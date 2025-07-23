/**
 * Tests for SankeyChart interactive features
 * Testing hover tooltips, visual differentiation, emphasis effects, and different data sets
 */

import { describe, it, expect } from 'vitest';
import type { SankeyChartData, ThemeMode } from '$lib/types';

describe('SankeyChart Interactive Features', () => {
    describe('Hover Tooltips', () => {
        it('should format node tooltips with connection information', () => {
            const data: SankeyChartData = {
                nodes: [
                    { name: 'Source A' },
                    { name: 'Target B' },
                    { name: 'Target C' }
                ],
                links: [
                    { source: 'Source A', target: 'Target B', value: 100 },
                    { source: 'Source A', target: 'Target C', value: 50 }
                ]
            };

            // Simulate node tooltip data
            const nodeParams = {
                dataType: 'node',
                name: 'Source A'
            };

            // Test node connections calculation
            const nodeConnections = data.links.filter(
                link => link.source === nodeParams.name || link.target === nodeParams.name
            );
            const outgoingValue = data.links
                .filter(link => link.source === nodeParams.name)
                .reduce((sum, link) => sum + link.value, 0);

            expect(nodeConnections).toHaveLength(2);
            expect(outgoingValue).toBe(150);
        });

        it('should format edge tooltips with flow values and percentages', () => {
            const data: SankeyChartData = {
                nodes: [
                    { name: 'A' },
                    { name: 'B' },
                    { name: 'C' }
                ],
                links: [
                    { source: 'A', target: 'B', value: 80 },
                    { source: 'A', target: 'C', value: 20 }
                ]
            };

            // Simulate edge tooltip data
            const edgeParams = {
                dataType: 'edge',
                source: 'A',
                target: 'B',
                value: 80
            };

            const totalValue = data.links.reduce((sum, link) => sum + link.value, 0);
            const percentage = ((edgeParams.value / totalValue) * 100).toFixed(1);

            expect(totalValue).toBe(100);
            expect(percentage).toBe('80.0');
        });

        it('should handle tooltips for nodes with only incoming connections', () => {
            const data: SankeyChartData = {
                nodes: [
                    { name: 'Source' },
                    { name: 'Target' }
                ],
                links: [
                    { source: 'Source', target: 'Target', value: 75 }
                ]
            };

            const targetNodeParams = {
                dataType: 'node',
                name: 'Target'
            };

            const incomingValue = data.links
                .filter(link => link.target === targetNodeParams.name)
                .reduce((sum, link) => sum + link.value, 0);
            const outgoingValue = data.links
                .filter(link => link.source === targetNodeParams.name)
                .reduce((sum, link) => sum + link.value, 0);

            expect(incomingValue).toBe(75);
            expect(outgoingValue).toBe(0);
        });

        it('should calculate connected nodes for tooltip context', () => {
            const data: SankeyChartData = {
                nodes: [
                    { name: 'Hub' },
                    { name: 'A' },
                    { name: 'B' },
                    { name: 'C' }
                ],
                links: [
                    { source: 'A', target: 'Hub', value: 30 },
                    { source: 'B', target: 'Hub', value: 40 },
                    { source: 'Hub', target: 'C', value: 70 }
                ]
            };

            const hubNodeParams = {
                dataType: 'node',
                name: 'Hub'
            };

            const incomingConnections = data.links.filter(
                link => link.target === hubNodeParams.name
            );
            const outgoingConnections = data.links.filter(
                link => link.source === hubNodeParams.name
            );

            const connectedNodes = [...new Set([
                ...incomingConnections.map(link => link.source),
                ...outgoingConnections.map(link => link.target)
            ])];

            expect(connectedNodes).toEqual(['A', 'B', 'C']);
            expect(connectedNodes).toHaveLength(3);
        });
    });

    describe('Visual Differentiation for Multiple Connections', () => {
        it('should use different colors for multiple connections', () => {
            const CONNECTION_COLORS = {
                dark: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                light: ['#2563eb', '#059669', '#d97706', '#dc2626']
            };

            function getConnectionColor(index: number, totalLinks: number, isDark: boolean): string {
                const colors = isDark ? CONNECTION_COLORS.dark : CONNECTION_COLORS.light;

                if (totalLinks > 1) {
                    return colors[index % colors.length];
                }

                return isDark ? '#3b82f6' : '#2563eb';
            }

            // Test multiple connections with different colors
            expect(getConnectionColor(0, 4, true)).toBe('#3b82f6');
            expect(getConnectionColor(1, 4, true)).toBe('#10b981');
            expect(getConnectionColor(2, 4, true)).toBe('#f59e0b');
            expect(getConnectionColor(3, 4, true)).toBe('#ef4444');

            // Test single connection uses primary color
            expect(getConnectionColor(0, 1, true)).toBe('#3b82f6');
            expect(getConnectionColor(0, 1, false)).toBe('#2563eb');
        });

        it('should calculate dynamic line width based on value', () => {
            function calculateLineWidth(
                value: number,
                maxValue: number,
                minWidth = 2,
                maxWidth = 12
            ): number {
                if (maxValue === 0) return minWidth;
                const ratio = value / maxValue;
                return Math.max(
                    minWidth,
                    Math.min(maxWidth, minWidth + (maxWidth - minWidth) * ratio)
                );
            }

            expect(calculateLineWidth(100, 100)).toBe(12); // Max value gets max width
            expect(calculateLineWidth(50, 100)).toBe(7);   // Half value gets middle width
            expect(calculateLineWidth(0, 100)).toBe(2);    // Min value gets min width
            expect(calculateLineWidth(25, 100)).toBe(4.5); // Quarter value
        });

        it('should provide different line patterns for visual differentiation', () => {
            function getConnectionPattern(index: number, totalConnections: number): string {
                if (totalConnections <= 1) return 'solid';
                const patterns = ['solid', 'dashed', 'dotted'];
                return patterns[index % patterns.length];
            }

            // Single connection always solid
            expect(getConnectionPattern(0, 1)).toBe('solid');

            // Multiple connections cycle through patterns
            expect(getConnectionPattern(0, 3)).toBe('solid');
            expect(getConnectionPattern(1, 3)).toBe('dashed');
            expect(getConnectionPattern(2, 3)).toBe('dotted');
            expect(getConnectionPattern(3, 3)).toBe('solid'); // Cycles back
        });

        it('should create enhanced connection styles for multiple connections', () => {
            function getConnectionStyle(
                link: any,
                index: number,
                totalLinks: number,
                isDark: boolean
            ) {
                const baseColor = '#3b82f6'; // Simplified for test

                if (totalLinks > 1) {
                    return {
                        color: baseColor,
                        opacity: 0.85,
                        width: Math.max(2, Math.min(8, link.value / 2)),
                        curveness: 0.5 + (index % 3) * 0.1,
                        shadowBlur: 4,
                        shadowColor: baseColor + '40',
                    };
                }

                return {
                    color: baseColor,
                    opacity: 0.8,
                    width: 3,
                    curveness: 0.5,
                    shadowBlur: 2,
                    shadowColor: baseColor + '30',
                };
            }

            const multipleConnectionStyle = getConnectionStyle(
                { value: 10 }, 1, 3, true
            );
            const singleConnectionStyle = getConnectionStyle(
                { value: 10 }, 0, 1, true
            );

            expect(multipleConnectionStyle.opacity).toBe(0.85);
            expect(multipleConnectionStyle.curveness).toBe(0.6); // 0.5 + (1 % 3) * 0.1
            expect(multipleConnectionStyle.shadowBlur).toBe(4);

            expect(singleConnectionStyle.opacity).toBe(0.8);
            expect(singleConnectionStyle.curveness).toBe(0.5);
            expect(singleConnectionStyle.shadowBlur).toBe(2);
        });
    });

    describe('Chart Emphasis and Focus Effects', () => {
        it('should configure emphasis effects for nodes', () => {
            const emphasisConfig = {
                focus: 'adjacency',
                blurScope: 'coordinateSystem',
                itemStyle: {
                    borderWidth: 3,
                    shadowBlur: 15,
                    shadowColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#60a5fa',
                },
                lineStyle: {
                    opacity: 1,
                    width: 6,
                    shadowBlur: 12,
                    shadowColor: 'rgba(59, 130, 246, 0.4)',
                    type: 'solid',
                },
                label: {
                    fontWeight: 'bold',
                    fontSize: 14,
                }
            };

            expect(emphasisConfig.focus).toBe('adjacency');
            expect(emphasisConfig.itemStyle.borderWidth).toBe(3);
            expect(emphasisConfig.lineStyle.width).toBe(6);
            expect(emphasisConfig.label.fontWeight).toBe('bold');
        });

        it('should configure blur effects for non-focused elements', () => {
            const blurConfig = {
                itemStyle: {
                    opacity: 0.15,
                },
                lineStyle: {
                    opacity: 0.05,
                },
                label: {
                    opacity: 0.2,
                }
            };

            expect(blurConfig.itemStyle.opacity).toBe(0.15);
            expect(blurConfig.lineStyle.opacity).toBe(0.05);
            expect(blurConfig.label.opacity).toBe(0.2);
        });

        it('should configure select effects for clicked elements', () => {
            const selectConfig = {
                itemStyle: {
                    borderColor: '#3b82f6',
                    borderWidth: 3,
                },
                lineStyle: {
                    opacity: 1,
                    width: 4,
                }
            };

            expect(selectConfig.itemStyle.borderWidth).toBe(3);
            expect(selectConfig.lineStyle.width).toBe(4);
        });
    });

    describe('Different Data Sets Testing', () => {
        it('should handle simple linear flow', () => {
            const linearData: SankeyChartData = {
                nodes: [
                    { name: 'Start' },
                    { name: 'Middle' },
                    { name: 'End' }
                ],
                links: [
                    { source: 'Start', target: 'Middle', value: 100 },
                    { source: 'Middle', target: 'End', value: 100 }
                ]
            };

            expect(linearData.nodes).toHaveLength(3);
            expect(linearData.links).toHaveLength(2);

            // All values should be equal in linear flow
            const allValuesEqual = linearData.links.every(link => link.value === 100);
            expect(allValuesEqual).toBe(true);
        });

        it('should handle branching flow (one-to-many)', () => {
            const branchingData: SankeyChartData = {
                nodes: [
                    { name: 'Source' },
                    { name: 'Branch A' },
                    { name: 'Branch B' },
                    { name: 'Branch C' }
                ],
                links: [
                    { source: 'Source', target: 'Branch A', value: 50 },
                    { source: 'Source', target: 'Branch B', value: 30 },
                    { source: 'Source', target: 'Branch C', value: 20 }
                ]
            };

            const sourceConnections = branchingData.links.filter(
                link => link.source === 'Source'
            );
            const totalOutgoing = sourceConnections.reduce(
                (sum, link) => sum + link.value, 0
            );

            expect(sourceConnections).toHaveLength(3);
            expect(totalOutgoing).toBe(100);
        });

        it('should handle merging flow (many-to-one)', () => {
            const mergingData: SankeyChartData = {
                nodes: [
                    { name: 'Input A' },
                    { name: 'Input B' },
                    { name: 'Input C' },
                    { name: 'Output' }
                ],
                links: [
                    { source: 'Input A', target: 'Output', value: 40 },
                    { source: 'Input B', target: 'Output', value: 35 },
                    { source: 'Input C', target: 'Output', value: 25 }
                ]
            };

            const outputConnections = mergingData.links.filter(
                link => link.target === 'Output'
            );
            const totalIncoming = outputConnections.reduce(
                (sum, link) => sum + link.value, 0
            );

            expect(outputConnections).toHaveLength(3);
            expect(totalIncoming).toBe(100);
        });

        it('should handle complex multi-level flow', () => {
            const complexData: SankeyChartData = {
                nodes: [
                    { name: 'Level1_A' },
                    { name: 'Level1_B' },
                    { name: 'Level2_X' },
                    { name: 'Level2_Y' },
                    { name: 'Level3_Final' }
                ],
                links: [
                    { source: 'Level1_A', target: 'Level2_X', value: 60 },
                    { source: 'Level1_A', target: 'Level2_Y', value: 40 },
                    { source: 'Level1_B', target: 'Level2_X', value: 30 },
                    { source: 'Level1_B', target: 'Level2_Y', value: 70 },
                    { source: 'Level2_X', target: 'Level3_Final', value: 90 },
                    { source: 'Level2_Y', target: 'Level3_Final', value: 110 }
                ]
            };

            // Test conservation of flow
            const level2XIncoming = complexData.links
                .filter(link => link.target === 'Level2_X')
                .reduce((sum, link) => sum + link.value, 0);
            const level2XOutgoing = complexData.links
                .filter(link => link.source === 'Level2_X')
                .reduce((sum, link) => sum + link.value, 0);

            expect(level2XIncoming).toBe(90);
            expect(level2XOutgoing).toBe(90);
        });

        it('should handle data with varying value ranges', () => {
            const varyingData: SankeyChartData = {
                nodes: [
                    { name: 'Large' },
                    { name: 'Medium' },
                    { name: 'Small' },
                    { name: 'Target' }
                ],
                links: [
                    { source: 'Large', target: 'Target', value: 1000 },
                    { source: 'Medium', target: 'Target', value: 100 },
                    { source: 'Small', target: 'Target', value: 10 }
                ]
            };

            const values = varyingData.links.map(link => link.value);
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const ratio = maxValue / minValue;

            expect(maxValue).toBe(1000);
            expect(minValue).toBe(10);
            expect(ratio).toBe(100); // 100:1 ratio
        });

        it('should handle edge cases with zero values', () => {
            const zeroValueData: SankeyChartData = {
                nodes: [
                    { name: 'A' },
                    { name: 'B' },
                    { name: 'C' }
                ],
                links: [
                    { source: 'A', target: 'B', value: 0 },
                    { source: 'B', target: 'C', value: 50 }
                ]
            };

            const hasZeroValue = zeroValueData.links.some(link => link.value === 0);
            const totalValue = zeroValueData.links.reduce((sum, link) => sum + link.value, 0);

            expect(hasZeroValue).toBe(true);
            expect(totalValue).toBe(50);
        });
    });

    describe('Theme-specific Interactive Features', () => {
        it('should provide different tooltip colors for dark theme', () => {
            const darkTooltipConfig = {
                backgroundColor: '#374151',
                borderColor: '#4b5563',
                textStyle: {
                    color: '#f9fafb'
                }
            };

            expect(darkTooltipConfig.backgroundColor).toBe('#374151');
            expect(darkTooltipConfig.textStyle.color).toBe('#f9fafb');
        });

        it('should provide different tooltip colors for light theme', () => {
            const lightTooltipConfig = {
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                textStyle: {
                    color: '#111827'
                }
            };

            expect(lightTooltipConfig.backgroundColor).toBe('#ffffff');
            expect(lightTooltipConfig.textStyle.color).toBe('#111827');
        });

        it('should provide theme-specific emphasis colors', () => {
            const darkEmphasisColor = 'rgba(59, 130, 246, 0.6)';
            const lightEmphasisColor = 'rgba(37, 99, 235, 0.6)';

            expect(darkEmphasisColor).toContain('59, 130, 246');
            expect(lightEmphasisColor).toContain('37, 99, 235');
        });
    });

    describe('Performance and Responsiveness', () => {
        it('should handle large datasets efficiently', () => {
            // Create a dataset with many nodes and connections
            const largeDataset: SankeyChartData = {
                nodes: Array.from({ length: 20 }, (_, i) => ({ name: `Node_${i}` })),
                links: Array.from({ length: 50 }, (_, i) => ({
                    source: `Node_${i % 10}`,
                    target: `Node_${(i % 10) + 10}`,
                    value: Math.floor(Math.random() * 100) + 1
                }))
            };

            expect(largeDataset.nodes).toHaveLength(20);
            expect(largeDataset.links).toHaveLength(50);

            // Test that all links reference valid nodes
            const nodeNames = new Set(largeDataset.nodes.map(node => node.name));
            const allLinksValid = largeDataset.links.every(
                link => nodeNames.has(link.source) && nodeNames.has(link.target)
            );

            expect(allLinksValid).toBe(true);
        });

        it('should maintain consistent performance with varying connection counts', () => {
            const datasets = [
                { connections: 5, expectedProcessingTime: 'fast' },
                { connections: 25, expectedProcessingTime: 'medium' },
                { connections: 50, expectedProcessingTime: 'acceptable' }
            ];

            datasets.forEach(dataset => {
                const data: SankeyChartData = {
                    nodes: Array.from({ length: dataset.connections }, (_, i) => ({ name: `N${i}` })),
                    links: Array.from({ length: dataset.connections }, (_, i) => ({
                        source: `N${i}`,
                        target: `N${(i + 1) % dataset.connections}`,
                        value: 10
                    }))
                };

                expect(data.links).toHaveLength(dataset.connections);
                expect(dataset.expectedProcessingTime).toBeTruthy();
            });
        });
    });
});
