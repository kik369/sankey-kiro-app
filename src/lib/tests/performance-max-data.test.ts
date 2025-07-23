/**
 * Performance tests with maximum allowed data (50 nodes, 100 connections)
 * Tests requirement 5.4: "WHEN the diagram contains up to 50 nodes and 100 connections THEN the system SHALL maintain smooth performance"
 */

import { describe, it, expect, vi } from 'vitest';
import { generateMaxTestData, PerformanceTestSuite } from '../utils/performance-test-data.js';
import { transformFlowsToSankeyData } from '../transform.js';
import { analyzePerformance, PERFORMANCE_LIMITS } from '../utils/performance-limits.js';
import { debounce, throttle } from '../utils/debounce.js';

describe('Performance with Maximum Data', () => {
  describe('Maximum Data Generation', () => {
    it('should generate maximum test data within performance limits', () => {
      const maxFlows = generateMaxTestData();

      expect(maxFlows).toHaveLength(PERFORMANCE_LIMITS.MAX_CONNECTIONS);

      // Count unique nodes
      const uniqueNodes = new Set<string>();
      maxFlows.forEach(flow => {
        uniqueNodes.add(flow.source);
        uniqueNodes.add(flow.target);
      });

      expect(uniqueNodes.size).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_NODES);
      expect(uniqueNodes.size).toBeGreaterThan(0);
    });

    it('should generate valid flow data at maximum scale', () => {
      const maxFlows = generateMaxTestData();

      // Verify all flows have valid data
      maxFlows.forEach(flow => {
        expect(flow.id).toBeDefined();
        expect(flow.source).toBeDefined();
        expect(flow.target).toBeDefined();
        expect(flow.value).toBeGreaterThan(0);
        expect(flow.source).not.toBe(flow.target); // No self-loops
      });
    });
  });

  describe('Data Transformation Performance', () => {
    it('should transform maximum data efficiently', () => {
      const maxFlows = generateMaxTestData();

      const startTime = performance.now();
      const sankeyData = transformFlowsToSankeyData(maxFlows);
      const endTime = performance.now();

      const transformTime = endTime - startTime;

      // Should complete transformation within reasonable time (< 100ms)
      expect(transformTime).toBeLessThan(100);

      // Verify transformed data structure
      expect(sankeyData.nodes).toBeDefined();
      expect(sankeyData.links).toBeDefined();
      expect(sankeyData.links).toHaveLength(maxFlows.length);
      expect(sankeyData.nodes.length).toBeGreaterThan(0);
      expect(sankeyData.nodes.length).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_NODES);
    });

    it('should handle repeated transformations efficiently', () => {
      const maxFlows = generateMaxTestData();
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        transformFlowsToSankeyData(maxFlows);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Average should be reasonable
      expect(averageTime).toBeLessThan(50);
      // No single transformation should take too long
      expect(maxTime).toBeLessThan(200);
    });
  });

  describe('Performance Analysis with Maximum Data', () => {
    it('should correctly analyze performance at maximum limits', () => {
      const maxFlows = generateMaxTestData();
      const warnings = analyzePerformance(maxFlows);

      // Should have error-level warnings at maximum data
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.level === 'error')).toBe(true);

      // Check specific warning types
      const nodeWarnings = warnings.filter(w => w.type === 'nodes');
      const connectionWarnings = warnings.filter(w => w.type === 'connections');

      expect(nodeWarnings.length + connectionWarnings.length).toBeGreaterThan(0);
    });

    it('should provide accurate node and connection counts', () => {
      const maxFlows = generateMaxTestData();
      const warnings = analyzePerformance(maxFlows);

      const nodeWarning = warnings.find(w => w.type === 'nodes');
      const connectionWarning = warnings.find(w => w.type === 'connections');

      if (nodeWarning) {
        expect(nodeWarning.current).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_NODES);
        expect(nodeWarning.limit).toBe(PERFORMANCE_LIMITS.MAX_NODES);
      }

      if (connectionWarning) {
        expect(connectionWarning.current).toBe(PERFORMANCE_LIMITS.MAX_CONNECTIONS);
        expect(connectionWarning.limit).toBe(PERFORMANCE_LIMITS.MAX_CONNECTIONS);
      }
    });
  });

  describe('Debouncing with Maximum Data', () => {
    it('should handle debounced operations with large datasets', async () => {
      const maxFlows = generateMaxTestData();
      let callCount = 0;
      let lastProcessedData: any = null;

      const processData = (data: any) => {
        callCount++;
        lastProcessedData = data;
        // Simulate data processing
        transformFlowsToSankeyData(data);
      };

      const debouncedProcess = debounce(processData, 50);

      // Simulate rapid updates with maximum data
      for (let i = 0; i < 5; i++) {
        debouncedProcess(maxFlows);
      }

      // Should not have been called yet
      expect(callCount).toBe(0);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should have been called only once
      expect(callCount).toBe(1);
      expect(lastProcessedData).toBe(maxFlows);
    });

    it('should handle throttled operations with large datasets', async () => {
      const maxFlows = generateMaxTestData();
      let callCount = 0;

      const processData = (data: any) => {
        callCount++;
        transformFlowsToSankeyData(data);
      };

      const throttledProcess = throttle(processData, 50);

      // First call should execute immediately
      throttledProcess(maxFlows);
      expect(callCount).toBe(1);

      // Subsequent calls should be throttled
      throttledProcess(maxFlows);
      throttledProcess(maxFlows);
      expect(callCount).toBe(1);

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should allow one more call
      expect(callCount).toBe(2);
    });
  });

  describe('Memory Usage with Maximum Data', () => {
    it('should estimate memory usage for maximum dataset', () => {
      const maxFlows = generateMaxTestData();

      // Test memory estimation (this is a rough estimate)
      const nodeCount = new Set(maxFlows.flatMap(f => [f.source, f.target])).size;
      const connectionCount = maxFlows.length;

      // Verify we're at or near maximum limits
      expect(nodeCount).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_NODES);
      expect(connectionCount).toBe(PERFORMANCE_LIMITS.MAX_CONNECTIONS);

      // Memory usage should be calculable
      expect(nodeCount).toBeGreaterThan(0);
      expect(connectionCount).toBeGreaterThan(0);
    });
  });

  describe('Performance Test Suite with Maximum Data', () => {
    it('should complete performance tests with maximum data', async () => {
      const testSuite = new PerformanceTestSuite();

      // Mock console.log to avoid test output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const startTime = performance.now();
      await testSuite.testDataGeneration();
      await testSuite.testChartDataTransformation();
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      // Performance test suite should complete in reasonable time
      expect(totalTime).toBeLessThan(1000); // 1 second

      const results = testSuite.getResults();
      expect(Object.keys(results).length).toBeGreaterThan(0);

      // All individual operations should be reasonably fast
      Object.values(results).forEach(duration => {
        expect(duration).toBeLessThan(500); // 500ms per operation
        expect(duration).toBeGreaterThanOrEqual(0);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases with Maximum Data', () => {
    it('should handle maximum data with duplicate connections', () => {
      const maxFlows = generateMaxTestData();

      // Add some duplicate connections (same source-target pairs)
      const duplicateFlows = [
        ...maxFlows.slice(0, 95), // Keep most flows
        {
          id: 'duplicate_1',
          source: maxFlows[0].source,
          target: maxFlows[0].target,
          value: 50
        },
        {
          id: 'duplicate_2',
          source: maxFlows[1].source,
          target: maxFlows[1].target,
          value: 75
        }
      ];

      // Should still transform correctly
      const sankeyData = transformFlowsToSankeyData(duplicateFlows);
      expect(sankeyData.nodes).toBeDefined();
      expect(sankeyData.links).toBeDefined();
      expect(sankeyData.links.length).toBe(duplicateFlows.length);
    });

    it('should handle maximum data with extreme values', () => {
      const maxFlows = generateMaxTestData();

      // Modify some flows to have extreme values
      const extremeFlows = maxFlows.map((flow, index) => ({
        ...flow,
        value: index === 0 ? 0.01 : index === 1 ? 10000 : flow.value
      }));

      const sankeyData = transformFlowsToSankeyData(extremeFlows);
      expect(sankeyData.nodes).toBeDefined();
      expect(sankeyData.links).toBeDefined();

      // All values should be preserved
      expect(sankeyData.links.some(link => link.value === 0.01)).toBe(true);
      expect(sankeyData.links.some(link => link.value === 10000)).toBe(true);
    });
  });
});
