# K'UHUL RLHF Data Import Guide

Import your personal AI conversation history to train a personalized coding assistant.

## Supported Providers

| Provider | Export Method | Data Format | Priority |
|----------|---------------|-------------|----------|
| **OpenAI/ChatGPT** | Settings → Data Controls → Export | `conversations.json` | High |
| **Claude** | Settings → Export Data | `conversations.json` | High |
| **DeepSeek** | Profile → Export History | `*.jsonl` | High |
| **Mistral** | Account → Download Data | `*.json` | Medium |
| **Gemini** | Google Takeout | `*.json` | Medium |
| **GitHub Copilot** | VS Code logs | `*.log` | High |

---

## Step 1: Export Your Data

### OpenAI/ChatGPT

1. Go to [chat.openai.com](https://chat.openai.com)
2. Click your profile icon → **Settings**
3. Navigate to **Data Controls**
4. Click **Export Data**
5. Wait for email with download link
6. Extract to `./exports/openai/`

```bash
mkdir -p training/exports/openai
# Extract your downloaded zip here
unzip chatgpt-export.zip -d training/exports/openai/
```

### Claude (Anthropic)

1. Go to [claude.ai](https://claude.ai)
2. Click your profile → **Settings**
3. Navigate to **Privacy & Data**
4. Click **Export Conversation History**
5. Extract to `./exports/claude/`

```bash
mkdir -p training/exports/claude
# Extract your downloaded data here
```

### DeepSeek

1. Go to [chat.deepseek.com](https://chat.deepseek.com)
2. Click your profile → **Account Settings**
3. Find **Export History** or **Download Data**
4. Save to `./exports/deepseek/`

```bash
mkdir -p training/exports/deepseek
# Move your exported files here
```

### Mistral

1. Go to [chat.mistral.ai](https://chat.mistral.ai)
2. Navigate to **Account** → **Privacy**
3. Request data export
4. Save to `./exports/mistral/`

### GitHub Copilot

Copilot doesn't have a direct export, but you can capture suggestions:

```bash
# VS Code: Enable telemetry logging
# Check ~/.config/Code/logs/ for suggestion logs

mkdir -p training/exports/copilot
# Copy relevant log files
```

---

## Step 2: Import Your Data

### Import All Sources

```bash
cd training

# Import everything from exports directory
python rlhf_importer.py import --source all --path ./exports/

# Or import specific providers
python rlhf_importer.py import --source openai --path ./exports/openai/
python rlhf_importer.py import --source claude --path ./exports/claude/
python rlhf_importer.py import --source deepseek --path ./exports/deepseek/
```

### View Statistics

```bash
python rlhf_importer.py stats --path ./rlhf_data/
```

Expected output:
```
 K'UHUL RLHF Import Statistics
==================================================

 SOURCES
   openai          1,234 conversations
   claude            567 conversations
   deepseek          890 conversations

 TOTALS
   Conversations:    2,691
   Training samples: 8,432
   With code:        6,789

 EXPERT DISTRIBUTION (top 10)
   lang-python          2,341 ████████████████████
   lang-typescript      1,234 ██████████
   lang-javascript        987 ████████
   web-react              654 █████
   algo-dynamic           432 ███
   infra-docker           321 ██
```

---

## Step 3: Train with RLHF Data

```bash
# Full training with RLHF + HuggingFace datasets
python train.py --config datasets.json

# Or train only on your RLHF data
python train.py --config datasets.json --rlhf-only
```

---

## Data Format Examples

### OpenAI Format
```json
{
  "title": "Python async debugging",
  "mapping": {
    "node-1": {
      "message": {
        "author": {"role": "user"},
        "content": {"parts": ["How do I debug async Python code?"]},
        "metadata": {"model_slug": "gpt-4"}
      }
    }
  }
}
```

### Claude Format
```json
{
  "uuid": "conv-123",
  "name": "React hooks optimization",
  "chat_messages": [
    {"sender": "human", "text": "Explain useCallback vs useMemo"},
    {"sender": "assistant", "text": "useCallback memoizes functions..."}
  ]
}
```

### DeepSeek Format
```json
{
  "id": "session-456",
  "messages": [
    {"role": "user", "content": "Implement a trie data structure"},
    {"role": "assistant", "content": "Here's a Trie implementation..."}
  ]
}
```

---

## Expert Auto-Detection

The importer automatically detects which experts should train on each conversation:

| Pattern | Detected Expert |
|---------|-----------------|
| `def `, `class `, `import` | `lang-python` |
| `const `, `=>`, `async` | `lang-javascript` |
| `interface `, `type `, `<T>` | `lang-typescript` |
| `fn `, `impl `, `pub` | `lang-rust` |
| `func `, `package `, `:=` | `lang-go` |
| `SELECT`, `FROM`, `WHERE` | `lang-sql` |
| `docker`, `Dockerfile` | `infra-docker` |
| `kubectl`, `deployment` | `infra-kubernetes` |
| `React`, `useState`, `jsx` | `web-react` |
| `algorithm`, `O(n)`, `leetcode` | `algo-dynamic` |

---

## Privacy & Security

The importer includes safety features:

- **API Key Detection**: Automatically redacts patterns like `sk-...`, `AKIA...`
- **Email Removal**: Option to strip email addresses
- **Deduplication**: Removes duplicate conversations
- **Code-Only Filter**: Focus on conversations with actual code

```json
{
  "processing": {
    "anonymization": {
      "removeEmails": true,
      "removeApiKeys": true
    }
  }
}
```

---

## Directory Structure

```
training/
├── exports/
│   ├── openai/
│   │   └── conversations.json
│   ├── claude/
│   │   └── export.json
│   ├── deepseek/
│   │   └── history.jsonl
│   ├── mistral/
│   │   └── chats.json
│   └── copilot/
│       └── suggestions.log
├── rlhf_data/
│   ├── rlhf_samples.jsonl      # Processed training data
│   └── rlhf_metadata.json      # Import statistics
├── datasets.json               # Training config
├── rlhf_importer.py           # Import tool
└── train.py                   # Training script
```

---

## Troubleshooting

### "No conversations found"

Check that your export files are in the correct format. Try:
```bash
# Inspect file structure
head -c 1000 exports/openai/conversations.json
```

### "Failed to parse"

The importer tries multiple formats. If one fails, it attempts alternatives:
```bash
# Force generic parser
python rlhf_importer.py import --source generic --path ./exports/unknown/
```

### Memory issues with large exports

Process in chunks:
```bash
# Split large files
split -l 1000 large_export.jsonl chunk_
for f in chunk_*; do
  python rlhf_importer.py import --source openai --path "$f"
done
```
