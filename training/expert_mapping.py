#!/usr/bin/env python3
"""
K'UHUL Expert-to-Dataset Mapping
Visualizes and manages the mapping between experts and training datasets

Usage:
    python expert_mapping.py show
    python expert_mapping.py coverage
    python expert_mapping.py export --format json
"""

import argparse
import json
from dataclasses import dataclass
from typing import Dict, List, Set
from pathlib import Path

# ============================================================================
# Expert Taxonomy (108 total: 89 defined + 19 reserved)
# ============================================================================

EXPERT_TAXONOMY = {
    "math": {
        "parent": "MathMicroAtomic",
        "experts": [
            "math-algebra", "math-calculus", "math-statistics",
            "math-linear-algebra", "math-discrete", "math-numerical",
            "math-geometry", "math-probability", "math-optimization", "math-proofs"
        ]
    },
    "languages": {
        "parent": "ProgrammingMicroAtomic",
        "experts": [
            "lang-python", "lang-typescript", "lang-javascript", "lang-rust",
            "lang-go", "lang-java", "lang-cpp", "lang-c", "lang-csharp",
            "lang-swift", "lang-kotlin", "lang-ruby", "lang-php", "lang-sql", "lang-shell"
        ]
    },
    "web": {
        "parent": "WebMicroAtomic",
        "experts": [
            "web-react", "web-vue", "web-angular", "web-svelte", "web-nextjs",
            "web-css", "web-html", "web-api", "web-graphql", "web-websocket",
            "web-pwa", "web-accessibility"
        ]
    },
    "data": {
        "parent": "CodeGenMicroAtomic",
        "experts": [
            "data-pytorch", "data-tensorflow", "data-pandas", "data-numpy",
            "data-sklearn", "data-transformers", "data-mlops",
            "data-visualization", "data-preprocessing", "data-deployment"
        ]
    },
    "infra": {
        "parent": "CodeGenMicroAtomic",
        "experts": [
            "infra-docker", "infra-kubernetes", "infra-aws", "infra-gcp",
            "infra-azure", "infra-terraform", "infra-ansible", "infra-cicd",
            "infra-monitoring", "infra-security", "infra-networking", "infra-databases"
        ]
    },
    "resume": {
        "parent": "ResumeMicroAtomic",
        "experts": [
            "resume-tech", "resume-management", "resume-academic", "resume-creative",
            "resume-finance", "resume-healthcare", "resume-legal", "resume-general"
        ]
    },
    "algorithms": {
        "parent": "ProgrammingMicroAtomic",
        "experts": [
            "algo-sorting", "algo-graph", "algo-dynamic", "algo-greedy",
            "algo-search", "algo-tree", "algo-string", "algo-complexity"
        ]
    },
    "architecture": {
        "parent": "ProgrammingMicroAtomic",
        "experts": [
            "arch-microservices", "arch-monolith", "arch-serverless",
            "arch-event-driven", "arch-cqrs", "arch-ddd", "arch-patterns", "arch-scaling"
        ]
    },
    "docs": {
        "parent": "OutputMicroAtomic",
        "experts": [
            "docs-api", "docs-tutorial", "docs-readme",
            "docs-changelog", "docs-specification", "docs-comments"
        ]
    },
    "reserved": {
        "parent": "CustomMicroAtomic",
        "experts": [f"reserved-{i:02d}" for i in range(1, 20)]
    }
}

# ============================================================================
# Dataset Mapping
# ============================================================================

DATASET_MAPPING = {
    "deep-planning": {
        "name": "Qwen/DeepPlanning",
        "experts": ["algo-dynamic", "algo-graph", "arch-patterns", "arch-ddd"],
        "features": ["planning", "reasoning", "multi-step"],
        "weight": 1.2
    },
    "sft-code": {
        "name": "eth-dl-rewards/sft-data-code",
        "experts": ["lang-python", "lang-javascript", "lang-typescript", "lang-rust"],
        "features": ["supervised-finetuning", "code-generation"],
        "weight": 1.5
    },
    "a1-code-apps": {
        "name": "mlfoundations-dev/a1_code_apps_phi_annotated",
        "experts": ["lang-python", "algo-complexity", "algo-dynamic"],
        "features": ["competitive-programming", "problem-solving"],
        "weight": 1.2
    },
    "agent-tool-use": {
        "name": "Mgmgrand420/Agent-Tool-Use-Dialogue-Open-Dataset",
        "experts": ["infra-cicd", "infra-docker", "web-api"],
        "features": ["tool-use", "agent-dialogue", "function-calling"],
        "weight": 1.0
    },
    "gpt5-codex": {
        "name": "Mgmgrand420/gpt-5-codex-1000x",
        "experts": ["lang-python", "lang-javascript", "lang-typescript", "lang-go", "lang-rust"],
        "features": ["code-completion", "multi-language"],
        "weight": 1.5
    },
    "deepthink-code": {
        "name": "Mgmgrand420/DeepThink-Code-Lite",
        "experts": ["algo-dynamic", "algo-graph", "math-discrete", "math-proofs"],
        "features": ["reasoning", "step-by-step", "chain-of-thought"],
        "weight": 1.3
    },
    "dolphin-coder": {
        "name": "Mgmgrand420/dolphin-coder",
        "experts": ["lang-python", "lang-javascript", "web-react", "web-api"],
        "features": ["instruction-following", "code-generation"],
        "weight": 1.0
    },
    "code-feedback": {
        "name": "Mgmgrand420/Code-Feedback",
        "experts": ["docs-comments", "docs-api", "resume-tech"],
        "features": ["code-review", "feedback", "improvement"],
        "weight": 0.8
    }
}


# ============================================================================
# Analysis Functions
# ============================================================================

def get_all_experts() -> List[str]:
    """Get all expert IDs"""
    experts = []
    for category, data in EXPERT_TAXONOMY.items():
        experts.extend(data["experts"])
    return experts


def get_covered_experts() -> Set[str]:
    """Get experts that have training data"""
    covered = set()
    for dataset in DATASET_MAPPING.values():
        covered.update(dataset["experts"])
    return covered


def get_uncovered_experts() -> Set[str]:
    """Get experts without training data"""
    all_experts = set(get_all_experts())
    covered = get_covered_experts()
    return all_experts - covered


def get_expert_datasets(expert_id: str) -> List[str]:
    """Get datasets that train a specific expert"""
    datasets = []
    for dataset_id, data in DATASET_MAPPING.items():
        if expert_id in data["experts"]:
            datasets.append(dataset_id)
    return datasets


def compute_expert_weights() -> Dict[str, float]:
    """Compute training weight for each expert"""
    weights = {}
    for expert in get_all_experts():
        total_weight = 0.0
        for dataset_id, data in DATASET_MAPPING.items():
            if expert in data["experts"]:
                total_weight += data["weight"]
        weights[expert] = total_weight
    return weights


# ============================================================================
# Display Functions
# ============================================================================

def show_mapping():
    """Display the expert-to-dataset mapping"""
    print("\n" + "=" * 70)
    print(" K'UHUL Expert-to-Dataset Mapping")
    print("=" * 70)

    for category, data in EXPERT_TAXONOMY.items():
        print(f"\n{category.upper()} ({data['parent']})")
        print("-" * 50)

        for expert in data["experts"]:
            datasets = get_expert_datasets(expert)
            if datasets:
                print(f"  {expert:25} <- {', '.join(datasets)}")
            else:
                print(f"  {expert:25} <- (no data)")


def show_coverage():
    """Show coverage statistics"""
    all_experts = get_all_experts()
    covered = get_covered_experts()
    uncovered = get_uncovered_experts()
    weights = compute_expert_weights()

    print("\n" + "=" * 70)
    print(" K'UHUL Training Coverage Analysis")
    print("=" * 70)

    print(f"\n SUMMARY")
    print(f"   Total experts:     {len(all_experts)}")
    print(f"   Covered by data:   {len(covered)} ({100*len(covered)/len(all_experts):.1f}%)")
    print(f"   Uncovered:         {len(uncovered)} ({100*len(uncovered)/len(all_experts):.1f}%)")

    print(f"\n DATASETS ({len(DATASET_MAPPING)})")
    for dataset_id, data in DATASET_MAPPING.items():
        print(f"   {dataset_id:20} -> {len(data['experts'])} experts (weight: {data['weight']})")

    print(f"\n CATEGORY COVERAGE")
    for category, data in EXPERT_TAXONOMY.items():
        cat_experts = set(data["experts"])
        cat_covered = cat_experts & covered
        pct = 100 * len(cat_covered) / len(cat_experts) if cat_experts else 0
        bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
        print(f"   {category:12} {bar} {pct:5.1f}% ({len(cat_covered)}/{len(cat_experts)})")

    print(f"\n UNCOVERED EXPERTS")
    for expert in sorted(uncovered):
        if not expert.startswith("reserved-"):
            print(f"   - {expert}")

    print(f"\n TOP WEIGHTED EXPERTS")
    sorted_weights = sorted(weights.items(), key=lambda x: x[1], reverse=True)
    for expert, weight in sorted_weights[:10]:
        if weight > 0:
            print(f"   {expert:25} weight: {weight:.2f}")


def show_datasets():
    """Show dataset details"""
    print("\n" + "=" * 70)
    print(" K'UHUL Training Datasets")
    print("=" * 70)

    for dataset_id, data in DATASET_MAPPING.items():
        print(f"\n {dataset_id}")
        print(f"   Source:   {data['name']}")
        print(f"   Weight:   {data['weight']}")
        print(f"   Features: {', '.join(data['features'])}")
        print(f"   Experts:  {', '.join(data['experts'])}")


def export_mapping(format: str, output: str):
    """Export mapping to file"""
    if format == "json":
        data = {
            "taxonomy": EXPERT_TAXONOMY,
            "datasets": DATASET_MAPPING,
            "coverage": {
                "total": len(get_all_experts()),
                "covered": len(get_covered_experts()),
                "uncovered": list(get_uncovered_experts()),
            },
            "weights": compute_expert_weights(),
        }
        with open(output, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Exported to {output}")

    elif format == "markdown":
        with open(output, 'w') as f:
            f.write("# K'UHUL Expert-to-Dataset Mapping\n\n")

            f.write("## Datasets\n\n")
            f.write("| Dataset | Source | Experts | Weight |\n")
            f.write("|---------|--------|---------|--------|\n")
            for did, data in DATASET_MAPPING.items():
                f.write(f"| {did} | {data['name']} | {len(data['experts'])} | {data['weight']} |\n")

            f.write("\n## Coverage by Category\n\n")
            covered = get_covered_experts()
            for category, data in EXPERT_TAXONOMY.items():
                cat_experts = set(data["experts"])
                cat_covered = cat_experts & covered
                pct = 100 * len(cat_covered) / len(cat_experts) if cat_experts else 0
                f.write(f"- **{category}**: {pct:.0f}% ({len(cat_covered)}/{len(cat_experts)})\n")

        print(f"Exported to {output}")


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="K'UHUL Expert-to-Dataset Mapping Tool"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Show command
    subparsers.add_parser("show", help="Show expert-to-dataset mapping")

    # Coverage command
    subparsers.add_parser("coverage", help="Show coverage statistics")

    # Datasets command
    subparsers.add_parser("datasets", help="Show dataset details")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export mapping")
    export_parser.add_argument("--format", "-f", choices=["json", "markdown"], default="json")
    export_parser.add_argument("--output", "-o", default="expert_mapping.json")

    args = parser.parse_args()

    if args.command == "show":
        show_mapping()
    elif args.command == "coverage":
        show_coverage()
    elif args.command == "datasets":
        show_datasets()
    elif args.command == "export":
        export_mapping(args.format, args.output)
    else:
        # Default: show coverage
        show_coverage()


if __name__ == "__main__":
    main()
