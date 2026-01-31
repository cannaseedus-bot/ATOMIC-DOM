/**
 * ASXR TypeScript Decorators
 * Decorators for defining ASXR blocks in TypeScript classes
 */

import type { Block } from '../runtime/index.js';

/**
 * Block metadata stored on decorated classes
 */
export interface BlockMetadata {
  type: 'atomic' | 'component' | 'state';
  id?: string;
  props?: Record<string, PropertyMetadata>;
  state?: Record<string, StateMetadata>;
  children?: string[];
}

export interface PropertyMetadata {
  type: string;
  required: boolean;
  default?: unknown;
}

export interface StateMetadata {
  type: string;
  initial?: unknown;
  reactive: boolean;
}

/**
 * Symbol for storing block metadata
 */
const BLOCK_METADATA = Symbol('asxr:block');
const EVENT_METADATA = Symbol('asxr:event');

/**
 * @Atomic decorator - marks a class as an atomic block
 */
export function Atomic(id?: string): ClassDecorator {
  return function (target: Function) {
    const metadata: BlockMetadata = getOrCreateMetadata(target);
    metadata.type = 'atomic';
    metadata.id = id ?? target.name;
  };
}

/**
 * @Component decorator - marks a class as a component
 */
export function Component(id?: string): ClassDecorator {
  return function (target: Function) {
    const metadata: BlockMetadata = getOrCreateMetadata(target);
    metadata.type = 'component';
    metadata.id = id ?? target.name;
  };
}

/**
 * @State decorator for class - marks a class as a state container
 */
export function State(id?: string): ClassDecorator {
  return function (target: Function) {
    const metadata: BlockMetadata = getOrCreateMetadata(target);
    metadata.type = 'state';
    metadata.id = id ?? target.name;
  };
}

/**
 * @Prop decorator - marks a property as a component prop
 */
export function Prop(options?: { required?: boolean; default?: unknown }): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const props = getOrCreatePropMetadata(target.constructor);
    props[String(propertyKey)] = {
      type: 'unknown',
      required: options?.required ?? false,
      default: options?.default,
    };
  };
}

/**
 * @Reactive decorator - marks a property as reactive state
 */
export function Reactive(initial?: unknown): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const state = getOrCreateStateMetadata(target.constructor);
    state[String(propertyKey)] = {
      type: 'unknown',
      initial,
      reactive: true,
    };
  };
}

/**
 * @Computed decorator - marks a getter as a computed property
 */
export function Computed(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const state = getOrCreateStateMetadata(target.constructor);
    state[String(propertyKey)] = {
      type: 'computed',
      reactive: true,
    };
  };
}

/**
 * @On decorator - marks a method as an event handler
 */
export function On(eventName: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const events = getOrCreateEventMetadata(target.constructor);
    events[eventName] = String(propertyKey);
    return descriptor;
  };
}

/**
 * @Watch decorator - marks a method as a state watcher
 */
export function Watch(path: string): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const watchers = getOrCreateWatchMetadata(target.constructor);
    watchers[path] = String(propertyKey);
    return descriptor;
  };
}

/**
 * @Child decorator - marks a property as a child block reference
 */
export function Child(): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const metadata = getOrCreateMetadata(target.constructor);
    metadata.children = metadata.children ?? [];
    metadata.children.push(String(propertyKey));
  };
}

/**
 * Get or create block metadata for a class
 */
function getOrCreateMetadata(target: Function): BlockMetadata {
  let metadata = (target as any)[BLOCK_METADATA] as BlockMetadata | undefined;
  if (!metadata) {
    metadata = { type: 'atomic', props: {}, state: {} };
    (target as any)[BLOCK_METADATA] = metadata;
  }
  return metadata;
}

function getOrCreatePropMetadata(target: Function): Record<string, PropertyMetadata> {
  const metadata = getOrCreateMetadata(target);
  metadata.props = metadata.props ?? {};
  return metadata.props;
}

function getOrCreateStateMetadata(target: Function): Record<string, StateMetadata> {
  const metadata = getOrCreateMetadata(target);
  metadata.state = metadata.state ?? {};
  return metadata.state;
}

function getOrCreateEventMetadata(target: Function): Record<string, string> {
  let events = (target as any)[EVENT_METADATA] as Record<string, string> | undefined;
  if (!events) {
    events = {};
    (target as any)[EVENT_METADATA] = events;
  }
  return events;
}

function getOrCreateWatchMetadata(target: Function): Record<string, string> {
  let watchers = (target as any)['asxr:watch'] as Record<string, string> | undefined;
  if (!watchers) {
    watchers = {};
    (target as any)['asxr:watch'] = watchers;
  }
  return watchers;
}

/**
 * Get block metadata from a class
 */
export function getBlockMetadata(target: Function): BlockMetadata | undefined {
  return (target as any)[BLOCK_METADATA];
}

/**
 * Get event handlers from a class
 */
export function getEventHandlers(target: Function): Record<string, string> {
  return (target as any)[EVENT_METADATA] ?? {};
}

/**
 * Get watchers from a class
 */
export function getWatchers(target: Function): Record<string, string> {
  return (target as any)['asxr:watch'] ?? {};
}

/**
 * Convert a decorated class instance to a Block
 */
export function toBlock(instance: object): Block {
  const constructor = instance.constructor;
  const metadata = getBlockMetadata(constructor);

  if (!metadata) {
    throw new Error('Class is not decorated with @Atomic, @Component, or @State');
  }

  const props: Record<string, unknown> = {};

  // Copy props
  if (metadata.props) {
    for (const [key, propMeta] of Object.entries(metadata.props)) {
      const value = (instance as any)[key];
      props[key] = value !== undefined ? value : propMeta.default;
    }
  }

  // Copy state
  if (metadata.state) {
    for (const [key, stateMeta] of Object.entries(metadata.state)) {
      const value = (instance as any)[key];
      props[key] = value !== undefined ? value : stateMeta.initial;
    }
  }

  return {
    type: metadata.type,
    id: metadata.id ?? null,
    props,
  };
}

/**
 * Create a reactive proxy for a decorated class instance
 */
export function reactive<T extends object>(instance: T, onChange?: (key: string, value: unknown) => void): T {
  const metadata = getBlockMetadata(instance.constructor);

  return new Proxy(instance, {
    set(target, key, value) {
      const result = Reflect.set(target, key, value);

      // Check if this is a reactive property
      if (metadata?.state?.[String(key)]?.reactive) {
        onChange?.(String(key), value);
      }

      return result;
    },
  });
}
