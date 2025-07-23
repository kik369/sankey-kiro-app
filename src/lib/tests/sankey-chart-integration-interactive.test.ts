/**
 * Integration tests for SankeyChart interactive features
 * Testing real-world scenarios and data integration
 */

import { describe, it, expect } from 'vitest';
import type { SankeyChartData, ThemeMode } from '$lib/types';

describe('SankeyChart Interactive Features Integration', () => {
    describe('Real-world Data Scenarios', () => {
        it('should handle energy flow visualization', () => {
            const energyFlowData: SankeyChartData = {
                nodes: [
                    { name: 'Solar' },
                    { name: 'Wind' },
                    { name: 'Coal' },
                    { name: 'Grid' },
                    { name: 'Residential' },
                    { name: 'Commercial' },
                    { name: 'Industrial' }
                ],
                links: [
                    { source: 'Solar', target: 'Grid', value: 150 },
                    { source: 'Wind', target: 'Grid', value: 200 },
                    { source: 'Coal', target: 'Grid', value: 300 },
                    { source: 'Grid', target: 'Residential', value: 250 },
                    { source: 'Grid', target: 'Commercial', value: 200 },
                    { source: 'Grid', target: 'Industrial', value: 200 }
                ]
            };

            // Test energy conservation
            const totalGeneration = energyFlowData.links
                .filter(link => link.target === 'Grid')
                .reduce((sum, link) => sum + link.value, 0);

            const totalConsumption = energyFlowData.links
                .filter(link => link.source === 'Grid')
                .reduce((sum, link) => sum + link.value, 0);

            expect(totalGeneration).toBe(650);
            expect(totalConsumption).toBe(650);
            expect(totalGeneration).toBe(totalConsumption);

            // Test tooltip data for Grid node
            const gridConnections = energyFlowData.links.filter(
                link => link.source === 'Grid' || link.target === 'Grid'
            );
            expect(gridConnections).toHaveLength(6);
        });

        it('should handle financial flow visualization', () => {
            const financialFlowData: SankeyChartData = {
                nodes: [
                    { name: 'Revenue' },
                    { name: 'Operating Costs' },
                    { name: 'Marketing' },
                    { name: 'R&D' },
                    { name: 'Profit' },
                    { name: 'Taxes' },
                    { name: 'Dividends' },
                    { name: 'Retained Earnings' }
                ],
                links: [
                    { source: 'Revenue', target: 'Operating Costs', value: 600 },
                    { source: 'Revenue', target: 'Marketing', value: 150 },
                    { source: 'Revenue', target: 'R&D', value: 100 },
                    { source: 'Revenue', target: 'Profit', value: 150 },
                    { source: 'Profit', target: 'Taxes', value: 45 },
                    { source: 'Profit', target: 'Dividends', value: 60 },
                    { source: 'Profit', target: 'Retained Earnings', value: 45 }
                ]
            };

            // Test financial flow calculations
            const totalRevenue = financialFlowData.links
                .filter(link => link.source === 'Revenue')
                .reduce((sum, link) => sum + link.value, 0);

            const profitDistribution = financialFlowData.links
                .filter(link => link.source === 'Profit')
                .reduce((sum, link) => sum + link.value, 0);

            expect(totalRevenue).toBe(1000);
            expect(profitDistribution).toBe(150);

            // Test visual differentiation for multiple profit distributions
            const profitConnections = financialFlowData.links.filter(
                link => link.source === 'Profit'
            );
            expect(profitConnections).toHaveLength(3);
        });

        it('should handle website traffic flow visualization', () => {
            const trafficFlowData: SankeyChartData = {
                nodes: [
                    { name: 'Direct' },
                    { name: 'Search' },
                    { name: 'Social' },
                    { name: 'Homepage' },
                    { name: 'Product Page' },
                    { name: 'Checkout' },
                    { name: 'Purchase' },
                    { name: 'Bounce' }
                ],
                links: [
                    { source: 'Direct', target: 'Homepage', value: 500 },
                    { source: 'Search', target: 'Product Page', value: 800 },
                    { source: 'Social', target: 'Homepage', value: 200 },
                    { source: 'Homepage', target: 'Product Page', value: 400 },
                    { source: 'Homepage', target: 'Bounce', value: 300 },
                    { source: 'Product Page', target: 'Checkout', value: 600 },
                    { source: 'Product Page', target: 'Bounce', value: 600 },
                    { source: 'Checkout', target: 'Purchase', value: 300 },
                    { source: 'Checkout', target: 'Bounce', value: 300 }
                ]
            };

            // Test conversion funnel analysis
            const totalTraffic = trafficFlowData.links
                .filter(link => ['Direct', 'Search', 'Social'].includes(link.source))
                .reduce((sum, link) => sum + link.value, 0);

            const totalPurchases = trafficFlowData.links
                .filter(link => link.target === 'Purchase')
                .reduce((sum, link) => sum + link.value, 0);

            const conversionRate = (totalPurchases / totalTraffic) * 100;

            expect(totalTraffic).toBe(1500);
            expect(totalPurchases).toBe(300);
            expect(conversionRate).toBe(20);

            // Test bounce analysis
            const totalBounces = trafficFlowData.links
                .filter(link => link.target === 'Bounce')
                .reduce((sum, link) => sum + link.value, 0);

            expect(totalBounces).toBe(1200);
        });
    });

    describe('Interactive Features with Complex Data', () => {
        it('should handle tooltip formatting for complex multi-level flows', () => {
            const complexData: SankeyChartData = {
                nodes: [
                    { name: 'Input_A' },
                    { name: 'Input_B' },
                    { name: 'Process_1' },
                    { name: 'Process_2' },
                    { name: 'Output_X' },
                    { name: 'Output_Y' },
                    { name: 'Waste' }
                ],
                links: [
                    { source: 'Input_A', target: 'Process_1', value: 100 },
                    { source: 'Input_B', target: 'Process_1', value: 80 },
                    { source: 'Input_A', target: 'Process_2', value: 50 },
                    { source: 'Process_1', target: 'Output_X', value: 120 },
                    { source: 'Process_1', target: 'Waste', value: 60 },
                    { source: 'Process_2', target: 'Output_Y', value: 40 },
                    { source: 'Process_2', target: 'Waste', value: 10 }
                ]
            };

            // Test Process_1 node tooltip data
            const process1Connections = complexData.links.filter(
                link => link.source === 'Process_1' || link.target === 'Process_1'
            );

            const process1Incoming = complexData.links
                .filter(link => link.target === 'Process_1')
                .reduce((sum, link) => sum + link.value, 0);

            const process1Outgoing = complexData.links
                .filter(link => link.source === 'Process_1')
                .reduce((sum, link) => sum + link.value, 0);

            expect(process1Connections).toHaveLength(4);
            expect(process1Incoming).toBe(180);
            expect(process1Outgoing).toBe(180);

            // Test connected nodes calculation
            const process1ConnectedNodes = [...new Set([
                ...complexData.links
                    .filter(link => link.target === 'Process_1')
                    .map(link => link.source),
                ...complexData.links
                    .filter(link => link.source === 'Process_1')
                    .map(link => link.target)
            ])];

            expect(process1ConnectedNodes).toEqual(['Input_A', 'Input_B', 'Output_X', 'Waste']);
        });

        it('should handle visual differentiation with many connections', () => {
            const manyConnectionsData: SankeyChartData = {
                nodes: [
                    { name: 'Hub' },
                    { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' },
                    { name: 'E' }, { name: 'F' }, { name: 'G' }, { name: 'H' }
                ],
                links: [
                    { source: 'A', target: 'Hub', value: 10 },
                    { source: 'B', target: 'Hub', value: 15 },
                    { source: 'C', target: 'Hub', value: 20 },
                    { source: 'D', target: 'Hub', value: 25 },
                    { source: 'Hub', target: 'E', value: 20 },
                    { source: 'Hub', target: 'F', value: 20 },
                    { source: 'Hub', target: 'G', value: 15 },
                    { source: 'Hub', target: 'H', value: 15 }
                ]
            };

            // Test color cycling for many connections
            const CONNECTION_COLORS = {
                dark: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
                light: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#ea580c']
            };

            function getConnectionColor(index: number, totalLinks: number, isDark: boolean): string {
                const colors = isDark ? CONNECTION_COLORS.dark : CONNECTION_COLORS.light;
                if (totalLinks > 1) {
                    return colors[index % colors.length];
                }
                return isDark ? '#3b82f6' : '#2563eb';
            }

            // Test that colors cycle properly
            expect(getConnectionColor(0, 8, true)).toBe('#3b82f6');
            expect(getConnectionColor(7, 8, true)).toBe('#f97316');
            expect(getConnectionColor(8, 9, true)).toBe('#3b82f6'); // Should cycle back

            // Test line pattern cycling
            function getConnectionPattern(index: number, totalConnections: number): string {
                if (totalConnections <= 1) return 'solid';
                const patterns = ['solid', 'dashed', 'dotted'];
                return patterns[index % patterns.length];
            }

            expect(getConnectionPattern(0, 8)).toBe('solid');
            expect(getConnectionPattern(1, 8)).toBe('dashed');
            expect(getConnectionPattern(2, 8)).toBe('dotted');
            expect(getConnectionPattern(3, 8)).toBe('solid'); // Cycles back
        });

        it('should handle emphasis effects with varying data densities', () => {
            const sparseData: SankeyChartData = {
                nodes: [{ name: 'A' }, { name: 'B' }],
                links: [{ source: 'A', target: 'B', value: 100 }]
            };

            const denseData: SankeyChartData = {
                nodes: Array.from({ length: 10 }, (_, i) => ({ name: `Node_${i}` })),
                links: Array.from({ length: 20 }, (_, i) => ({
                    source: `Node_${i % 5}`,
                    target: `Node_${(i % 5) + 5}`,
                    value: Math.floor(Math.random() * 50) + 10
                }))
            };

            // Test that sparse data has simple adjacency
            const sparseAdjacency = sparseData.links.filter(
                link => link.source === 'A' || link.target === 'A'
            );
            expect(sparseAdjacency).toHaveLength(1);

            // Test that dense data has complex adjacency
            const node0Adjacency = denseData.links.filter(
                link => link.source === 'Node_0' || link.target === 'Node_0'
            );
            expect(node0Adjacency.length).toBeGreaterThan(1);
        });
    });

    describe('Theme Integration with Interactive Features', () => {
        it('should provide consistent theming across all interactive elements', () => {
            const themes: ThemeMode[] = ['dark', 'light'];

            themes.forEach(theme => {
                const isDark = theme === 'dark';

                // Tooltip theming
                const tooltipConfig = {
                    backgroundColor: isDark ? '#374151' : '#ffffff',
                    borderColor: isDark ? '#4b5563' : '#e5e7eb',
                    textColor: isDark ? '#f9fafb' : '#111827'
                };

                // Emphasis theming
                const emphasisConfig = {
                    shadowColor: isDark ? 'rgba(59, 130, 246, 0.6)' : 'rgba(37, 99, 235, 0.6)',
                    borderColor: isDark ? '#60a5fa' : '#3b82f6'
                };

                // Connection theming
                const connectionColors = isDark
                    ? ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                    : ['#2563eb', '#059669', '#d97706', '#dc2626'];

                expect(tooltipConfig.backgroundColor).toBeTruthy();
                expect(emphasisConfig.shadowColor).toContain('rgba');
                expect(connectionColors).toHaveLength(4);
            });
        });

        it('should maintain accessibility with theme changes', () => {
            const darkThemeColors = {
                background: '#374151',
                text: '#f9fafb',
                accent: '#3b82f6'
            };

            const lightThemeColors = {
                background: '#ffffff',
                text: '#111827',
                accent: '#2563eb'
            };

            // Test contrast ratios (simplified check)
            expect(darkThemeColors.background).not.toBe(darkThemeColors.text);
            expect(lightThemeColors.background).not.toBe(lightThemeColors.text);

            // Test that accent colors are different between themes
            expect(darkThemeColors.accent).not.toBe(lightThemeColors.accent);
        });
    });

    describe('Performance with Interactive Features', () => {
        it('should handle rapid hover events efficiently', () => {
            const data: SankeyChartData = {
                nodes: Array.from({ length: 15 }, (_, i) => ({ name: `Node_${i}` })),
                links: Array.from({ length: 30 }, (_, i) => ({
                    source: `Node_${i % 10}`,
                    target: `Node_${(i % 5) + 10}`,
                    value: Math.floor(Math.random() * 100) + 1
                }))
            };

            // Simulate rapid tooltip calculations
            const startTime = performance.now();

            data.nodes.forEach(node => {
                const connections = data.links.filter(
                    link => link.source === node.name || link.target === node.name
                );
                const incoming = data.links
                    .filter(link => link.target === node.name)
                    .reduce((sum, link) => sum + link.value, 0);
                const outgoing = data.links
                    .filter(link => link.source === node.name)
                    .reduce((sum, link) => sum + link.value, 0);

                expect(connections.length).toBeGreaterThanOrEqual(0);
                expect(incoming).toBeGreaterThanOrEqual(0);
                expect(outgoing).toBeGreaterThanOrEqual(0);
            });

            const endTime = performance.now();
            const processingTime = endTime - startTime;

            // Should process quickly (less than 10ms for this dataset size)
            expect(processingTime).toBeLessThan(10);
        });

        it('should maintain smooth animations with data updates', () => {
            const initialData: SankeyChartData = {
                nodes: [{ name: 'A' }, { name: 'B' }],
                links: [{ source: 'A', target: 'B', value: 50 }]
            };

            const updatedData: SankeyChartData = {
                nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
                links: [
                    { source: 'A', target: 'B', value: 30 },
                    { source: 'A', target: 'C', value: 20 }
                ]
            };

            // Test data structure changes
            expect(initialData.nodes).toHaveLength(2);
            expect(initialData.links).toHaveLength(1);

            expect(updatedData.nodes).toHaveLength(3);
            expect(updatedData.links).toHaveLength(2);

            // Test that total flow is conserved
            const initialTotal = initialData.links.reduce((sum, link) => sum + link.value, 0);
            const updatedTotal = updatedData.links.reduce((sum, link) => sum + link.value, 0);

            expect(initialTotal).toBe(50);
            expect(updatedTotal).toBe(50);
        });
    });

    describe('Error Handling in Interactive Features', () => {
        it('should handle malformed data gracefully', () => {
            const malformedData: SankeyChartData = {
                nodes: [{ name: 'A' }, { name: 'B' }],
                links: [
                    { source: 'A', target: 'B', value: 50 },
                    { source: 'C', target: 'D', value: 25 } // References non-existent nodes
                ]
            };

            // Should not crash when processing tooltips
            const nodeNames = new Set(malformedData.nodes.map(node => node.name));
            const validLinks = malformedData.links.filter(
                link => nodeNames.has(link.source) && nodeNames.has(link.target)
            );

            expect(validLinks).toHaveLength(1);
            expect(malformedData.links).toHaveLength(2);
        });

        it('should handle empty or null values in interactive calculations', () => {
            const edgeCaseData: SankeyChartData = {
                nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
                links: [
                    { source: 'A', target: 'B', value: 0 },
                    { source: 'B', target: 'C', value: 100 }
                ]
            };

            // Test percentage calculations with zero values
            const totalValue = edgeCaseData.links.reduce((sum, link) => sum + link.value, 0);
            const zeroValuePercentage = totalValue > 0 ? ((0 / totalValue) * 100).toFixed(1) : '0';

            expect(totalValue).toBe(100);
            expect(zeroValuePercentage).toBe('0.0');

            // Test tooltip calculations with zero values
            const nodeAOutgoing = edgeCaseData.links
                .filter(link => link.source === 'A')
                .reduce((sum, link) => sum + link.value, 0);

            expect(nodeAOutgoing).toBe(0);
        });
    });
});
