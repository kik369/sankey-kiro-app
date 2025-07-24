/**
 * Performance optimization utilities for the Sankey diagram app
 * Implements advanced performance monitoring and optimization techniques
 */

import type { FlowData, SankeyChartData } from '$lib/types';
import { PERFORMANCE_LIMITS } from './performance-limits';
import { debounce, throttle } from './debounce';

export interface PerformanceProfile {
  renderTime: number;
  transformTime: number;
  memoryUsage: number;
  frameRate: number;
  isOptimal: boolean;
}

export interface OptimizationStrategy {
  enableDataVirtualization: boolean;
  enableChartCaching: boolean;
  enableProgressiveRendering: boolean;
  enableMemoryOptimization: boolean;
  debounceDelay: number;
  throttleDelay: number;
}

/**
 * Advanced performance optimizer for the Sankey diagram
 */
export class PerformanceOptimizer {
  private strategy: OptimizationStrategy;
  private chartCache = new Map<string, any>();
  private renderQueue: (() => void)[] = [];
  private isProcessingQueue = false;
  private frameRateMonitor: FrameRateMonitor;
  private memoryMonitor: MemoryMonitor;

  constructor(strategy: Partial<OptimizationStrategy> = {}) {
    const defaultStrategy: OptimizationStrategy = {
      enableDataVirtualization: true,
      enableChartCaching: true,
      enableProgressiveRendering: true,
      enableMemoryOptimization: true,
      debounceDelay: PERFORMANCE_LIMITS.DEBOUNCE_DELAY,
      throttleDelay: PERFORMANCE_LIMITS.CHART_UPDATE_DELAY,
    };

    this.strategy = { ...defaultStrategy, ...strategy };

    this.frameRateMonitor = new FrameRateMonitor();
    this.memoryMonitor = new MemoryMonitor();
  }

  /**
   * Optimizes data transformation based on current performance
   */
  public optimizeDataTransformation(flows: FlowData[]): SankeyChartData {
    const startTime = performance.now();

    let optimizedFlows = flows;

    // Apply data virtualization if enabled and needed
    if (this.strategy.enableDataVirtualization && flows.length > PERFORMANCE_LIMITS.WARNING_CONNECTIONS) {
      optimizedFlows = this.virtualizeData(flows);
    }

    // Apply memory optimization
    if (this.strategy.enableMemoryOptimization) {
      optimizedFlows = this.optimizeMemoryUsage(optimizedFlows);
    }

    // Transform data
    const result = this.transformFlowsToSankeyData(optimizedFlows);

    const endTime = performance.now();
    const transformTime = endTime - startTime;

    // Log performance metrics
    if (import.meta.env.DEV) {
      console.log(`Data transformation took ${transformTime.toFixed(2)}ms for ${flows.length} flows`);
    }

    return result;
  }

  /**
   * Optimizes chart rendering with caching and progressive loading
   */
  public async optimizeChartRendering(
    chartInstance: any,
    data: SankeyChartData,
    theme: string
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(data, theme);

    // Check cache first
    if (this.strategy.enableChartCaching && this.chartCache.has(cacheKey)) {
      const cachedOption = this.chartCache.get(cacheKey);
      chartInstance.setOption(cachedOption, false, true); // Use merge mode for performance
      return;
    }

    // Progressive rendering for large datasets
    if (this.strategy.enableProgressiveRendering && data.links.length > 50) {
      await this.progressiveRender(chartInstance, data, theme);
    } else {
      await this.standardRender(chartInstance, data, theme);
    }

    // Cache the result
    if (this.strategy.enableChartCaching) {
      const option = chartInstance.getOption();
      this.chartCache.set(cacheKey, option);
    }
  }

  /**
   * Virtualizes data for large datasets
   */
  private virtualizeData(flows: FlowData[]): FlowData[] {
    // Sort by value and take top connections
    const sortedFlows = [...flows].sort((a, b) => b.value - a.value);
    const virtualizedFlows = sortedFlows.slice(0, PERFORMANCE_LIMITS.MAX_CONNECTIONS);

    // Group smaller flows if needed
    const remainingFlows = sortedFlows.slice(PERFORMANCE_LIMITS.MAX_CONNECTIONS);
    if (remainingFlows.length > 0) {
      const groupedValue = remainingFlows.reduce((sum, flow) => sum + flow.value, 0);
      virtualizedFlows.push({
        id: 'virtualized-others',
        source: 'Other Sources',
        target: 'Other Targets',
        value: groupedValue
      });
    }

    return virtualizedFlows;
  }

  /**
   * Optimizes memory usage by cleaning up unnecessary data
   */
  private optimizeMemoryUsage(flows: FlowData[]): FlowData[] {
    // Remove duplicate flows and merge values
    const flowMap = new Map<string, FlowData>();

    flows.forEach(flow => {
      const key = `${flow.source}->${flow.target}`;
      if (flowMap.has(key)) {
        const existing = flowMap.get(key)!;
        existing.value += flow.value;
      } else {
        flowMap.set(key, { ...flow });
      }
    });

    return Array.from(flowMap.values());
  }

  /**
   * Progressive rendering for large datasets
   */
  private async progressiveRender(chartInstance: any, data: SankeyChartData, theme: string): Promise<void> {
    const batchSize = 20;
    const batches = this.createBatches(data.links, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batchData = {
        nodes: data.nodes,
        links: batches.slice(0, i + 1).flat()
      };

      const option = this.createChartOption(batchData, theme);
      chartInstance.setOption(option, i === 0); // Clear on first batch only

      // Allow UI to update between batches
      await this.nextFrame();
    }
  }

  /**
   * Standard rendering for normal datasets
   */
  private async standardRender(chartInstance: any, data: SankeyChartData, theme: string): Promise<void> {
    const option = this.createChartOption(data, theme);
    chartInstance.setOption(option);
  }

  /**
   * Creates chart option with theme support
   */
  private createChartOption(data: SankeyChartData, theme: string) {
    const isDark = theme === 'dark';

    return {
      backgroundColor: 'transparent',
      animation: !this.memoryMonitor.isLowMemory(),
      animationDuration: this.frameRateMonitor.getOptimalAnimationDuration(),
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `${params.data.source} → ${params.data.target}: ${params.data.value}`;
          }
          return params.name;
        },
      },
      series: [
        {
          type: 'sankey',
          data: data.nodes,
          links: data.links,
          emphasis: {
            focus: 'adjacency',
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
          },
          label: {
            color: isDark ? '#fff' : '#000',
          },
        },
      ],
    };
  }

  /**
   * Transforms flows to Sankey data format
   */
  private transformFlowsToSankeyData(flows: FlowData[]): SankeyChartData {
    const nodeSet = new Set<string>();
    flows.forEach(flow => {
      nodeSet.add(flow.source);
      nodeSet.add(flow.target);
    });

    const nodes = Array.from(nodeSet).map(name => ({ name }));
    const links = flows.map(flow => ({
      source: flow.source,
      target: flow.target,
      value: flow.value
    }));

    return { nodes, links };
  }

  /**
   * Creates batches for progressive rendering
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Generates cache key for chart options
   */
  private generateCacheKey(data: SankeyChartData, theme: string): string {
    const dataHash = this.hashData(data);
    return `${dataHash}-${theme}`;
  }

  /**
   * Simple hash function for data
   */
  private hashData(data: SankeyChartData): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Waits for next animation frame
   */
  private nextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  /**
   * Gets current performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      renderTime: this.frameRateMonitor.getAverageFrameTime(),
      transformTime: 0, // Would be measured during transformation
      memoryUsage: this.memoryMonitor.getCurrentUsage(),
      frameRate: this.frameRateMonitor.getCurrentFPS(),
      isOptimal: this.frameRateMonitor.getCurrentFPS() > 30 && !this.memoryMonitor.isLowMemory()
    };
  }

  /**
   * Clears all caches
   */
  public clearCache(): void {
    this.chartCache.clear();
  }

  /**
   * Destroys the optimizer and cleans up resources
   */
  public destroy(): void {
    this.clearCache();
    this.frameRateMonitor.destroy();
    this.memoryMonitor.destroy();
  }
}

/**
 * Frame rate monitor for performance tracking
 */
class FrameRateMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private animationId: number | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Only start monitoring if requestAnimationFrame is available
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }

    const measureFrame = (currentTime: number) => {
      if (this.lastFrameTime > 0) {
        const frameTime = currentTime - this.lastFrameTime;
        this.frameTimes.push(frameTime);

        // Keep only recent measurements
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift();
        }
      }

      this.lastFrameTime = currentTime;
      this.animationId = requestAnimationFrame(measureFrame);
    };

    this.animationId = requestAnimationFrame(measureFrame);
  }

  public getCurrentFPS(): number {
    if (this.frameTimes.length === 0) return 60;

    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / averageFrameTime);
  }

  public getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 16.67; // 60 FPS

    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  public getOptimalAnimationDuration(): number {
    const fps = this.getCurrentFPS();

    if (fps < 30) return 0; // Disable animations for low FPS
    if (fps < 45) return 200; // Shorter animations
    return 400; // Normal animations
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

/**
 * Memory monitor for tracking memory usage
 */
class MemoryMonitor {
  private memoryCheckInterval: number | null = null;
  private currentUsage = 0;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Only start monitoring if setInterval is available
    if (typeof window !== 'undefined' && window.setInterval) {
      this.memoryCheckInterval = window.setInterval(() => {
        this.updateMemoryUsage();
      }, 5000); // Check every 5 seconds
    }
  }

  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.currentUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
  }

  public getCurrentUsage(): number {
    return this.currentUsage;
  }

  public isLowMemory(): boolean {
    return this.currentUsage > 100; // More than 100MB
  }

  public destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

/**
 * Global performance optimizer instance
 */
export const performanceOptimizer = new PerformanceOptimizer({});
