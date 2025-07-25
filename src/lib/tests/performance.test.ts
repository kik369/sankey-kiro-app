/**
 * Performance Tests
 * Tests for performance optimizations, debouncing, and data limits
 */

import { describe, it, expect, vi } from 'vitest';
import { debounce, throttle } from '../utils/debounce.js';
import {
  analyzePerformance,
  canAddFlow,
  estimateMemoryUsage,
  getOptimizationSuggestions,
  PERFORMANCE_LIMITS
} from '../utils/performance-limits.js';
import {
  generateTestData,
  generateMaxTestData,
  generateWarningTestData,
  generateBusinessScenarioData,
  PerformanceTestSuite
} from '../utils/performance-test-data.js';
import type { FlowData } from '../types.js';

describe('Debouncing Utilities', () => {
  it('should debounce function calls', async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 50);

    // Call multiple times rapidly
    debouncedFn('arg1');
    debouncedFn('arg2');
    debouncedFn('arg3');

    // Should not have been called yet
    expect(mockFn).not.toHaveBeenCalled();

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 60));

    // Should have been called once with the last arguments
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg3');
  });

  it('should throttle function calls', async () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 50);

    // Call immediately
    throttledFn('arg1');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1');

    // Call again immediately - should be throttled
    throttledFn('arg2');
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Wait for throttle delay
    await new Promise(resolve => setTimeout(resolve, 60));

    // Should now allow the throttled call
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('arg2');
  });
});

describe('Performance Limits', () => {
  it('should analyze performance correctly for small datasets', () => {
    const flows = generateTestData(10, 20);
    const warnings = analyzePerformance(flows);

    expect(warnings).toHaveLength(0);
  });

  it('should generate warnings for large datasets', () => {
    const flows = generateWarningTestData();
    const warnings = analyzePerformance(flows);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.level === 'warning')).toBe(true);
  });

  it('should generate errors for maximum datasets', () => {
    const flows = generateMaxTestData();
    const warnings = analyzePerformance(flows);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.level === 'error')).toBe(true);
  });

  it('should check if flows can be added', () => {
    const flows = generateTestData(45, 95); // Near limits

    const result = canAddFlow(flows, { source: 'NewSource', target: 'NewTarget' });
    expect(result.canAdd).toBe(true);

    // Test with flows at maximum
    const maxFlows = generateMaxTestData();
    const maxResult = canAddFlow(maxFlows, { source: 'NewSource', target: 'NewTarget' });
    expect(maxResult.canAdd).toBe(false);
    expect(maxResult.warnings.length).toBeGreaterThan(0);
  });

  it('should estimate memory usage correctly', () => {
    const smallFlows = generateTestData(5, 10);
    const smallMemory = estimateMemoryUsage(smallFlows);
    expect(smallMemory.level).toBe('low');

    const largeFlows = generateTestData(40, 80);
    const largeMemory = estimateMemoryUsage(largeFlows);
    expect(['low', 'medium', 'high']).toContain(largeMemory.level);
    expect(largeMemory.estimatedMB).toBeGreaterThan(0);
  });

  it('should provide optimization suggestions', () => {
    const largeFlows = generateWarningTestData();
    const suggestions = getOptimizationSuggestions(largeFlows);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.includes('nodes') || s.includes('connections'))).toBe(true);
  });
});

describe('Performance Test Data Generation', () => {
  it('should generate test data with correct node and connection counts', () => {
    const flows = generateTestData(10, 15);

    expect(flows).toHaveLength(15);

    // Count unique nodes
    const uniqueNodes = new Set<string>();
    flows.forEach(flow => {
      uniqueNodes.add(flow.source);
      uniqueNodes.add(flow.target);
    });

    expect(uniqueNodes.size).toBeLessThanOrEqual(10);
  });

  it('should generate maximum test data within limits', () => {
    const flows = generateMaxTestData();

    expect(flows).toHaveLength(PERFORMANCE_LIMITS.MAX_CONNECTIONS);

    const uniqueNodes = new Set<string>();
    flows.forEach(flow => {
      uniqueNodes.add(flow.source);
      uniqueNodes.add(flow.target);
    });

    expect(uniqueNodes.size).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_NODES);
  });

  it('should generate realistic business scenario data', () => {
    const flows = generateBusinessScenarioData();

    expect(flows.length).toBeGreaterThan(0);
    expect(flows.every(flow => flow.value > 0)).toBe(true);
    expect(flows.every(flow => flow.source !== flow.target)).toBe(true);
  });
});

describe('Performance Constants', () => {
  it('should have reasonable performance limits', () => {
    expect(PERFORMANCE_LIMITS.MAX_NODES).toBe(50);
    expect(PERFORMANCE_LIMITS.MAX_CONNECTIONS).toBe(100);
    expect(PERFORMANCE_LIMITS.WARNING_NODES).toBe(40);
    expect(PERFORMANCE_LIMITS.WARNING_CONNECTIONS).toBe(80);
    expect(PERFORMANCE_LIMITS.DEBOUNCE_DELAY).toBeGreaterThan(0);
    expect(PERFORMANCE_LIMITS.CHART_UPDATE_DELAY).toBeGreaterThan(0);
  });

  it('should have warning thresholds below maximum limits', () => {
    expect(PERFORMANCE_LIMITS.WARNING_NODES).toBeLessThan(PERFORMANCE_LIMITS.MAX_NODES);
    expect(PERFORMANCE_LIMITS.WARNING_CONNECTIONS).toBeLessThan(PERFORMANCE_LIMITS.MAX_CONNECTIONS);
  });
});

describe('Performance Edge Cases', () => {
  it('should handle empty datasets', () => {
    const warnings = analyzePerformance([]);
    expect(warnings).toHaveLength(0);

    const memory = estimateMemoryUsage([]);
    expect(memory.level).toBe('low');

    const suggestions = getOptimizationSuggestions([]);
    expect(suggestions).toHaveLength(0);
  });

  it('should handle single flow datasets', () => {
    const singleFlow: FlowData = {
      id: 'test',
      source: 'A',
      target: 'B',
      value: 10
    };

    const warnings = analyzePerformance([singleFlow]);
    expect(warnings).toHaveLength(0);

    const canAdd = canAddFlow([singleFlow], { source: 'C', target: 'D' });
    expect(canAdd.canAdd).toBe(true);
  });

  it('should handle duplicate node names correctly', () => {
    const flows: FlowData[] = [
      { id: '1', source: 'A', target: 'B', value: 10 },
      { id: '2', source: 'A', target: 'C', value: 20 },
      { id: '3', source: 'B', target: 'C', value: 15 }
    ];

    const warnings = analyzePerformance(flows);
    expect(warnings).toHaveLength(0);

    // Should count unique nodes correctly (A, B, C = 3 nodes)
    const uniqueNodes = new Set<string>();
    flows.forEach(flow => {
      uniqueNodes.add(flow.source);
      uniqueNodes.add(flow.target);
    });
    expect(uniqueNodes.size).toBe(3);
  });
});

describe('Performance Test Suite', () => {
  it('should measure operation performance', async () => {
    const testSuite = new PerformanceTestSuite();

    // Mock console.log to avoid test output
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await testSuite.testDataGeneration();

    const results = testSuite.getResults();
    expect(Object.keys(results).length).toBeGreaterThan(0);
    expect(Object.values(results).every(duration => duration >= 0)).toBe(true);

    consoleSpy.mockRestore();
  });
});
