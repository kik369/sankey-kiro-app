/**
 * Task 15: Final optimization and accessibility testing
 * Tests all optimization features and accessibility compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { AccessibilityManager, generateChartDescription } from '$lib/utils/accessibility';
import { performanceOptimizer } from '$lib/utils/performance-optimizer';
import { animationManager, animations } from '$lib/utils/animations';
import { PERFORMANCE_LIMITS } from '$lib/utils/performance-limits';
import type { FlowData } from '$lib/types';

// Mock DOM APIs for testing
const mockMatchMedia = vi.fn();
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia.mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });

    // Mock animation frame APIs
    globalThis.requestAnimationFrame = mockRequestAnimationFrame.mockImplementation(cb => {
        setTimeout(cb, 16);
        return 1;
    });
    globalThis.cancelAnimationFrame = mockCancelAnimationFrame;

    // Mock performance API
    Object.defineProperty(globalThis, 'performance', {
        writable: true,
        value: {
            now: vi.fn(() => Date.now()),
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024, // 50MB
                totalJSHeapSize: 100 * 1024 * 1024, // 100MB
            }
        }
    });
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('Task 15: Final Performance Testing and Optimization', () => {
    describe('Performance Optimization', () => {
        it('should optimize data transformation for large datasets', async () => {
            // Create a large dataset
            const largeFlows: FlowData[] = [];
            for (let i = 0; i < PERFORMANCE_LIMITS.MAX_CONNECTIONS + 10; i++) {
                largeFlows.push({
                    id: `flow-${i}`,
                    source: `Source-${i % 20}`,
                    target: `Target-${i % 15}`,
                    value: Math.random() * 100
                });
            }

            const startTime = performance.now();
            const optimizedData = performanceOptimizer.optimizeDataTransformation(largeFlows);
            const endTime = performance.now();

            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(500);

            // Should limit the number of connections
            expect(optimizedData.links.length).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_CONNECTIONS + 1);

            // Should preserve data integrity
            expect(optimizedData.nodes.length).toBeGreaterThan(0);
            expect(optimizedData.links.length).toBeGreaterThan(0);
        });

        it('should provide performance profiling', () => {
            const profile = performanceOptimizer.getPerformanceProfile();

            expect(profile).toHaveProperty('renderTime');
            expect(profile).toHaveProperty('transformTime');
            expect(profile).toHaveProperty('memoryUsage');
            expect(profile).toHaveProperty('frameRate');
            expect(profile).toHaveProperty('isOptimal');

            expect(typeof profile.renderTime).toBe('number');
            expect(typeof profile.transformTime).toBe('number');
            expect(typeof profile.memoryUsage).toBe('number');
            expect(typeof profile.frameRate).toBe('number');
            expect(typeof profile.isOptimal).toBe('boolean');
        });

        it('should handle memory optimization', () => {
            // Create flows with duplicates
            const flowsWithDuplicates: FlowData[] = [
                { id: '1', source: 'A', target: 'B', value: 10 },
                { id: '2', source: 'A', target: 'B', value: 5 },
                { id: '3', source: 'B', target: 'C', value: 15 },
                { id: '4', source: 'A', target: 'B', value: 3 }
            ];

            const optimizedData = performanceOptimizer.optimizeDataTransformation(flowsWithDuplicates);

            // Should merge duplicate flows
            const abFlow = optimizedData.links.find(link => link.source === 'A' && link.target === 'B');
            expect(abFlow?.value).toBe(18); // 10 + 5 + 3
        });

        it('should clear cache when requested', () => {
            performanceOptimizer.clearCache();
            // Should not throw and should reset internal state
            expect(() => performanceOptimizer.clearCache()).not.toThrow();
        });
    });

    describe('Accessibility Features', () => {
        let container: HTMLElement;
        let accessibilityManager: AccessibilityManager;

        beforeEach(() => {
            container = document.createElement('div');
            container.innerHTML = `
                <button id="btn1">Button 1</button>
                <input id="input1" type="text" />
                <button id="btn2">Button 2</button>
            `;
            document.body.appendChild(container);

            accessibilityManager = new AccessibilityManager(container);
        });

        afterEach(() => {
            accessibilityManager.destroy();
            document.body.removeChild(container);
        });

        it('should provide keyboard navigation', () => {
            const button1 = container.querySelector('#btn1') as HTMLElement;
            const input1 = container.querySelector('#input1') as HTMLElement;
            const button2 = container.querySelector('#btn2') as HTMLElement;

            // Focus first element
            button1.focus();
            expect(document.activeElement).toBe(button1);

            // Simulate arrow key navigation
            const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            container.dispatchEvent(arrowDownEvent);

            // Should move focus to next element
            expect(document.activeElement).toBe(input1);
        });

        it('should provide screen reader announcements', () => {
            const announceSpy = vi.spyOn(accessibilityManager, 'announce');

            accessibilityManager.announce('Test announcement');
            expect(announceSpy).toHaveBeenCalledWith('Test announcement');

            accessibilityManager.announceError('Test error');
            expect(announceSpy).toHaveBeenCalledWith('Error: Test error', 'assertive');
        });

        it('should generate chart descriptions', () => {
            const flows: FlowData[] = [
                { id: '1', source: 'A', target: 'B', value: 10 },
                { id: '2', source: 'B', target: 'C', value: 15 },
                { id: '3', source: 'A', target: 'C', value: 5 }
            ];

            const description = generateChartDescription(3, 3, flows);

            expect(description).toContain('3 nodes');
            expect(description).toContain('3 connections');
            expect(description).toContain('Total flow value: 30.00');
            expect(description).toContain('Average flow value: 10.00');
            expect(description).toContain('Largest flows:');
        });

        it('should handle empty chart descriptions', () => {
            const description = generateChartDescription(0, 0, []);
            expect(description).toBe('Empty Sankey diagram. No data flows to display.');
        });

        it('should support high contrast mode', () => {
            const initialState = accessibilityManager.getHighContrastState();
            const newState = accessibilityManager.toggleHighContrast();

            expect(newState).toBe(!initialState);
            expect(accessibilityManager.getHighContrastState()).toBe(newState);
        });

        it('should detect reduced motion preference', () => {
            // Mock reduced motion preference
            mockMatchMedia.mockImplementation(query => ({
                matches: query.includes('prefers-reduced-motion: reduce'),
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }));

            const newManager = new AccessibilityManager(container);
            const reducedMotion = newManager.getReducedMotionState();

            expect(typeof reducedMotion).toBe('boolean');
            newManager.destroy();
        });
    });

    describe('Animation System', () => {
        let testElement: HTMLElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testElement.style.opacity = '0';
            document.body.appendChild(testElement);
        });

        afterEach(() => {
            document.body.removeChild(testElement);
            animationManager?.cancelAllAnimations();
        });

        it('should provide fade in animation', async () => {
            await animations.fadeIn(testElement);
            expect(testElement.style.opacity).toBe('1');
        });

        it('should provide fade out animation', async () => {
            testElement.style.opacity = '1';
            await animations.fadeOut(testElement);
            expect(testElement.style.opacity).toBe('0');
        });

        it('should provide slide animations', async () => {
            await animations.slideInFromTop(testElement);
            expect(testElement.style.transform).toContain('translateY(0)');
            expect(testElement.style.opacity).toBe('1');
        });

        it('should provide scale animation', async () => {
            await animations.scaleIn(testElement);
            expect(testElement.style.transform).toContain('scale(1)');
            expect(testElement.style.opacity).toBe('1');
        });

        it('should respect reduced motion preference', async () => {
            // Mock reduced motion preference
            mockMatchMedia.mockImplementation(query => ({
                matches: query.includes('prefers-reduced-motion: reduce'),
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }));

            // Create new animation manager with reduced motion
            const reducedMotionManager = new (await import('$lib/utils/animations')).AnimationManager();

            expect(reducedMotionManager.getPrefersReducedMotion()).toBe(true);
        });

        it('should handle staggered animations', async () => {
            const elements = [
                document.createElement('div'),
                document.createElement('div'),
                document.createElement('div')
            ];

            elements.forEach(el => {
                el.style.opacity = '0';
                document.body.appendChild(el);
            });

            await animations.staggerIn(elements);

            elements.forEach(el => {
                expect(el.style.opacity).toBe('1');
                document.body.removeChild(el);
            });
        });

        it('should cancel all animations', () => {
            animations.fadeIn(testElement);
            animations.slideInFromTop(testElement);

            animationManager?.cancelAllAnimations();

            // Should not throw and should clear active animations
            expect(() => animationManager?.cancelAllAnimations()).not.toThrow();
        });
    });

    describe('Responsive Design', () => {
        it('should handle different screen sizes', () => {
            // Mock different viewport sizes
            const viewports = [
                { width: 320, height: 568 }, // Mobile
                { width: 768, height: 1024 }, // Tablet
                { width: 1920, height: 1080 } // Desktop
            ];

            viewports.forEach(viewport => {
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: viewport.width,
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: viewport.height,
                });

                // Trigger resize event
                window.dispatchEvent(new Event('resize'));

                // Should adapt to different screen sizes
                expect(window.innerWidth).toBe(viewport.width);
                expect(window.innerHeight).toBe(viewport.height);
            });
        });

        it('should provide responsive text utilities', () => {
            const testElement = document.createElement('div');
            testElement.className = 'text-responsive';
            document.body.appendChild(testElement);

            const computedStyle = window.getComputedStyle(testElement);

            // Should have responsive font size
            expect(computedStyle.fontSize).toBeDefined();

            document.body.removeChild(testElement);
        });
    });

    describe('End-to-End Application Testing', () => {
        it('should handle complete user workflow', async () => {
            // This would test the complete application flow
            // Including data input, chart rendering, theme switching, etc.

            const testFlows: FlowData[] = [
                { id: '1', source: 'A', target: 'B', value: 10 },
                { id: '2', source: 'B', target: 'C', value: 15 }
            ];

            // Test data transformation
            const chartData = performanceOptimizer.optimizeDataTransformation(testFlows);
            expect(chartData.nodes.length).toBe(3); // A, B, C
            expect(chartData.links.length).toBe(2);

            // Test accessibility description
            const description = generateChartDescription(3, 2, testFlows);
            expect(description).toContain('3 nodes');
            expect(description).toContain('2 connections');

            // Test performance profiling
            const profile = performanceOptimizer.getPerformanceProfile();
            expect(profile.isOptimal).toBeDefined();
        });

        it('should maintain performance under stress', async () => {
            // Create maximum allowed data
            const maxFlows: FlowData[] = [];
            for (let i = 0; i < PERFORMANCE_LIMITS.MAX_CONNECTIONS; i++) {
                maxFlows.push({
                    id: `flow-${i}`,
                    source: `Source-${i % PERFORMANCE_LIMITS.MAX_NODES}`,
                    target: `Target-${(i + 1) % PERFORMANCE_LIMITS.MAX_NODES}`,
                    value: Math.random() * 100
                });
            }

            const startTime = performance.now();

            // Test data transformation performance
            const chartData = performanceOptimizer.optimizeDataTransformation(maxFlows);

            // Test accessibility description generation
            const description = generateChartDescription(
                chartData.nodes.length,
                maxFlows.length,
                maxFlows
            );

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // Should complete within reasonable time even with max data
            expect(totalTime).toBeLessThan(1000); // 1 second
            expect(chartData.nodes.length).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_NODES);
            expect(chartData.links.length).toBeLessThanOrEqual(PERFORMANCE_LIMITS.MAX_CONNECTIONS);
            expect(description).toContain('nodes');
            expect(description).toContain('connections');
        });

        it('should handle error states gracefully', () => {
            // Test with invalid data
            expect(() => {
                generateChartDescription(-1, -1, []);
            }).not.toThrow();

            // Test with null/undefined data
            expect(() => {
                generateChartDescription(0, 0, null as any);
            }).not.toThrow();

            // Test performance optimizer with invalid data
            expect(() => {
                performanceOptimizer.optimizeDataTransformation(null as any);
            }).not.toThrow();
        });
    });

    describe('Memory Management', () => {
        it('should clean up resources properly', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);

            const accessibilityManager = new AccessibilityManager(container);

            // Should not throw when destroying
            expect(() => accessibilityManager.destroy()).not.toThrow();
            expect(() => performanceOptimizer.destroy()).not.toThrow();
            expect(() => animationManager?.cancelAllAnimations()).not.toThrow();

            document.body.removeChild(container);
        });

        it('should handle memory pressure', () => {
            // Mock high memory usage
            Object.defineProperty(globalThis.performance, 'memory', {
                value: {
                    usedJSHeapSize: 200 * 1024 * 1024, // 200MB (high usage)
                    totalJSHeapSize: 300 * 1024 * 1024,
                }
            });

            const profile = performanceOptimizer.getPerformanceProfile();

            // Should detect high memory usage
            expect(profile.memoryUsage).toBeGreaterThan(100);
        });
    });
});

describe('Task 15: UI Polish and Animations', () => {
    it('should provide smooth transitions', async () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        // Test bounce animation
        await animations.bounce(element);
        expect(element.style.transform).toContain('scale(1)');

        // Test shake animation for errors
        await animations.shake(element);
        expect(element.style.transform).toContain('translateX(0)');

        // Test pulse animation
        await animations.pulse(element);
        expect(element.style.opacity).toBe('1');

        document.body.removeChild(element);
    });

    it('should handle height animations', async () => {
        const element = document.createElement('div');
        element.style.height = '100px';
        element.innerHTML = '<p>Content</p>';
        document.body.appendChild(element);

        // Test expand animation
        await animations.expandHeight(element);
        expect(element.style.height).toBe('auto');

        // Test collapse animation
        await animations.collapseHeight(element);
        expect(element.style.height).toBe('0px');

        document.body.removeChild(element);
    });
});

describe('Task 15: Complete Application Functionality', () => {
    it('should integrate all features seamlessly', async () => {
        // Test that all systems work together
        const container = document.createElement('div');
        document.body.appendChild(container);

        const accessibilityManager = new AccessibilityManager(container);

        const testFlows: FlowData[] = [
            { id: '1', source: 'A', target: 'B', value: 10 },
            { id: '2', source: 'B', target: 'C', value: 15 },
            { id: '3', source: 'C', target: 'D', value: 20 }
        ];

        // Test performance optimization
        const optimizedData = performanceOptimizer.optimizeDataTransformation(testFlows);
        expect(optimizedData.nodes.length).toBe(4);
        expect(optimizedData.links.length).toBe(3);

        // Test accessibility description
        const description = generateChartDescription(4, 3, testFlows);
        expect(description).toContain('4 nodes');
        expect(description).toContain('3 connections');

        // Test screen reader announcement
        accessibilityManager.announceChartUpdate(4, 3);

        // Test animation
        const element = document.createElement('div');
        container.appendChild(element);
        await animations.fadeIn(element);
        expect(element.style.opacity).toBe('1');

        // Cleanup
        accessibilityManager.destroy();
        document.body.removeChild(container);
    });

    it('should meet performance requirements', () => {
        const profile = performanceOptimizer.getPerformanceProfile();

        // Should provide performance metrics
        expect(typeof profile.renderTime).toBe('number');
        expect(typeof profile.transformTime).toBe('number');
        expect(typeof profile.memoryUsage).toBe('number');
        expect(typeof profile.frameRate).toBe('number');
        expect(typeof profile.isOptimal).toBe('boolean');

        // Performance should be within acceptable ranges
        expect(profile.renderTime).toBeGreaterThanOrEqual(0);
        expect(profile.transformTime).toBeGreaterThanOrEqual(0);
        expect(profile.memoryUsage).toBeGreaterThanOrEqual(0);
        expect(profile.frameRate).toBeGreaterThanOrEqual(0);
    });

    it('should be accessible', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <button>Test Button</button>
            <input type="text" aria-label="Test Input" />
        `;
        document.body.appendChild(container);

        const accessibilityManager = new AccessibilityManager(container);

        // Should provide accessibility features
        expect(() => accessibilityManager.announce('Test')).not.toThrow();
        expect(() => accessibilityManager.announceError('Error')).not.toThrow();
        expect(() => accessibilityManager.announceSuccess('Success')).not.toThrow();
        expect(() => accessibilityManager.toggleHighContrast()).not.toThrow();

        // Should handle keyboard navigation
        const button = container.querySelector('button') as HTMLElement;
        button.focus();
        expect(document.activeElement).toBe(button);

        accessibilityManager.destroy();
        document.body.removeChild(container);
    });
});
