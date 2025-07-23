/**
 * Data transformation functions for converting flow data to ECharts Sankey format
 */

import type { FlowData, SankeyNode, SankeyLink, SankeyChartData } from './types';

/**
 * Extract unique nodes from flow data
 * @param flows Array of flow data
 * @returns Array of unique Sankey nodes
 */
export function extractNodes(flows: FlowData[]): SankeyNode[] {
  const nodeNames = new Set<string>();

  // Collect all unique source and target names
  flows.forEach(flow => {
    nodeNames.add(flow.source);
    nodeNames.add(flow.target);
  });

  // Convert to SankeyNode format
  return Array.from(nodeNames).map(name => ({ name }));
}

/**
 * Generate ECharts-compatible links array from flow data
 * @param flows Array of flow data
 * @returns Array of Sankey links
 */
export function generateLinks(flows: FlowData[]): SankeyLink[] {
  return flows.map(flow => ({
    source: flow.source,
    target: flow.target,
    value: flow.value
  }));
}

/**
 * Transform flow data to complete ECharts Sankey format
 * @param flows Array of flow data
 * @returns Complete Sankey chart data structure
 * @throws Error if data is invalid for transformation
 */
export function transformFlowsToSankeyData(flows: FlowData[]): SankeyChartData {
  // Handle empty flows
  if (!flows || flows.length === 0) {
    return {
      nodes: [],
      links: []
    };
  }

  // Validate input data structure
  if (!Array.isArray(flows)) {
    throw new Error('Flows must be an array');
  }

  // Validate each flow has required properties
  flows.forEach((flow, index) => {
    if (!flow || typeof flow !== 'object') {
      throw new Error(`Flow at index ${index} is not a valid object`);
    }

    if (!flow.hasOwnProperty('source') || typeof flow.source !== 'string') {
      throw new Error(`Flow at index ${index} missing valid source property`);
    }

    if (!flow.hasOwnProperty('target') || typeof flow.target !== 'string') {
      throw new Error(`Flow at index ${index} missing valid target property`);
    }

    if (!flow.hasOwnProperty('value') || typeof flow.value !== 'number' || isNaN(flow.value)) {
      throw new Error(`Flow at index ${index} missing valid value property`);
    }

    if (flow.value <= 0) {
      throw new Error(`Flow at index ${index} has invalid value: ${flow.value} (must be positive)`);
    }
  });

  // Extract nodes and generate links
  const nodes = extractNodes(flows);
  const links = generateLinks(flows);

  return {
    nodes,
    links
  };
}

/**
 * Validate that flow data can be transformed to Sankey format
 * @param flows Array of flow data
 * @returns Validation result with any transformation-specific errors
 */
export function validateSankeyTransformation(flows: FlowData[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!flows || flows.length === 0) {
    return { isValid: true, errors, warnings };
  }

  // Check for self-loops (source === target)
  const selfLoops = flows.filter(flow => flow.source === flow.target);
  if (selfLoops.length > 0) {
    warnings.push(`Found ${selfLoops.length} self-loop(s) which may not display well in Sankey diagrams`);
  }

  // Check for negative values
  const negativeValues = flows.filter(flow => flow.value < 0);
  if (negativeValues.length > 0) {
    errors.push(`Found ${negativeValues.length} flow(s) with negative values`);
  }

  // Check for zero values
  const zeroValues = flows.filter(flow => flow.value === 0);
  if (zeroValues.length > 0) {
    warnings.push(`Found ${zeroValues.length} flow(s) with zero values which will not be visible`);
  }

  // Performance check - warn about large datasets
  const uniqueNodes = extractNodes(flows);
  if (uniqueNodes.length > 50) {
    warnings.push(`Large dataset detected: ${uniqueNodes.length} nodes (recommended max: 50)`);
  }

  if (flows.length > 100) {
    warnings.push(`Large dataset detected: ${flows.length} connections (recommended max: 100)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get summary statistics about the transformed data
 * @param flows Array of flow data
 * @returns Summary statistics
 */
export function getSankeyDataSummary(flows: FlowData[]): {
  nodeCount: number;
  linkCount: number;
  totalValue: number;
  maxValue: number;
  minValue: number;
} {
  if (!flows || flows.length === 0) {
    return {
      nodeCount: 0,
      linkCount: 0,
      totalValue: 0,
      maxValue: 0,
      minValue: 0
    };
  }

  const nodes = extractNodes(flows);
  const values = flows.map(flow => flow.value);

  return {
    nodeCount: nodes.length,
    linkCount: flows.length,
    totalValue: values.reduce((sum, value) => sum + value, 0),
    maxValue: Math.max(...values),
    minValue: Math.min(...values)
  };
}
