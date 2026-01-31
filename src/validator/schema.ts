/**
 * ASXR Schema Validation
 * Validates block properties against schema definitions
 */

export type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'array'
  | 'object'
  | 'reference'
  | 'block'
  | 'any';

export interface PropertySchema {
  type: SchemaType | SchemaType[];
  required?: boolean;
  default?: unknown;
  items?: PropertySchema; // For arrays
  properties?: Record<string, PropertySchema>; // For objects
  enum?: unknown[]; // Allowed values
  pattern?: string; // Regex pattern for strings
  min?: number; // Min value/length
  max?: number; // Max value/length
}

export interface BlockSchema {
  type: string;
  properties: Record<string, PropertySchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Built-in schemas for core block types
export const BUILTIN_SCHEMAS: Record<string, BlockSchema> = {
  block: {
    type: 'block',
    properties: {
      schema: { type: 'object' },
      laws: { type: 'array', items: { type: 'string' } },
    },
    additionalProperties: true,
  },
  system: {
    type: 'system',
    properties: {
      name: { type: 'string', required: true },
      version: { type: 'string' },
      laws: { type: 'array', items: { type: 'string' } },
    },
    required: ['name'],
    additionalProperties: true,
  },
  container: {
    type: 'container',
    properties: {
      children: { type: 'array' },
      layout: { type: 'string', enum: ['flex', 'grid', 'block', 'inline'] },
    },
    additionalProperties: true,
  },
  component: {
    type: 'component',
    properties: {
      props: { type: 'object' },
      state: { type: 'object' },
      children: { type: 'array' },
    },
    additionalProperties: true,
  },
  dom: {
    type: 'dom',
    properties: {
      text: { type: 'string' },
      children: { type: 'array' },
      style: { type: 'object' },
      attrs: { type: 'object' },
      events: { type: 'object' },
    },
    additionalProperties: true,
  },
};

/**
 * Validate a value against a property schema
 */
export function validateProperty(
  value: unknown,
  schema: PropertySchema,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check type
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actualType = getValueType(value);

  if (!types.includes(actualType) && !types.includes('any')) {
    errors.push({
      path,
      message: `Expected ${types.join(' | ')}, got ${actualType}`,
      code: 'TYPE_MISMATCH',
    });
    return errors; // Don't validate further if type is wrong
  }

  // Check enum
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      path,
      message: `Value must be one of: ${schema.enum.join(', ')}`,
      code: 'ENUM_MISMATCH',
    });
  }

  // Check pattern (for strings)
  if (schema.pattern && typeof value === 'string') {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      errors.push({
        path,
        message: `Value does not match pattern: ${schema.pattern}`,
        code: 'PATTERN_MISMATCH',
      });
    }
  }

  // Check min/max
  if (typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        path,
        message: `Value must be >= ${schema.min}`,
        code: 'MIN_VALUE',
      });
    }
    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        path,
        message: `Value must be <= ${schema.max}`,
        code: 'MAX_VALUE',
      });
    }
  }

  // Check array items
  if (Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i++) {
      errors.push(...validateProperty(value[i], schema.items, `${path}[${i}]`));
    }
    if (schema.min !== undefined && value.length < schema.min) {
      errors.push({
        path,
        message: `Array must have at least ${schema.min} items`,
        code: 'MIN_LENGTH',
      });
    }
    if (schema.max !== undefined && value.length > schema.max) {
      errors.push({
        path,
        message: `Array must have at most ${schema.max} items`,
        code: 'MAX_LENGTH',
      });
    }
  }

  // Check object properties
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && schema.properties) {
    const obj = value as Record<string, unknown>;
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in obj) {
        errors.push(...validateProperty(obj[key], propSchema, `${path}.${key}`));
      } else if (propSchema.required) {
        errors.push({
          path: `${path}.${key}`,
          message: `Required property missing`,
          code: 'REQUIRED',
        });
      }
    }
  }

  return errors;
}

/**
 * Validate a block against its schema
 */
export function validateBlock(
  blockType: string,
  properties: Record<string, unknown>,
  customSchemas: Record<string, BlockSchema> = {}
): ValidationResult {
  const errors: ValidationError[] = [];
  const schema = customSchemas[blockType] || BUILTIN_SCHEMAS[blockType];

  if (!schema) {
    // Unknown block type - allow any properties
    return { valid: true, errors: [] };
  }

  // Check required properties
  if (schema.required) {
    for (const required of schema.required) {
      if (!(required in properties)) {
        errors.push({
          path: required,
          message: `Required property '${required}' is missing`,
          code: 'REQUIRED',
        });
      }
    }
  }

  // Validate each property
  for (const [key, value] of Object.entries(properties)) {
    const propSchema = schema.properties[key];
    if (propSchema) {
      errors.push(...validateProperty(value, propSchema, key));
    } else if (schema.additionalProperties === false) {
      errors.push({
        path: key,
        message: `Unknown property '${key}'`,
        code: 'ADDITIONAL_PROPERTY',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get the schema type of a value
 */
function getValueType(value: unknown): SchemaType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'any';
}

/**
 * Create a custom schema
 */
export function createSchema(definition: Partial<BlockSchema> & { type: string }): BlockSchema {
  return {
    properties: {},
    additionalProperties: true,
    ...definition,
  };
}
