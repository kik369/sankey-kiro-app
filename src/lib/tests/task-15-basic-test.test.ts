/**
 * Basic test for Task 15 functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceOptimizer } from '$lib/utils/performance-optimizer';
import { generateChartDescription } from '$lib/utils/accessibility';
import type { FlowData } from '$lib/types';

// Mock DOM APIs
beforeEach(() => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
        writable: true,
        value: {
            matchMedia: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
            setInterval: vi.fn(),
            clearInterval: vi.fn(),
        }
    });

    Object.defineProperty(globalThis, 'performance', {
        writable: true,
        value: {
            now: vi.fn(() => Date.now()),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,
                totalJSHeapSize: 100 * 1024 * 1024,
            }
        }
    });

    Object.defineProperty(globalThis, 'requestAnimationFrame', {
        writable: true,
        value: vi.fn(cb => {
            setTimeout(cb, 16);
            return 1;
        })
    });

    Object.defineProperty(globalThis, 'document', {
        writable: true,
        value: {
            createElement: vi.fn(() => ({
                setAttribute: vi.fn(),
                style: {},
                appendChild: vi.fn(),
                removeChild: vi.fn(),
                parentNode: null,
            })),
            body: {
                appendChild: vi.fn(),
                removeChild: vi.fn(),
            }
        }
    });
});

describe('Task 15: Basic Optimization Tests', () => {
    describe('Performance Optimization', () => {
        it('should optimize data transformation', () => {
            const testFlows: FlowData[] = [
                { id: '1', source: 'A', target: 'B', value: 10 },
                { id: '2', source: 'B', target: 'C', value: 15 }
            ];

            const result = performanceOptimizer.optimizeDataTransformation(testFlows);

            expect(result).toHaveProperty('nodes');
            expect(result).toHaveProperty('links');
            expect(result.nodes.length).toBe(3); // A, B, C
            expect(result.links.length).toBe(2);
        });

        it('should provide performance profile', () => {
            const profile = performanceOptimizer.getPerformanceProfile();

            expect(profile).toHaveProperty('renderTime');
            expect(profile).toHaveProperty('transformTime');
            expect(profile).toHaveProperty('memoryUsage');
            expect(profile).toHaveProperty('frameRate');
            expect(profile).toHaveProperty('isOptimal');
        });

        it('should handle empty data', () => {
            const result = performanceOptimizer.optimizeDataTransformation([]);

            expect(result.nodes).toEqual([]);
            expect(result.links).toEqual([]);
        });
    });

    describe('Accessibility Features', () => {
        it('should generate chart descriptions', () => {
            const flows: FlowData[] = [
                { id: '1', source: 'A', target: 'B', value: 10 },
                { id: '2', source: 'B', target: 'C', value: 15 }
            ];

            const description = generateChartDescription(3, 2, flows);

            expect(description).toContain('3 nodes');
            expect(description).toContain('2 connections');
            expect(description).toContain('Total flow value: 25.00');
        });

        it('should handle empty chart descriptions', () => {
            const description = generateChartDescription(0, 0, []);
            expect(description).toBe('Empty Sankey diagram. No data flows to display.');
        });
    });

    describe('Memory Management', () => {
        it('should clean up resources', () => {
            expect(() => performanceOptimizer.clearCache()).not.toThrow();
            expect(() => performanceOptimizer.destroy()).not.toThrow();
        });
    });
});
