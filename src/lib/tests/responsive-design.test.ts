import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import { tick } from 'svelte';
import DataInput from '../components/DataInput.svelte';
import SankeyChart from '../components/SankeyChart.svelte';
import ControlPanel from '../components/ControlPanel.svelte';
import type { FlowData, SankeyChartData } from '../types';

describe('Responsive Design Tests', () => {
    const mockFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 10 },
        { id: '2', source: 'B', target: 'C', value: 15 },
    ];

    const mockChartData: SankeyChartData = {
        nodes: [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
        ],
        links: [
            { source: 'A', target: 'B', value: 10 },
            { source: 'B', target: 'C', value: 15 },
        ],
    };

    describe('DataInput Component Responsive Classes', () => {
        it('should have responsive grid layout classes', async () => {
            const mockOnFlowsChange = vi.fn();
            const { container } = render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            // Check for responsive grid classes
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toBeInTheDocument();
            expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
        });

        it('should have mobile-friendly input sizing', async () => {
            const mockOnFlowsChange = vi.fn();
            render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            const sourceInput = screen.getByLabelText('Source');
            expect(sourceInput).toHaveClass('py-2.5', 'sm:py-2', 'text-base', 'sm:text-sm');
        });

        it('should have responsive button layout', async () => {
            const mockOnFlowsChange = vi.fn();
            render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            const addButton = screen.getByText('Add Flow');
            expect(addButton).toHaveClass('py-2.5', 'sm:py-2', 'text-base', 'sm:text-sm');
        });

        it('should handle flow list responsively', async () => {
            const mockOnFlowsChange = vi.fn();
            const { container } = render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            // Check for responsive flow item layout
            const flowItems = container.querySelectorAll('.flex-col.sm\\:flex-row');
            expect(flowItems.length).toBeGreaterThan(0);
        });
    });

    describe('SankeyChart Component Responsive Features', () => {
        it('should render chart container with responsive classes', async () => {
            const { container } = render(SankeyChart, {
                props: {
                    data: mockChartData,
                    theme: 'light',
                    width: '100%',
                    height: '400px',
                },
            });

            await tick();

            const chartContainer = container.querySelector('.sankey-chart-container');
            expect(chartContainer).toBeInTheDocument();
        });

        it('should display empty state with responsive layout', async () => {
            const emptyData: SankeyChartData = { nodes: [], links: [] };

            render(SankeyChart, {
                props: {
                    data: emptyData,
                    theme: 'light',
                    width: '100%',
                    height: '400px',
                },
            });

            await tick();

            expect(screen.getByText('No Data to Display')).toBeInTheDocument();
            expect(screen.getByText('Add some flow data to see your Sankey diagram')).toBeInTheDocument();
        });
    });

    describe('ControlPanel Component Responsive Layout', () => {
        it('should have responsive statistics grid', async () => {
            const mockOnClearAll = vi.fn();
            const { container } = render(ControlPanel, {
                props: {
                    flows: mockFlows,
                    onClearAll: mockOnClearAll,
                },
            });

            await tick();

            const statsGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-3');
            expect(statsGrid).toBeInTheDocument();
        });

        it('should have responsive button layout', async () => {
            const mockOnClearAll = vi.fn();
            render(ControlPanel, {
                props: {
                    flows: mockFlows,
                    onClearAll: mockOnClearAll,
                },
            });

            await tick();

            const clearButton = screen.getByText('Clear All Data');
            expect(clearButton).toHaveClass('w-full', 'sm:w-auto');
        });

        it('should display statistics correctly', async () => {
            const mockOnClearAll = vi.fn();
            render(ControlPanel, {
                props: {
                    flows: mockFlows,
                    onClearAll: mockOnClearAll,
                },
            });

            await tick();

            expect(screen.getByText('Diagram Statistics')).toBeInTheDocument();
            expect(screen.getByText('Total Flows')).toBeInTheDocument();
            expect(screen.getByText('Unique Nodes')).toBeInTheDocument();
            expect(screen.getByText('Total Value')).toBeInTheDocument();
        });
    });

    describe('Responsive Typography and Spacing', () => {
        it('should use responsive text sizes in DataInput', async () => {
            const mockOnFlowsChange = vi.fn();
            const { container } = render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            const heading = container.querySelector('h3');
            expect(heading).toHaveClass('text-lg', 'sm:text-xl');
        });

        it('should use responsive padding in components', async () => {
            const mockOnFlowsChange = vi.fn();
            const { container } = render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            const cardContainer = container.querySelector('.p-4.sm\\:p-6');
            expect(cardContainer).toBeInTheDocument();
        });
    });

    describe('Content Overflow Handling', () => {
        it('should handle long node names with break-words', async () => {
            const longNameFlows: FlowData[] = [
                {
                    id: '1',
                    source: 'Very Long Source Node Name That Might Overflow',
                    target: 'Very Long Target Node Name That Might Also Overflow',
                    value: 10
                },
            ];

            const mockOnFlowsChange = vi.fn();
            const { container } = render(DataInput, {
                props: {
                    flows: longNameFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            // Check that break-words class is applied
            const breakWordsElements = container.querySelectorAll('.break-words');
            expect(breakWordsElements.length).toBeGreaterThan(0);
        });
    });

    describe('Touch-Friendly Interface', () => {
        it('should have appropriate touch targets', async () => {
            const mockOnFlowsChange = vi.fn();
            render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            // Check that buttons have larger touch targets on mobile
            const addButton = screen.getByText('Add Flow');
            expect(addButton).toHaveClass('py-2.5'); // Larger touch target

            // Check that inputs have larger touch targets on mobile
            const sourceInput = screen.getByLabelText('Source');
            expect(sourceInput).toHaveClass('py-2.5'); // Larger touch target
        });
    });

    describe('Responsive Spacing', () => {
        it('should use responsive spacing between components', async () => {
            const mockOnFlowsChange = vi.fn();
            const { container } = render(DataInput, {
                props: {
                    flows: mockFlows,
                    onFlowsChange: mockOnFlowsChange,
                },
            });

            await tick();

            // Check for responsive spacing classes
            const spacingContainer = container.querySelector('.space-y-4.sm\\:space-y-6');
            expect(spacingContainer).toBeInTheDocument();
        });
    });
});
