#!/usr/bin/env python3
"""
K'UHUL MoE Training Script
Train a Mixture of Experts model on coding datasets

Usage:
    python train.py --config datasets.json
    python train.py --config datasets.json --download-only
    python train.py --config datasets.json --resume checkpoint-1000
"""

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

@dataclass
class DatasetConfig:
    """Configuration for a single dataset"""
    id: str
    name: str
    source: str
    clone_cmd: str
    experts: List[str]
    category: str
    format: str
    features: List[str]
    local_path: Optional[Path] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "DatasetConfig":
        return cls(
            id=d["id"],
            name=d["name"],
            source=d["source"],
            clone_cmd=d["clone_cmd"],
            experts=d.get("experts", []),
            category=d.get("category", "general"),
            format=d.get("format", "json"),
            features=d.get("features", []),
        )


@dataclass
class TrainingConfig:
    """Full training configuration"""
    base_model: str
    output_dir: str
    mixed_precision: str
    gradient_checkpointing: bool
    learning_rate: float
    batch_size: int
    gradient_accumulation_steps: int
    epochs: int
    warmup_ratio: float
    weight_decay: float
    max_grad_norm: float
    # MoE settings
    num_experts: int
    num_active_experts: int
    expert_capacity: float
    router_aux_loss_coef: float
    router_z_loss_coef: float
    # LoRA settings
    lora_enabled: bool
    lora_rank: int
    lora_alpha: int
    lora_dropout: float
    lora_target_modules: List[str]
    # Preprocessing
    max_sequence_length: int
    pack_sequences: bool
    shuffle_seed: int
    validation_split: float
    context_template: str

    @classmethod
    def from_dict(cls, config: Dict[str, Any]) -> "TrainingConfig":
        t = config.get("training", {})
        hp = t.get("hyperparameters", {})
        moe = t.get("moe", {})
        lora = t.get("lora", {})
        pre = config.get("preprocessing", {})

        return cls(
            base_model=t.get("baseModel", "Qwen/Qwen2.5-0.5B"),
            output_dir=t.get("outputDir", "./output"),
            mixed_precision=t.get("mixedPrecision", "bf16"),
            gradient_checkpointing=t.get("gradientCheckpointing", True),
            learning_rate=hp.get("learningRate", 2e-5),
            batch_size=hp.get("batchSize", 4),
            gradient_accumulation_steps=hp.get("gradientAccumulationSteps", 8),
            epochs=hp.get("epochs", 3),
            warmup_ratio=hp.get("warmupRatio", 0.1),
            weight_decay=hp.get("weightDecay", 0.01),
            max_grad_norm=hp.get("maxGradNorm", 1.0),
            num_experts=moe.get("numExperts", 108),
            num_active_experts=moe.get("numActiveExperts", 4),
            expert_capacity=moe.get("expertCapacity", 1.25),
            router_aux_loss_coef=moe.get("routerAuxLossCoef", 0.01),
            router_z_loss_coef=moe.get("routerZLossCoef", 0.001),
            lora_enabled=lora.get("enabled", True),
            lora_rank=lora.get("rank", 64),
            lora_alpha=lora.get("alpha", 128),
            lora_dropout=lora.get("dropout", 0.05),
            lora_target_modules=lora.get("targetModules", ["q_proj", "v_proj"]),
            max_sequence_length=pre.get("maxSequenceLength", 2048),
            pack_sequences=pre.get("packSequences", True),
            shuffle_seed=pre.get("shuffleSeed", 42),
            validation_split=pre.get("validationSplit", 0.05),
            context_template=pre.get("contextTemplate", "{instruction}\n{response}"),
        )


# ============================================================================
# Dataset Downloader
# ============================================================================

class DatasetDownloader:
    """Download datasets from Hugging Face"""

    def __init__(self, datasets_dir: Path):
        self.datasets_dir = datasets_dir
        self.datasets_dir.mkdir(parents=True, exist_ok=True)

    def download(self, dataset: DatasetConfig) -> Path:
        """Download a single dataset"""
        local_path = self.datasets_dir / dataset.id

        if local_path.exists():
            logger.info(f"Dataset already exists: {dataset.id}")
            return local_path

        logger.info(f"Downloading: {dataset.name} from {dataset.source}")

        try:
            # Use git clone with LFS
            env = os.environ.copy()
            env["GIT_LFS_SKIP_SMUDGE"] = "0"

            result = subprocess.run(
                ["git", "clone", "--depth", "1", dataset.source, str(local_path)],
                capture_output=True,
                text=True,
                env=env,
                timeout=600  # 10 minute timeout
            )

            if result.returncode != 0:
                logger.error(f"Failed to clone {dataset.id}: {result.stderr}")
                # Try with huggingface-cli as fallback
                return self._download_with_hf_cli(dataset, local_path)

            logger.info(f"Downloaded: {dataset.id}")
            return local_path

        except subprocess.TimeoutExpired:
            logger.error(f"Timeout downloading {dataset.id}")
            raise
        except Exception as e:
            logger.error(f"Error downloading {dataset.id}: {e}")
            raise

    def _download_with_hf_cli(self, dataset: DatasetConfig, local_path: Path) -> Path:
        """Fallback: download using huggingface-cli"""
        # Extract repo id from source URL
        repo_id = dataset.source.replace("https://huggingface.co/datasets/", "")

        try:
            result = subprocess.run(
                ["huggingface-cli", "download", "--repo-type", "dataset",
                 repo_id, "--local-dir", str(local_path)],
                capture_output=True,
                text=True,
                timeout=600
            )

            if result.returncode == 0:
                logger.info(f"Downloaded via HF CLI: {dataset.id}")
                return local_path
            else:
                logger.error(f"HF CLI failed: {result.stderr}")
                raise RuntimeError(f"Failed to download {dataset.id}")

        except FileNotFoundError:
            logger.error("huggingface-cli not found. Install with: pip install huggingface_hub")
            raise

    def download_all(self, datasets: List[DatasetConfig]) -> Dict[str, Path]:
        """Download all datasets"""
        paths = {}
        for dataset in datasets:
            try:
                paths[dataset.id] = self.download(dataset)
            except Exception as e:
                logger.error(f"Skipping {dataset.id}: {e}")
        return paths


# ============================================================================
# Data Processor
# ============================================================================

class DataProcessor:
    """Process and prepare datasets for training"""

    def __init__(self, config: TrainingConfig):
        self.config = config

    def load_dataset(self, path: Path, format: str) -> List[Dict[str, Any]]:
        """Load a dataset from disk"""
        samples = []

        if format == "json" or format == "jsonl":
            for file in path.rglob("*.json*"):
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        if file.suffix == '.jsonl':
                            for line in f:
                                if line.strip():
                                    samples.append(json.loads(line))
                        else:
                            data = json.load(f)
                            if isinstance(data, list):
                                samples.extend(data)
                            else:
                                samples.append(data)
                except Exception as e:
                    logger.warning(f"Error loading {file}: {e}")

        elif format == "parquet":
            try:
                import pyarrow.parquet as pq
                for file in path.rglob("*.parquet"):
                    table = pq.read_table(file)
                    samples.extend(table.to_pylist())
            except ImportError:
                logger.error("pyarrow not installed. Run: pip install pyarrow")

        logger.info(f"Loaded {len(samples)} samples from {path}")
        return samples

    def format_sample(self, sample: Dict[str, Any], dataset_id: str) -> Optional[Dict[str, str]]:
        """Format a sample into instruction/response format"""
        # Try common field names
        instruction_fields = ['instruction', 'prompt', 'input', 'question', 'query', 'user']
        response_fields = ['response', 'output', 'answer', 'assistant', 'completion', 'code']

        instruction = None
        response = None

        for field in instruction_fields:
            if field in sample and sample[field]:
                instruction = str(sample[field])
                break

        for field in response_fields:
            if field in sample and sample[field]:
                response = str(sample[field])
                break

        # Handle conversation format
        if 'conversations' in sample:
            convs = sample['conversations']
            if isinstance(convs, list) and len(convs) >= 2:
                instruction = convs[0].get('value', convs[0].get('content', ''))
                response = convs[1].get('value', convs[1].get('content', ''))

        # Handle messages format
        if 'messages' in sample:
            msgs = sample['messages']
            if isinstance(msgs, list):
                for msg in msgs:
                    role = msg.get('role', '')
                    content = msg.get('content', '')
                    if role in ['user', 'human'] and not instruction:
                        instruction = content
                    elif role in ['assistant', 'gpt', 'model'] and not response:
                        response = content

        if instruction and response:
            return {
                'instruction': instruction.strip(),
                'response': response.strip(),
                'dataset': dataset_id,
            }

        return None

    def load_rlhf_data(self, rlhf_path: Path) -> List[Dict[str, Any]]:
        """Load custom RLHF data from processed exports"""
        samples = []
        rlhf_file = rlhf_path / "rlhf_samples.jsonl"

        if not rlhf_file.exists():
            logger.warning(f"No RLHF data found at {rlhf_file}")
            return samples

        with open(rlhf_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        sample = json.loads(line)
                        samples.append({
                            'instruction': sample.get('instruction', ''),
                            'response': sample.get('response', ''),
                            'dataset': f"rlhf-{sample.get('source', 'unknown')}",
                            'experts': sample.get('experts', ['lang-python']),
                            'category': 'rlhf',
                        })
                    except json.JSONDecodeError:
                        continue

        logger.info(f"Loaded {len(samples)} RLHF samples from {rlhf_file}")
        return samples

    def prepare_dataset(
        self,
        datasets: Dict[str, Tuple[Path, DatasetConfig]],
        rlhf_path: Optional[Path] = None
    ) -> Tuple[List[Dict], List[Dict]]:
        """Prepare all datasets for training"""
        all_samples = []

        # Load HuggingFace datasets
        for dataset_id, (path, config) in datasets.items():
            raw_samples = self.load_dataset(path, config.format)

            for sample in raw_samples:
                formatted = self.format_sample(sample, dataset_id)
                if formatted:
                    # Add expert routing info
                    formatted['experts'] = config.experts
                    formatted['category'] = config.category
                    all_samples.append(formatted)

        # Load custom RLHF data (higher weight)
        if rlhf_path and rlhf_path.exists():
            rlhf_samples = self.load_rlhf_data(rlhf_path)
            # RLHF data gets 2x weight by duplicating
            all_samples.extend(rlhf_samples)
            all_samples.extend(rlhf_samples)  # 2x weight
            logger.info(f"Added {len(rlhf_samples)} RLHF samples (2x weighted)")

        # Shuffle
        import random
        random.seed(self.config.shuffle_seed)
        random.shuffle(all_samples)

        # Split
        split_idx = int(len(all_samples) * (1 - self.config.validation_split))
        train_samples = all_samples[:split_idx]
        val_samples = all_samples[split_idx:]

        logger.info(f"Train samples: {len(train_samples)}, Val samples: {len(val_samples)}")
        return train_samples, val_samples


# ============================================================================
# MoE Trainer
# ============================================================================

class MoETrainer:
    """Train the MoE model"""

    def __init__(self, config: TrainingConfig):
        self.config = config

    def setup_model(self):
        """Setup model with MoE and LoRA"""
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
            from peft import LoraConfig, get_peft_model, TaskType
        except ImportError as e:
            logger.error(f"Missing dependency: {e}")
            logger.error("Install with: pip install transformers peft accelerate")
            sys.exit(1)

        logger.info(f"Loading base model: {self.config.base_model}")

        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            self.config.base_model,
            trust_remote_code=True,
            padding_side="right",
        )
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        # Load model
        model = AutoModelForCausalLM.from_pretrained(
            self.config.base_model,
            trust_remote_code=True,
            torch_dtype="auto",
            device_map="auto",
        )

        # Apply LoRA if enabled
        if self.config.lora_enabled:
            logger.info("Applying LoRA configuration")
            lora_config = LoraConfig(
                task_type=TaskType.CAUSAL_LM,
                r=self.config.lora_rank,
                lora_alpha=self.config.lora_alpha,
                lora_dropout=self.config.lora_dropout,
                target_modules=self.config.lora_target_modules,
                bias="none",
            )
            model = get_peft_model(model, lora_config)
            model.print_trainable_parameters()

        return model, tokenizer

    def create_training_args(self, output_dir: Path) -> "TrainingArguments":
        """Create training arguments"""
        from transformers import TrainingArguments

        return TrainingArguments(
            output_dir=str(output_dir),
            num_train_epochs=self.config.epochs,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            warmup_ratio=self.config.warmup_ratio,
            max_grad_norm=self.config.max_grad_norm,
            logging_steps=10,
            eval_strategy="steps",
            eval_steps=500,
            save_strategy="steps",
            save_steps=500,
            save_total_limit=3,
            bf16=self.config.mixed_precision == "bf16",
            fp16=self.config.mixed_precision == "fp16",
            gradient_checkpointing=self.config.gradient_checkpointing,
            dataloader_num_workers=4,
            report_to=["tensorboard"],
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
        )

    def tokenize_dataset(self, samples: List[Dict], tokenizer) -> "Dataset":
        """Tokenize samples into a HF Dataset"""
        from datasets import Dataset

        def format_text(sample):
            text = self.config.context_template.format(
                instruction=sample['instruction'],
                response=sample['response']
            )
            return {"text": text}

        # Create dataset
        dataset = Dataset.from_list(samples)
        dataset = dataset.map(format_text)

        # Tokenize
        def tokenize(examples):
            return tokenizer(
                examples["text"],
                truncation=True,
                max_length=self.config.max_sequence_length,
                padding="max_length",
            )

        dataset = dataset.map(tokenize, batched=True, remove_columns=["text"])
        return dataset

    def train(
        self,
        train_samples: List[Dict],
        val_samples: List[Dict],
        output_dir: Path,
        resume_from: Optional[str] = None
    ):
        """Run training"""
        from transformers import Trainer, DataCollatorForLanguageModeling

        model, tokenizer = self.setup_model()
        training_args = self.create_training_args(output_dir)

        # Prepare datasets
        logger.info("Tokenizing datasets...")
        train_dataset = self.tokenize_dataset(train_samples, tokenizer)
        val_dataset = self.tokenize_dataset(val_samples, tokenizer)

        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False,
        )

        # Create trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            data_collator=data_collator,
        )

        # Train
        logger.info("Starting training...")
        if resume_from:
            trainer.train(resume_from_checkpoint=resume_from)
        else:
            trainer.train()

        # Save final model
        logger.info(f"Saving model to {output_dir}")
        trainer.save_model()
        tokenizer.save_pretrained(output_dir)

        return trainer


# ============================================================================
# Expert Router Training
# ============================================================================

class ExpertRouterTrainer:
    """Train the expert routing network"""

    def __init__(self, config: TrainingConfig):
        self.config = config
        self.expert_embeddings = {}

    def build_expert_embeddings(self, samples: List[Dict]) -> Dict[str, List[float]]:
        """Build embeddings for each expert based on training data"""
        from collections import defaultdict

        expert_texts = defaultdict(list)

        for sample in samples:
            for expert in sample.get('experts', []):
                expert_texts[expert].append(sample['instruction'])

        # For each expert, compute average embedding
        # This is a simplified version - in practice you'd use a proper encoder
        logger.info(f"Building embeddings for {len(expert_texts)} experts")

        for expert_id, texts in expert_texts.items():
            # Simple TF-IDF-like representation (placeholder)
            self.expert_embeddings[expert_id] = self._compute_embedding(texts)

        return self.expert_embeddings

    def _compute_embedding(self, texts: List[str], dim: int = 512) -> List[float]:
        """Compute a simple embedding from texts"""
        import hashlib

        # Simple hash-based embedding (placeholder for real embeddings)
        combined = " ".join(texts[:100])  # Sample first 100
        hash_bytes = hashlib.sha512(combined.encode()).digest()

        # Convert to floats
        embedding = []
        for i in range(0, min(len(hash_bytes), dim * 4), 4):
            val = int.from_bytes(hash_bytes[i:i+4], 'little', signed=True)
            embedding.append(val / (2**31))

        # Pad or truncate to dim
        while len(embedding) < dim:
            embedding.append(0.0)

        return embedding[:dim]

    def save_router(self, output_path: Path):
        """Save the trained router"""
        router_data = {
            "num_experts": self.config.num_experts,
            "active_experts": self.config.num_active_experts,
            "embeddings": self.expert_embeddings,
        }

        with open(output_path / "router.json", 'w') as f:
            json.dump(router_data, f, indent=2)

        logger.info(f"Saved router to {output_path / 'router.json'}")


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="K'UHUL MoE Training Script"
    )
    parser.add_argument(
        "--config", "-c",
        default="datasets.json",
        help="Path to datasets.json config"
    )
    parser.add_argument(
        "--download-only",
        action="store_true",
        help="Only download datasets, don't train"
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Skip dataset download"
    )
    parser.add_argument(
        "--resume",
        help="Resume from checkpoint"
    )
    parser.add_argument(
        "--output", "-o",
        help="Override output directory"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without doing it"
    )
    parser.add_argument(
        "--rlhf",
        default="./rlhf_data",
        help="Path to RLHF data directory"
    )
    parser.add_argument(
        "--rlhf-only",
        action="store_true",
        help="Train only on RLHF data (skip HuggingFace datasets)"
    )

    args = parser.parse_args()

    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        logger.error(f"Config not found: {config_path}")
        sys.exit(1)

    with open(config_path) as f:
        config_data = json.load(f)

    # Parse configurations
    datasets = [DatasetConfig.from_dict(d) for d in config_data.get("repositories", [])]
    training_config = TrainingConfig.from_dict(config_data)

    if args.output:
        training_config.output_dir = args.output

    output_dir = Path(training_config.output_dir)
    datasets_dir = Path("datasets")
    rlhf_dir = Path(args.rlhf)

    # Print config summary
    print("\n" + "=" * 60)
    print(" K'UHUL MoE Training")
    print("=" * 60)
    print(f"  Base Model:     {training_config.base_model}")
    print(f"  Output Dir:     {output_dir}")
    print(f"  Datasets:       {len(datasets)}")
    print(f"  Experts:        {training_config.num_experts}")
    print(f"  Active (Top-K): {training_config.num_active_experts}")
    print(f"  LoRA Rank:      {training_config.lora_rank}")
    print(f"  Epochs:         {training_config.epochs}")
    print(f"  Batch Size:     {training_config.batch_size} x {training_config.gradient_accumulation_steps}")
    print(f"  RLHF Data:      {rlhf_dir if rlhf_dir.exists() else 'Not found'}")
    print(f"  RLHF Only:      {args.rlhf_only}")
    print("=" * 60 + "\n")

    if args.dry_run:
        print("Dry run - exiting")
        return 0

    # Download datasets
    if not args.skip_download:
        logger.info("Downloading datasets...")
        downloader = DatasetDownloader(datasets_dir)
        dataset_paths = downloader.download_all(datasets)
    else:
        dataset_paths = {d.id: datasets_dir / d.id for d in datasets}

    if args.download_only:
        logger.info("Download complete. Exiting.")
        return 0

    # Process datasets
    logger.info("Processing datasets...")
    processor = DataProcessor(training_config)

    # Build dataset map
    dataset_map = {}
    if not args.rlhf_only:
        for dataset in datasets:
            if dataset.id in dataset_paths:
                dataset_map[dataset.id] = (dataset_paths[dataset.id], dataset)

    # Prepare datasets with optional RLHF data
    rlhf_path = rlhf_dir if rlhf_dir.exists() else None
    train_samples, val_samples = processor.prepare_dataset(dataset_map, rlhf_path=rlhf_path)

    if not train_samples:
        logger.error("No training samples found!")
        sys.exit(1)

    # Train expert router
    logger.info("Training expert router...")
    router_trainer = ExpertRouterTrainer(training_config)
    router_trainer.build_expert_embeddings(train_samples)
    output_dir.mkdir(parents=True, exist_ok=True)
    router_trainer.save_router(output_dir)

    # Train model
    logger.info("Training model...")
    trainer = MoETrainer(training_config)
    trainer.train(
        train_samples,
        val_samples,
        output_dir,
        resume_from=args.resume
    )

    logger.info("Training complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
