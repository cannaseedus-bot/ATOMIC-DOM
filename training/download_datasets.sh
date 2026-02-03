#!/bin/bash
#
# K'UHUL Atomic Expert Dataset Downloader
# Downloads all training datasets from Hugging Face
#

set -e

DATASETS_DIR="${1:-./datasets}"
mkdir -p "$DATASETS_DIR"
cd "$DATASETS_DIR"

echo "=================================================="
echo " K'UHUL Atomic Expert Dataset Downloader"
echo "=================================================="
echo " Target directory: $DATASETS_DIR"
echo "=================================================="
echo ""

# Function to clone a dataset
clone_dataset() {
    local name="$1"
    local url="$2"
    local dir="$3"

    if [ -d "$dir" ]; then
        echo "[SKIP] $name already exists"
        return 0
    fi

    echo "[CLONE] $name"
    echo "        $url"

    if git clone --depth 1 "$url" "$dir" 2>/dev/null; then
        echo "[OK] $name downloaded"
    else
        echo "[WARN] git clone failed, trying huggingface-cli..."
        local repo_id="${url#https://huggingface.co/datasets/}"
        if huggingface-cli download --repo-type dataset "$repo_id" --local-dir "$dir" 2>/dev/null; then
            echo "[OK] $name downloaded via HF CLI"
        else
            echo "[FAIL] Could not download $name"
            return 1
        fi
    fi
}

echo "Downloading 8 datasets..."
echo ""

# 1. DeepPlanning - Planning and reasoning
clone_dataset \
    "DeepPlanning" \
    "https://huggingface.co/datasets/Qwen/DeepPlanning" \
    "deep-planning"

# 2. SFT Data Code - Supervised fine-tuning code
clone_dataset \
    "SFT Data Code" \
    "https://huggingface.co/datasets/eth-dl-rewards/sft-data-code" \
    "sft-code"

# 3. A1 Code Apps - Competitive programming
clone_dataset \
    "A1 Code Apps Phi" \
    "https://huggingface.co/datasets/mlfoundations-dev/a1_code_apps_phi_annotated" \
    "a1-code-apps"

# 4. Agent Tool Use - Tool use dialogues
clone_dataset \
    "Agent Tool Use" \
    "https://huggingface.co/datasets/Mgmgrand420/Agent-Tool-Use-Dialogue-Open-Dataset" \
    "agent-tool-use"

# 5. GPT-5 Codex - Multi-language code
clone_dataset \
    "GPT-5 Codex 1000x" \
    "https://huggingface.co/datasets/Mgmgrand420/gpt-5-codex-1000x" \
    "gpt5-codex"

# 6. DeepThink Code - Reasoning with code
clone_dataset \
    "DeepThink Code Lite" \
    "https://huggingface.co/datasets/Mgmgrand420/DeepThink-Code-Lite" \
    "deepthink-code"

# 7. Dolphin Coder - Instruction following
clone_dataset \
    "Dolphin Coder" \
    "https://huggingface.co/datasets/Mgmgrand420/dolphin-coder" \
    "dolphin-coder"

# 8. Code Feedback - Code review
clone_dataset \
    "Code Feedback" \
    "https://huggingface.co/datasets/Mgmgrand420/Code-Feedback" \
    "code-feedback"

echo ""
echo "=================================================="
echo " Download Summary"
echo "=================================================="

# Count datasets
total=0
success=0
for dir in deep-planning sft-code a1-code-apps agent-tool-use gpt5-codex deepthink-code dolphin-coder code-feedback; do
    total=$((total + 1))
    if [ -d "$dir" ]; then
        success=$((success + 1))
        size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo " [OK] $dir ($size)"
    else
        echo " [--] $dir (not downloaded)"
    fi
done

echo ""
echo " Total: $success/$total datasets ready"
echo "=================================================="

# Show total size
total_size=$(du -sh . 2>/dev/null | cut -f1)
echo " Total size: $total_size"
echo ""
