import { test, describe, expect } from 'vitest';
import { validateFlowInput, validateFlowData, validateFlowDataArray, createFlowData, findDuplicateFlows } from '../validation.js';
import type { FlowData } from '../types.js';

describe('Flow Input Validation', () => {
  test('should validate correct flow input', () => {
    const input = {
      source: 'A',
      target: 'B',
      value: 10
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject empty source', () => {
    const input = {
      source: '',
      target: 'B',
      value: 10
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Source must be a non-empty string'))).toBe(true);
  });

  test('should reject empty target', () => {
    const input = {
      source: 'A',
      target: '',
      value: 10
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Target must be a non-empty string'))).toBe(true);
  });

  test('should reject same source and target', () => {
    const input = {
      source: 'A',
      target: 'A',
      value: 10
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Source and target must be different'))).toBe(true);
  });

  test('should reject negative value', () => {
    const input = {
      source: 'A',
      target: 'B',
      value: -5
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Value must be a positive number'))).toBe(true);
  });

  test('should reject zero value', () => {
    const input = {
      source: 'A',
      target: 'B',
      value: 0
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Value must be a positive number'))).toBe(true);
  });

  test('should reject non-numeric value', () => {
    const input = {
      source: 'A',
      target: 'B',
      value: 'not a number'
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Value must be a valid number'))).toBe(true);
  });

  test('should reject infinite value', () => {
    const input = {
      source: 'A',
      target: 'B',
      value: Infinity
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Value must be a finite number'))).toBe(true);
  });

  test('should accept string numeric value', () => {
    const input = {
      source: 'A',
      target: 'B',
      value: '15.5'
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should trim whitespace from source and target', () => {
    const input = {
      source: '  A  ',
      target: '  B  ',
      value: 10
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(true);
  });
});

describe('Flow Data Validation', () => {
  test('should validate correct flow data', () => {
    const flow = {
      id: 'flow_123',
      source: 'A',
      target: 'B',
      value: 10
    };

    const result = validateFlowData(flow);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject missing ID', () => {
    const flow = {
      id: '',
      source: 'A',
      target: 'B',
      value: 10
    };

    const result = validateFlowData(flow);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('ID must be a non-empty string'))).toBe(true);
  });

  test('should reject invalid flow data with multiple errors', () => {
    const flow = {
      id: '',
      source: '',
      target: 'A',
      value: -5
    };

    const result = validateFlowData(flow);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3); // ID, source, and value errors
  });
});

describe('Flow Data Array Validation', () => {
  test('should validate empty array', () => {
    const flows: FlowData[] = [];
    const result = validateFlowDataArray(flows);
    expect(result.isValid).toBe(true);
  });

  test('should validate array with valid flows', () => {
    const flows = [
      { id: 'flow_1', source: 'A', target: 'B', value: 10 },
      { id: 'flow_2', source: 'B', target: 'C', value: 5 }
    ];

    const result = validateFlowDataArray(flows);
    expect(result.isValid).toBe(true);
  });

  test('should reject non-array input', () => {
    const flows = 'not an array' as any;
    const result = validateFlowDataArray(flows);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Flows must be an array'))).toBe(true);
  });

  test('should reject array with invalid flows', () => {
    const flows = [
      { id: 'flow_1', source: 'A', target: 'B', value: 10 },
      { id: '', source: '', target: 'C', value: -5 }
    ];

    const result = validateFlowDataArray(flows);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Flow 2:'))).toBe(true);
  });

  test('should enforce node limit (50 nodes)', () => {
    const flows: FlowData[] = [];
    // Create flows that would result in 51 unique nodes
    for (let i = 0; i <= 50; i++) {
      flows.push({
        id: `flow_${i}`,
        source: `Node${i}`,
        target: 'CommonTarget',
        value: 1
      });
    }

    const result = validateFlowDataArray(flows);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Maximum of 50 nodes allowed'))).toBe(true);
  });

  test('should enforce connection limit (100 connections)', () => {
    const flows: FlowData[] = [];
    // Create 101 flows
    for (let i = 0; i <= 100; i++) {
      flows.push({
        id: `flow_${i}`,
        source: 'A',
        target: 'B',
        value: 1
      });
    }

    const result = validateFlowDataArray(flows);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Maximum of 100 connections allowed'))).toBe(true);
  });
});

describe('Create Flow Data', () => {
  test('should create flow data from valid input', () => {
    const input = {
      source: '  A  ',
      target: '  B  ',
      value: '15.5'
    };

    const flowData = createFlowData(input);
    expect(flowData.source).toBe('A');
    expect(flowData.target).toBe('B');
    expect(flowData.value).toBe(15.5);
    expect(flowData.id).toBeDefined();
    expect(flowData.id.startsWith('flow_')).toBe(true);
  });

  test('should throw error for invalid input', () => {
    const input = {
      source: '',
      target: 'B',
      value: -5
    };

    expect(() => {
      createFlowData(input);
    }).toThrow(/Invalid flow input/);
  });
});

describe('Find Duplicate Flows', () => {
  test('should find no duplicates in unique flows', () => {
    const flows = [
      { id: 'flow_1', source: 'A', target: 'B', value: 10 },
      { id: 'flow_2', source: 'B', target: 'C', value: 5 },
      { id: 'flow_3', source: 'A', target: 'C', value: 3 }
    ];

    const duplicates = findDuplicateFlows(flows);
    expect(duplicates).toHaveLength(0);
  });

  test('should find duplicate flows with same source-target pair', () => {
    const flows = [
      { id: 'flow_1', source: 'A', target: 'B', value: 10 },
      { id: 'flow_2', source: 'A', target: 'B', value: 5 },
      { id: 'flow_3', source: 'B', target: 'C', value: 3 }
    ];

    const duplicates = findDuplicateFlows(flows);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toHaveLength(2);
    expect(duplicates[0][0].source).toBe('A');
    expect(duplicates[0][0].target).toBe('B');
  });

  test('should find multiple duplicate groups', () => {
    const flows = [
      { id: 'flow_1', source: 'A', target: 'B', value: 10 },
      { id: 'flow_2', source: 'A', target: 'B', value: 5 },
      { id: 'flow_3', source: 'C', target: 'D', value: 3 },
      { id: 'flow_4', source: 'C', target: 'D', value: 7 }
    ];

    const duplicates = findDuplicateFlows(flows);
    expect(duplicates).toHaveLength(2);
  });
});
