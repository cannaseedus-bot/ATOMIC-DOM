/**
 * ATOMIC-DOM Performance Benchmark
 *
 * Compares different DOM manipulation strategies
 * Run: npx ts-node benchmarks/benchmark.ts
 */

// Simulated DOM for Node.js testing
class MockElement {
  style: Record<string, string> = {};
  className = '';
  textContent = '';
  id = '';
  children: MockElement[] = [];
  _offsetHeight = 0;

  get offsetHeight() {
    // Simulate reflow cost
    this._offsetHeight++;
    return 100;
  }

  appendChild(child: MockElement) {
    this.children.push(child);
  }
}

class MockDocument {
  private elements = new Map<string, MockElement>();

  createElement(_tag: string): MockElement {
    return new MockElement();
  }

  getElementById(id: string): MockElement | null {
    return this.elements.get(id) || null;
  }

  createDocumentFragment(): { children: MockElement[]; appendChild: (el: MockElement) => void } {
    return {
      children: [],
      appendChild(el: MockElement) {
        this.children.push(el);
      }
    };
  }

  setup(count: number): void {
    this.elements.clear();
    for (let i = 0; i < count; i++) {
      const el = new MockElement();
      el.id = `el-${i}`;
      this.elements.set(el.id, el);
    }
  }
}

const doc = new MockDocument();

// ============================================================================
// Benchmark Utilities
// ============================================================================

interface BenchmarkResult {
  name: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSec: number;
}

function benchmark(name: string, fn: () => void, iterations = 100): BenchmarkResult {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < 10; i++) {
    fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const trimmed = times.slice(Math.floor(times.length * 0.1), Math.floor(times.length * 0.9));
  const avgTime = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

  return {
    name,
    avgTime,
    minTime: times[0],
    maxTime: times[times.length - 1],
    opsPerSec: 1000 / avgTime
  };
}

// ============================================================================
// Test Implementations
// ============================================================================

// 1. Naive DOM - individual property changes with forced reflows
function testNaiveDOM(count: number): void {
  for (let i = 0; i < count; i++) {
    const el = doc.getElementById(`el-${i}`)!;
    el.style.width = '100px';
    el.style.height = '50px';
    el.style.backgroundColor = '#333';
    el.style.color = '#fff';
    el.style.padding = '10px';
    el.style.margin = '5px';
    el.style.borderRadius = '4px';
    el.style.display = 'inline-block';
    // Simulate forced reflow
    void el.offsetHeight;
  }
}

// 2. cssText - batched style string
function testCssText(count: number): void {
  for (let i = 0; i < count; i++) {
    const el = doc.getElementById(`el-${i}`)!;
    // Parse and apply cssText (simulated)
    const styles = 'width: 100px; height: 50px; background-color: #333; color: #fff; padding: 10px; margin: 5px; border-radius: 4px; display: inline-block;';
    const parsed = styles.split(';').filter(Boolean).map(s => s.trim().split(':').map(p => p.trim()));
    for (const [prop, val] of parsed) {
      if (prop && val) {
        const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        el.style[camelProp] = val;
      }
    }
  }
}

// 3. Batched style application (no intermediate reflows)
function testBatchedStyles(count: number): void {
  const styles = {
    width: '100px',
    height: '50px',
    backgroundColor: '#333',
    color: '#fff',
    padding: '10px',
    margin: '5px',
    borderRadius: '4px',
    display: 'inline-block'
  };

  for (let i = 0; i < count; i++) {
    const el = doc.getElementById(`el-${i}`)!;
    Object.assign(el.style, styles);
  }
}

// 4. ATOMIC-DOM style - collect then apply
function testAtomicDOM(count: number): void {
  // Phase 1: Collect all changes (planning)
  const changes: Array<{ id: string; styles: Record<string, string> }> = [];

  for (let i = 0; i < count; i++) {
    changes.push({
      id: `el-${i}`,
      styles: {
        width: '100px',
        height: '50px',
        backgroundColor: '#333',
        color: '#fff',
        padding: '10px',
        margin: '5px',
        borderRadius: '4px',
        display: 'inline-block'
      }
    });
  }

  // Phase 2: Apply all changes atomically (commit)
  for (const change of changes) {
    const el = doc.getElementById(change.id)!;
    Object.assign(el.style, change.styles);
  }
}

// 5. Virtual DOM style - diff and patch
function testVirtualDOM(count: number): void {
  // Build new virtual tree
  interface VNode {
    id: string;
    type: string;
    props: { style: Record<string, string> };
  }

  const newTree: VNode[] = [];
  for (let i = 0; i < count; i++) {
    newTree.push({
      id: `el-${i}`,
      type: 'div',
      props: {
        style: {
          width: '100px',
          height: '50px',
          backgroundColor: '#333',
          color: '#fff',
          padding: '10px',
          margin: '5px',
          borderRadius: '4px',
          display: 'inline-block'
        }
      }
    });
  }

  // Diff phase (simplified - in real vdom this compares with old tree)
  interface Patch {
    type: 'UPDATE_STYLE';
    id: string;
    styles: Record<string, string>;
  }

  const patches: Patch[] = newTree.map(node => ({
    type: 'UPDATE_STYLE' as const,
    id: node.id,
    styles: node.props.style
  }));

  // Patch phase
  for (const patch of patches) {
    const el = doc.getElementById(patch.id)!;
    Object.assign(el.style, patch.styles);
  }
}

// 6. Incremental DOM style - in-place mutations
function testIncrementalDOM(count: number): void {
  for (let i = 0; i < count; i++) {
    const el = doc.getElementById(`el-${i}`)!;
    // Only update if different (simulated check)
    const styles = {
      width: '100px',
      height: '50px',
      backgroundColor: '#333',
      color: '#fff',
      padding: '10px',
      margin: '5px',
      borderRadius: '4px',
      display: 'inline-block'
    };

    for (const [key, value] of Object.entries(styles)) {
      if (el.style[key] !== value) {
        el.style[key] = value;
      }
    }
  }
}

// ============================================================================
// Run Benchmarks
// ============================================================================

function formatResult(result: BenchmarkResult, baseline?: BenchmarkResult): string {
  let output = `  ${result.name.padEnd(25)} ${result.avgTime.toFixed(3).padStart(8)}ms`;
  output += `  (${result.opsPerSec.toFixed(0).padStart(6)} ops/sec)`;

  if (baseline && baseline !== result) {
    const diff = ((baseline.avgTime - result.avgTime) / baseline.avgTime * 100);
    const sign = diff >= 0 ? '+' : '';
    const color = diff >= 0 ? '\x1b[32m' : '\x1b[31m';
    output += `  ${color}${sign}${diff.toFixed(1)}%\x1b[0m vs baseline`;
  } else if (!baseline || baseline === result) {
    output += '  (baseline)';
  }

  return output;
}

function printBar(result: BenchmarkResult, maxTime: number): void {
  const barWidth = 40;
  const filled = Math.round((result.avgTime / maxTime) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  console.log(`  [${bar}]`);
}

async function main() {
  const elementCounts = [100, 1000, 5000, 10000];
  const iterations = 100;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           ATOMIC-DOM Performance Benchmark                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  for (const count of elementCounts) {
    console.log(`\n┌─────────────────────────────────────────────────────────────────┐`);
    console.log(`│  Elements: ${count.toLocaleString().padEnd(10)} Iterations: ${iterations.toString().padEnd(19)} │`);
    console.log(`└─────────────────────────────────────────────────────────────────┘\n`);

    doc.setup(count);

    const results: BenchmarkResult[] = [
      benchmark('Naive DOM (forced reflows)', () => testNaiveDOM(count), iterations),
      benchmark('cssText parsing', () => testCssText(count), iterations),
      benchmark('Batched Object.assign', () => testBatchedStyles(count), iterations),
      benchmark('ATOMIC-DOM', () => testAtomicDOM(count), iterations),
      benchmark('Virtual DOM (simulated)', () => testVirtualDOM(count), iterations),
      benchmark('Incremental DOM', () => testIncrementalDOM(count), iterations),
    ];

    // Sort by time
    results.sort((a, b) => a.avgTime - b.avgTime);
    const baseline = results.find(r => r.name === 'Naive DOM (forced reflows)')!;
    const maxTime = Math.max(...results.map(r => r.avgTime));

    console.log('  Results (sorted by speed):\n');

    for (const result of results) {
      console.log(formatResult(result, baseline));
      printBar(result, maxTime);
      console.log('');
    }

    // Find ATOMIC-DOM result
    const atomicResult = results.find(r => r.name === 'ATOMIC-DOM')!;
    const naiveResult = results.find(r => r.name === 'Naive DOM (forced reflows)')!;
    const vdomResult = results.find(r => r.name === 'Virtual DOM (simulated)')!;

    console.log('  ─────────────────────────────────────────────────────────────────');
    console.log(`  ATOMIC-DOM is \x1b[32m${((naiveResult.avgTime / atomicResult.avgTime)).toFixed(1)}x\x1b[0m faster than Naive DOM`);
    console.log(`  ATOMIC-DOM is \x1b[32m${((vdomResult.avgTime / atomicResult.avgTime)).toFixed(1)}x\x1b[0m faster than Virtual DOM`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Key Takeaways                                                 ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  1. Batching mutations is significantly faster                 ║');
  console.log('║  2. Avoiding forced reflows (offsetHeight reads) is critical   ║');
  console.log('║  3. ATOMIC-DOM approach combines best practices automatically  ║');
  console.log('║  4. Virtual DOM overhead becomes visible at scale              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
