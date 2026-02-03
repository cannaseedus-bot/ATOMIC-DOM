/**
 * K'UHUL MicroAtomics Training Spec
 * Model architecture and training data mapping for ~100 expert modules
 */

// ============================================================================
// Core Architecture Constants
// ============================================================================

export const MODEL_SPEC = {
  name: 'kuhul-v1',
  architecture: 'atomic-experts',
  totalExperts: 118,       // 99 defined + 19 reserved
  activeExperts: 4,        // top-k routing
  expertDimension: 512,    // per-expert hidden dim
  sharedDimension: 1024,   // shared layers dim
  vocabSize: 32000,
  maxSeqLength: 4096,
  routerType: 'context-gated',  // uses our detectContext()
};

// ============================================================================
// Expert Domain Taxonomy
// ============================================================================

export interface ExpertSpec {
  id: string;
  name: string;
  parent: string | null;
  domains: string[];
  trainingDataSources: string[];
  vocabBias: string[];           // high-weight tokens
  capacity: number;              // 0-1, routing weight
  minActivation: number;         // threshold for activation
}

export const EXPERT_TAXONOMY: Record<string, ExpertSpec[]> = {
  // ═══════════════════════════════════════════════════════════════════════
  // MATHEMATICS (10 experts)
  // ═══════════════════════════════════════════════════════════════════════
  math: [
    {
      id: 'math-algebra',
      name: 'Algebra Expert',
      parent: 'MathMicroAtomic',
      domains: ['equations', 'polynomials', 'factoring', 'inequalities'],
      trainingDataSources: [
        'khan-academy/algebra',
        'mathworld/algebra',
        'stack-exchange/math/algebra',
        'textbooks/algebra-*',
      ],
      vocabBias: ['solve', 'factor', 'simplify', 'equation', 'variable', 'coefficient'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'math-calculus',
      name: 'Calculus Expert',
      parent: 'MathMicroAtomic',
      domains: ['derivatives', 'integrals', 'limits', 'series', 'differential-equations'],
      trainingDataSources: [
        'khan-academy/calculus',
        'mit-ocw/calculus',
        'stack-exchange/math/calculus',
        'textbooks/calculus-*',
      ],
      vocabBias: ['derivative', 'integral', 'limit', 'dx', 'dy', 'convergence', 'divergence'],
      capacity: 0.9,
      minActivation: 0.3,
    },
    {
      id: 'math-linear-algebra',
      name: 'Linear Algebra Expert',
      parent: 'MathMicroAtomic',
      domains: ['matrices', 'vectors', 'eigenvalues', 'transformations', 'vector-spaces'],
      trainingDataSources: [
        'mit-ocw/linear-algebra',
        '3blue1brown/essence-of-linear-algebra',
        'stack-exchange/math/linear-algebra',
      ],
      vocabBias: ['matrix', 'vector', 'eigenvalue', 'determinant', 'transpose', 'rank'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'math-statistics',
      name: 'Statistics Expert',
      parent: 'MathMicroAtomic',
      domains: ['probability', 'distributions', 'hypothesis-testing', 'regression', 'bayesian'],
      trainingDataSources: [
        'khan-academy/statistics',
        'stat-papers/*',
        'stack-exchange/stats',
        'r-documentation/stats',
      ],
      vocabBias: ['probability', 'distribution', 'mean', 'variance', 'p-value', 'confidence'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'math-discrete',
      name: 'Discrete Math Expert',
      parent: 'MathMicroAtomic',
      domains: ['combinatorics', 'graph-theory', 'logic', 'set-theory', 'number-theory'],
      trainingDataSources: [
        'mit-ocw/discrete-math',
        'textbooks/discrete-*',
        'competitive-programming/math',
      ],
      vocabBias: ['permutation', 'combination', 'graph', 'vertex', 'edge', 'proof', 'induction'],
      capacity: 0.75,
      minActivation: 0.3,
    },
    {
      id: 'math-geometry',
      name: 'Geometry Expert',
      parent: 'MathMicroAtomic',
      domains: ['euclidean', 'coordinate', 'trigonometry', 'topology'],
      trainingDataSources: [
        'khan-academy/geometry',
        'mathworld/geometry',
        'geogebra/tutorials',
      ],
      vocabBias: ['angle', 'triangle', 'circle', 'polygon', 'theorem', 'congruent'],
      capacity: 0.7,
      minActivation: 0.3,
    },
    {
      id: 'math-numerical',
      name: 'Numerical Methods Expert',
      parent: 'MathMicroAtomic',
      domains: ['approximation', 'interpolation', 'optimization', 'numerical-integration'],
      trainingDataSources: [
        'numerical-recipes/*',
        'scipy-documentation',
        'matlab-documentation',
      ],
      vocabBias: ['iteration', 'convergence', 'error', 'approximation', 'newton', 'gradient'],
      capacity: 0.7,
      minActivation: 0.4,
    },
    {
      id: 'math-applied',
      name: 'Applied Math Expert',
      parent: 'MathMicroAtomic',
      domains: ['physics-math', 'engineering-math', 'financial-math'],
      trainingDataSources: [
        'physics-textbooks/math-methods',
        'engineering-math/*',
        'quantitative-finance/*',
      ],
      vocabBias: ['model', 'simulation', 'differential', 'boundary', 'optimization'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'math-proof',
      name: 'Proof & Logic Expert',
      parent: 'MathMicroAtomic',
      domains: ['formal-proofs', 'mathematical-logic', 'proof-techniques'],
      trainingDataSources: [
        'proof-wiki/*',
        'lean-prover/mathlib',
        'coq/stdlib',
      ],
      vocabBias: ['prove', 'theorem', 'lemma', 'qed', 'contradiction', 'induction', 'assume'],
      capacity: 0.7,
      minActivation: 0.4,
    },
    {
      id: 'math-notation',
      name: 'Math Notation Expert',
      parent: 'MathMicroAtomic',
      domains: ['latex', 'mathml', 'symbolic-representation'],
      trainingDataSources: [
        'latex-documentation',
        'mathjax-examples',
        'arxiv-papers/math',
      ],
      vocabBias: ['\\frac', '\\int', '\\sum', '\\lim', '\\sqrt', '\\partial'],
      capacity: 0.6,
      minActivation: 0.5,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // PROGRAMMING LANGUAGES (15 experts)
  // ═══════════════════════════════════════════════════════════════════════
  languages: [
    {
      id: 'lang-javascript',
      name: 'JavaScript Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['javascript', 'es6+', 'node.js', 'deno', 'bun'],
      trainingDataSources: [
        'mdn-web-docs/javascript',
        'github/javascript-repos',
        'npm-packages/*',
        'stack-overflow/javascript',
      ],
      vocabBias: ['const', 'let', 'async', 'await', 'function', '=>', 'Promise', 'fetch'],
      capacity: 0.95,
      minActivation: 0.2,
    },
    {
      id: 'lang-typescript',
      name: 'TypeScript Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['typescript', 'type-system', 'generics', 'decorators'],
      trainingDataSources: [
        'typescript-handbook',
        'github/typescript-repos',
        'definitely-typed/*',
      ],
      vocabBias: ['interface', 'type', 'generic', '<T>', 'extends', 'implements', 'readonly'],
      capacity: 0.9,
      minActivation: 0.25,
    },
    {
      id: 'lang-python',
      name: 'Python Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['python', 'python3', 'pip', 'virtualenv'],
      trainingDataSources: [
        'python-docs',
        'github/python-repos',
        'pypi-packages/*',
        'stack-overflow/python',
      ],
      vocabBias: ['def', 'class', 'import', 'from', 'self', '__init__', 'lambda', 'yield'],
      capacity: 0.95,
      minActivation: 0.2,
    },
    {
      id: 'lang-rust',
      name: 'Rust Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['rust', 'cargo', 'ownership', 'borrowing', 'lifetimes'],
      trainingDataSources: [
        'rust-book',
        'rust-by-example',
        'github/rust-repos',
        'crates-io/*',
      ],
      vocabBias: ['fn', 'let', 'mut', 'impl', 'trait', 'struct', 'enum', '&', 'lifetime'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'lang-go',
      name: 'Go Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['golang', 'goroutines', 'channels', 'go-modules'],
      trainingDataSources: [
        'go-docs',
        'go-by-example',
        'github/go-repos',
      ],
      vocabBias: ['func', 'go', 'chan', 'defer', 'interface{}', 'goroutine', 'select'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'lang-java',
      name: 'Java Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['java', 'jvm', 'spring', 'maven', 'gradle'],
      trainingDataSources: [
        'oracle-java-docs',
        'github/java-repos',
        'spring-documentation',
      ],
      vocabBias: ['public', 'private', 'class', 'extends', 'implements', 'static', 'void'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'lang-cpp',
      name: 'C++ Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['cpp', 'c++11', 'c++17', 'c++20', 'stl', 'boost'],
      trainingDataSources: [
        'cppreference',
        'github/cpp-repos',
        'boost-documentation',
      ],
      vocabBias: ['template', 'namespace', 'std::', 'vector', 'unique_ptr', 'const', '::'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'lang-c',
      name: 'C Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['c', 'systems-programming', 'embedded', 'pointers'],
      trainingDataSources: [
        'c-reference',
        'linux-kernel-source',
        'github/c-repos',
      ],
      vocabBias: ['int', 'char', 'void', 'struct', 'malloc', 'free', 'pointer', '*'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'lang-sql',
      name: 'SQL Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['sql', 'postgresql', 'mysql', 'sqlite', 'query-optimization'],
      trainingDataSources: [
        'postgresql-docs',
        'mysql-docs',
        'stack-overflow/sql',
        'db-fiddle-examples',
      ],
      vocabBias: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'INSERT', 'UPDATE'],
      capacity: 0.85,
      minActivation: 0.25,
    },
    {
      id: 'lang-shell',
      name: 'Shell/Bash Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['bash', 'zsh', 'shell-scripting', 'unix-commands'],
      trainingDataSources: [
        'gnu-bash-manual',
        'github/dotfiles',
        'stack-overflow/bash',
      ],
      vocabBias: ['#!/bin/bash', 'if', 'then', 'fi', 'for', 'do', 'done', 'echo', 'grep', 'awk'],
      capacity: 0.75,
      minActivation: 0.3,
    },
    {
      id: 'lang-ruby',
      name: 'Ruby Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['ruby', 'rails', 'gems', 'rspec'],
      trainingDataSources: [
        'ruby-docs',
        'rails-guides',
        'github/ruby-repos',
      ],
      vocabBias: ['def', 'end', 'class', 'module', 'do', 'block', 'yield', 'gem'],
      capacity: 0.7,
      minActivation: 0.35,
    },
    {
      id: 'lang-php',
      name: 'PHP Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['php', 'laravel', 'wordpress', 'composer'],
      trainingDataSources: [
        'php-docs',
        'laravel-documentation',
        'github/php-repos',
      ],
      vocabBias: ['<?php', 'function', 'class', '$this', '->', 'namespace', 'use'],
      capacity: 0.7,
      minActivation: 0.35,
    },
    {
      id: 'lang-swift',
      name: 'Swift Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['swift', 'ios', 'macos', 'swiftui'],
      trainingDataSources: [
        'swift-docs',
        'apple-developer-docs',
        'github/swift-repos',
      ],
      vocabBias: ['func', 'var', 'let', 'struct', 'class', 'protocol', 'guard', 'optional'],
      capacity: 0.7,
      minActivation: 0.35,
    },
    {
      id: 'lang-kotlin',
      name: 'Kotlin Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['kotlin', 'android', 'jetpack-compose', 'coroutines'],
      trainingDataSources: [
        'kotlin-docs',
        'android-developer-docs',
        'github/kotlin-repos',
      ],
      vocabBias: ['fun', 'val', 'var', 'data class', 'suspend', 'coroutine', 'flow'],
      capacity: 0.7,
      minActivation: 0.35,
    },
    {
      id: 'lang-scala',
      name: 'Scala Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['scala', 'akka', 'spark', 'functional'],
      trainingDataSources: [
        'scala-docs',
        'akka-documentation',
        'github/scala-repos',
      ],
      vocabBias: ['def', 'val', 'var', 'case class', 'trait', 'object', 'implicit'],
      capacity: 0.65,
      minActivation: 0.4,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // WEB DEVELOPMENT (12 experts)
  // ═══════════════════════════════════════════════════════════════════════
  web: [
    {
      id: 'web-html',
      name: 'HTML Expert',
      parent: 'WebMicroAtomic',
      domains: ['html', 'html5', 'semantic-html', 'accessibility'],
      trainingDataSources: [
        'mdn-web-docs/html',
        'w3c-specifications',
        'html5-rocks',
      ],
      vocabBias: ['<div>', '<span>', '<section>', '<article>', '<header>', '<nav>', 'aria-'],
      capacity: 0.85,
      minActivation: 0.25,
    },
    {
      id: 'web-css',
      name: 'CSS Expert',
      parent: 'WebMicroAtomic',
      domains: ['css', 'css3', 'flexbox', 'grid', 'animations', 'responsive'],
      trainingDataSources: [
        'mdn-web-docs/css',
        'css-tricks',
        'github/css-frameworks',
      ],
      vocabBias: ['display:', 'flex', 'grid', '@media', 'margin:', 'padding:', 'transform:'],
      capacity: 0.85,
      minActivation: 0.25,
    },
    {
      id: 'web-react',
      name: 'React Expert',
      parent: 'WebMicroAtomic',
      domains: ['react', 'hooks', 'jsx', 'redux', 'next.js'],
      trainingDataSources: [
        'react-docs',
        'next-js-docs',
        'github/react-repos',
        'redux-documentation',
      ],
      vocabBias: ['useState', 'useEffect', 'component', 'props', 'jsx', 'render', 'hook'],
      capacity: 0.9,
      minActivation: 0.25,
    },
    {
      id: 'web-vue',
      name: 'Vue Expert',
      parent: 'WebMicroAtomic',
      domains: ['vue', 'vue3', 'composition-api', 'vuex', 'nuxt'],
      trainingDataSources: [
        'vue-docs',
        'nuxt-docs',
        'github/vue-repos',
      ],
      vocabBias: ['ref', 'reactive', 'computed', 'v-if', 'v-for', 'v-model', 'setup'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'web-angular',
      name: 'Angular Expert',
      parent: 'WebMicroAtomic',
      domains: ['angular', 'rxjs', 'ngrx', 'angular-material'],
      trainingDataSources: [
        'angular-docs',
        'rxjs-docs',
        'github/angular-repos',
      ],
      vocabBias: ['@Component', '@Injectable', 'Observable', 'subscribe', 'ngIf', 'ngFor'],
      capacity: 0.75,
      minActivation: 0.3,
    },
    {
      id: 'web-svelte',
      name: 'Svelte Expert',
      parent: 'WebMicroAtomic',
      domains: ['svelte', 'sveltekit', 'stores', 'transitions'],
      trainingDataSources: [
        'svelte-docs',
        'sveltekit-docs',
        'github/svelte-repos',
      ],
      vocabBias: ['$:', 'bind:', 'on:', '{#if}', '{#each}', 'store', 'writable'],
      capacity: 0.7,
      minActivation: 0.35,
    },
    {
      id: 'web-tailwind',
      name: 'Tailwind CSS Expert',
      parent: 'WebMicroAtomic',
      domains: ['tailwind', 'utility-first', 'responsive-design'],
      trainingDataSources: [
        'tailwind-docs',
        'github/tailwind-repos',
        'tailwind-ui',
      ],
      vocabBias: ['flex', 'grid', 'p-4', 'm-2', 'text-', 'bg-', 'hover:', 'md:', 'lg:'],
      capacity: 0.75,
      minActivation: 0.3,
    },
    {
      id: 'web-node',
      name: 'Node.js Expert',
      parent: 'WebMicroAtomic',
      domains: ['node', 'express', 'fastify', 'npm', 'package-management'],
      trainingDataSources: [
        'node-docs',
        'express-docs',
        'github/node-repos',
      ],
      vocabBias: ['require', 'module.exports', 'app.get', 'middleware', 'async', 'await'],
      capacity: 0.85,
      minActivation: 0.25,
    },
    {
      id: 'web-api',
      name: 'Web API Expert',
      parent: 'WebMicroAtomic',
      domains: ['rest', 'graphql', 'websocket', 'http', 'authentication'],
      trainingDataSources: [
        'mdn-web-apis',
        'graphql-docs',
        'oauth-specs',
      ],
      vocabBias: ['fetch', 'GET', 'POST', 'PUT', 'DELETE', 'endpoint', 'query', 'mutation'],
      capacity: 0.85,
      minActivation: 0.25,
    },
    {
      id: 'web-testing',
      name: 'Web Testing Expert',
      parent: 'WebMicroAtomic',
      domains: ['jest', 'cypress', 'playwright', 'testing-library'],
      trainingDataSources: [
        'jest-docs',
        'cypress-docs',
        'playwright-docs',
      ],
      vocabBias: ['describe', 'it', 'expect', 'test', 'mock', 'spy', 'assert', 'fixture'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'web-bundlers',
      name: 'Build Tools Expert',
      parent: 'WebMicroAtomic',
      domains: ['webpack', 'vite', 'rollup', 'esbuild', 'parcel'],
      trainingDataSources: [
        'webpack-docs',
        'vite-docs',
        'rollup-docs',
      ],
      vocabBias: ['bundle', 'chunk', 'loader', 'plugin', 'config', 'build', 'dev'],
      capacity: 0.7,
      minActivation: 0.35,
    },
    {
      id: 'web-pwa',
      name: 'PWA Expert',
      parent: 'WebMicroAtomic',
      domains: ['service-worker', 'manifest', 'offline', 'push-notifications'],
      trainingDataSources: [
        'web-dev/pwa',
        'mdn-service-workers',
        'workbox-docs',
      ],
      vocabBias: ['ServiceWorker', 'cache', 'manifest.json', 'offline', 'push', 'sync'],
      capacity: 0.65,
      minActivation: 0.4,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // DATA & ML (10 experts)
  // ═══════════════════════════════════════════════════════════════════════
  data: [
    {
      id: 'data-pandas',
      name: 'Pandas Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['pandas', 'dataframes', 'data-manipulation', 'csv'],
      trainingDataSources: [
        'pandas-docs',
        'kaggle-notebooks',
        'github/pandas-repos',
      ],
      vocabBias: ['DataFrame', 'Series', 'groupby', 'merge', 'pivot', 'apply', 'loc', 'iloc'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'data-numpy',
      name: 'NumPy Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['numpy', 'arrays', 'linear-algebra', 'broadcasting'],
      trainingDataSources: [
        'numpy-docs',
        'scipy-docs',
        'github/numpy-repos',
      ],
      vocabBias: ['np.array', 'ndarray', 'reshape', 'dot', 'transpose', 'broadcasting'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'data-sklearn',
      name: 'Scikit-learn Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['sklearn', 'classification', 'regression', 'clustering', 'preprocessing'],
      trainingDataSources: [
        'sklearn-docs',
        'kaggle-competitions',
        'github/ml-repos',
      ],
      vocabBias: ['fit', 'predict', 'transform', 'Pipeline', 'GridSearchCV', 'train_test_split'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'data-pytorch',
      name: 'PyTorch Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['pytorch', 'tensors', 'neural-networks', 'autograd'],
      trainingDataSources: [
        'pytorch-docs',
        'pytorch-tutorials',
        'github/pytorch-repos',
      ],
      vocabBias: ['torch.tensor', 'nn.Module', 'forward', 'backward', 'optimizer', 'loss'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'data-tensorflow',
      name: 'TensorFlow Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['tensorflow', 'keras', 'tf2', 'serving'],
      trainingDataSources: [
        'tensorflow-docs',
        'keras-docs',
        'github/tensorflow-repos',
      ],
      vocabBias: ['tf.', 'keras.', 'Model', 'Layer', 'compile', 'fit', 'predict'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'data-transformers',
      name: 'Transformers Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['huggingface', 'transformers', 'llm', 'fine-tuning', 'tokenizers'],
      trainingDataSources: [
        'huggingface-docs',
        'arxiv/transformers',
        'github/transformers-repos',
      ],
      vocabBias: ['AutoModel', 'AutoTokenizer', 'pipeline', 'Trainer', 'attention', 'embeddings'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'data-viz',
      name: 'Data Visualization Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['matplotlib', 'seaborn', 'plotly', 'd3', 'charts'],
      trainingDataSources: [
        'matplotlib-docs',
        'seaborn-docs',
        'plotly-docs',
      ],
      vocabBias: ['plt.', 'plot', 'figure', 'axis', 'bar', 'scatter', 'heatmap', 'legend'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'data-sql-analytics',
      name: 'SQL Analytics Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['sql-analytics', 'window-functions', 'cte', 'aggregations'],
      trainingDataSources: [
        'mode-analytics',
        'datacamp-sql',
        'stack-overflow/sql-analytics',
      ],
      vocabBias: ['OVER', 'PARTITION BY', 'ROW_NUMBER', 'LAG', 'LEAD', 'WITH', 'CTE'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'data-spark',
      name: 'Spark Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['pyspark', 'spark-sql', 'distributed-computing', 'databricks'],
      trainingDataSources: [
        'spark-docs',
        'databricks-docs',
        'github/spark-repos',
      ],
      vocabBias: ['SparkSession', 'DataFrame', 'RDD', 'partitions', 'broadcast', 'cache'],
      capacity: 0.7,
      minActivation: 0.4,
    },
    {
      id: 'data-etl',
      name: 'ETL Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['airflow', 'luigi', 'dagster', 'data-pipelines'],
      trainingDataSources: [
        'airflow-docs',
        'dagster-docs',
        'github/etl-repos',
      ],
      vocabBias: ['DAG', 'task', 'operator', 'pipeline', 'schedule', 'sensor', 'hook'],
      capacity: 0.7,
      minActivation: 0.4,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // INFRASTRUCTURE & DEVOPS (12 experts)
  // ═══════════════════════════════════════════════════════════════════════
  infra: [
    {
      id: 'infra-docker',
      name: 'Docker Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['docker', 'dockerfile', 'containers', 'images'],
      trainingDataSources: [
        'docker-docs',
        'github/dockerfiles',
        'docker-hub-descriptions',
      ],
      vocabBias: ['FROM', 'RUN', 'COPY', 'CMD', 'EXPOSE', 'ENTRYPOINT', 'docker-compose'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'infra-kubernetes',
      name: 'Kubernetes Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['kubernetes', 'k8s', 'helm', 'pods', 'services'],
      trainingDataSources: [
        'kubernetes-docs',
        'helm-docs',
        'github/k8s-repos',
      ],
      vocabBias: ['kubectl', 'pod', 'deployment', 'service', 'ingress', 'configmap', 'secret'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'infra-aws',
      name: 'AWS Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['aws', 'ec2', 's3', 'lambda', 'cloudformation'],
      trainingDataSources: [
        'aws-docs',
        'aws-blogs',
        'github/aws-repos',
      ],
      vocabBias: ['EC2', 'S3', 'Lambda', 'IAM', 'VPC', 'RDS', 'CloudFormation', 'boto3'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'infra-gcp',
      name: 'GCP Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['gcp', 'cloud-run', 'bigquery', 'gke'],
      trainingDataSources: [
        'gcp-docs',
        'google-cloud-blogs',
        'github/gcp-repos',
      ],
      vocabBias: ['gcloud', 'BigQuery', 'Cloud Run', 'GKE', 'Pub/Sub', 'Cloud Functions'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'infra-azure',
      name: 'Azure Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['azure', 'azure-functions', 'aks', 'cosmos-db'],
      trainingDataSources: [
        'azure-docs',
        'microsoft-learn',
        'github/azure-repos',
      ],
      vocabBias: ['az', 'Azure Functions', 'AKS', 'Cosmos DB', 'App Service', 'ARM'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'infra-terraform',
      name: 'Terraform Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['terraform', 'iac', 'hcl', 'modules'],
      trainingDataSources: [
        'terraform-docs',
        'terraform-registry',
        'github/terraform-repos',
      ],
      vocabBias: ['resource', 'variable', 'output', 'module', 'provider', 'state', 'plan'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'infra-cicd',
      name: 'CI/CD Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['github-actions', 'gitlab-ci', 'jenkins', 'circleci'],
      trainingDataSources: [
        'github-actions-docs',
        'gitlab-ci-docs',
        'jenkins-docs',
      ],
      vocabBias: ['workflow', 'pipeline', 'job', 'step', 'stage', 'artifact', 'deploy'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'infra-linux',
      name: 'Linux Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['linux', 'ubuntu', 'centos', 'systemd', 'networking'],
      trainingDataSources: [
        'linux-man-pages',
        'arch-wiki',
        'ubuntu-docs',
      ],
      vocabBias: ['sudo', 'apt', 'yum', 'systemctl', 'chmod', 'chown', 'ssh', 'iptables'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'infra-networking',
      name: 'Networking Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['tcp/ip', 'dns', 'load-balancing', 'firewalls', 'vpn'],
      trainingDataSources: [
        'networking-rfcs',
        'cloudflare-docs',
        'nginx-docs',
      ],
      vocabBias: ['TCP', 'UDP', 'HTTP', 'DNS', 'SSL/TLS', 'load balancer', 'proxy', 'port'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'infra-monitoring',
      name: 'Monitoring Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['prometheus', 'grafana', 'datadog', 'logging', 'alerting'],
      trainingDataSources: [
        'prometheus-docs',
        'grafana-docs',
        'datadog-docs',
      ],
      vocabBias: ['metric', 'alert', 'dashboard', 'scrape', 'query', 'log', 'trace'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'infra-security',
      name: 'Security Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['security', 'owasp', 'encryption', 'authentication', 'penetration-testing'],
      trainingDataSources: [
        'owasp-docs',
        'security-blogs',
        'cve-database',
      ],
      vocabBias: ['XSS', 'CSRF', 'injection', 'encryption', 'hash', 'JWT', 'OAuth', 'RBAC'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'infra-databases',
      name: 'Database Admin Expert',
      parent: 'CodeGenMicroAtomic',
      domains: ['postgresql-admin', 'mysql-admin', 'mongodb', 'redis', 'replication'],
      trainingDataSources: [
        'postgresql-admin-docs',
        'mongodb-docs',
        'redis-docs',
      ],
      vocabBias: ['index', 'replication', 'sharding', 'backup', 'vacuum', 'query plan'],
      capacity: 0.75,
      minActivation: 0.35,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // RESUME & PROFESSIONAL (8 experts)
  // ═══════════════════════════════════════════════════════════════════════
  resume: [
    {
      id: 'resume-action-words',
      name: 'Action Words Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['action-verbs', 'achievement-framing', 'impact-statements'],
      trainingDataSources: [
        'resume-guides',
        'linkedin-profiles',
        'job-descriptions',
      ],
      vocabBias: ['engineered', 'optimized', 'spearheaded', 'architected', 'delivered', 'scaled'],
      capacity: 0.9,
      minActivation: 0.25,
    },
    {
      id: 'resume-tech-skills',
      name: 'Tech Skills Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['technical-skills', 'skill-categorization', 'proficiency-levels'],
      trainingDataSources: [
        'tech-job-postings',
        'skill-frameworks',
        'certification-programs',
      ],
      vocabBias: ['proficient', 'expert', 'familiar', 'certified', 'years of experience'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'resume-projects',
      name: 'Project Description Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['project-descriptions', 'outcomes', 'technologies-used'],
      trainingDataSources: [
        'github-readmes',
        'portfolio-sites',
        'case-studies',
      ],
      vocabBias: ['built', 'developed', 'implemented', 'reduced', 'increased', 'improved'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'resume-metrics',
      name: 'Metrics Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['quantification', 'kpis', 'impact-measurement'],
      trainingDataSources: [
        'performance-reviews',
        'okr-examples',
        'business-metrics',
      ],
      vocabBias: ['%', 'increased by', 'reduced by', 'saved', 'generated', 'users', 'revenue'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'resume-experience',
      name: 'Experience Framing Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['work-experience', 'role-descriptions', 'responsibilities'],
      trainingDataSources: [
        'job-descriptions',
        'linkedin-experiences',
        'career-guides',
      ],
      vocabBias: ['responsible for', 'led', 'managed', 'collaborated', 'contributed'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'resume-education',
      name: 'Education Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['education', 'certifications', 'courses', 'bootcamps'],
      trainingDataSources: [
        'university-programs',
        'certification-bodies',
        'coursera-certificates',
      ],
      vocabBias: ['degree', 'certified', 'completed', 'coursework', 'GPA', 'honors'],
      capacity: 0.7,
      minActivation: 0.35,
    },
    {
      id: 'resume-cover-letter',
      name: 'Cover Letter Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['cover-letters', 'introductions', 'motivation'],
      trainingDataSources: [
        'cover-letter-examples',
        'career-advice',
        'hiring-manager-perspectives',
      ],
      vocabBias: ['excited', 'passionate', 'contribute', 'opportunity', 'align', 'value'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'resume-interview',
      name: 'Interview Prep Expert',
      parent: 'ResumeMicroAtomic',
      domains: ['behavioral-questions', 'star-method', 'technical-interviews'],
      trainingDataSources: [
        'interview-guides',
        'glassdoor-interviews',
        'leetcode-discussions',
      ],
      vocabBias: ['STAR', 'situation', 'task', 'action', 'result', 'challenge', 'learned'],
      capacity: 0.75,
      minActivation: 0.35,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // ALGORITHMS & DSA (8 experts)
  // ═══════════════════════════════════════════════════════════════════════
  algorithms: [
    {
      id: 'algo-sorting',
      name: 'Sorting Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['sorting', 'quicksort', 'mergesort', 'heapsort'],
      trainingDataSources: [
        'algorithms-textbooks',
        'leetcode/sorting',
        'visualgo',
      ],
      vocabBias: ['O(n log n)', 'partition', 'merge', 'pivot', 'stable', 'in-place'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'algo-searching',
      name: 'Searching Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['binary-search', 'bfs', 'dfs', 'hash-tables'],
      trainingDataSources: [
        'algorithms-textbooks',
        'leetcode/searching',
        'competitive-programming',
      ],
      vocabBias: ['O(log n)', 'binary search', 'hash', 'linear', 'target', 'index'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'algo-graphs',
      name: 'Graph Algorithms Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['dijkstra', 'bfs', 'dfs', 'topological-sort', 'mst'],
      trainingDataSources: [
        'algorithms-textbooks',
        'leetcode/graphs',
        'competitive-programming',
      ],
      vocabBias: ['vertex', 'edge', 'path', 'shortest', 'cycle', 'connected', 'weighted'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'algo-dp',
      name: 'Dynamic Programming Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['dynamic-programming', 'memoization', 'tabulation'],
      trainingDataSources: [
        'algorithms-textbooks',
        'leetcode/dp',
        'competitive-programming',
      ],
      vocabBias: ['subproblem', 'optimal', 'memoize', 'state', 'transition', 'base case'],
      capacity: 0.85,
      minActivation: 0.35,
    },
    {
      id: 'algo-trees',
      name: 'Tree Algorithms Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['binary-trees', 'bst', 'avl', 'red-black', 'trie'],
      trainingDataSources: [
        'algorithms-textbooks',
        'leetcode/trees',
        'competitive-programming',
      ],
      vocabBias: ['root', 'leaf', 'height', 'balanced', 'traversal', 'inorder', 'preorder'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'algo-strings',
      name: 'String Algorithms Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['pattern-matching', 'kmp', 'regex', 'edit-distance'],
      trainingDataSources: [
        'algorithms-textbooks',
        'leetcode/strings',
        'competitive-programming',
      ],
      vocabBias: ['substring', 'pattern', 'match', 'prefix', 'suffix', 'palindrome'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'algo-complexity',
      name: 'Complexity Analysis Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['big-o', 'time-complexity', 'space-complexity', 'amortized'],
      trainingDataSources: [
        'algorithms-textbooks',
        'complexity-analysis-guides',
        'interview-prep',
      ],
      vocabBias: ['O(n)', 'O(1)', 'O(n²)', 'amortized', 'worst case', 'best case', 'average'],
      capacity: 0.8,
      minActivation: 0.3,
    },
    {
      id: 'algo-design',
      name: 'Algorithm Design Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['divide-conquer', 'greedy', 'backtracking', 'branch-bound'],
      trainingDataSources: [
        'algorithms-textbooks',
        'competitive-programming',
        'research-papers',
      ],
      vocabBias: ['divide', 'conquer', 'greedy', 'optimal', 'backtrack', 'prune'],
      capacity: 0.75,
      minActivation: 0.35,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // DESIGN PATTERNS & ARCHITECTURE (8 experts)
  // ═══════════════════════════════════════════════════════════════════════
  architecture: [
    {
      id: 'arch-patterns',
      name: 'Design Patterns Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['gang-of-four', 'creational', 'structural', 'behavioral'],
      trainingDataSources: [
        'design-patterns-book',
        'refactoring-guru',
        'github/pattern-examples',
      ],
      vocabBias: ['singleton', 'factory', 'observer', 'strategy', 'decorator', 'adapter'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'arch-clean',
      name: 'Clean Architecture Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['clean-architecture', 'hexagonal', 'onion', 'ddd'],
      trainingDataSources: [
        'clean-architecture-book',
        'ddd-books',
        'architecture-blogs',
      ],
      vocabBias: ['entity', 'use case', 'repository', 'domain', 'interface', 'boundary'],
      capacity: 0.75,
      minActivation: 0.4,
    },
    {
      id: 'arch-microservices',
      name: 'Microservices Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['microservices', 'service-mesh', 'api-gateway', 'saga'],
      trainingDataSources: [
        'microservices-patterns',
        'architecture-blogs',
        'case-studies',
      ],
      vocabBias: ['service', 'api', 'gateway', 'circuit breaker', 'saga', 'event-driven'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'arch-api-design',
      name: 'API Design Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['rest-design', 'graphql-schema', 'openapi', 'versioning'],
      trainingDataSources: [
        'api-design-guides',
        'openapi-specs',
        'stripe-api-docs',
      ],
      vocabBias: ['endpoint', 'resource', 'schema', 'versioning', 'pagination', 'rate limit'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'arch-solid',
      name: 'SOLID Principles Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['solid', 'srp', 'ocp', 'lsp', 'isp', 'dip'],
      trainingDataSources: [
        'solid-principles-books',
        'clean-code-book',
        'refactoring-examples',
      ],
      vocabBias: ['single responsibility', 'open/closed', 'liskov', 'interface segregation', 'dependency inversion'],
      capacity: 0.75,
      minActivation: 0.4,
    },
    {
      id: 'arch-event-driven',
      name: 'Event-Driven Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['event-sourcing', 'cqrs', 'message-queues', 'pub-sub'],
      trainingDataSources: [
        'event-sourcing-docs',
        'kafka-docs',
        'rabbitmq-docs',
      ],
      vocabBias: ['event', 'command', 'query', 'publish', 'subscribe', 'consumer', 'producer'],
      capacity: 0.75,
      minActivation: 0.4,
    },
    {
      id: 'arch-scalability',
      name: 'Scalability Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['horizontal-scaling', 'caching', 'load-balancing', 'sharding'],
      trainingDataSources: [
        'system-design-primer',
        'highscalability-blog',
        'case-studies',
      ],
      vocabBias: ['scale', 'cache', 'shard', 'replicate', 'partition', 'throughput', 'latency'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'arch-system-design',
      name: 'System Design Expert',
      parent: 'ProgrammingMicroAtomic',
      domains: ['system-design', 'distributed-systems', 'cap-theorem'],
      trainingDataSources: [
        'system-design-primer',
        'designing-data-intensive-apps',
        'interview-prep',
      ],
      vocabBias: ['CAP', 'consistency', 'availability', 'partition', 'distributed', 'consensus'],
      capacity: 0.85,
      minActivation: 0.35,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // DOCUMENTATION & COMMUNICATION (6 experts)
  // ═══════════════════════════════════════════════════════════════════════
  docs: [
    {
      id: 'docs-technical',
      name: 'Technical Writing Expert',
      parent: 'OutputMicroAtomic',
      domains: ['technical-documentation', 'api-docs', 'tutorials'],
      trainingDataSources: [
        'stripe-docs',
        'aws-docs',
        'technical-writing-guides',
      ],
      vocabBias: ['overview', 'prerequisites', 'steps', 'example', 'note', 'warning'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'docs-readme',
      name: 'README Expert',
      parent: 'OutputMicroAtomic',
      domains: ['readme', 'project-documentation', 'badges'],
      trainingDataSources: [
        'github/awesome-readmes',
        'readme-templates',
        'open-source-guides',
      ],
      vocabBias: ['installation', 'usage', 'contributing', 'license', 'features', 'getting started'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'docs-comments',
      name: 'Code Comments Expert',
      parent: 'OutputMicroAtomic',
      domains: ['jsdoc', 'docstrings', 'inline-comments'],
      trainingDataSources: [
        'jsdoc-examples',
        'pep-257',
        'javadoc-examples',
      ],
      vocabBias: ['@param', '@returns', '@example', '@throws', '@deprecated', '@see'],
      capacity: 0.7,
      minActivation: 0.4,
    },
    {
      id: 'docs-changelog',
      name: 'Changelog Expert',
      parent: 'OutputMicroAtomic',
      domains: ['changelog', 'release-notes', 'semantic-versioning'],
      trainingDataSources: [
        'keep-a-changelog',
        'conventional-commits',
        'release-notes-examples',
      ],
      vocabBias: ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security', 'Breaking'],
      capacity: 0.65,
      minActivation: 0.45,
    },
    {
      id: 'docs-git',
      name: 'Git Messages Expert',
      parent: 'OutputMicroAtomic',
      domains: ['commit-messages', 'pr-descriptions', 'conventional-commits'],
      trainingDataSources: [
        'conventional-commits-spec',
        'git-commit-guidelines',
        'github-pr-templates',
      ],
      vocabBias: ['feat:', 'fix:', 'docs:', 'refactor:', 'test:', 'chore:', 'breaking change'],
      capacity: 0.7,
      minActivation: 0.4,
    },
    {
      id: 'docs-diagrams',
      name: 'Diagrams Expert',
      parent: 'OutputMicroAtomic',
      domains: ['mermaid', 'plantuml', 'ascii-diagrams', 'flowcharts'],
      trainingDataSources: [
        'mermaid-docs',
        'plantuml-docs',
        'diagramming-guides',
      ],
      vocabBias: ['flowchart', 'sequence', 'class', 'entity', 'state', 'gantt', 'pie'],
      capacity: 0.65,
      minActivation: 0.45,
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════
  // ATOMIC FRAMEWORK (10 experts) - Object Server, Blocks, Micronauts
  // ═══════════════════════════════════════════════════════════════════════
  atomic: [
    {
      id: 'atomic-object-server',
      name: 'Object Server Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['object-server', 'object-loading', 'verification', 'projection'],
      trainingDataSources: [
        'atomic-framework-docs',
        'object-server-spec',
        'projection-patterns',
      ],
      vocabBias: ['object', 'descriptor', 'payload', 'projection', 'verify', 'invariant', 'authority'],
      capacity: 0.9,
      minActivation: 0.25,
    },
    {
      id: 'atomic-blocks',
      name: 'Atomic Blocks Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['atomic-blocks', 'header', 'body', 'sidebars', 'footer', 'template'],
      trainingDataSources: [
        'atomic-blocks-grammar',
        'template-examples',
        'html-semantics',
      ],
      vocabBias: ['<header>', '<body>', '<sidebars>', '<footer>', 'AtomicBlockSet', 'slot', '{{'],
      capacity: 0.9,
      minActivation: 0.25,
    },
    {
      id: 'atomic-micronauts',
      name: 'Micronauts Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['micronauts', 'perception', 'layout', 'theme', 'motion', 'density'],
      trainingDataSources: [
        'micronaut-grammar',
        'css-perception',
        'design-tokens',
      ],
      vocabBias: ['@micronaut', 'layout:', 'theme:', 'motion:', 'density:', 'visibility:', 'perception'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'atomic-projections',
      name: 'Projections Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['projections', 'mapping', 'emit', 'response', 'representation'],
      trainingDataSources: [
        'projection-spec',
        'data-mapping',
        'response-formats',
      ],
      vocabBias: ['projection', 'emit', '@payload', 'mapping', 'representation', 'view'],
      capacity: 0.85,
      minActivation: 0.3,
    },
    {
      id: 'atomic-identity',
      name: 'Object Identity Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['identity', 'hash', 'resolution', 'canonical', 'versioning'],
      trainingDataSources: [
        'identity-spec',
        'content-addressable',
        'hash-verification',
      ],
      vocabBias: ['object://', 'hash', 'sha256', 'identity', 'resolve', 'canonical'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'atomic-invariants',
      name: 'Invariants Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['invariants', 'constraints', 'verification', 'immutability'],
      trainingDataSources: [
        'invariant-patterns',
        'constraint-systems',
        'verification-logic',
      ],
      vocabBias: ['invariant', 'immutable_payload', 'no_execution', 'deterministic', 'constraint'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'atomic-authority',
      name: 'Authority Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['authority', 'escalation', 'permissions', 'execution-rights'],
      trainingDataSources: [
        'authority-spec',
        'escalation-patterns',
        'capability-systems',
      ],
      vocabBias: ['authority', 'none', 'read', 'write', 'execute', 'escalation', 'capability'],
      capacity: 0.8,
      minActivation: 0.35,
    },
    {
      id: 'atomic-slots',
      name: 'Slots Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['slots', 'placeholders', 'interpolation', 'filters'],
      trainingDataSources: [
        'slot-syntax',
        'template-interpolation',
        'filter-patterns',
      ],
      vocabBias: ['{{', '}}', 'slot', 'placeholder', '|', 'filter', 'escape', 'default'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'atomic-events',
      name: 'Lifecycle Events Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['events', 'lifecycle', 'on_load', 'on_project', 'handlers'],
      trainingDataSources: [
        'event-spec',
        'lifecycle-patterns',
        'handler-examples',
      ],
      vocabBias: ['on_load', 'on_project', 'on_error', 'emit', 'event', 'lifecycle', 'tick'],
      capacity: 0.75,
      minActivation: 0.35,
    },
    {
      id: 'atomic-kuhul',
      name: 'K\'UHUL Integration Expert',
      parent: 'AtomicMicroAtomic',
      domains: ['kuhul', 'toml', 'cluster', 'policy', 'coordination'],
      trainingDataSources: [
        'kuhul-spec',
        'toml-config',
        'cluster-patterns',
      ],
      vocabBias: ['kuhul.toml', 'cluster', 'policy', 'tools', 'plan', 'step', 'coordinator'],
      capacity: 0.8,
      minActivation: 0.35,
    },
  ],
};

// ============================================================================
// Training Configuration
// ============================================================================

export interface TrainingConfig {
  batchSize: number;
  learningRate: number;
  epochs: number;
  expertDropout: number;
  routerTemperature: number;
  loadBalancingLoss: number;
}

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  batchSize: 32,
  learningRate: 1e-4,
  epochs: 3,
  expertDropout: 0.1,
  routerTemperature: 1.0,
  loadBalancingLoss: 0.01,  // auxiliary loss for balanced expert usage
};

// ============================================================================
// Expert Count Summary
// ============================================================================

export function getExpertCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const [category, experts] of Object.entries(EXPERT_TAXONOMY)) {
    counts[category] = experts.length;
    total += experts.length;
  }

  counts['TOTAL'] = total;
  return counts;
}

export function getAllExperts(): ExpertSpec[] {
  return Object.values(EXPERT_TAXONOMY).flat();
}

export function getExpertById(id: string): ExpertSpec | undefined {
  return getAllExperts().find(e => e.id === id);
}

export function getExpertsByParent(parent: string): ExpertSpec[] {
  return getAllExperts().filter(e => e.parent === parent);
}
