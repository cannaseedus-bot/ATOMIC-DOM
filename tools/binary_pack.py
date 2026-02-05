"""Binary packer for ATOMIC-DOM MATRIX ingest.

This script converts text-based sources into fixed-width binary atoms that can
be memory-mapped and streamed without parsing in hot loops.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, List

import numpy as np

# ---- CONFIG ----
VOCAB_SIZE = 65_536  # uint16
DTYPE = np.uint16
ATOM_SIZE = 256  # tokens per atom
OUT_FILE = "matrix_atoms.bin"

# ---- PLACEHOLDERS (plug your real ones in) ----

def load_and_clean(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")

    if path.suffix == ".json":
        try:
            obj = json.loads(text)
            text = json.dumps(obj, separators=(",", ":"))
        except json.JSONDecodeError:
            pass

    # Minimal HTML stripping (replace later if needed)
    text = text.replace("<", " ").replace(">", " ")
    return text


def pi_tokenize(text: str) -> List[int]:
    """Deterministic placeholder tokenizer (replace with π tokenizer)."""
    return [ord(char) % VOCAB_SIZE for char in text]


# ---- PACKER ----

def iter_text_files(input_dir: Path) -> Iterable[Path]:
    for path in input_dir.rglob("*"):
        if path.suffix.lower() in {".txt", ".md", ".html", ".json"}:
            yield path


def pack_directory(input_dir: str, out_file: str) -> None:
    tokens: List[int] = []
    root = Path(input_dir)

    for path in iter_text_files(root):
        text = load_and_clean(path)
        tokens.extend(pi_tokenize(text))

    pad = (-len(tokens)) % ATOM_SIZE
    if pad:
        tokens.extend([0] * pad)

    arr = np.array(tokens, dtype=DTYPE)
    arr.tofile(out_file)

    print(f"[OK] Packed {len(arr)} tokens")
    print(f"[OK] Atoms: {len(arr) // ATOM_SIZE}")
    print(f"[OK] Output: {out_file}")


if __name__ == "__main__":
    pack_directory("datasets", OUT_FILE)
