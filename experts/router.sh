#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ATOMIC EXPERT ROUTER
# VERSION: 1.0.0
#
# Routes input to appropriate experts based on n-gram matching
# and tensor weight activation scores.
#
# This router does NOT use an LLM. It uses pre-computed n-gram
# pools and tensor weights from each expert file.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOP_K=${TOP_K:-4}

# ─────────────────────────────────────────────────────────────────
# FIND ALL EXPERT FILES
# ─────────────────────────────────────────────────────────────────

find_experts() {
  find "$SCRIPT_DIR" -name "*.expert" -type f 2>/dev/null | sort
}

# ─────────────────────────────────────────────────────────────────
# GET EXPERT ACTIVATION SCORE
# ─────────────────────────────────────────────────────────────────

get_expert_score() {
  local expert_file="$1"
  local input="$2"

  # Source the expert to get its functions
  # Run in subshell to avoid pollution
  (
    source "$expert_file"
    calculate_activation "$input"
  )
}

# ─────────────────────────────────────────────────────────────────
# GET EXPERT INFO
# ─────────────────────────────────────────────────────────────────

get_expert_info() {
  local expert_file="$1"

  (
    source "$expert_file"
    echo "$EXPERT_ID|$EXPERT_TITLE|$WEIGHT_ACTIVATION"
  )
}

# ─────────────────────────────────────────────────────────────────
# ROUTE INPUT TO EXPERTS
# ─────────────────────────────────────────────────────────────────

route() {
  local input="$1"
  local results=()

  echo "Routing input: \"$input\""
  echo "─────────────────────────────────────────────────────────"
  echo ""

  # Score all experts
  while IFS= read -r expert_file; do
    local score=$(get_expert_score "$expert_file" "$input")
    local info=$(get_expert_info "$expert_file")
    local expert_id=$(echo "$info" | cut -d'|' -f1)
    local expert_title=$(echo "$info" | cut -d'|' -f2)
    local threshold=$(echo "$info" | cut -d'|' -f3)

    # Check if activated
    local activated="DORMANT"
    if (( $(echo "$score >= $threshold" | bc -l) )); then
      activated="ACTIVE"
    fi

    results+=("$score|$expert_id|$expert_title|$activated|$threshold")
  done < <(find_experts)

  # Sort by score (descending) and take top-k
  echo "Top-$TOP_K Experts:"
  echo ""
  printf "%-8s %-8s %-25s %-30s %s\n" "SCORE" "STATUS" "EXPERT_ID" "TITLE" "THRESHOLD"
  echo "─────────────────────────────────────────────────────────────────────────────────────"

  printf '%s\n' "${results[@]}" | sort -t'|' -k1 -rn | head -n "$TOP_K" | while IFS='|' read -r score expert_id expert_title activated threshold; do
    printf "%-8.3f %-8s %-25s %-30s %.2f\n" "$score" "$activated" "$expert_id" "$expert_title" "$threshold"
  done

  echo ""
  echo "─────────────────────────────────────────────────────────"

  # Count activated
  local active_count=$(printf '%s\n' "${results[@]}" | grep "|ACTIVE|" | wc -l)
  echo "Activated: $active_count experts"
}

# ─────────────────────────────────────────────────────────────────
# LIST ALL EXPERTS
# ─────────────────────────────────────────────────────────────────

list_experts() {
  echo "Registered Experts:"
  echo "─────────────────────────────────────────────────────────"
  printf "%-25s %-35s %s\n" "EXPERT_ID" "TITLE" "FILE"
  echo "─────────────────────────────────────────────────────────"

  while IFS= read -r expert_file; do
    local info=$(get_expert_info "$expert_file")
    local expert_id=$(echo "$info" | cut -d'|' -f1)
    local expert_title=$(echo "$info" | cut -d'|' -f2)
    local rel_path="${expert_file#$SCRIPT_DIR/}"

    printf "%-25s %-35s %s\n" "$expert_id" "$expert_title" "$rel_path"
  done < <(find_experts)

  echo ""
  echo "Total: $(find_experts | wc -l) experts"
}

# ─────────────────────────────────────────────────────────────────
# GET STATUS AS JSON
# ─────────────────────────────────────────────────────────────────

status_json() {
  local input="${1:-}"
  local experts=()

  while IFS= read -r expert_file; do
    local score=0
    if [ -n "$input" ]; then
      score=$(get_expert_score "$expert_file" "$input")
    fi

    local info=$(get_expert_info "$expert_file")
    local expert_id=$(echo "$info" | cut -d'|' -f1)
    local threshold=$(echo "$info" | cut -d'|' -f3)

    local activated="false"
    if [ -n "$input" ] && (( $(echo "$score >= $threshold" | bc -l) )); then
      activated="true"
    fi

    experts+=("{\"id\":\"$expert_id\",\"score\":$score,\"activated\":$activated}")
  done < <(find_experts)

  # Join with commas
  local joined=$(IFS=,; echo "${experts[*]}")

  cat << EOF
{
  "router": "atomic-expert-router",
  "version": "1.0.0",
  "top_k": $TOP_K,
  "input": $([ -n "$input" ] && echo "\"$input\"" || echo "null"),
  "experts": [$joined]
}
EOF
}

# ─────────────────────────────────────────────────────────────────
# HELP
# ─────────────────────────────────────────────────────────────────

show_help() {
  cat << EOF
Atomic Expert Router v1.0.0

Usage: $(basename "$0") <command> [arguments]

Commands:
  route <input>     Route input to experts and show activation scores
  list              List all registered experts
  status [input]    Get router status as JSON
  help              Show this help message

Environment Variables:
  TOP_K             Number of top experts to show (default: 4)

Examples:
  $(basename "$0") route "solve the matrix equation Ax = b"
  $(basename "$0") route "write a python function to sort a list"
  $(basename "$0") list
  TOP_K=8 $(basename "$0") route "calculate eigenvalues"

EOF
}

# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────

case "${1:-help}" in
  route)
    if [ -z "${2:-}" ]; then
      echo "Error: Missing input"
      echo "Usage: $(basename "$0") route <input>"
      exit 1
    fi
    route "$2"
    ;;
  list)
    list_experts
    ;;
  status)
    status_json "${2:-}"
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
