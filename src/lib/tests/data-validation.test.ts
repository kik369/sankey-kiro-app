/**
 * Data Validation and Transformation Tests
 * Consolidated tests for data validation, transformation, and processing
 */

import { test, describe, expect } from 'vitest';
import { validateFlowInput, validateFlowData, validateFlowDataArray, createFlowData, findDuplicateFlows } from '../validation.js';
import {
  extractNodes,
  generateLinks,
  transformFlowsToSankeyData,
  validateSankeyTransformation,
  getSankeyDataSummary
} from '../transform';
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
    expect(result.errors.some(error => error.includes('Source cannot be empty'))).toBe(true);
  });

  test('should reject empty target', () => {
    const input = {
      source: 'A',
      target: '',
      value: 10
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Target cannot be empty'))).toBe(true);
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
    expect(result.errors.some(error => error.includes('Value must be greater than zero'))).toBe(true);
  });

  test('should reject zero value', () => {
    const input = {
      source: 'A',
      target: 'B',
      value: 0
    };

    const result = validateFlowInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Value must be greater than zero'))).toBe(true);
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

describe('Data Transformation', () => {
  const sampleFlows: FlowData[] = [
    { id: '1', source: 'A', target: 'B', value: 10 },
    { id: '2', source: 'A', target: 'C', value: 20 },
    { id: '3', source: 'B', target: 'D', value: 15 },
    { id: '4', source: 'C', target: 'D', value: 25 }
  ];

  test('should extract unique nodes from flow data', () => {
    const nodes = extractNodes(sampleFlows);

    expect(nodes).toHaveLength(4);
    expect(nodes.map(n => n.name).sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  test('should generate ECharts-compatible links', () => {
    const links = generateLinks(sampleFlows);

    expect(links).toHaveLength(4);
    expect(links[0]).toEqual({
      source: 'A',
      target: 'B',
      value: 10
    });
  });

  test('should transform flows to complete Sankey data structure', () => {
    const sankeyData = transformFlowsToSankeyData(sampleFlows);

    expect(sankeyData.nodes).toHaveLength(4);
    expect(sankeyData.links).toHaveLength(4);
    expect(sankeyData.nodes.map(n => n.name).sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  test('should handle empty flows', () => {
    const sankeyData = transformFlowsToSankeyData([]);
    expect(sankeyData).toEqual({
      nodes: [],
      links: []
    });
  });

  test('should validate transformation results', () => {
    const result = validateSankeyTransformation(sampleFlows);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should calculate correct summary statistics', () => {
    const summary = getSankeyDataSummary(sampleFlows);

    expect(summary.nodeCount).toBe(4);
    expect(summary.linkCount).toBe(4);
    expect(summary.totalValue).toBe(70); // 10 + 20 + 15 + 25
    expect(summary.maxValue).toBe(25);
    expect(summary.minValue).toBe(10);
  });
});

describe('Duplicate Flow Detection', () => {
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
});

describe('Flow Data Creation', () => {
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
