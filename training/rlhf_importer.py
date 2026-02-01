#!/usr/bin/env python3
"""
K'UHUL RLHF Data Importer
Import conversation data from OpenAI, Claude, Mistral, DeepSeek, and other AI providers

Usage:
    python rlhf_importer.py import --source openai --path ./exports/chatgpt/
    python rlhf_importer.py import --source claude --path ./exports/claude/
    python rlhf_importer.py import --source all --path ./exports/
    python rlhf_importer.py stats --path ./rlhf_data/
    python rlhf_importer.py export --path ./rlhf_data/ --format jsonl
"""

import argparse
import json
import os
import re
import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Generator
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================================
# Data Structures
# ============================================================================

@dataclass
class Message:
    """A single message in a conversation"""
    role: str  # user, assistant, system
    content: str
    timestamp: Optional[str] = None
    model: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Conversation:
    """A complete conversation with messages"""
    id: str
    source: str  # openai, claude, mistral, deepseek, etc.
    messages: List[Message] = field(default_factory=list)
    title: Optional[str] = None
    created_at: Optional[str] = None
    model: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_training_samples(self) -> List[Dict[str, str]]:
        """Convert to instruction/response pairs"""
        samples = []
        for i in range(len(self.messages) - 1):
            if self.messages[i].role == "user" and self.messages[i + 1].role == "assistant":
                samples.append({
                    "instruction": self.messages[i].content,
                    "response": self.messages[i + 1].content,
                    "source": self.source,
                    "conversation_id": self.id,
                    "model": self.messages[i + 1].model or self.model,
                })
        return samples


# ============================================================================
# Provider Parsers
# ============================================================================

class BaseParser:
    """Base parser for conversation exports"""
    source_name = "unknown"

    def parse_file(self, path: Path) -> List[Conversation]:
        raise NotImplementedError

    def parse_directory(self, path: Path) -> List[Conversation]:
        """Parse all files in a directory"""
        conversations = []
        for file in path.rglob("*"):
            if file.is_file() and file.suffix in [".json", ".jsonl", ".txt", ".md"]:
                try:
                    conversations.extend(self.parse_file(file))
                except Exception as e:
                    logger.warning(f"Failed to parse {file}: {e}")
        return conversations


class OpenAIParser(BaseParser):
    """Parse OpenAI/ChatGPT conversation exports"""
    source_name = "openai"

    def parse_file(self, path: Path) -> List[Conversation]:
        conversations = []

        with open(path, 'r', encoding='utf-8') as f:
            if path.suffix == '.jsonl':
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        conv = self._parse_conversation(data)
                        if conv:
                            conversations.append(conv)
            else:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        conv = self._parse_conversation(item)
                        if conv:
                            conversations.append(conv)
                else:
                    conv = self._parse_conversation(data)
                    if conv:
                        conversations.append(conv)

        return conversations

    def _parse_conversation(self, data: Dict) -> Optional[Conversation]:
        """Parse a single OpenAI conversation"""
        conv_id = data.get("id") or data.get("conversation_id") or hashlib.md5(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()[:16]

        messages = []

        # Handle ChatGPT export format
        if "mapping" in data:
            # ChatGPT conversations.json format
            for node_id, node in data.get("mapping", {}).items():
                msg = node.get("message")
                if msg and msg.get("content", {}).get("parts"):
                    role = msg.get("author", {}).get("role", "user")
                    content = "\n".join(msg["content"]["parts"])
                    if content.strip():
                        messages.append(Message(
                            role=role,
                            content=content,
                            timestamp=msg.get("create_time"),
                            model=msg.get("metadata", {}).get("model_slug"),
                        ))

        # Handle messages array format
        elif "messages" in data:
            for msg in data["messages"]:
                role = msg.get("role", msg.get("author", {}).get("role", "user"))
                content = msg.get("content", "")
                if isinstance(content, dict):
                    content = content.get("parts", [""])[0] if "parts" in content else str(content)
                if isinstance(content, list):
                    content = "\n".join(str(p) for p in content)
                if content.strip():
                    messages.append(Message(
                        role=role,
                        content=content,
                        model=msg.get("model"),
                    ))

        if not messages:
            return None

        return Conversation(
            id=conv_id,
            source=self.source_name,
            messages=messages,
            title=data.get("title"),
            created_at=data.get("create_time") or data.get("created_at"),
            model=data.get("model"),
        )


class ClaudeParser(BaseParser):
    """Parse Claude/Anthropic conversation exports"""
    source_name = "claude"

    def parse_file(self, path: Path) -> List[Conversation]:
        conversations = []

        with open(path, 'r', encoding='utf-8') as f:
            if path.suffix == '.jsonl':
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        conv = self._parse_conversation(data)
                        if conv:
                            conversations.append(conv)
            else:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        conv = self._parse_conversation(item)
                        if conv:
                            conversations.append(conv)
                else:
                    conv = self._parse_conversation(data)
                    if conv:
                        conversations.append(conv)

        return conversations

    def _parse_conversation(self, data: Dict) -> Optional[Conversation]:
        """Parse a single Claude conversation"""
        conv_id = data.get("uuid") or data.get("id") or hashlib.md5(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()[:16]

        messages = []

        # Handle chat_messages array
        chat_messages = data.get("chat_messages", data.get("messages", []))
        for msg in chat_messages:
            role = msg.get("sender", msg.get("role", "user"))
            if role == "human":
                role = "user"

            # Handle text content
            content = msg.get("text", "")
            if not content and "content" in msg:
                content_list = msg["content"]
                if isinstance(content_list, list):
                    content = "\n".join(
                        c.get("text", "") for c in content_list
                        if isinstance(c, dict) and c.get("type") == "text"
                    )
                else:
                    content = str(content_list)

            if content.strip():
                messages.append(Message(
                    role=role,
                    content=content,
                    timestamp=msg.get("created_at") or msg.get("timestamp"),
                    model=msg.get("model"),
                ))

        if not messages:
            return None

        return Conversation(
            id=conv_id,
            source=self.source_name,
            messages=messages,
            title=data.get("name") or data.get("title"),
            created_at=data.get("created_at"),
            model=data.get("model"),
        )


class MistralParser(BaseParser):
    """Parse Mistral conversation exports"""
    source_name = "mistral"

    def parse_file(self, path: Path) -> List[Conversation]:
        conversations = []

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f) if path.suffix == '.json' else [
                json.loads(line) for line in f if line.strip()
            ]

        if isinstance(data, dict):
            data = [data]

        for item in data:
            conv = self._parse_conversation(item)
            if conv:
                conversations.append(conv)

        return conversations

    def _parse_conversation(self, data: Dict) -> Optional[Conversation]:
        """Parse a single Mistral conversation"""
        conv_id = data.get("id") or hashlib.md5(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()[:16]

        messages = []
        for msg in data.get("messages", []):
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if content.strip():
                messages.append(Message(
                    role=role,
                    content=content,
                    model=data.get("model"),
                ))

        if not messages:
            return None

        return Conversation(
            id=conv_id,
            source=self.source_name,
            messages=messages,
            model=data.get("model"),
        )


class DeepSeekParser(BaseParser):
    """Parse DeepSeek conversation exports"""
    source_name = "deepseek"

    def parse_file(self, path: Path) -> List[Conversation]:
        conversations = []

        with open(path, 'r', encoding='utf-8') as f:
            if path.suffix == '.jsonl':
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        conv = self._parse_conversation(data)
                        if conv:
                            conversations.append(conv)
            else:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        conv = self._parse_conversation(item)
                        if conv:
                            conversations.append(conv)
                else:
                    conv = self._parse_conversation(data)
                    if conv:
                        conversations.append(conv)

        return conversations

    def _parse_conversation(self, data: Dict) -> Optional[Conversation]:
        """Parse a single DeepSeek conversation"""
        conv_id = data.get("id") or data.get("session_id") or hashlib.md5(
            json.dumps(data, sort_keys=True).encode()
        ).hexdigest()[:16]

        messages = []

        # Handle various DeepSeek formats
        msg_list = data.get("messages", data.get("conversation", []))
        for msg in msg_list:
            role = msg.get("role", msg.get("type", "user"))
            if role in ["human", "user_message"]:
                role = "user"
            elif role in ["ai", "assistant_message", "deepseek"]:
                role = "assistant"

            content = msg.get("content", msg.get("text", msg.get("message", "")))
            if isinstance(content, list):
                content = "\n".join(str(c) for c in content)

            if content.strip():
                messages.append(Message(
                    role=role,
                    content=content,
                    model=msg.get("model") or data.get("model"),
                ))

        if not messages:
            return None

        return Conversation(
            id=conv_id,
            source=self.source_name,
            messages=messages,
            title=data.get("title"),
            created_at=data.get("created_at"),
            model=data.get("model"),
        )


class GenericParser(BaseParser):
    """Generic parser for unknown formats"""
    source_name = "generic"

    def __init__(self, source_name: str = "generic"):
        self.source_name = source_name

    def parse_file(self, path: Path) -> List[Conversation]:
        conversations = []

        try:
            with open(path, 'r', encoding='utf-8') as f:
                if path.suffix in ['.json', '.jsonl']:
                    if path.suffix == '.jsonl':
                        data = [json.loads(line) for line in f if line.strip()]
                    else:
                        data = json.load(f)
                        if not isinstance(data, list):
                            data = [data]

                    for item in data:
                        conv = self._try_parse(item, path)
                        if conv:
                            conversations.append(conv)

                elif path.suffix in ['.txt', '.md']:
                    # Try to parse markdown/text conversations
                    conv = self._parse_markdown(f.read(), path)
                    if conv:
                        conversations.append(conv)

        except Exception as e:
            logger.warning(f"Generic parser failed for {path}: {e}")

        return conversations

    def _try_parse(self, data: Dict, path: Path) -> Optional[Conversation]:
        """Try to parse any JSON structure"""
        conv_id = (
            data.get("id") or
            data.get("conversation_id") or
            data.get("uuid") or
            hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16]
        )

        messages = []

        # Try various message field names
        msg_fields = ["messages", "chat_messages", "conversation", "dialog", "turns", "exchanges"]
        msg_list = None
        for field in msg_fields:
            if field in data and isinstance(data[field], list):
                msg_list = data[field]
                break

        if msg_list:
            for msg in msg_list:
                role = self._extract_role(msg)
                content = self._extract_content(msg)
                if content:
                    messages.append(Message(role=role, content=content))

        # Try prompt/response format
        if not messages:
            prompt = data.get("prompt") or data.get("instruction") or data.get("input") or data.get("question")
            response = data.get("response") or data.get("output") or data.get("answer") or data.get("completion")
            if prompt and response:
                messages = [
                    Message(role="user", content=str(prompt)),
                    Message(role="assistant", content=str(response)),
                ]

        if not messages:
            return None

        return Conversation(
            id=conv_id,
            source=self.source_name,
            messages=messages,
            title=data.get("title") or data.get("name"),
        )

    def _extract_role(self, msg: Dict) -> str:
        """Extract role from message"""
        role = msg.get("role") or msg.get("sender") or msg.get("author") or msg.get("type") or "user"
        if isinstance(role, dict):
            role = role.get("role", "user")
        role = str(role).lower()
        if role in ["human", "user_message", "customer"]:
            return "user"
        elif role in ["ai", "assistant_message", "bot", "model", "gpt", "claude", "deepseek"]:
            return "assistant"
        return role

    def _extract_content(self, msg: Dict) -> Optional[str]:
        """Extract content from message"""
        content = (
            msg.get("content") or
            msg.get("text") or
            msg.get("message") or
            msg.get("value") or
            msg.get("body")
        )
        if isinstance(content, list):
            # Handle content parts
            parts = []
            for part in content:
                if isinstance(part, str):
                    parts.append(part)
                elif isinstance(part, dict):
                    parts.append(part.get("text", part.get("value", str(part))))
            content = "\n".join(parts)
        if content:
            return str(content).strip()
        return None

    def _parse_markdown(self, text: str, path: Path) -> Optional[Conversation]:
        """Parse markdown conversation format"""
        messages = []

        # Try to detect conversation patterns
        patterns = [
            (r"(?:^|\n)(?:User|Human|Me|Q):\s*(.+?)(?=(?:\n(?:Assistant|AI|Bot|A|Claude|GPT):)|$)",
             r"(?:^|\n)(?:Assistant|AI|Bot|A|Claude|GPT):\s*(.+?)(?=(?:\n(?:User|Human|Me|Q):)|$)"),
            (r"(?:^|\n)##?\s*(?:User|Prompt|Question)\s*\n(.+?)(?=(?:\n##?\s*(?:Assistant|Response|Answer))|$)",
             r"(?:^|\n)##?\s*(?:Assistant|Response|Answer)\s*\n(.+?)(?=(?:\n##?\s*(?:User|Prompt|Question))|$)"),
        ]

        for user_pattern, assistant_pattern in patterns:
            user_matches = re.findall(user_pattern, text, re.DOTALL | re.IGNORECASE)
            assistant_matches = re.findall(assistant_pattern, text, re.DOTALL | re.IGNORECASE)

            if user_matches and assistant_matches:
                for u, a in zip(user_matches, assistant_matches):
                    if u.strip():
                        messages.append(Message(role="user", content=u.strip()))
                    if a.strip():
                        messages.append(Message(role="assistant", content=a.strip()))
                break

        if not messages:
            return None

        conv_id = hashlib.md5(text.encode()).hexdigest()[:16]
        return Conversation(
            id=conv_id,
            source=self.source_name,
            messages=messages,
            title=path.stem,
        )


# ============================================================================
# Code Detector
# ============================================================================

class CodeDetector:
    """Detect and classify code in conversations"""

    CODE_PATTERNS = {
        "python": [
            r"def\s+\w+\s*\(", r"class\s+\w+\s*[:\(]", r"import\s+\w+", r"from\s+\w+\s+import",
            r"if\s+__name__\s*==", r"@\w+\s*\n\s*def", r"\.py\b", r"print\s*\(",
        ],
        "javascript": [
            r"const\s+\w+\s*=", r"let\s+\w+\s*=", r"function\s+\w+\s*\(",
            r"=>\s*\{", r"async\s+function", r"\.js\b", r"require\s*\(",
            r"module\.exports", r"console\.log",
        ],
        "typescript": [
            r":\s*\w+\s*[=;]", r"interface\s+\w+", r"type\s+\w+\s*=",
            r"<\w+>", r"\.ts\b", r"\.tsx\b", r"as\s+\w+",
        ],
        "rust": [
            r"fn\s+\w+\s*\(", r"let\s+mut\s+\w+", r"impl\s+\w+",
            r"pub\s+fn", r"\.rs\b", r"use\s+\w+::", r"#\[derive",
        ],
        "go": [
            r"func\s+\w+\s*\(", r"package\s+\w+", r"import\s+\(",
            r"\.go\b", r"go\s+func", r":=",
        ],
        "sql": [
            r"SELECT\s+", r"FROM\s+\w+", r"WHERE\s+", r"INSERT\s+INTO",
            r"UPDATE\s+\w+\s+SET", r"CREATE\s+TABLE", r"JOIN\s+\w+",
        ],
        "shell": [
            r"#!/bin/(?:ba)?sh", r"\$\(\w+\)", r"echo\s+", r"export\s+\w+=",
            r"\.sh\b", r"apt-get\s+", r"pip\s+install",
        ],
        "docker": [
            r"FROM\s+\w+", r"RUN\s+", r"COPY\s+", r"EXPOSE\s+\d+",
            r"docker\s+(?:build|run|compose)", r"Dockerfile",
        ],
        "react": [
            r"import\s+React", r"useState\s*\(", r"useEffect\s*\(",
            r"<\w+\s*/?>", r"className=", r"\.jsx\b", r"\.tsx\b",
        ],
        "api": [
            r"(?:GET|POST|PUT|DELETE|PATCH)\s+/", r"Content-Type:",
            r"Authorization:", r"curl\s+", r"fetch\s*\(", r"axios\.",
        ],
    }

    @classmethod
    def detect_experts(cls, text: str) -> List[str]:
        """Detect which experts should handle this content"""
        experts = []
        text_lower = text.lower()

        for lang, patterns in cls.CODE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    expert = f"lang-{lang}" if lang not in ["docker", "react", "api", "sql"] else {
                        "docker": "infra-docker",
                        "react": "web-react",
                        "api": "web-api",
                        "sql": "lang-sql",
                    }.get(lang, f"lang-{lang}")
                    if expert not in experts:
                        experts.append(expert)
                    break

        # Detect algorithmic content
        algo_keywords = ["algorithm", "complexity", "big-o", "dynamic programming", "recursion",
                         "binary search", "graph", "tree", "sorting", "leetcode", "hackerrank"]
        if any(kw in text_lower for kw in algo_keywords):
            experts.append("algo-dynamic")

        # Detect math content
        math_keywords = ["equation", "matrix", "vector", "calculus", "derivative", "integral",
                         "probability", "statistics", "linear algebra"]
        if any(kw in text_lower for kw in math_keywords):
            experts.append("math-algebra")

        return experts if experts else ["lang-python"]  # Default


# ============================================================================
# RLHF Importer
# ============================================================================

class RLHFImporter:
    """Main importer for RLHF data"""

    PARSERS = {
        "openai": OpenAIParser,
        "chatgpt": OpenAIParser,
        "claude": ClaudeParser,
        "anthropic": ClaudeParser,
        "mistral": MistralParser,
        "deepseek": DeepSeekParser,
    }

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.conversations: List[Conversation] = []
        self.stats = defaultdict(int)

    def import_source(self, source: str, path: Path) -> int:
        """Import data from a specific source"""
        parser_class = self.PARSERS.get(source.lower())
        if parser_class:
            parser = parser_class()
        else:
            parser = GenericParser(source)

        logger.info(f"Importing from {source}: {path}")

        if path.is_file():
            conversations = parser.parse_file(path)
        else:
            conversations = parser.parse_directory(path)

        self.conversations.extend(conversations)
        self.stats[source] += len(conversations)

        logger.info(f"Imported {len(conversations)} conversations from {source}")
        return len(conversations)

    def import_all(self, base_path: Path) -> int:
        """Import from all known sources in a directory"""
        total = 0

        # Look for known source directories
        for source in self.PARSERS.keys():
            source_path = base_path / source
            if source_path.exists():
                total += self.import_source(source, source_path)

        # Also try to import any remaining files
        for file in base_path.glob("*.json*"):
            if not any(source in file.name.lower() for source in self.PARSERS.keys()):
                total += self.import_source("generic", file)

        return total

    def filter_code_conversations(self, min_length: int = 100) -> List[Conversation]:
        """Filter to only conversations with substantial code content"""
        filtered = []
        for conv in self.conversations:
            has_code = False
            total_length = 0

            for msg in conv.messages:
                total_length += len(msg.content)
                # Check for code blocks or code patterns
                if "```" in msg.content or re.search(r"def\s+\w+|function\s+\w+|class\s+\w+", msg.content):
                    has_code = True

            if has_code and total_length >= min_length:
                filtered.append(conv)

        return filtered

    def to_training_samples(self, filter_code: bool = True) -> List[Dict]:
        """Convert all conversations to training samples"""
        conversations = self.filter_code_conversations() if filter_code else self.conversations
        samples = []

        for conv in conversations:
            for sample in conv.to_training_samples():
                # Add expert routing
                sample["experts"] = CodeDetector.detect_experts(
                    sample["instruction"] + "\n" + sample["response"]
                )
                samples.append(sample)

        return samples

    def save(self, format: str = "jsonl") -> Path:
        """Save imported data"""
        samples = self.to_training_samples()

        if format == "jsonl":
            output_path = self.output_dir / "rlhf_samples.jsonl"
            with open(output_path, 'w', encoding='utf-8') as f:
                for sample in samples:
                    f.write(json.dumps(sample, ensure_ascii=False) + "\n")

        elif format == "json":
            output_path = self.output_dir / "rlhf_samples.json"
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(samples, f, indent=2, ensure_ascii=False)

        elif format == "parquet":
            try:
                import pyarrow as pa
                import pyarrow.parquet as pq

                output_path = self.output_dir / "rlhf_samples.parquet"
                # Flatten experts list for parquet
                flat_samples = []
                for s in samples:
                    flat_samples.append({
                        **s,
                        "experts": ",".join(s.get("experts", [])),
                    })
                table = pa.Table.from_pylist(flat_samples)
                pq.write_table(table, output_path)
            except ImportError:
                logger.error("pyarrow not installed. Using jsonl format instead.")
                return self.save("jsonl")

        # Also save metadata
        meta_path = self.output_dir / "rlhf_metadata.json"
        with open(meta_path, 'w') as f:
            json.dump({
                "total_samples": len(samples),
                "sources": dict(self.stats),
                "created_at": datetime.now().isoformat(),
                "experts_distribution": self._compute_expert_distribution(samples),
            }, f, indent=2)

        logger.info(f"Saved {len(samples)} samples to {output_path}")
        return output_path

    def _compute_expert_distribution(self, samples: List[Dict]) -> Dict[str, int]:
        """Compute distribution of experts"""
        dist = defaultdict(int)
        for sample in samples:
            for expert in sample.get("experts", []):
                dist[expert] += 1
        return dict(sorted(dist.items(), key=lambda x: x[1], reverse=True))

    def print_stats(self):
        """Print import statistics"""
        samples = self.to_training_samples()

        print("\n" + "=" * 60)
        print(" K'UHUL RLHF Import Statistics")
        print("=" * 60)

        print(f"\n SOURCES")
        for source, count in sorted(self.stats.items()):
            print(f"   {source:15} {count:6} conversations")

        print(f"\n TOTALS")
        print(f"   Conversations:    {len(self.conversations)}")
        print(f"   Training samples: {len(samples)}")
        print(f"   With code:        {len(self.filter_code_conversations())}")

        print(f"\n EXPERT DISTRIBUTION (top 10)")
        dist = self._compute_expert_distribution(samples)
        for expert, count in list(dist.items())[:10]:
            bar = "█" * min(count // 10, 30)
            print(f"   {expert:20} {count:5} {bar}")

        print("=" * 60)


# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="K'UHUL RLHF Data Importer"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Import command
    import_parser = subparsers.add_parser("import", help="Import conversation data")
    import_parser.add_argument("--source", "-s", default="all",
                               help="Source: openai, claude, mistral, deepseek, all")
    import_parser.add_argument("--path", "-p", required=True,
                               help="Path to export directory or file")
    import_parser.add_argument("--output", "-o", default="./rlhf_data",
                               help="Output directory")
    import_parser.add_argument("--format", "-f", default="jsonl",
                               choices=["jsonl", "json", "parquet"])

    # Stats command
    stats_parser = subparsers.add_parser("stats", help="Show statistics")
    stats_parser.add_argument("--path", "-p", required=True,
                              help="Path to rlhf_data directory")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export to training format")
    export_parser.add_argument("--path", "-p", required=True,
                               help="Path to rlhf_data directory")
    export_parser.add_argument("--format", "-f", default="jsonl",
                               choices=["jsonl", "json", "parquet"])
    export_parser.add_argument("--output", "-o", help="Output path")

    args = parser.parse_args()

    if args.command == "import":
        importer = RLHFImporter(Path(args.output))

        path = Path(args.path)
        if args.source.lower() == "all":
            importer.import_all(path)
        else:
            importer.import_source(args.source, path)

        importer.save(args.format)
        importer.print_stats()

    elif args.command == "stats":
        # Load existing data
        data_path = Path(args.path) / "rlhf_samples.jsonl"
        if data_path.exists():
            samples = []
            with open(data_path) as f:
                for line in f:
                    if line.strip():
                        samples.append(json.loads(line))

            print(f"\nLoaded {len(samples)} samples from {data_path}")

            # Show stats
            sources = defaultdict(int)
            experts = defaultdict(int)
            for s in samples:
                sources[s.get("source", "unknown")] += 1
                for e in s.get("experts", []):
                    experts[e] += 1

            print("\n SOURCES")
            for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
                print(f"   {source:15} {count}")

            print("\n TOP EXPERTS")
            for expert, count in sorted(experts.items(), key=lambda x: x[1], reverse=True)[:15]:
                print(f"   {expert:20} {count}")
        else:
            print(f"No data found at {data_path}")

    elif args.command == "export":
        # Re-export data
        data_path = Path(args.path) / "rlhf_samples.jsonl"
        if data_path.exists():
            samples = []
            with open(data_path) as f:
                for line in f:
                    if line.strip():
                        samples.append(json.loads(line))

            output_path = Path(args.output) if args.output else Path(args.path)
            if args.format == "jsonl":
                out_file = output_path / "training_data.jsonl"
                with open(out_file, 'w') as f:
                    for s in samples:
                        f.write(json.dumps(s) + "\n")
            elif args.format == "json":
                out_file = output_path / "training_data.json"
                with open(out_file, 'w') as f:
                    json.dump(samples, f, indent=2)

            print(f"Exported {len(samples)} samples to {out_file}")
        else:
            print(f"No data found at {data_path}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
