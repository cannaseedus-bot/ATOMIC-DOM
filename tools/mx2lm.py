#!/usr/bin/env python3
"""
MX2LM AGENT FOREMAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Core: @posthog/code-agent (unified agent framework)
Sub-CLIs: /claude, /gemini, /codex → spawn dedicated terminals
Includes: PowerShell XCFE-PS-ENVELOPE Security

ARCHITECTURE:
┌─────────────────────────────────────────────────┐
│           @posthog/code-agent (Core)            │
├─────────┬─────────┬─────────┬──────────────────┤
│ /claude │ /gemini │ /codex  │ /ollama /phi3    │
│ Claude  │ Gemini  │ OpenAI  │ Local + Cloud    │
│  Code   │  CLI    │ Codex   │ Models           │
└─────────┴─────────┴─────────┴──────────────────┘
"""
import os
import argparse
import threading
import webbrowser
import time
import pathlib
import socketserver
import http.server
import json
import subprocess
from typing import Optional, Any

def parse_args():
    parser = argparse.ArgumentParser(description="MX2LM CLI with optional Basher V5 web UI")
    parser.add_argument('-w', '--web', action='store_true', help='Launch the Basher V5 web interface')
    parser.add_argument('--port', type=int, default=8333, help='Port for the web server (default: 8333)')
    parser.add_argument('--no-browser', action='store_true', help='Do not automatically open a browser')
    parser.add_argument('--flask-port', type=int, default=8500, help='Port for the Flask model server (default: 8500)')
    parser.add_argument('--raw-ps', action='store_true', help='Enable raw PowerShell mode (bypass DSL)')
    return parser.parse_args()

def start_web_server(port: int, open_browser: bool):
    """Start a simple HTTP server serving the ./web directory."""
    web_root = pathlib.Path(__file__).with_name('web').resolve()
    os.chdir(web_root)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True, name="BasherWebServer")
    thread.start()
    if open_browser:
        try:
            webbrowser.open_new_tab(f"http://127.0.0.1:{port}")
        except Exception:
            pass
    return httpd, thread


# ═══════════════════════════════════════════════════════════════
# HYBRID AGENT ROUTER - Sub-CLI Dispatcher
# ═══════════════════════════════════════════════════════════════

class AgentRouter:
    """
    Routes /command prefixes to dedicated CLI sub-terminals.
    Each agent has its own interactive mode when spawned.
    """

    AGENT_REGISTRY = {
        '/claude': {
            'name': 'Claude Code',
            'package': '@anthropic-ai/claude-code',
            'cmd': 'npx @anthropic-ai/claude-code',
            'env_key': 'ANTHROPIC_API_KEY',
            'description': 'Anthropic Claude Code CLI - agentic coding assistant'
        },
        '/gemini': {
            'name': 'Gemini CLI',
            'package': 'gemini-cli',
            'cmd': 'npx gemini-cli',
            'env_key': 'GEMINI_API_KEY',
            'description': 'Google Gemini CLI - multimodal AI assistant'
        },
        '/codex': {
            'name': 'OpenAI Codex',
            'package': 'openai',
            'cmd': 'npx openai',
            'env_key': 'OPENAI_API_KEY',
            'description': 'OpenAI CLI - GPT-4 and Codex models'
        },
        '/ollama': {
            'name': 'Ollama',
            'package': 'ollama',
            'cmd': 'ollama run',
            'env_key': 'OLLAMA_HOST',
            'description': 'Ollama local/cloud model runner'
        },
        '/phi3': {
            'name': 'Phi-3 Local',
            'package': 'transformers',
            'cmd': 'python -m mx2lm.phi3_runner',
            'env_key': None,
            'description': 'Microsoft Phi-3 local inference'
        },
        '/posthog': {
            'name': 'PostHog Code Agent',
            'package': '@posthog/code-agent',
            'cmd': 'npx @posthog/code-agent',
            'env_key': 'POSTHOG_API_KEY',
            'description': 'PostHog unified code agent framework'
        }
    }

    @classmethod
    def parse_command(cls, input_str: str) -> tuple:
        """Parse input for /agent prefix"""
        input_str = input_str.strip()
        for prefix, config in cls.AGENT_REGISTRY.items():
            if input_str.startswith(prefix):
                remaining = input_str[len(prefix):].strip()
                return prefix, config, remaining
        return None, None, input_str

    @classmethod
    def spawn_agent(cls, prefix: str, args: str = '', interactive: bool = True):
        """Spawn a dedicated sub-terminal for the selected agent."""
        config = cls.AGENT_REGISTRY.get(prefix)
        if not config:
            print(f"[MX2LM] Unknown agent: {prefix}")
            return False

        if config['env_key'] and not os.getenv(config['env_key']):
            print(f"[MX2LM] ⚠️  Missing env: {config['env_key']}")
            print(f"[MX2LM] Set it with: export {config['env_key']}=your_key")
            return False

        cmd = config['cmd']
        if args:
            cmd = f"{cmd} {args}"

        print(f"")
        print(f"╔═══════════════════════════════════════════════════════════════╗")
        print(f"║  Launching: {config['name']:<49}║")
        print(f"║  {config['description']:<59}║")
        print(f"║  Exit with: Ctrl+C or 'exit' to return to MX2LM              ║")
        print(f"╚═══════════════════════════════════════════════════════════════╝")
        print(f"")

        try:
            if interactive:
                subprocess.run(cmd, shell=True, env=os.environ.copy())
            else:
                result = subprocess.run(
                    cmd, shell=True, capture_output=True, text=True,
                    env=os.environ.copy(), timeout=120
                )
                return result.stdout
        except KeyboardInterrupt:
            print(f"\n[MX2LM] Returning to main CLI...")
        except subprocess.TimeoutExpired:
            print(f"[MX2LM] Agent timeout (120s)")
        except Exception as e:
            print(f"[MX2LM] Agent error: {e}")

        return True

    @classmethod
    def list_agents(cls):
        """List all available agent sub-commands"""
        print("\n╔═══════════════════════════════════════════════════════════════╗")
        print("║               MX2LM Available Agent Sub-CLIs                  ║")
        print("╠═══════════════════════════════════════════════════════════════╣")
        for prefix, config in cls.AGENT_REGISTRY.items():
            status = "✓" if not config['env_key'] or os.getenv(config['env_key']) else "○"
            print(f"║  {status} {prefix:<10} │ {config['name']:<15} │ {config['package']:<20}║")
        print("╚═══════════════════════════════════════════════════════════════╝")
        print("\nUsage: /claude [prompt]  or  /gemini  or  /codex chat 'question'")
        print("       Type just the prefix (e.g., /claude) to enter interactive mode\n")


# ═══════════════════════════════════════════════════════════════
# @posthog/code-agent CORE INTEGRATION
# ═══════════════════════════════════════════════════════════════

class PostHogCodeAgent:
    """
    Core agent framework wrapper - all sub-CLIs can be orchestrated through this.
    Provides unified context, memory, and tool access across agents.
    """

    def __init__(self):
        self.context = {}
        self.memory = []
        self.active_agent = None

    def set_context(self, key: str, value: Any):
        """Set shared context accessible by all sub-agents"""
        self.context[key] = value

    def run(self, prompt: str, agent: str = 'auto'):
        """Run a prompt through the selected agent or auto-detect."""
        prefix, config, remaining = AgentRouter.parse_command(prompt)

        if prefix:
            return AgentRouter.spawn_agent(prefix, remaining, interactive=False)

        if agent == 'auto':
            if any(kw in prompt.lower() for kw in ['code', 'function', 'debug', 'refactor']):
                return self._run_with_agent('/claude', prompt)
            elif any(kw in prompt.lower() for kw in ['image', 'vision', 'describe', 'analyze']):
                return self._run_with_agent('/gemini', prompt)
            else:
                return self._run_with_agent('/codex', prompt)

        return self._run_with_agent(f'/{agent}', prompt)

    def _run_with_agent(self, prefix: str, prompt: str):
        """Internal agent execution"""
        self.active_agent = prefix
        return AgentRouter.spawn_agent(prefix, prompt, interactive=False)


# ═══════════════════════════════════════════════════════════════
# OLLAMA CLOUD API - Remote Model Access
# ═══════════════════════════════════════════════════════════════

OLLAMA_CLOUD_MODELS = [
    'gpt-oss:120b', 'gpt-oss:120b-cloud', 'llama3.3:70b',
    'qwen3:235b', 'deepseek-r1:671b', 'gemma3:27b'
]

class OllamaCloud:
    """Ollama Cloud API client for remote model inference"""

    def __init__(self, api_key=None, host="https://ollama.com"):
        self.host = host
        self.api_key = api_key or os.getenv("OLLAMA_API_KEY", "")
        self.headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

    def list_models(self):
        """List available cloud models"""
        import requests
        response = requests.get(f"{self.host}/api/tags", headers=self.headers)
        return response.json() if response.ok else None

    def chat(self, prompt, model="gpt-oss:120b", stream=True):
        """Chat with a cloud model"""
        import requests
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": stream
        }
        response = requests.post(
            f"{self.host}/api/chat",
            json=payload,
            headers=self.headers,
            stream=stream
        )
        if stream:
            result = ""
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line)
                    if 'message' in chunk:
                        result += chunk['message'].get('content', '')
                        print(chunk['message'].get('content', ''), end='', flush=True)
            return result
        return response.json()

    def generate(self, prompt, model="gpt-oss:120b"):
        """Generate completion (non-chat)"""
        import requests
        payload = {"model": model, "prompt": prompt}
        response = requests.post(
            f"{self.host}/api/generate",
            json=payload,
            headers=self.headers
        )
        return response.json()


# ═══════════════════════════════════════════════════════════════
# POWERSHELL UTILITIES - XCFE-PS-ENVELOPE + KUHUL π GOVERNED
# ═══════════════════════════════════════════════════════════════

# PS-DSL v1: Deny-by-Default Command Registry (FROZEN)
PS_COMMAND_REGISTRY = {
    "allow": {
        "process.list": {"cmdlet": "Get-Process", "params": []},
        "process.query": {"cmdlet": "Get-Process", "params": ["name", "id"]},
        "service.list": {"cmdlet": "Get-Service", "params": []},
        "service.query": {"cmdlet": "Get-Service", "params": ["name", "status"]},
        "eventlog.query": {"cmdlet": "Get-EventLog", "params": ["logname", "newest"]},
        "system.info": {"cmdlet": "Get-ComputerInfo", "params": []},
        "disk.list": {"cmdlet": "Get-Disk", "params": []},
        "volume.list": {"cmdlet": "Get-Volume", "params": []},
        "drive.list": {"cmdlet": "Get-PSDrive", "params": []},
        "hotfix.list": {"cmdlet": "Get-HotFix", "params": []},
        "network.adapters": {"cmdlet": "Get-NetAdapter", "params": []},
        "network.config": {"cmdlet": "Get-NetIPConfiguration", "params": []},
        "file.list": {"cmdlet": "Get-ChildItem", "params": ["path"]},
        "file.content": {"cmdlet": "Get-Content", "params": ["path"]},
        "file.hash": {"cmdlet": "Get-FileHash", "params": ["path", "algorithm"]},
        "path.test": {"cmdlet": "Test-Path", "params": ["path"]},
        "connection.test": {"cmdlet": "Test-Connection", "params": ["computername", "count"]},
        "user.list": {"cmdlet": "Get-LocalUser", "params": []},
        "group.list": {"cmdlet": "Get-LocalGroup", "params": []},
        "task.list": {"cmdlet": "Get-ScheduledTask", "params": []},
        "package.list": {"cmdlet": "Get-Package", "params": []},
        "date.get": {"cmdlet": "Get-Date", "params": []},
        "timezone.get": {"cmdlet": "Get-TimeZone", "params": []},
        "help.get": {"cmdlet": "Get-Help", "params": ["name"]},
        "command.list": {"cmdlet": "Get-Command", "params": []},
    },
    "deny": [
        "Invoke-Expression", "iex", "Invoke-Command", "icm",
        "Start-Process", "New-Object", "Add-Type", "Set-Item",
        "Remove-Item", "Invoke-WebRequest", "iwr", "Invoke-RestMethod",
        "irm", "Set-ExecutionPolicy", "curl", "wget", "Invoke-WmiMethod"
    ]
}

PS_ILLEGAL_CHARS = r'[|;`\$(){}[\]\\]'

def ps_dsl_verify(intent):
    """XCFE-Grade PS-DSL Verifier - Deny-by-default"""
    import re

    if intent.get('@dsl') != 'ps-dsl.v1':
        return False, "BAD_DSL", None

    action = intent.get('action', '')
    if not action or not re.match(r'^[a-z]+.[a-z]+$', action):
        return False, "BAD_ACTION", None

    spec = PS_COMMAND_REGISTRY['allow'].get(action)
    if not spec:
        return False, "ACTION_NOT_ALLOWLISTED", None

    params = intent.get('params', {})
    for key, value in params.items():
        if key not in spec['params']:
            return False, f"PARAM_NOT_ALLOWED: {key}", None
        if isinstance(value, str) and re.search(PS_ILLEGAL_CHARS, value):
            return False, f"ILLEGAL_PARAM_CHARS: {key}", None

    if spec['cmdlet'] in PS_COMMAND_REGISTRY['deny']:
        return False, "CMDLET_DENIED", None

    lowered = ps_dsl_lower(spec['cmdlet'], params)
    return True, "VERIFIED", lowered

def ps_dsl_lower(cmdlet, params):
    """Lower PS-DSL intent to single PowerShell cmdlet"""
    if not params:
        return cmdlet
    args = ' '.join(f"-{k} '{str(v).replace(chr(39), chr(39)+chr(39))}'" for k, v in params.items())
    return f"{cmdlet} {args}"

def cm1_wrap(lowered, meta=None):
    """CM-1 Audit Envelope - Invisible geometry for provenance"""
    SOH, STX, ETX, EOT, GS = '\x01', '\x02', '\x03', '\x04', '\x1D'
    meta = meta or {}
    header_parts = ['ps-envelope.v1'] + [f"{k}={v}" for k, v in meta.items()]
    header = GS.join(header_parts)
    return f"{SOH}{header}{STX}{lowered}{ETX}{EOT}"

def ps_execute_dsl(intent, audit=True):
    """Execute PS-DSL intent with full XCFE verification + CM-1 audit"""
    import datetime

    is_valid, reason, lowered = ps_dsl_verify(intent)

    cm1_envelope = {
        'soh': '[SOH] ps-envelope.v1',
        'dsl': intent.get('@dsl'),
        'action': intent.get('action'),
        'status': 'allowed' if is_valid else 'blocked',
        'reason': reason,
        'timestamp': datetime.datetime.now().isoformat(),
        'lowered': lowered if is_valid else None
    }

    if audit:
        status_icon = '✓' if is_valid else '✗'
        print(f"[CM-1] {status_icon} {cm1_envelope['status'].upper()}: {reason}")

    if not is_valid:
        return {'success': False, 'error': reason, 'cm1': cm1_envelope}

    try:
        result = subprocess.run(
            ['powershell', '-NoProfile', '-Command', lowered],
            capture_output=True, text=True, timeout=30
        )
        return {
            'success': result.returncode == 0,
            'output': result.stdout,
            'error': result.stderr if result.returncode != 0 else None,
            'cm1': cm1_envelope
        }
    except Exception as e:
        return {'success': False, 'error': str(e), 'cm1': cm1_envelope}


# ═══════════════════════════════════════════════════════════════
# PS-DSL HELPER FUNCTIONS (Safe, Allowlisted Operations)
# ═══════════════════════════════════════════════════════════════

def ps_get_processes(name=None):
    """Get running processes (safe)"""
    intent = {'@dsl': 'ps-dsl.v1', 'action': 'process.list', 'params': {}}
    if name:
        intent['action'] = 'process.query'
        intent['params'] = {'name': name}
    return ps_execute_dsl(intent)

def ps_get_services(name=None, status=None):
    """Get Windows services (safe)"""
    intent = {'@dsl': 'ps-dsl.v1', 'action': 'service.list', 'params': {}}
    if name or status:
        intent['action'] = 'service.query'
        if name: intent['params']['name'] = name
        if status: intent['params']['status'] = status
    return ps_execute_dsl(intent)

def ps_get_system_info():
    """Get computer info (safe)"""
    return ps_execute_dsl({'@dsl': 'ps-dsl.v1', 'action': 'system.info', 'params': {}})

def ps_test_connection(host, count=2):
    """Ping a host (safe)"""
    return ps_execute_dsl({
        '@dsl': 'ps-dsl.v1',
        'action': 'connection.test',
        'params': {'computername': host, 'count': str(count)}
    })

def ps_list_directory(path='.'):
    """List directory contents (safe)"""
    return ps_execute_dsl({
        '@dsl': 'ps-dsl.v1',
        'action': 'file.list',
        'params': {'path': path}
    })

def ps_get_file_hash(filepath, algorithm='SHA256'):
    """Get file hash (safe)"""
    return ps_execute_dsl({
        '@dsl': 'ps-dsl.v1',
        'action': 'file.hash',
        'params': {'path': filepath, 'algorithm': algorithm}
    })

def ps_get_network_config():
    """Get network configuration (safe)"""
    return ps_execute_dsl({'@dsl': 'ps-dsl.v1', 'action': 'network.config', 'params': {}})

def ps_get_disks():
    """Get disk information (safe)"""
    return ps_execute_dsl({'@dsl': 'ps-dsl.v1', 'action': 'disk.list', 'params': {}})


# ═══════════════════════════════════════════════════════════════
# MAIN CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════

def main():
    args = parse_args()
    raw_ps_mode = getattr(args, 'raw_ps', False)

    if args.web:
        httpd, thread = start_web_server(args.port, not args.no_browser)
        print(f"[MX2LM] Basher V5 web UI running on http://127.0.0.1:{args.port}")
        try:
            while True:
                time.sleep(3600)
        except KeyboardInterrupt:
            print("\n[MX2LM] Shutting down web UI...")
            httpd.shutdown()
        return

    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║  MX2LM CLI v3.0 - Hybrid Multi-Agent Framework               ║")
    print("║  Core: @posthog/code-agent                                    ║")
    print("║  Sub-CLIs: /claude  /gemini  /codex  /ollama  /phi3          ║")
    print("║  PS: XCFE-PS-ENVELOPE + PS-DSL v1 + CM-1 Audit Trail         ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print("")
    print("  Type /agents to list available sub-CLIs")
    print("  Type /claude, /gemini, /codex to spawn dedicated terminals")
    print("  Type 'help' for commands, 'exit' to quit")
    print("")

    agent = PostHogCodeAgent()

    while True:
        try:
            user_input = input("mx2lm> ").strip()

            if not user_input:
                continue

            if user_input.lower() in ['exit', 'quit', 'q']:
                print("[MX2LM] Goodbye!")
                break

            if user_input.lower() in ['help', '?']:
                print("\nCommands:")
                print("  /agents        - List available agent sub-CLIs")
                print("  /claude [msg]  - Launch Claude Code CLI")
                print("  /gemini [msg]  - Launch Gemini CLI")
                print("  /codex [msg]   - Launch OpenAI CLI")
                print("  /ollama [msg]  - Launch Ollama")
                print("  /phi3 [msg]    - Run Phi-3 locally")
                print("  /posthog       - Launch PostHog Code Agent")
                print("  ps:[action]    - Run PowerShell (ps:process.list)")
                print("  exit           - Quit MX2LM CLI")
                print("")
                continue

            if user_input.lower() == '/agents':
                AgentRouter.list_agents()
                continue

            prefix, config, remaining = AgentRouter.parse_command(user_input)
            if prefix:
                AgentRouter.spawn_agent(prefix, remaining)
                continue

            if user_input.startswith('ps:'):
                action = user_input[3:].strip()
                intent = {'@dsl': 'ps-dsl.v1', 'action': action, 'params': {}}
                result = ps_execute_dsl(intent)
                if result['success']:
                    print(result['output'])
                else:
                    print(f"[PS-DSL] Error: {result['error']}")
                continue

            if raw_ps_mode:
                try:
                    ps_res = subprocess.run(
                        ['powershell', '-NoProfile', '-Command', user_input],
                        capture_output=True, text=True, timeout=60
                    )
                    print(ps_res.stdout)
                    if ps_res.stderr:
                        print('[PowerShell error]', ps_res.stderr)
                except Exception as e:
                    print('[PowerShell exec error]', e)
                continue

            # Default: auto-route to best agent
            print(f"[MX2LM] Use /claude, /gemini, or /codex prefix to route to an agent")

        except KeyboardInterrupt:
            print("\n[MX2LM] Use 'exit' to quit")
        except Exception as e:
            print(f"[MX2LM] Error: {e}")


if __name__ == "__main__":
    main()
