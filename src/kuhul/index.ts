/**
 * K'UHUL MicroAtomics Module
 * Orchestration layer for context-aware inference with action words registry
 */

// MicroAtomics (Micronauts) System
export {
  MICROATOMICS,
  MicroAtomicOrchestrator,
  orchestrator,
  getMicroAtomicNames,
  getMicroAtomicById,
  getMicroAtomicsByResponsibility,
  type MicroAtomic,
  type MicroAtomicDomain,
  type MicroAtomicContext,
  type ContextType,
} from './microatomics.js';

// Action Words Registry
export {
  ACTION_WORDS,
  ACTION_WORD_CATEGORIES,
  getAllActionWords,
  getActionWordsByCategory,
  getActionWordsByStrength,
  findActionWordByKeyword,
  extractActionWords,
  suggestStrongerWords,
  formatForResume,
  getRandomActionWords,
  type ActionWord,
  type ActionWordCategory,
} from './action-words.js';

// Context Detection
export {
  CONTEXT_INDICATORS,
  MATH_CONTEXT_REGISTRY,
  PROGRAMMING_CONTEXT_REGISTRY,
  calculateContextScore,
  detectContext,
  getAllContextScores,
  detectMultipleContexts,
  getContextDescription,
  getContextEmoji,
  type ContextIndicators,
  type ContextScore,
} from './context.js';

// Inference Engine
export {
  PROMPT_TEMPLATES,
  InferenceEngine,
  inferenceEngine,
  handleCLICommand,
  type PromptTemplate,
  type InferenceResponse,
  type CLICommand,
  type CLIResult,
} from './inference.js';

// Training Spec (Atomic Expert Architecture)
export {
  MODEL_SPEC,
  EXPERT_TAXONOMY,
  DEFAULT_TRAINING_CONFIG,
  getExpertCounts,
  getAllExperts,
  getExpertById,
  getExpertsByParent,
  type ExpertSpec,
  type TrainingConfig,
} from './training-spec.js';

// Inference Backend
export {
  // Pipeline
  InferencePipeline,
  ExpertRouter,
  router,
  createMockPipeline,
  createWebGPUPipeline,
  createRemotePipeline,
  runCLIInference,
  // Backends
  MockInferenceBackend,
  WebGPUInferenceBackend,
  RemoteInferenceBackend,
  // Types
  type InferenceBackend,
  type InferenceOptions,
  type InferenceResult,
  type PipelineResult,
  type RemoteBackendConfig,
} from './backend.js';
