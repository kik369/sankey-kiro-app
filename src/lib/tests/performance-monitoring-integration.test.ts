/**
 * Integration tests for performance monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor, performanceMonitor, measurePerformance } from '../utils/performance-monitor.js';
import { generateTestData, generateMaxTestData } from '../utils/performance-test-data.js';
import { transformFlowsToSankeyData } from '../transform.js';

describe('Performance Monitoring Integration', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('PerformanceMonitor', () => {
    it('should record performance metrics correctly', () => {
      const flows = generateTestData(10, 20);
      const metric = monitor.recordMetric(flows, 50, 100);

      expect(metric.nodeCount).toBe(10);
      expect(metric.connectionCount).toBe(20);
      expect(metric.transformTime).toBe(50);
      expect(metric.renderTime).toBe(100);
      expect(metric.memoryUsage).toBeGreaterThan(0);
      expect(metric.timestamp).toBeGreaterThan(0);
    });

    it('should track performance status correctly', () => {
      const flows = generateTestData(5, 10);
      monitor.recordMetric(flows, 25, 50);

      const status = monitor.getPerformanceStatus();
      expect(status.current).toBeDefined();
      expect(status.current!.nodeCount).toBe(5);
      expect(status.current!.connectionCount).toBe(10);
      expect(status.isHealthy).toBe(true);
      expect(status.warnings).toHaveLength(0);
    });

    it('should detect performance issues with large datasets', () => {
      const flows = generateMaxTestData();
      monitor.recordMetric(flows, 150, 300); // Slow times

      const status = monitor.getPerformanceStatus();
      expect(status.isHealthy).toBe(false);
      expect(status.warnings.length).toBeGreaterThan(0);
    });

    it('should calculate performance trends', () => {
      const flows = generateTestData(10, 20);

      // Record improving performance
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric(flows, 100 - i * 5, 200 - i * 10);
      }

      const trends = monitor.getPerformanceTrends();
      expect(trends.transformTimetrend).toBe('improving');
      expect(trends.renderTimetrend).toBe('improving');
    });

    it('should limit metrics history', () => {
      const flows = generateTestData(5, 10);

      // Record more than max history
      for (let i = 0; i < 150; i++) {
        monitor.recordMetric(flows, 50, 100);
      }

      const metrics = monitor.getRawMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });

    it('should clear history correctly', () => {
      const flows = generateTestData(5, 10);
      monitor.recordMetric(flows, 50, 100);

      expect(monitor.getRawMetrics().length).toBe(1);

      monitor.clearHistory();
      expect(monitor.getRawMetrics().length).toBe(0);

      const status = monitor.getPerformanceStatus();
      expect(status.current).toBeNull();
    });
  });

  describe('Performance Measurement Utilities', () => {
    it('should measure function performance', () => {
      const flows = generateTestData(10, 20);

      const result = measurePerformance(() => {
        return transformFlowsToSankeyData(flows);
      }, flows, 'Test Transform');

      expect(result.nodes).toBeDefined();
      expect(result.links).toBeDefined();

      // Check that performance was recorded
      const status = performanceMonitor.getPerformanceStatus();
      expect(status.current).toBeDefined();
    });

    it('should handle performance measurement errors gracefully', () => {
      const flows = generateTestData(5, 10);

      expect(() => {
        measurePerformance(() => {
          throw new Error('Test error');
        }, flows, 'Error Test');
      }).toThrow('Test error');

      // Performance should still be recorded even if function throws
      const status = performanceMonitor.getPerformanceStatus();
      expect(status.current).toBeDefined();
    });
  });

  describe('Performance Thresholds', () => {
    it('should use custom thresholds', () => {
      const customMonitor = new PerformanceMonitor({
        maxTransformTime: 10,
        maxRenderTime: 20,
        maxMemoryUsage: 1,
        maxUpdateFrequency: 2
      });

      const flows = generateTestData(5, 10);
      customMonitor.recordMetric(flows, 15, 25); // Above thresholds

      const status = customMonitor.getPerformanceStatus();
      expect(status.isHealthy).toBe(false);
      expect(status.warnings.length).toBeGreaterThan(0);
    });

    it('should detect high update frequency', async () => {
      const flows = generateTestData(5, 10);

      // Simulate rapid updates
      for (let i = 0; i < 15; i++) {
        monitor.recordMetric(flows, 10, 20);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const status = monitor.getPerformanceStatus();
      expect(status.warnings.some(w => w.includes('update frequency'))).toBe(true);
    });
  });

  describe('Memory Usage Estimation', () => {
    it('should estimate memory usage for different dataset sizes', () => {
      const smallFlows = generateTestData(5, 10);
      const largeFlows = generateTestData(40, 80);

      const smallMetric = monitor.recordMetric(smallFlows, 10, 20);
      const largeMetric = monitor.recordMetric(largeFlows, 50, 100);

      expect(largeMetric.memoryUsage).toBeGreaterThan(smallMetric.memoryUsage);
      expect(smallMetric.memoryUsage).toBeGreaterThan(0);
      expect(largeMetric.memoryUsage).toBeGreaterThan(0);
    });

    it('should handle empty datasets', () => {
      const emptyFlows: any[] = [];
      const metric = monitor.recordMetric(emptyFlows, 5, 10);

      expect(metric.nodeCount).toBe(0);
      expect(metric.connectionCount).toBe(0);
      expect(metric.memoryUsage).toBeGreaterThan(0); // Should have some base memory
    });
  });

  describe('Performance Warnings', () => {
    it('should generate appropriate warnings for node limits', () => {
      const flows = generateTestData(50, 50); // At node limit
      monitor.recordMetric(flows, 50, 100);

      const status = monitor.getPerformanceStatus();
      expect(status.warnings.some(w => w.includes('node limit') || w.includes('Approaching node limit'))).toBe(true);
    });

    it('should generate appropriate warnings for connection limits', () => {
      const flows = generateTestData(30, 85); // Near connection limit
      monitor.recordMetric(flows, 50, 100);

      const status = monitor.getPerformanceStatus();
      expect(status.warnings.some(w => w.includes('connection limit'))).toBe(true);
    });

    it('should prioritize error-level warnings', () => {
      const flows = generateMaxTestData();
      monitor.recordMetric(flows, 200, 400); // Slow performance + max data

      const status = monitor.getPerformanceStatus();
      expect(status.isHealthy).toBe(false);
      expect(status.warnings.length).toBeGreaterThan(0);
    });
  });
});
