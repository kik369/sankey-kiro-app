/**
 * Performance limits and warnings for the Sankey diagram app
 */

import type { FlowData } from '$lib/types.js';

// Performance limits as per requirements
export const PERFORMANCE_LIMITS = {
  MAX_NODES: 50,
  MAX_CONNECTIONS: 100,
  WARNING_NODES: 40,
  WARNING_CONNECTIONS: 80,
  DEBOUNCE_DELAY: 150, // milliseconds
  CHART_UPDATE_DELAY: 100, // milliseconds
} as const;

export interface PerformanceWarning {
  type: 'nodes' | 'connections' | 'performance';
  level: 'warning' | 'error';
  message: string;
  current: number;
  limit: number;
}

/**
 * Analyzes flow data and returns performance warnings
 */
export function analyzePerformance(flows: FlowData[]): PerformanceWarning[] {
  const warnings: PerformanceWarning[] = [];

  // Count unique nodes
  const uniqueNodes = new Set<string>();
  flows.forEach(flow => {
    uniqueNodes.add(flow.source);
    uniqueNodes.add(flow.target);
  });

  const nodeCount = uniqueNodes.size;
  const connectionCount = flows.length;

  // Check node limits
  if (nodeCount >= PERFORMANCE_LIMITS.MAX_NODES) {
    warnings.push({
      type: 'nodes',
      level: 'error',
      message: `Maximum node limit reached (${nodeCount}/${PERFORMANCE_LIMITS.MAX_NODES}). Performance may be severely impacted.`,
      current: nodeCount,
      limit: PERFORMANCE_LIMITS.MAX_NODES
    });
  } else if (nodeCount >= PERFORMANCE_LIMITS.WARNING_NODES) {
    warnings.push({
      type: 'nodes',
      level: 'warning',
      message: `Approaching node limit (${nodeCount}/${PERFORMANCE_LIMITS.MAX_NODES}). Consider reducing data complexity.`,
      current: nodeCount,
      limit: PERFORMANCE_LIMITS.MAX_NODES
    });
  }

  // Check connection limits
  if (connectionCount >= PERFORMANCE_LIMITS.MAX_CONNECTIONS) {
    warnings.push({
      type: 'connections',
      level: 'error',
      message: `Maximum connection limit reached (${connectionCount}/${PERFORMANCE_LIMITS.MAX_CONNECTIONS}). Performance may be severely impacted.`,
      current: connectionCount,
      limit: PERFORMANCE_LIMITS.MAX_CONNECTIONS
    });
  } else if (connectionCount >= PERFORMANCE_LIMITS.WARNING_CONNECTIONS) {
    warnings.push({
      type: 'connections',
      level: 'warning',
      message: `Approaching connection limit (${connectionCount}/${PERFORMANCE_LIMITS.MAX_CONNECTIONS}). Consider reducing data complexity.`,
      current: connectionCount,
      limit: PERFORMANCE_LIMITS.MAX_CONNECTIONS
    });
  }

  // General performance warning for complex datasets
  if (nodeCount > 30 && connectionCount > 60) {
    warnings.push({
      type: 'performance',
      level: 'warning',
      message: `Large dataset detected (${nodeCount} nodes, ${connectionCount} connections). Updates may be slower.`,
      current: nodeCount + connectionCount,
      limit: PERFORMANCE_LIMITS.MAX_NODES + PERFORMANCE_LIMITS.MAX_CONNECTIONS
    });
  }

  return warnings;
}

/**
 * Checks if adding a new flow would exceed performance limits
 */
export function canAddFlow(currentFlows: FlowData[], newFlow: { source: string; target: string }): {
  canAdd: boolean;
  warnings: PerformanceWarning[];
} {
  // Create a temporary flow array to test limits
  const testFlow: FlowData = {
    id: 'temp',
    source: newFlow.source,
    target: newFlow.target,
    value: 1
  };

  const testFlows = [...currentFlows, testFlow];
  const warnings = analyzePerformance(testFlows);

  // Check if any error-level warnings would be triggered
  const hasErrors = warnings.some(w => w.level === 'error');

  return {
    canAdd: !hasErrors,
    warnings: warnings.filter(w => w.level === 'error') // Only return blocking errors
  };
}

/**
 * Estimates memory usage for the current dataset
 */
export function estimateMemoryUsage(flows: FlowData[]): {
  estimatedMB: number;
  level: 'low' | 'medium' | 'high';
} {
  const uniqueNodes = new Set<string>();
  flows.forEach(flow => {
    uniqueNodes.add(flow.source);
    uniqueNodes.add(flow.target);
  });

  // Rough estimation based on data structures and ECharts overhead
  const nodeMemory = uniqueNodes.size * 0.5; // KB per node
  const linkMemory = flows.length * 0.3; // KB per link
  const chartMemory = Math.max(uniqueNodes.size * flows.length * 0.1, 100); // Chart rendering overhead

  const totalKB = nodeMemory + linkMemory + chartMemory;
  const estimatedMB = totalKB / 1024;

  let level: 'low' | 'medium' | 'high';
  if (estimatedMB < 5) {
    level = 'low';
  } else if (estimatedMB < 15) {
    level = 'medium';
  } else {
    level = 'high';
  }

  return { estimatedMB, level };
}

/**
 * Provides performance optimization suggestions based on current data
 */
export function getOptimizationSuggestions(flows: FlowData[]): string[] {
  const suggestions: string[] = [];
  const warnings = analyzePerformance(flows);
  const memory = estimateMemoryUsage(flows);

  if (warnings.some(w => w.type === 'nodes' && w.level === 'warning')) {
    suggestions.push('Consider consolidating similar nodes to reduce complexity');
  }

  if (warnings.some(w => w.type === 'connections' && w.level === 'warning')) {
    suggestions.push('Try grouping small-value connections or filtering out minimal flows');
  }

  if (memory.level === 'high') {
    suggestions.push('Large dataset detected - consider data pagination or filtering');
  }

  if (flows.length > 50) {
    suggestions.push('Enable data virtualization for better scroll performance');
  }

  return suggestions;
}
