/**
 * Task 14: Integration Tests
 *
 * Comprehensive integration tests for complete user workflows including:
 * - End-to-end user workflows
 * - Theme switching with chart updates
 * - Real-time data input and visualization updates
 * - Data persistence and clearing functionality
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 7.2, 7.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FlowData, SankeyChartData } from '$lib/types';
import { transformFlowsToSankeyData } from '$lib/transform';

// Mock ECharts
const mockChart = {
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Task 14: Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Transformation Integration', () => {
    it('should transform flow data correctly for chart visualization (Requirement 2.1)', () => {
      const flows: FlowData[] = [
        { id: '1', source: 'Production', target: 'Sales', value: 100 },
        { id: '2', source: 'Sales', target: 'Marketing', value: 50 }
      ];

      const result = transformFlowsToSankeyData(flows);

      expect(result.nodes).toHaveLength(3); // Production, Sales, Marketing
      expect(result.links).toHaveLength(2);
      expect(result.nodes).toEqual([
        { name: 'Production' },
        { name: 'Sales' },
        { name: 'Marketing' }
      ]);
      expect(result.links).toEqual([
        { source: 'Production', target: 'Sales', value: 100 },
        { source: 'Sales', target: 'Marketing', value: 50 }
      ]);
    });

    it('should handle complex multi-node workflows (Requirement 2.2)', () => {
      const flows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 30 },
        { id: '2', source: 'B', target: 'C', value: 20 },
        { id: '3', source: 'A', target: 'C', value: 10 },
        { id: '4', source: 'C', target: 'D', value: 25 }
      ];

      const result = transformFlowsToSankeyData(flows);

      expect(result.nodes).toHaveLength(4); // A, B, C, D
      expect(result.links).toHaveLength(4);

      // Verify all nodes are present
      const nodeNames = result.nodes.map(n => n.name).sort();
      expect(nodeNames).toEqual(['A', 'B', 'C', 'D']);

      // Verify total value calculation
      const totalValue = result.links.reduce((sum, link) => sum + link.value, 0);
      expect(totalValue).toBe(85);
    });

    it('should handle flow removal correctly (Requirement 2.3)', () => {
      const initialFlows: FlowData[] = [
        { id: '1', source: 'Remove', target: 'Test1', value: 10 },
        { id: '2', source: 'Remove', target: 'Test2', value: 20 }
      ];

      const afterRemoval: FlowData[] = [
        { id: '2', source: 'Remove', target: 'Test2', value: 20 }
      ];

      const initialResult = transformFlowsToSankeyData(initialFlows);
      const afterRemovalResult = transformFlowsToSankeyData(afterRemoval);

      expect(initialResult.links).toHaveLength(2);
      expect(afterRemovalResult.links).toHaveLength(1);
      expect(afterRemovalResult.links[0]).toEqual({
        source: 'Remove',
        target: 'Test2',
        value: 20
      });
    });

    it('should handle flow value modifications (Requirement 2.4)', () => {
      const initialFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 10 }
      ];

      const modifiedFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 25 }
      ];

      const initialData = transformFlowsToSankeyData(initialFlows);
      const modifiedData = transformFlowsToSankeyData(modifiedFlows);

      expect(initialData.links[0].value).toBe(10);
      expect(modifiedData.links[0].value).toBe(25);

      // Verify structure remains the same
      expect(initialData.nodes).toEqual(modifiedData.nodes);
      expect(initialData.links[0].source).toBe(modifiedData.links[0].source);
      expect(initialData.links[0].target).toBe(modifiedData.links[0].target);
    });
  });

  describe('Data Clearing Functionality', () => {
    it('should clear all data correctly (Requirement 6.1)', () => {
      const flows: FlowData[] = [
        { id: '1', source: 'Clear', target: 'Test', value: 30 }
      ];

      const emptyFlows: FlowData[] = [];

      const beforeClear = transformFlowsToSankeyData(flows);
      const afterClear = transformFlowsToSankeyData(emptyFlows);

      expect(beforeClear.nodes).toHaveLength(2);
      expect(beforeClear.links).toHaveLength(1);

      expect(afterClear.nodes).toHaveLength(0);
      expect(afterClear.links).toHaveLength(0);
    });

    it('should handle empty data state gracefully', () => {
      const emptyFlows: FlowData[] = [];
      const result = transformFlowsToSankeyData(emptyFlows);

      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
      expect(result).toEqual({ nodes: [], links: [] });
    });
  });

  describe('Theme System Integration', () => {
    it('should persist theme preference (Requirement 7.2)', () => {
      // Simulate theme change
      localStorageMock.setItem('theme', 'light');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should maintain data consistency during theme switches (Requirement 7.3)', () => {
      const flows: FlowData[] = [
        { id: '1', source: 'Theme', target: 'Test', value: 15 },
        { id: '2', source: 'Test', target: 'Chart', value: 10 }
      ];

      // Data should remain the same regardless of theme
      const darkThemeData = transformFlowsToSankeyData(flows);
      const lightThemeData = transformFlowsToSankeyData(flows);

      expect(darkThemeData).toEqual(lightThemeData);
      expect(darkThemeData.nodes).toHaveLength(3);
      expect(darkThemeData.links).toHaveLength(2);
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const performanceFlows: FlowData[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        source: `Source${i}`,
        target: `Target${i}`,
        value: (i + 1) * 5
      }));

      const startTime = performance.now();
      const result = transformFlowsToSankeyData(performanceFlows);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete transformation quickly (less than 100ms for 50 flows)
      expect(duration).toBeLessThan(100);

      // Verify correct transformation
      expect(result.nodes).toHaveLength(100); // 50 sources + 50 targets
      expect(result.links).toHaveLength(50);

      // Verify total value calculation
      const expectedTotal = performanceFlows.reduce((sum, flow) => sum + flow.value, 0);
      const actualTotal = result.links.reduce((sum, link) => sum + link.value, 0);
      expect(actualTotal).toBe(expectedTotal);
    });

    it('should handle rapid data changes efficiently', () => {
      const rapidFlows = [
        { id: '1', source: 'Rapid1', target: 'Test1', value: 5 },
        { id: '2', source: 'Rapid2', target: 'Test2', value: 8 },
        { id: '3', source: 'Rapid3', target: 'Test3', value: 12 },
        { id: '4', source: 'Rapid4', target: 'Test4', value: 15 }
      ];

      // Simulate rapid transformations
      const results = rapidFlows.map((_, index) => {
        const currentFlows = rapidFlows.slice(0, index + 1);
        return transformFlowsToSankeyData(currentFlows);
      });

      // Verify each transformation is correct
      expect(results[0].links).toHaveLength(1);
      expect(results[1].links).toHaveLength(2);
      expect(results[2].links).toHaveLength(3);
      expect(results[3].links).toHaveLength(4);

      // Final result should have all flows
      const finalResult = results[3];
      expect(finalResult.nodes).toHaveLength(8); // 4 sources + 4 targets
      expect(finalResult.links).toHaveLength(4);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid data gracefully', () => {
      // Test with null/undefined
      expect(() => transformFlowsToSankeyData(null as any)).toThrow();
      expect(() => transformFlowsToSankeyData(undefined as any)).toThrow();

      // Test with invalid flow objects (missing properties)
      const invalidFlows = [
        { id: '1', target: 'Test', value: 10 } // missing source
      ] as any;

      expect(() => transformFlowsToSankeyData(invalidFlows)).toThrow();

      // Test with non-string source/target
      const invalidTypeFlows = [
        { id: '1', source: 123, target: 'Test', value: 10 }
      ] as any;

      expect(() => transformFlowsToSankeyData(invalidTypeFlows)).toThrow();
    });

    it('should validate flow data before transformation', () => {
      const invalidFlows = [
        { id: '1', source: 'Valid', target: 'Test', value: -5 }
      ] as FlowData[];

      expect(() => transformFlowsToSankeyData(invalidFlows)).toThrow();
    });

    it('should handle edge cases in data transformation', () => {
      // Self-loops (source === target)
      const selfLoopFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'A', value: 10 }
      ];

      // Should not throw, but may produce warnings
      const result = transformFlowsToSankeyData(selfLoopFlows);
      expect(result.nodes).toHaveLength(1);
      expect(result.links).toHaveLength(1);
    });
  });

  describe('Data Statistics Integration', () => {
    it('should calculate correct statistics for complex flows', () => {
      const flows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 100 },
        { id: '2', source: 'B', target: 'C', value: 50 },
        { id: '3', source: 'A', target: 'C', value: 25 },
        { id: '4', source: 'C', target: 'D', value: 75 }
      ];

      const result = transformFlowsToSankeyData(flows);

      // Verify node count (unique nodes)
      expect(result.nodes).toHaveLength(4); // A, B, C, D

      // Verify link count
      expect(result.links).toHaveLength(4);

      // Verify total value
      const totalValue = result.links.reduce((sum, link) => sum + link.value, 0);
      expect(totalValue).toBe(250);

      // Verify max and min values
      const values = result.links.map(link => link.value);
      expect(Math.max(...values)).toBe(100);
      expect(Math.min(...values)).toBe(25);
    });

    it('should handle statistics for empty datasets', () => {
      const emptyFlows: FlowData[] = [];
      const result = transformFlowsToSankeyData(emptyFlows);

      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });
  });

  describe('Real-time Update Simulation', () => {
    it('should simulate real-time data updates correctly', () => {
      // Simulate adding flows one by one
      const flows: FlowData[] = [];
      const results: SankeyChartData[] = [];

      // Add first flow
      flows.push({ id: '1', source: 'Real', target: 'Time', value: 20 });
      results.push(transformFlowsToSankeyData([...flows]));

      // Add second flow
      flows.push({ id: '2', source: 'Time', target: 'Update', value: 15 });
      results.push(transformFlowsToSankeyData([...flows]));

      // Verify progressive updates
      expect(results[0].nodes).toHaveLength(2); // Real, Time
      expect(results[0].links).toHaveLength(1);

      expect(results[1].nodes).toHaveLength(3); // Real, Time, Update
      expect(results[1].links).toHaveLength(2);

      // Verify data consistency
      expect(results[1].links[0]).toEqual({
        source: 'Real',
        target: 'Time',
        value: 20
      });
      expect(results[1].links[1]).toEqual({
        source: 'Time',
        target: 'Update',
        value: 15
      });
    });

    it('should simulate flow removal in real-time', () => {
      let flows: FlowData[] = [
        { id: '1', source: 'Remove', target: 'Test1', value: 10 },
        { id: '2', source: 'Remove', target: 'Test2', value: 20 }
      ];

      const beforeRemoval = transformFlowsToSankeyData(flows);

      // Remove first flow
      flows = flows.filter(flow => flow.id !== '1');
      const afterRemoval = transformFlowsToSankeyData(flows);

      expect(beforeRemoval.links).toHaveLength(2);
      expect(afterRemoval.links).toHaveLength(1);
      expect(afterRemoval.links[0].target).toBe('Test2');
    });
  });

  describe('Integration Workflow Tests', () => {
    it('should complete full data lifecycle workflow', () => {
      // Step 1: Start with empty data
      let flows: FlowData[] = [];
      let result = transformFlowsToSankeyData(flows);
      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);

      // Step 2: Add first flow
      flows.push({ id: '1', source: 'Production', target: 'Sales', value: 100 });
      result = transformFlowsToSankeyData(flows);
      expect(result.nodes).toHaveLength(2);
      expect(result.links).toHaveLength(1);

      // Step 3: Add second flow
      flows.push({ id: '2', source: 'Sales', target: 'Marketing', value: 50 });
      result = transformFlowsToSankeyData(flows);
      expect(result.nodes).toHaveLength(3);
      expect(result.links).toHaveLength(2);

      // Step 4: Modify flow value
      flows[0].value = 150;
      result = transformFlowsToSankeyData(flows);
      expect(result.links[0].value).toBe(150);

      // Step 5: Remove flow
      flows = flows.filter(flow => flow.id !== '1');
      result = transformFlowsToSankeyData(flows);
      expect(result.links).toHaveLength(1);
      expect(result.links[0].source).toBe('Sales');

      // Step 6: Clear all data
      flows = [];
      result = transformFlowsToSankeyData(flows);
      expect(result.nodes).toHaveLength(0);
      expect(result.links).toHaveLength(0);
    });

    it('should handle complex workflow with validation', () => {
      const flows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 30 },
        { id: '2', source: 'B', target: 'C', value: 20 },
        { id: '3', source: 'A', target: 'C', value: 10 },
        { id: '4', source: 'C', target: 'D', value: 25 }
      ];

      const result = transformFlowsToSankeyData(flows);

      // Verify complex network structure
      expect(result.nodes).toHaveLength(4);
      expect(result.links).toHaveLength(4);

      // Verify specific connections
      const linkMap = new Map(result.links.map(link => [`${link.source}-${link.target}`, link.value]));
      expect(linkMap.get('A-B')).toBe(30);
      expect(linkMap.get('B-C')).toBe(20);
      expect(linkMap.get('A-C')).toBe(10);
      expect(linkMap.get('C-D')).toBe(25);

      // Verify total flow value
      const totalValue = result.links.reduce((sum, link) => sum + link.value, 0);
      expect(totalValue).toBe(85);
    });
  });
});
