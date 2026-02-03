#!/usr/bin/env python3
"""
K'UHUL Atomic Expert Model Builder
GPU-accelerated model building with 2-4 byte quantization support

Note: Atomic Experts are NOT code modules. They are declarative taxonomy entries
defined by objects (JSON/TypeScript), not executable JS/TS agents.

Usage:
    python model_builder.py build --config runtime.json
    python model_builder.py quantize --model ./model --precision int4
    python model_builder.py export --model ./model --format onnx
"""

import argparse
import json
import struct
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import math

# ============================================================================
# Precision Types (2-4 byte support)
# ============================================================================

class Precision(Enum):
    INT2 = "int2"      # 2-bit (packed into bytes)
    INT4 = "int4"      # 4-bit (2 values per byte)
    INT8 = "int8"      # 1 byte
    FP16 = "fp16"      # 2 bytes
    BF16 = "bf16"      # 2 bytes (bfloat16)
    FP32 = "fp32"      # 4 bytes

    @property
    def bytes_per_element(self) -> float:
        mapping = {
            "int2": 0.25,
            "int4": 0.5,
            "int8": 1,
            "fp16": 2,
            "bf16": 2,
            "fp32": 4,
        }
        return mapping[self.value]

    @property
    def bit_width(self) -> int:
        mapping = {
            "int2": 2,
            "int4": 4,
            "int8": 8,
            "fp16": 16,
            "bf16": 16,
            "fp32": 32,
        }
        return mapping[self.value]


# ============================================================================
# Tensor Structures
# ============================================================================

@dataclass
class TensorSpec:
    """Specification for a model tensor"""
    name: str
    shape: Tuple[int, ...]
    precision: Precision
    quantization_scale: Optional[float] = None
    quantization_zero_point: Optional[int] = None

    @property
    def numel(self) -> int:
        """Number of elements"""
        result = 1
        for dim in self.shape:
            result *= dim
        return result

    @property
    def size_bytes(self) -> int:
        """Size in bytes"""
        return int(self.numel * self.precision.bytes_per_element)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "shape": list(self.shape),
            "precision": self.precision.value,
            "size_bytes": self.size_bytes,
            "quantization": {
                "scale": self.quantization_scale,
                "zero_point": self.quantization_zero_point,
            } if self.quantization_scale else None
        }


@dataclass
class ExpertTensor:
    """Expert module tensor layout"""
    expert_id: str
    up_proj: TensorSpec
    down_proj: TensorSpec
    gate_proj: Optional[TensorSpec] = None

    @property
    def total_bytes(self) -> int:
        total = self.up_proj.size_bytes + self.down_proj.size_bytes
        if self.gate_proj:
            total += self.gate_proj.size_bytes
        return total


# ============================================================================
# Model Configuration
# ============================================================================

@dataclass
class AtomicExpertConfig:
    """Atomic Expert Model Configuration"""
    total_experts: int = 108
    active_experts: int = 4
    expert_dim: int = 512
    shared_dim: int = 1024
    hidden_dim: int = 2048
    vocab_size: int = 32000
    num_layers: int = 12

    # Quantization settings
    expert_precision: Precision = Precision.INT4
    router_precision: Precision = Precision.FP16
    shared_precision: Precision = Precision.FP16

    @classmethod
    def from_json(cls, config: Dict[str, Any]) -> "AtomicExpertConfig":
        model = config.get("model", {})
        dims = model.get("dimensions", {})
        quant = model.get("quantization", {})

        return cls(
            total_experts=model.get("totalExperts", 108),
            active_experts=model.get("activeExperts", 4),
            expert_dim=dims.get("expert", 512),
            shared_dim=dims.get("shared", 1024),
            hidden_dim=dims.get("hidden", 2048),
            vocab_size=dims.get("vocab", 32000),
            expert_precision=Precision(quant.get("expertPrecision", "int8")),
            router_precision=Precision(quant.get("routerPrecision", "fp16")),
        )


# ============================================================================
# Quantization Engine
# ============================================================================

class QuantizationEngine:
    """Low-byte quantization for GPU deployment"""

    @staticmethod
    def compute_scale_zp(
        min_val: float,
        max_val: float,
        precision: Precision
    ) -> Tuple[float, int]:
        """Compute quantization scale and zero point"""
        bit_width = precision.bit_width
        qmin = 0
        qmax = (1 << bit_width) - 1

        scale = (max_val - min_val) / (qmax - qmin)
        zero_point = int(round(qmin - min_val / scale))
        zero_point = max(qmin, min(qmax, zero_point))

        return scale, zero_point

    @staticmethod
    def quantize_tensor(
        values: List[float],
        precision: Precision
    ) -> Tuple[bytes, float, int]:
        """Quantize float values to specified precision"""
        if not values:
            return b"", 1.0, 0

        min_val = min(values)
        max_val = max(values)
        scale, zero_point = QuantizationEngine.compute_scale_zp(
            min_val, max_val, precision
        )

        # Quantize values
        quantized = []
        for v in values:
            q = int(round(v / scale)) + zero_point
            q = max(0, min((1 << precision.bit_width) - 1, q))
            quantized.append(q)

        # Pack into bytes based on precision
        packed = QuantizationEngine._pack_values(quantized, precision)
        return packed, scale, zero_point

    @staticmethod
    def _pack_values(values: List[int], precision: Precision) -> bytes:
        """Pack quantized values into bytes"""
        if precision == Precision.INT2:
            # Pack 4 values per byte
            packed = bytearray()
            for i in range(0, len(values), 4):
                byte = 0
                for j in range(4):
                    if i + j < len(values):
                        byte |= (values[i + j] & 0x3) << (j * 2)
                packed.append(byte)
            return bytes(packed)

        elif precision == Precision.INT4:
            # Pack 2 values per byte
            packed = bytearray()
            for i in range(0, len(values), 2):
                low = values[i] & 0xF
                high = (values[i + 1] & 0xF) if i + 1 < len(values) else 0
                packed.append(low | (high << 4))
            return bytes(packed)

        elif precision == Precision.INT8:
            return bytes(values)

        elif precision in (Precision.FP16, Precision.BF16):
            # Use struct for fp16
            packed = bytearray()
            for v in values:
                packed.extend(struct.pack('e', v))  # 'e' = fp16
            return bytes(packed)

        elif precision == Precision.FP32:
            packed = bytearray()
            for v in values:
                packed.extend(struct.pack('f', v))
            return bytes(packed)

        return b""


# ============================================================================
# Expert Builder
# ============================================================================

class ExpertBuilder:
    """Build expert tensors with quantization"""

    def __init__(self, config: AtomicExpertConfig):
        self.config = config
        self.quantizer = QuantizationEngine()

    def build_expert(self, expert_id: str) -> ExpertTensor:
        """Build tensor specs for a single expert"""
        precision = self.config.expert_precision

        up_proj = TensorSpec(
            name=f"{expert_id}.up_proj",
            shape=(self.config.expert_dim, self.config.hidden_dim),
            precision=precision,
        )

        down_proj = TensorSpec(
            name=f"{expert_id}.down_proj",
            shape=(self.config.hidden_dim, self.config.expert_dim),
            precision=precision,
        )

        gate_proj = TensorSpec(
            name=f"{expert_id}.gate_proj",
            shape=(self.config.expert_dim, self.config.hidden_dim),
            precision=precision,
        )

        return ExpertTensor(
            expert_id=expert_id,
            up_proj=up_proj,
            down_proj=down_proj,
            gate_proj=gate_proj,
        )

    def build_router(self) -> TensorSpec:
        """Build router tensor"""
        return TensorSpec(
            name="router.weight",
            shape=(self.config.shared_dim, self.config.total_experts),
            precision=self.config.router_precision,
        )

    def build_all_experts(self, expert_ids: List[str]) -> List[ExpertTensor]:
        """Build all expert tensors"""
        return [self.build_expert(eid) for eid in expert_ids]


# ============================================================================
# Cluster Builder
# ============================================================================

@dataclass
class NodeAllocation:
    """Expert allocation to a cluster node"""
    node_id: str
    device: str
    memory_budget: int
    experts: List[str] = field(default_factory=list)
    memory_used: int = 0


class ClusterBuilder:
    """Build cluster allocation plan"""

    def __init__(self, config: Dict[str, Any], expert_config: AtomicExpertConfig):
        self.config = config
        self.expert_config = expert_config
        self.expert_builder = ExpertBuilder(expert_config)

    def parse_memory(self, mem_str: str) -> int:
        """Parse memory string like '16GB' to bytes"""
        units = {"B": 1, "KB": 1024, "MB": 1024**2, "GB": 1024**3, "TB": 1024**4}
        mem_str = mem_str.upper().strip()
        for unit, multiplier in units.items():
            if mem_str.endswith(unit):
                return int(float(mem_str[:-len(unit)]) * multiplier)
        return int(mem_str)

    def expand_expert_pattern(self, pattern: str, all_experts: List[str]) -> List[str]:
        """Expand wildcard pattern like 'math-*' to matching experts"""
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return [e for e in all_experts if e.startswith(prefix)]
        return [pattern] if pattern in all_experts else []

    def build_allocation(self) -> List[NodeAllocation]:
        """Build expert allocation across cluster nodes"""
        cluster = self.config.get("cluster", {})
        registry = self.config.get("expertRegistry", {})

        # Collect all expert IDs
        all_experts = []
        for category, cat_config in registry.get("categories", {}).items():
            all_experts.extend(cat_config.get("experts", []))

        # Build allocations
        allocations = []
        for node in cluster.get("nodes", []):
            gpu = node.get("gpu", {})
            allocation = NodeAllocation(
                node_id=node.get("id", "unknown"),
                device=gpu.get("device", "cpu"),
                memory_budget=self.parse_memory(gpu.get("memory", "8GB")),
            )

            # Expand expert patterns
            for pattern in node.get("experts", []):
                matched = self.expand_expert_pattern(pattern, all_experts)
                allocation.experts.extend(matched)

            # Calculate memory usage
            for expert_id in allocation.experts:
                expert = self.expert_builder.build_expert(expert_id)
                allocation.memory_used += expert.total_bytes

            allocations.append(allocation)

        return allocations

    def generate_deployment_plan(self) -> Dict[str, Any]:
        """Generate full deployment plan"""
        allocations = self.build_allocation()
        router = self.expert_builder.build_router()

        plan = {
            "model": {
                "config": {
                    "total_experts": self.expert_config.total_experts,
                    "active_experts": self.expert_config.active_experts,
                    "expert_dim": self.expert_config.expert_dim,
                    "shared_dim": self.expert_config.shared_dim,
                    "hidden_dim": self.expert_config.hidden_dim,
                },
                "quantization": {
                    "expert_precision": self.expert_config.expert_precision.value,
                    "router_precision": self.expert_config.router_precision.value,
                    "bytes_per_expert_element": self.expert_config.expert_precision.bytes_per_element,
                },
                "router": router.to_dict(),
            },
            "cluster": {
                "nodes": [],
                "total_memory_used": 0,
                "total_memory_budget": 0,
            },
            "experts": [],
        }

        total_used = 0
        total_budget = 0

        for alloc in allocations:
            node_info = {
                "node_id": alloc.node_id,
                "device": alloc.device,
                "memory_budget_bytes": alloc.memory_budget,
                "memory_used_bytes": alloc.memory_used,
                "memory_utilization": alloc.memory_used / alloc.memory_budget if alloc.memory_budget > 0 else 0,
                "expert_count": len(alloc.experts),
                "experts": alloc.experts,
            }
            plan["cluster"]["nodes"].append(node_info)
            total_used += alloc.memory_used
            total_budget += alloc.memory_budget

            # Add expert details
            for expert_id in alloc.experts:
                expert = self.expert_builder.build_expert(expert_id)
                plan["experts"].append({
                    "id": expert_id,
                    "node": alloc.node_id,
                    "device": alloc.device,
                    "tensors": {
                        "up_proj": expert.up_proj.to_dict(),
                        "down_proj": expert.down_proj.to_dict(),
                        "gate_proj": expert.gate_proj.to_dict() if expert.gate_proj else None,
                    },
                    "total_bytes": expert.total_bytes,
                })

        plan["cluster"]["total_memory_used"] = total_used
        plan["cluster"]["total_memory_budget"] = total_budget

        return plan


# ============================================================================
# GPU Kernel Generator
# ============================================================================

class GPUKernelGenerator:
    """Generate GPU kernel code for quantized inference"""

    @staticmethod
    def generate_dequant_kernel(precision: Precision) -> str:
        """Generate CUDA dequantization kernel"""
        if precision == Precision.INT4:
            return '''
// INT4 Dequantization Kernel
__global__ void dequant_int4_kernel(
    const uint8_t* __restrict__ input,
    float* __restrict__ output,
    const float scale,
    const int zero_point,
    const int num_elements
) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    int packed_idx = idx / 2;

    if (idx < num_elements) {
        uint8_t packed = input[packed_idx];
        int nibble = (idx % 2 == 0) ? (packed & 0xF) : ((packed >> 4) & 0xF);
        output[idx] = (float)(nibble - zero_point) * scale;
    }
}
'''
        elif precision == Precision.INT8:
            return '''
// INT8 Dequantization Kernel
__global__ void dequant_int8_kernel(
    const int8_t* __restrict__ input,
    float* __restrict__ output,
    const float scale,
    const int zero_point,
    const int num_elements
) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < num_elements) {
        output[idx] = (float)(input[idx] - zero_point) * scale;
    }
}
'''
        elif precision == Precision.INT2:
            return '''
// INT2 Dequantization Kernel
__global__ void dequant_int2_kernel(
    const uint8_t* __restrict__ input,
    float* __restrict__ output,
    const float scale,
    const int zero_point,
    const int num_elements
) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    int packed_idx = idx / 4;

    if (idx < num_elements) {
        uint8_t packed = input[packed_idx];
        int shift = (idx % 4) * 2;
        int val = (packed >> shift) & 0x3;
        output[idx] = (float)(val - zero_point) * scale;
    }
}
'''
        return ""

    @staticmethod
    def generate_expert_forward(config: AtomicExpertConfig) -> str:
        """Generate expert forward pass kernel"""
        return f'''
// Expert Forward Pass (Gated Linear Unit)
__global__ void expert_forward_kernel(
    const float* __restrict__ input,      // [batch, {config.expert_dim}]
    const float* __restrict__ up_proj,    // [{config.expert_dim}, {config.hidden_dim}]
    const float* __restrict__ gate_proj,  // [{config.expert_dim}, {config.hidden_dim}]
    const float* __restrict__ down_proj,  // [{config.hidden_dim}, {config.expert_dim}]
    float* __restrict__ output,           // [batch, {config.expert_dim}]
    const int batch_size
) {{
    // Shared memory for intermediate results
    __shared__ float gate_out[{config.hidden_dim}];
    __shared__ float up_out[{config.hidden_dim}];

    int batch_idx = blockIdx.x;
    int hidden_idx = threadIdx.x;

    if (batch_idx < batch_size && hidden_idx < {config.hidden_dim}) {{
        // Compute gate and up projections
        float gate_sum = 0.0f;
        float up_sum = 0.0f;

        for (int i = 0; i < {config.expert_dim}; i++) {{
            float in_val = input[batch_idx * {config.expert_dim} + i];
            gate_sum += in_val * gate_proj[i * {config.hidden_dim} + hidden_idx];
            up_sum += in_val * up_proj[i * {config.hidden_dim} + hidden_idx];
        }}

        // SiLU activation on gate, multiply with up
        float silu_gate = gate_sum / (1.0f + expf(-gate_sum));
        float hidden_val = silu_gate * up_sum;

        gate_out[hidden_idx] = hidden_val;
        __syncthreads();

        // Down projection (parallel reduction)
        if (hidden_idx < {config.expert_dim}) {{
            float out_sum = 0.0f;
            for (int j = 0; j < {config.hidden_dim}; j++) {{
                out_sum += gate_out[j] * down_proj[j * {config.expert_dim} + hidden_idx];
            }}
            output[batch_idx * {config.expert_dim} + hidden_idx] = out_sum;
        }}
    }}
}}
'''

    @staticmethod
    def generate_router_kernel(config: AtomicExpertConfig) -> str:
        """Generate top-k router kernel"""
        return f'''
// Top-K Router Kernel
__global__ void router_topk_kernel(
    const float* __restrict__ input,       // [batch, {config.shared_dim}]
    const float* __restrict__ router_w,    // [{config.shared_dim}, {config.total_experts}]
    int* __restrict__ expert_indices,      // [batch, {config.active_experts}]
    float* __restrict__ expert_weights,    // [batch, {config.active_experts}]
    const int batch_size
) {{
    int batch_idx = blockIdx.x;

    if (batch_idx < batch_size) {{
        // Compute router logits
        float logits[{config.total_experts}];

        for (int e = 0; e < {config.total_experts}; e++) {{
            float sum = 0.0f;
            for (int d = 0; d < {config.shared_dim}; d++) {{
                sum += input[batch_idx * {config.shared_dim} + d] *
                       router_w[d * {config.total_experts} + e];
            }}
            logits[e] = sum;
        }}

        // Softmax normalization
        float max_logit = logits[0];
        for (int e = 1; e < {config.total_experts}; e++) {{
            if (logits[e] > max_logit) max_logit = logits[e];
        }}

        float sum_exp = 0.0f;
        for (int e = 0; e < {config.total_experts}; e++) {{
            logits[e] = expf(logits[e] - max_logit);
            sum_exp += logits[e];
        }}

        for (int e = 0; e < {config.total_experts}; e++) {{
            logits[e] /= sum_exp;
        }}

        // Top-K selection
        for (int k = 0; k < {config.active_experts}; k++) {{
            int max_idx = 0;
            float max_val = -1.0f;

            for (int e = 0; e < {config.total_experts}; e++) {{
                if (logits[e] > max_val) {{
                    max_val = logits[e];
                    max_idx = e;
                }}
            }}

            expert_indices[batch_idx * {config.active_experts} + k] = max_idx;
            expert_weights[batch_idx * {config.active_experts} + k] = max_val;
            logits[max_idx] = -1.0f;  // Mark as selected
        }}

        // Renormalize top-k weights
        float weight_sum = 0.0f;
        for (int k = 0; k < {config.active_experts}; k++) {{
            weight_sum += expert_weights[batch_idx * {config.active_experts} + k];
        }}
        for (int k = 0; k < {config.active_experts}; k++) {{
            expert_weights[batch_idx * {config.active_experts} + k] /= weight_sum;
        }}
    }}
}}
'''


# ============================================================================
# Model Exporter
# ============================================================================

class ModelExporter:
    """Export model to various formats"""

    def __init__(self, config: AtomicExpertConfig):
        self.config = config

    def export_safetensors_manifest(self, experts: List[ExpertTensor]) -> Dict[str, Any]:
        """Generate safetensors manifest"""
        manifest = {
            "__metadata__": {
                "format": "kuhul-atomic",
                "version": "1.0",
                "total_experts": self.config.total_experts,
                "active_experts": self.config.active_experts,
            },
            "tensors": {},
        }

        for expert in experts:
            manifest["tensors"][expert.up_proj.name] = {
                "dtype": self.config.expert_precision.value,
                "shape": list(expert.up_proj.shape),
                "data_offsets": [0, expert.up_proj.size_bytes],
            }
            manifest["tensors"][expert.down_proj.name] = {
                "dtype": self.config.expert_precision.value,
                "shape": list(expert.down_proj.shape),
                "data_offsets": [0, expert.down_proj.size_bytes],
            }
            if expert.gate_proj:
                manifest["tensors"][expert.gate_proj.name] = {
                    "dtype": self.config.expert_precision.value,
                    "shape": list(expert.gate_proj.shape),
                    "data_offsets": [0, expert.gate_proj.size_bytes],
                }

        return manifest

    def export_onnx_config(self) -> Dict[str, Any]:
        """Generate ONNX export configuration"""
        return {
            "opset_version": 17,
            "export_params": True,
            "do_constant_folding": True,
            "input_names": ["input_ids", "attention_mask"],
            "output_names": ["logits", "expert_indices"],
            "dynamic_axes": {
                "input_ids": {0: "batch_size", 1: "sequence_length"},
                "attention_mask": {0: "batch_size", 1: "sequence_length"},
                "logits": {0: "batch_size", 1: "sequence_length"},
            },
            "custom_ops": [
                {
                    "name": "TopKRouter",
                    "domain": "kuhul.atomic",
                    "version": 1,
                },
                {
                    "name": "SparseExpertDispatch",
                    "domain": "kuhul.atomic",
                    "version": 1,
                },
            ],
        }


# ============================================================================
# CLI Interface
# ============================================================================

def cmd_build(args):
    """Build model from config"""
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}")
        return 1

    with open(config_path) as f:
        config = json.load(f)

    expert_config = AtomicExpertConfig.from_json(config)
    cluster_builder = ClusterBuilder(config, expert_config)
    plan = cluster_builder.generate_deployment_plan()

    output_path = Path(args.output) if args.output else config_path.with_suffix(".plan.json")
    with open(output_path, "w") as f:
        json.dump(plan, f, indent=2)

    print(f"Deployment plan generated: {output_path}")
    print(f"  Total experts: {expert_config.total_experts}")
    print(f"  Active experts: {expert_config.active_experts}")
    print(f"  Expert precision: {expert_config.expert_precision.value}")
    print(f"  Bytes per element: {expert_config.expert_precision.bytes_per_element}")
    print(f"  Cluster nodes: {len(plan['cluster']['nodes'])}")

    total_mb = plan['cluster']['total_memory_used'] / (1024 * 1024)
    print(f"  Total memory: {total_mb:.2f} MB")

    return 0


def cmd_quantize(args):
    """Quantize model to specified precision"""
    precision = Precision(args.precision)
    print(f"Quantizing to {precision.value}...")
    print(f"  Bit width: {precision.bit_width}")
    print(f"  Bytes per element: {precision.bytes_per_element}")

    # Generate dequantization kernel
    kernel_gen = GPUKernelGenerator()
    kernel = kernel_gen.generate_dequant_kernel(precision)

    kernel_path = Path(args.output) if args.output else Path(f"dequant_{precision.value}.cu")
    with open(kernel_path, "w") as f:
        f.write(kernel)

    print(f"Generated kernel: {kernel_path}")
    return 0


def cmd_kernels(args):
    """Generate GPU kernels"""
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}")
        return 1

    with open(config_path) as f:
        config = json.load(f)

    expert_config = AtomicExpertConfig.from_json(config)
    kernel_gen = GPUKernelGenerator()

    output_dir = Path(args.output) if args.output else Path("kernels")
    output_dir.mkdir(exist_ok=True)

    # Generate all kernels
    kernels = {
        "dequant_int4.cu": kernel_gen.generate_dequant_kernel(Precision.INT4),
        "dequant_int8.cu": kernel_gen.generate_dequant_kernel(Precision.INT8),
        "dequant_int2.cu": kernel_gen.generate_dequant_kernel(Precision.INT2),
        "expert_forward.cu": kernel_gen.generate_expert_forward(expert_config),
        "router_topk.cu": kernel_gen.generate_router_kernel(expert_config),
    }

    for filename, content in kernels.items():
        with open(output_dir / filename, "w") as f:
            f.write(content)
        print(f"Generated: {output_dir / filename}")

    return 0


def cmd_export(args):
    """Export model to external format"""
    config_path = Path(args.config) if args.config else Path("runtime.json")
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}")
        return 1

    with open(config_path) as f:
        config = json.load(f)

    expert_config = AtomicExpertConfig.from_json(config)
    exporter = ModelExporter(expert_config)

    format_type = args.format.lower()
    output_path = Path(args.output) if args.output else Path(f"export_{format_type}.json")

    if format_type == "onnx":
        manifest = exporter.export_onnx_config()
    elif format_type == "safetensors":
        expert_builder = ExpertBuilder(expert_config)
        experts = expert_builder.build_all_experts([f"expert-{i}" for i in range(expert_config.total_experts)])
        manifest = exporter.export_safetensors_manifest(experts)
    else:
        print(f"Unknown format: {format_type}")
        return 1

    with open(output_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Exported {format_type} config: {output_path}")
    return 0


def cmd_info(args):
    """Show model info"""
    config_path = Path(args.config) if args.config else Path("runtime.json")
    if not config_path.exists():
        print(f"Error: Config file not found: {config_path}")
        return 1

    with open(config_path) as f:
        config = json.load(f)

    expert_config = AtomicExpertConfig.from_json(config)
    expert_builder = ExpertBuilder(expert_config)

    print("\n K'UHUL Atomic Expert Model Info")
    print("=" * 50)
    print(f"  Total Experts:     {expert_config.total_experts}")
    print(f"  Active Experts:    {expert_config.active_experts}")
    print(f"  Expert Dimension:  {expert_config.expert_dim}")
    print(f"  Shared Dimension:  {expert_config.shared_dim}")
    print(f"  Hidden Dimension:  {expert_config.hidden_dim}")
    print(f"  Vocab Size:        {expert_config.vocab_size}")
    print()
    print("Quantization:")
    print(f"  Expert Precision:  {expert_config.expert_precision.value} ({expert_config.expert_precision.bytes_per_element} bytes)")
    print(f"  Router Precision:  {expert_config.router_precision.value} ({expert_config.router_precision.bytes_per_element} bytes)")
    print()

    # Calculate total size
    expert = expert_builder.build_expert("sample")
    router = expert_builder.build_router()

    expert_size = expert.total_bytes * expert_config.total_experts
    router_size = router.size_bytes

    print("Memory Footprint:")
    print(f"  Per Expert:        {expert.total_bytes / 1024:.2f} KB")
    print(f"  All Experts:       {expert_size / (1024*1024):.2f} MB")
    print(f"  Router:            {router_size / 1024:.2f} KB")
    print(f"  Total:             {(expert_size + router_size) / (1024*1024):.2f} MB")
    print("=" * 50)

    return 0


def main():
    parser = argparse.ArgumentParser(
        description="K'UHUL Atomic Expert Model Builder - GPU-accelerated 2-4 byte quantization"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build deployment plan from config")
    build_parser.add_argument("--config", "-c", required=True, help="Runtime config JSON")
    build_parser.add_argument("--output", "-o", help="Output plan file")

    # Quantize command
    quant_parser = subparsers.add_parser("quantize", help="Generate quantization kernels")
    quant_parser.add_argument("--precision", "-p", default="int4",
                              choices=["int2", "int4", "int8", "fp16"],
                              help="Target precision")
    quant_parser.add_argument("--output", "-o", help="Output kernel file")

    # Kernels command
    kernel_parser = subparsers.add_parser("kernels", help="Generate all GPU kernels")
    kernel_parser.add_argument("--config", "-c", required=True, help="Runtime config JSON")
    kernel_parser.add_argument("--output", "-o", help="Output directory")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export model configuration")
    export_parser.add_argument("--config", "-c", help="Runtime config JSON")
    export_parser.add_argument("--format", "-f", default="onnx",
                               choices=["onnx", "safetensors"],
                               help="Export format")
    export_parser.add_argument("--output", "-o", help="Output file")

    # Info command
    info_parser = subparsers.add_parser("info", help="Show model information")
    info_parser.add_argument("--config", "-c", help="Runtime config JSON")

    args = parser.parse_args()

    if args.command == "build":
        return cmd_build(args)
    elif args.command == "quantize":
        return cmd_quantize(args)
    elif args.command == "kernels":
        return cmd_kernels(args)
    elif args.command == "export":
        return cmd_export(args)
    elif args.command == "info":
        return cmd_info(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
