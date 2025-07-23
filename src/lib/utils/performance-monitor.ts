/**
 * Performance monitoring utilities for real-time performance tracking
 */

import type { FlowData } from '$lib/types.js';
import { PERFORMANCE_LIMITS } from './performance-limits.js';

export interface PerformanceMetrics {
  timestamp: number;
  nodeCount: number;
  connectionCount: number;
  transformTime: number;
  renderTime: number;
  memoryUsage: number;
  updateFrequency: number;
}

export interface PerformanceThresholds {
  maxTransformTime: number;
  maxRenderTime: number;
  maxMemoryUsage: number;
  maxUpdateFrequency: number;
}

/**
 * Performance monitor class for tracking application performance
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private updateTimes: number[] = [];
  private maxMetricsHistory = 100;
  private thresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxTransformTime: 100, // ms
      maxRenderTime: 200, // ms
      maxMemoryUsage: 50, // MB
      maxUpdateFrequency: 10, // updates per second
      ...thresholds
    };
  }

  /**
   * Records a performance measurement
   */
  recordMetric(
    flows: FlowData[],
    transformTime: number,
    renderTime: number = 0
  ): PerformanceMetrics {
    const now = Date.now();

    // Calculate node count
    const uniqueNodes = new Set<string>();
    flows.forEach(flow => {
      uniqueNodes.add(flow.source);
      uniqueNodes.add(flow.target);
    });

    // Estimate memory usage (rough calculation)
    const memoryUsage = this.estimateMemoryUsage(flows);

    // Calculate update frequency
    this.updateTimes.push(now);
    this.updateTimes = this.updateTimes.filter(time => now - time < 1000); // Last second
    const updateFrequency = this.updateTimes.length;

    const metric: PerformanceMetrics = {
      timestamp: now,
      nodeCount: uniqueNodes.size,
      connectionCount: flows.length,
      transformTime,
      renderTime,
      memoryUsage,
      updateFrequency
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    return metric;
  }

  /**
   * Gets current performance status
   */
  getPerformanceStatus(): {
    current: PerformanceMetrics | null;
    average: Partial<PerformanceMetrics>;
    warnings: string[];
    isHealthy: boolean;
  } {
    if (this.metrics.length === 0) {
      return {
        current: null,
        average: {},
        warnings: [],
        isHealthy: true
      };
    }

    const current = this.metrics[this.metrics.length - 1];
    const recentMetrics = this.metrics.slice(-10); // Last 10 measurements

    // Calculate averages
    const average = {
      transformTime: this.calculateAverage(recentMetrics, 'transformTime'),
      renderTime: this.calculateAverage(recentMetrics, 'renderTime'),
      memoryUsage: this.calculateAverage(recentMetrics, 'memoryUsage'),
      updateFrequency: this.calculateAverage(recentMetrics, 'updateFrequency')
    };

    // Check for performance warnings
    const warnings: string[] = [];
    let isHealthy = true;

    if (average.transformTime > this.thresholds.maxTransformTime) {
      warnings.push(`Data transformation is slow (${average.transformTime.toFixed(1)}ms avg)`);
      isHealthy = false;
    }

    if (average.renderTime > this.thresholds.maxRenderTime) {
      warnings.push(`Chart rendering is slow (${average.renderTime.toFixed(1)}ms avg)`);
      isHealthy = false;
    }

    if (average.memoryUsage > this.thresholds.maxMemoryUsage) {
      warnings.push(`High memory usage (${average.memoryUsage.toFixed(1)}MB avg)`);
      isHealthy = false;
    }

    if (average.updateFrequency > this.thresholds.maxUpdateFrequency) {
      warnings.push(`High update frequency (${average.updateFrequency.toFixed(1)}/sec avg)`);
      isHealthy = false;
    }

    // Check data limits
    if (current.nodeCount >= PERFORMANCE_LIMITS.WARNING_NODES) {
      warnings.push(`Approaching node limit (${current.nodeCount}/${PERFORMANCE_LIMITS.MAX_NODES})`);
      if (current.nodeCount >= PERFORMANCE_LIMITS.MAX_NODES) {
        isHealthy = false;
      }
    }

    if (current.connectionCount >= PERFORMANCE_LIMITS.WARNING_CONNECTIONS) {
      warnings.push(`Approaching connection limit (${current.connectionCount}/${PERFORMANCE_LIMITS.MAX_CONNECTIONS})`);
      if (current.connectionCount >= PERFORMANCE_LIMITS.MAX_CONNECTIONS) {
        isHealthy = false;
      }
    }

    return {
      current,
      average,
      warnings,
      isHealthy
    };
  }

  /**
   * Gets performance trends over time
   */
  getPerformanceTrends(): {
    transformTimetrend: 'improving' | 'stable' | 'degrading';
    renderTimetrend: 'improving' | 'stable' | 'degrading';
    memoryTrend: 'improving' | 'stable' | 'degrading';
  } {
    if (this.metrics.length < 5) {
      return {
        transformTimetrend: 'stable',
        renderTimetrend: 'stable',
        memoryTrend: 'stable'
      };
    }

    const recent = this.metrics.slice(-5);
    const older = this.metrics.slice(-10, -5);

    if (older.length === 0) {
      return {
        transformTimetrend: 'stable',
        renderTimetrend: 'stable',
        memoryTrend: 'stable'
      };
    }

    const recentAvg = {
      transformTime: this.calculateAverage(recent, 'transformTime'),
      renderTime: this.calculateAverage(recent, 'renderTime'),
      memoryUsage: this.calculateAverage(recent, 'memoryUsage')
    };

    const olderAvg = {
      transformTime: this.calculateAverage(older, 'transformTime'),
      renderTime: this.calculateAverage(older, 'renderTime'),
      memoryUsage: this.calculateAverage(older, 'memoryUsage')
    };

    return {
      transformTimetrend: this.getTrend(recentAvg.transformTime, olderAvg.transformTime),
      renderTimetrend: this.getTrend(recentAvg.renderTime, olderAvg.renderTime),
      memoryTrend: this.getTrend(recentAvg.memoryUsage, olderAvg.memoryUsage)
    };
  }

  /**
   * Clears performance history
   */
  clearHistory(): void {
    this.metrics = [];
    this.updateTimes = [];
  }

  /**
   * Gets raw metrics for analysis
   */
  getRawMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Estimates memory usage for a dataset
   */
  private estimateMemoryUsage(flows: FlowData[]): number {
    const uniqueNodes = new Set<string>();
    flows.forEach(flow => {
      uniqueNodes.add(flow.source);
      uniqueNodes.add(flow.target);
    });

    // Rough estimation in MB
    const nodeMemory = uniqueNodes.size * 0.5 / 1024; // KB to MB
    const linkMemory = flows.length * 0.3 / 1024; // KB to MB
    const chartMemory = Math.max(uniqueNodes.size * flows.length * 0.1 / 1024, 0.1); // Chart overhead

    return nodeMemory + linkMemory + chartMemory;
  }

  /**
   * Calculates average for a specific metric
   */
  private calculateAverage(metrics: PerformanceMetrics[], key: keyof PerformanceMetrics): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric[key] as number), 0);
    return sum / metrics.length;
  }

  /**
   * Determines trend direction
   */
  private getTrend(recent: number, older: number): 'improving' | 'stable' | 'degrading' {
    const threshold = 0.1; // 10% change threshold
    const change = (recent - older) / older;

    if (change > threshold) return 'degrading';
    if (change < -threshold) return 'improving';
    return 'stable';
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Utility function to measure and record performance
 */
export function measurePerformance<T>(
  operation: () => T,
  flows: FlowData[],
  label?: string
): T {
  const startTime = performance.now();
  const result = operation();
  const endTime = performance.now();

  const duration = endTime - startTime;

  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }

  performanceMonitor.recordMetric(flows, duration);

  return result;
}

/**
 * Debounced performance measurement
 */
export function createPerformanceMeasuredFunction<T extends (...args: any[]) => any>(
  fn: T,
  getFlows: () => FlowData[],
  label?: string
): T {
  return ((...args: Parameters<T>) => {
    return measurePerformance(() => fn(...args), getFlows(), label);
  }) as T;
}
