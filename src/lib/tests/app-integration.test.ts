import { describe, it, expect } from 'vitest';
import { transformFlowsToSankeyData } from '$lib/transform';
import type { FlowData } from '$lib/types';

describe('App Component Integration', () => {

    it('handles empty flows correctly', () => {
        const emptyFlows: FlowData[] = [];
        const result = transformFlowsToSankeyData(emptyFlows);

        expect(result.nodes).toEqual([]);
        expect(result.links).toEqual([]);
    });

    it('transforms single flow correctly', () => {
        const flows: FlowData[] = [
            { id: '1', source: 'A', target: 'B', value: 10 }
        ];
        const result = transformFlowsToSankeyData(flows);

        expect(result.nodes).toEqual([
            { name: 'A' },
            { name: 'B' }
        ]);
        expect(result.links).toEqual([
            { source: 'A', target: 'B', value: 10 }
        ]);
    });

    it('handles multiple flows with shared nodes', () => {
        const flows: FlowData[] = [
            { id: '1', source: 'A', target: 'B', value: 10 },
            { id: '2', source: 'B', target: 'C', value: 5 },
            { id: '3', source: 'A', target: 'C', value: 3 }
        ];
        const result = transformFlowsToSankeyData(flows);

        expect(result.nodes).toHaveLength(3);
        expect(result.nodes).toEqual([
            { name: 'A' },
            { name: 'B' },
            { name: 'C' }
        ]);
        expect(result.links).toHaveLength(3);
    });

    it('handles error scenarios gracefully', () => {
        // Test with null data
        const nullFlows = null as any;
        const result1 = transformFlowsToSankeyData(nullFlows);
        expect(result1.nodes).toEqual([]);
        expect(result1.links).toEqual([]);

        // Test with undefined data
        const undefinedFlows = undefined as any;
        const result2 = transformFlowsToSankeyData(undefinedFlows);
        expect(result2.nodes).toEqual([]);
        expect(result2.links).toEqual([]);
    });
});
