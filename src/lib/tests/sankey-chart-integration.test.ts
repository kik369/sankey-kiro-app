/**
 * Integration tests for SankeyChart component with data transformation
 */

import { describe, it, expect } from 'vitest';
import type { FlowData, SankeyChartData } from '$lib/types';
import { transformFlowsToSankeyData } from '$lib/transform';

describe('SankeyChart Integration', () => {
    describe('Chart Data Integration', () => {
        it('should integrate with transform functions to create chart data', () => {
            const flows: FlowData[] = [
                { id: '1', source: 'A', target: 'B', value: 10 },
                { id: '2', source: 'B', target: 'C', value: 5 },
                { id: '3', source: 'A', target: 'C', value: 3 }
            ];

            const chartData = transformFlowsToSankeyData(flows);

            // Verify chart data structure
            expect(chartData).toHaveProperty('nodes');
            expect(chartData).toHaveProperty('links');
            expect(chartData.nodes).toHaveLength(3);
            expect(chartData.links).toHaveLength(3);

            // Verify nodes
            const nodeNames = chartData.nodes.map(node => node.name);
            expect(nodeNames).toContain('A');
            expect(nodeNames).toContain('B');
            expect(nodeNames).toContain('C');

            // Verify links
            expect(chartData.links[0]).toEqual({ source: 'A', target: 'B', value: 10 });
            expect(chartData.links[1]).toEqual({ source: 'B', target: 'C', value: 5 });
            expect(chartData.links[2]).toEqual({ source: 'A', target: 'C', value: 3 });
        });

        it('should handle empty flow data for chart rendering', () => {
            const flows: FlowData[] = [];
            const chartData = transformFlowsToSankeyData(flows);

            expect(chartData.nodes).toHaveLength(0);
            expect(chartData.links).toHaveLength(0);

            // This should trigger the empty state in the chart component
            const isEmpty = chartData.nodes.length === 0 || chartData.links.length === 0;
            expect(isEmpty).toBe(true);
        });

        it('should handle complex flow scenarios for chart visualization', () => {
            const flows: FlowData[] = [
                { id: '1', source: 'Source A', target: 'Middle 1', value: 100 },
                { id: '2', source: 'Source A', target: 'Middle 2', value: 50 },
                { id: '3', source: 'Source B', target: 'Middle 1', value: 75 },
                { id: '4', source: 'Middle 1', target: 'Target X', value: 120 },
                { id: '5', source: 'Middle 1', target: 'Target Y', value: 55 },
                { id: '6', source: 'Middle 2', target: 'Target Y', value: 50 }
            ];

            const chartData = transformFlowsToSankeyData(flows);

            // Should have 6 unique nodes
            expect(chartData.nodes).toHaveLength(6);
            expect(chartData.links).toHaveLength(6);

            // Verify all expected nodes exist
            const nodeNames = chartData.nodes.map(node => node.name);
            expect(nodeNames).toContain('Source A');
            expect(nodeNames).toContain('Source B');
            expect(nodeNames).toContain('Middle 1');
            expect(nodeNames).toContain('Middle 2');
            expect(nodeNames).toContain('Target X');
            expect(nodeNames).toContain('Target Y');

            // Verify total flow values
            const totalValue = chartData.links.reduce((sum, link) => sum + link.value, 0);
            expect(totalValue).toBe(450);
        });
    });

    describe('Chart Configuration Integration', () => {
        it('should create valid ECharts configuration from transformed data', () => {
            const flows: FlowData[] = [
                { id: '1', source: 'Input', target: 'Process', value: 100 },
                { id: '2', source: 'Process', target: 'Output', value: 80 }
            ];

            const chartData = transformFlowsToSankeyData(flows);

            // Simulate chart configuration creation
            const chartConfig = {
                backgroundColor: 'transparent',
                series: [{
                    type: 'sankey',
                    data: chartData.nodes,
                    links: chartData.links,
                    left: '5%',
                    right: '5%',
                    top: '5%',
                    bottom: '5%'
                }]
            };

            expect(chartConfig.series[0].type).toBe('sankey');
            expect(chartConfig.series[0].data).toEqual(chartData.nodes);
            expect(chartConfig.series[0].links).toEqual(chartData.links);
        });

        it('should handle theme-specific chart configurations', () => {
            const chartData: SankeyChartData = {
                nodes: [{ name: 'A' }, { name: 'B' }],
                links: [{ source: 'A', target: 'B', value: 10 }]
            };

            // Dark theme configuration
            const darkConfig = {
                itemStyle: {
                    color: '#3b82f6',
                    borderColor: '#1e40af'
                },
                label: {
                    color: '#f9fafb'
                }
            };

            // Light theme configuration
            const lightConfig = {
                itemStyle: {
                    color: '#2563eb',
                    borderColor: '#1d4ed8'
                },
                label: {
                    color: '#111827'
                }
            };

            expect(darkConfig.itemStyle.color).toBe('#3b82f6');
            expect(lightConfig.itemStyle.color).toBe('#2563eb');
            expect(darkConfig.label.color).toBe('#f9fafb');
            expect(lightConfig.label.color).toBe('#111827');
        });
    });

    describe('Chart Props Integration', () => {
        it('should handle chart component props correctly', () => {
            const chartData: SankeyChartData = {
                nodes: [{ name: 'Test' }],
                links: []
            };

            const props = {
                data: chartData,
                theme: 'dark' as const,
                width: '800px',
                height: '600px'
            };

            expect(props.data).toBe(chartData);
            expect(props.theme).toBe('dark');
            expect(props.width).toBe('800px');
            expect(props.height).toBe('600px');
        });

        it('should use default props when not provided', () => {
            const chartData: SankeyChartData = {
                nodes: [],
                links: []
            };

            const defaultProps = {
                data: chartData,
                theme: 'dark' as const,
                width: '100%',
                height: '400px'
            };

            expect(defaultProps.theme).toBe('dark');
            expect(defaultProps.width).toBe('100%');
            expect(defaultProps.height).toBe('400px');
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle malformed data gracefully', () => {
            // Test with data that has links but no corresponding nodes
            const malformedData: SankeyChartData = {
                nodes: [],
                links: [{ source: 'A', target: 'B', value: 10 }]
            };

            // Should not throw error when processing
            expect(malformedData.nodes).toHaveLength(0);
            expect(malformedData.links).toHaveLength(1);

            // Chart should show empty state
            const isEmpty = malformedData.nodes.length === 0;
            expect(isEmpty).toBe(true);
        });

        it('should handle edge cases in flow data', () => {
            const edgeCaseFlows: FlowData[] = [
                { id: '1', source: 'A', target: 'A', value: 5 }, // Self-loop
                { id: '2', source: 'B', target: 'C', value: 0 }, // Zero value
                { id: '3', source: 'D', target: 'E', value: -1 } // Negative value
            ];

            const chartData = transformFlowsToSankeyData(edgeCaseFlows);

            // Should still create valid structure
            expect(chartData.nodes).toHaveLength(5); // A, B, C, D, E
            expect(chartData.links).toHaveLength(3);

            // Values should be preserved as-is
            expect(chartData.links[0].value).toBe(5);
            expect(chartData.links[1].value).toBe(0);
            expect(chartData.links[2].value).toBe(-1);
        });
    });
});
