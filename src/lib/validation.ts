import type { FlowInput, FlowData, ValidationResult } from './types.js';

/**
 * Validates a single flow input and returns validation result with detailed messages
 */
export function validateFlowInput(input: FlowInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate source
  if (!input.source || typeof input.source !== 'string') {
    errors.push('Source field is required and must be text');
  } else if (input.source.trim() === '') {
    errors.push('Source cannot be empty or just spaces');
  } else if (input.source.length > 50) {
    warnings.push('Source name is quite long - consider shortening for better display');
  }

  // Validate target
  if (!input.target || typeof input.target !== 'string') {
    errors.push('Target field is required and must be text');
  } else if (input.target.trim() === '') {
    errors.push('Target cannot be empty or just spaces');
  } else if (input.target.length > 50) {
    warnings.push('Target name is quite long - consider shortening for better display');
  }

  // Validate that source and target are different
  if (input.source && input.target &&
      typeof input.source === 'string' && typeof input.target === 'string' &&
      input.source.trim() === input.target.trim()) {
    errors.push('Source and target must be different nodes');
  }

  // Validate value with detailed error messages
  const valueStr = typeof input.value === 'string' ? input.value.trim() : String(input.value);
  const numValue = typeof input.value === 'string' ? parseFloat(input.value) : input.value;

  if (!valueStr || valueStr === '') {
    errors.push('Value field is required');
  } else if (isNaN(numValue)) {
    errors.push('Value must be a valid number (e.g., 10, 5.5, 100)');
  } else if (numValue <= 0) {
    errors.push('Value must be greater than zero');
  } else if (!isFinite(numValue)) {
    errors.push('Value must be a finite number (not infinity)');
  } else if (numValue > 1000000) {
    warnings.push('Very large values may affect chart readability');
  } else if (numValue < 0.01) {
    warnings.push('Very small values may be hard to see in the chart');
  }

  // Check for special characters that might cause issues
  if (input.source && /[<>\"'&]/.test(input.source)) {
    warnings.push('Source contains special characters that may affect display');
  }
  if (input.target && /[<>\"'&]/.test(input.target)) {
    warnings.push('Target contains special characters that may affect display');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates an array of flow data and returns overall validation result
 */
export function validateFlowDataArray(flows: FlowData[]): ValidationResult {
  const errors: string[] = [];

  // Check for empty array
  if (!Array.isArray(flows)) {
    errors.push('Flows must be an array');
    return { isValid: false, errors };
  }

  // Validate each flow
  flows.forEach((flow, index) => {
    const flowValidation = validateFlowData(flow);
    if (!flowValidation.isValid) {
      flowValidation.errors.forEach(error => {
        errors.push(`Flow ${index + 1}: ${error}`);
      });
    }
  });

  // Check for performance limits (as per requirements)
  const uniqueNodes = new Set<string>();
  flows.forEach(flow => {
    uniqueNodes.add(flow.source);
    uniqueNodes.add(flow.target);
  });

  if (uniqueNodes.size > 50) {
    errors.push('Maximum of 50 nodes allowed for optimal performance');
  }

  if (flows.length > 100) {
    errors.push('Maximum of 100 connections allowed for optimal performance');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single FlowData object
 */
export function validateFlowData(flow: FlowData): ValidationResult {
  const errors: string[] = [];

  // Validate ID
  if (!flow.id || typeof flow.id !== 'string' || flow.id.trim() === '') {
    errors.push('ID must be a non-empty string');
  }

  // Validate source
  if (!flow.source || typeof flow.source !== 'string' || flow.source.trim() === '') {
    errors.push('Source must be a non-empty string');
  }

  // Validate target
  if (!flow.target || typeof flow.target !== 'string' || flow.target.trim() === '') {
    errors.push('Target must be a non-empty string');
  }

  // Validate that source and target are different
  if (flow.source && flow.target && flow.source.trim() === flow.target.trim()) {
    errors.push('Source and target must be different');
  }

  // Validate value
  if (typeof flow.value !== 'number' || isNaN(flow.value)) {
    errors.push('Value must be a valid number');
  } else if (flow.value <= 0) {
    errors.push('Value must be a positive number');
  } else if (!isFinite(flow.value)) {
    errors.push('Value must be a finite number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Converts validated FlowInput to FlowData with generated ID
 */
export function createFlowData(input: FlowInput): FlowData {
  const validation = validateFlowInput(input);
  if (!validation.isValid) {
    throw new Error(`Invalid flow input: ${validation.errors.join(', ')}`);
  }

  return {
    id: generateFlowId(),
    source: input.source.trim(),
    target: input.target.trim(),
    value: typeof input.value === 'string' ? parseFloat(input.value) : input.value
  };
}

/**
 * Generates a unique ID for a flow
 */
function generateFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Checks if flows array contains duplicate flows (same source-target pair)
 */
export function findDuplicateFlows(flows: FlowData[]): FlowData[][] {
  const duplicates: FlowData[][] = [];
  const flowMap = new Map<string, FlowData[]>();

  // Group flows by source-target pair
  flows.forEach(flow => {
    const key = `${flow.source}->${flow.target}`;
    if (!flowMap.has(key)) {
      flowMap.set(key, []);
    }
    flowMap.get(key)!.push(flow);
  });

  // Find groups with more than one flow
  flowMap.forEach(group => {
    if (group.length > 1) {
      duplicates.push(group);
    }
  });

  return duplicates;
}
