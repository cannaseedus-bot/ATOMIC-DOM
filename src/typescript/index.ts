/**
 * ASXR TypeScript Integration
 * Tools for using ASXR with TypeScript
 */

// Decorators
export {
  Atomic,
  Component,
  State,
  Prop,
  Reactive,
  Computed,
  On,
  Watch,
  Child,
  toBlock,
  reactive,
  getBlockMetadata,
  getEventHandlers,
  getWatchers,
} from './decorators.js';

export type {
  BlockMetadata,
  PropertyMetadata,
  StateMetadata,
} from './decorators.js';

// Transforms
export {
  transformToTypeScript,
  transformFromClass,
  generateInterface,
  generateTypes,
  walkAST,
} from './transforms.js';

export type {
  TransformOptions,
  ASTVisitor,
} from './transforms.js';

// Type generators
export {
  generateTypesFromProgram,
  generateBlockType,
  generateDeclarationFile,
  generateEnum,
  generateConstAssertion,
  generatePropValidators,
  generateDomNodeType,
  TypeRegistry,
} from './types.js';

export type {
  TypeGenOptions,
} from './types.js';
