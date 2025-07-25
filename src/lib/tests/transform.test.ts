/**
 * Data Transformation Tests
 * Unit and integration tests for data transformation functions and pipeline
 */

import { describe, it, expect } from 'vitest';
import type { FlowData, FlowInput } from '../types';
import { createFlowData } from '../validation';
import {
  extractNodes,
  generateLinks,
  transformFlowsToSankeyData,
  validateSankeyTransformation,
  getSankeyDataSummary
} from '../transform';

describe('Data Transformation Functions', () => {
  // Sample test data
  const sampleFlows: FlowData[] = [
    { id: '1', source: 'A', target: 'B', value: 10 },
    { id: '2', source: 'A', target: 'C', value: 20 },
    { id: '3', source: 'B', target: 'D', value: 15 },
    { id: '4', source: 'C', target: 'D', value: 25 }
  ];

  describe('extractNodes', () => {
    it('should extract unique nodes from flow data', () => {
      const nodes = extractNodes(sampleFlows);

      expect(nodes).toHaveLength(4);
      expect(nodes.map(n => n.name).sort()).toEqual(['A', 'B', 'C', 'D']);
    });

    it('should handle empty flow array', () => {
      const nodes = extractNodes([]);
      expect(nodes).toEqual([]);
    });

    it('should handle duplicate source/target pairs', () => {
      const duplicateFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 10 },
        { id: '2', source: 'A', target: 'B', value: 20 },
        { id: '3', source: 'B', target: 'A', value: 5 }
      ];

      const nodes = extractNodes(duplicateFlows);
      expect(nodes).toHaveLength(2);
      expect(nodes.map(n => n.name).sort()).toEqual(['A', 'B']);
    });

    it('should handle single flow', () => {
      const singleFlow: FlowData[] = [
        { id: '1', source: 'Source', target: 'Target', value: 100 }
      ];

      const nodes = extractNodes(singleFlow);
      expect(nodes).toHaveLength(2);
      expect(nodes.map(n => n.name).sort()).toEqual(['Source', 'Target']);
    });
  });

  describe('generateLinks', () => {
    it('should generate ECharts-compatible links', () => {
      const links = generateLinks(sampleFlows);

      expect(links).toHaveLength(4);
      expect(links[0]).toEqual({
        source: 'A',
        target: 'B',
        value: 10
      });
      expect(links[1]).toEqual({
        source: 'A',
        target: 'C',
        value: 20
      });
    });

    it('should handle empty flow array', () => {
      const links = generateLinks([]);
      expect(links).toEqual([]);
    });

    it('should preserve all flow properties in links', () => {
      const testFlow: FlowData[] = [
        { id: '1', source: 'Test Source', target: 'Test Target', value: 42.5 }
      ];

      const links = generateLinks(testFlow);
      expect(links).toHaveLength(1);
      expect(links[0]).toEqual({
        source: 'Test Source',
        target: 'Test Target',
        value: 42.5
      });
    });
  });

  describe('transformFlowsToSankeyData', () => {
    it('should transform flows to complete Sankey data structure', () => {
      const sankeyData = transformFlowsToSankeyData(sampleFlows);

      expect(sankeyData.nodes).toHaveLength(4);
      expect(sankeyData.links).toHaveLength(4);
      expect(sankeyData.nodes.map(n => n.name).sort()).toEqual(['A', 'B', 'C', 'D']);
      expect(sankeyData.links[0]).toEqual({
        source: 'A',
        target: 'B',
        value: 10
      });
    });

    it('should handle empty flows', () => {
      const sankeyData = transformFlowsToSankeyData([]);

      expect(sankeyData).toEqual({
        nodes: [],
        links: []
      });
    });

    it('should handle null/undefined flows', () => {
      expect(() => transformFlowsToSankeyData(null as any)).toThrow('Flows cannot be null or undefined');
      expect(() => transformFlowsToSankeyData(undefined as any)).toThrow('Flows cannot be null or undefined');
    });

    it('should maintain data consistency between nodes and links', () => {
      const complexFlows: FlowData[] = [
        { id: '1', source: 'Input1', target: 'Process', value: 100 },
        { id: '2', source: 'Input2', target: 'Process', value: 50 },
        { id: '3', source: 'Process', target: 'Output1', value: 80 },
        { id: '4', source: 'Process', target: 'Output2', value: 70 }
      ];

      const sankeyData = transformFlowsToSankeyData(complexFlows);

      // All link sources and targets should exist in nodes
      const nodeNames = sankeyData.nodes.map(n => n.name);
      sankeyData.links.forEach(link => {
        expect(nodeNames).toContain(link.source);
        expect(nodeNames).toContain(link.target);
      });
    });
  });

  describe('validateSankeyTransformation', () => {
    it('should validate normal flow data', () => {
      const result = validateSankeyTransformation(sampleFlows);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty flows', () => {
      const result = validateSankeyTransformation([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect negative values', () => {
      const negativeFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: -10 },
        { id: '2', source: 'B', target: 'C', value: 20 }
      ];

      const result = validateSankeyTransformation(negativeFlows);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Found 1 flow(s) with negative values');
    });

    it('should detect self-loops', () => {
      const selfLoopFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'A', value: 10 },
        { id: '2', source: 'B', target: 'C', value: 20 }
      ];

      const result = validateSankeyTransformation(selfLoopFlows);

      expect(result.isValid).toBe(true); // Self-loops are warnings, not errors
      expect(result.warnings).toContain('Found 1 self-loop(s) which may not display well in Sankey diagrams');
    });

    it('should detect zero values', () => {
      const zeroFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 0 },
        { id: '2', source: 'B', target: 'C', value: 20 }
      ];

      const result = validateSankeyTransformation(zeroFlows);

      expect(result.isValid).toBe(true); // Zero values are warnings, not errors
      expect(result.warnings).toContain('Found 1 flow(s) with zero values which will not be visible');
    });

    it('should warn about large datasets', () => {
      // Create flows with many nodes (> 50)
      const largeFlows: FlowData[] = [];
      for (let i = 0; i < 60; i++) {
        largeFlows.push({
          id: `${i}`,
          source: `Node${i}`,
          target: `Node${i + 1}`,
          value: 10
        });
      }

      const result = validateSankeyTransformation(largeFlows);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('61 nodes'))).toBe(true);
    });

    it('should warn about many connections', () => {
      // Create many flows (> 100)
      const manyFlows: FlowData[] = [];
      for (let i = 0; i < 110; i++) {
        manyFlows.push({
          id: `${i}`,
          source: 'A',
          target: 'B',
          value: 1
        });
      }

      const result = validateSankeyTransformation(manyFlows);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('110 connections'))).toBe(true);
    });
  });

  describe('getSankeyDataSummary', () => {
    it('should calculate correct summary statistics', () => {
      const summary = getSankeyDataSummary(sampleFlows);

      expect(summary.nodeCount).toBe(4);
      expect(summary.linkCount).toBe(4);
      expect(summary.totalValue).toBe(70); // 10 + 20 + 15 + 25
      expect(summary.maxValue).toBe(25);
      expect(summary.minValue).toBe(10);
    });

    it('should handle empty flows', () => {
      const summary = getSankeyDataSummary([]);

      expect(summary).toEqual({
        nodeCount: 0,
        linkCount: 0,
        totalValue: 0,
        maxValue: 0,
        minValue: 0
      });
    });

    it('should handle single flow', () => {
      const singleFlow: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 42 }
      ];

      const summary = getSankeyDataSummary(singleFlow);

      expect(summary.nodeCount).toBe(2);
      expect(summary.linkCount).toBe(1);
      expect(summary.totalValue).toBe(42);
      expect(summary.maxValue).toBe(42);
      expect(summary.minValue).toBe(42);
    });

    it('should handle decimal values', () => {
      const decimalFlows: FlowData[] = [
        { id: '1', source: 'A', target: 'B', value: 10.5 },
        { id: '2', source: 'B', target: 'C', value: 20.25 }
      ];

      const summary = getSankeyDataSummary(decimalFlows);

      expect(summary.totalValue).toBe(30.75);
      expect(summary.maxValue).toBe(20.25);
      expect(summary.minValue).toBe(10.5);
    });

    it('should handle null/undefined flows', () => {
      const summary1 = getSankeyDataSummary(null as any);
      const summary2 = getSankeyDataSummary(undefined as any);

      const expectedResult = {
        nodeCount: 0,
        linkCount: 0,
        totalValue: 0,
        maxValue: 0,
        minValue: 0
      };

      expect(summary1).toEqual(expectedResult);
      expect(summary2).toEqual(expectedResult);
    });
  });
});

describe('Data Transformation Pipeline Integration', () => {
  it('should handle complete flow from input to Sankey data', () => {
    // Simulate user input
    const userInputs: FlowInput[] = [
      { source: 'Coal', target: 'Electricity', value: '50' },
      { source: 'Gas', target: 'Electricity', value: '30' },
      { source: 'Solar', target: 'Electricity', value: '20' },
      { source: 'Electricity', target: 'Homes', value: '60' },
      { source: 'Electricity', target: 'Industry', value: '40' }
    ];

    // Step 1: Convert inputs to validated flow data
    const flows = userInputs.map(input =>
      createFlowData(input)
    );

    // Step 2: Validate for Sankey transformation
    const validation = validateSankeyTransformation(flows);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Step 3: Transform to Sankey format
    const sankeyData = transformFlowsToSankeyData(flows);

    // Verify the transformation
    expect(sankeyData.nodes).toHaveLength(6); // Coal, Gas, Solar, Electricity, Homes, Industry
    expect(sankeyData.links).toHaveLength(5);

    // Verify node names
    const nodeNames = sankeyData.nodes.map(n => n.name).sort();
    expect(nodeNames).toEqual(['Coal', 'Electricity', 'Gas', 'Homes', 'Industry', 'Solar']);

    // Verify links maintain correct values
    const electricityToHomes = sankeyData.links.find(
      link => link.source === 'Electricity' && link.target === 'Homes'
    );
    expect(electricityToHomes?.value).toBe(60);

    const solarToElectricity = sankeyData.links.find(
      link => link.source === 'Solar' && link.target === 'Electricity'
    );
    expect(solarToElectricity?.value).toBe(20);
  });

  it('should handle complex multi-level flow scenarios', () => {
    const complexInputs: FlowInput[] = [
      // Primary sources
      { source: 'Oil', target: 'Refinery', value: '100' },
      { source: 'Gas', target: 'Power Plant', value: '80' },

      // Secondary processing
      { source: 'Refinery', target: 'Gasoline', value: '60' },
      { source: 'Refinery', target: 'Diesel', value: '40' },
      { source: 'Power Plant', target: 'Electricity', value: '80' },

      // End consumption
      { source: 'Gasoline', target: 'Transportation', value: '60' },
      { source: 'Diesel', target: 'Transportation', value: '20' },
      { source: 'Diesel', target: 'Industry', value: '20' },
      { source: 'Electricity', target: 'Residential', value: '50' },
      { source: 'Electricity', target: 'Commercial', value: '30' }
    ];

    const flows = complexInputs.map(input =>
      createFlowData(input)
    );

    const sankeyData = transformFlowsToSankeyData(flows);

    // Should have all unique nodes
    expect(sankeyData.nodes).toHaveLength(11);
    expect(sankeyData.links).toHaveLength(10);

    // Verify conservation of flow at intermediate nodes
    const refineryInput = sankeyData.links
      .filter(link => link.target === 'Refinery')
      .reduce((sum, link) => sum + link.value, 0);

    const refineryOutput = sankeyData.links
      .filter(link => link.source === 'Refinery')
      .reduce((sum, link) => sum + link.value, 0);

    expect(refineryInput).toBe(100);
    expect(refineryOutput).toBe(100); // Conservation of flow
  });

  it('should maintain data integrity through the entire pipeline', () => {
    const testInputs: FlowInput[] = [
      { source: 'Source1', target: 'Middle', value: '25.5' },
      { source: 'Source2', target: 'Middle', value: '34.5' },
      { source: 'Middle', target: 'Target1', value: '40' },
      { source: 'Middle', target: 'Target2', value: '20' }
    ];

    const flows = testInputs.map(input =>
      createFlowData(input)
    );

    const sankeyData = transformFlowsToSankeyData(flows);

    // Verify all original values are preserved
    expect(sankeyData.links.find(l => l.source === 'Source1')?.value).toBe(25.5);
    expect(sankeyData.links.find(l => l.source === 'Source2')?.value).toBe(34.5);
    expect(sankeyData.links.find(l => l.target === 'Target1')?.value).toBe(40);
    expect(sankeyData.links.find(l => l.target === 'Target2')?.value).toBe(20);

    // Verify node consistency
    const allSourcesAndTargets = new Set([
      ...sankeyData.links.map(l => l.source),
      ...sankeyData.links.map(l => l.target)
    ]);

    const nodeNames = new Set(sankeyData.nodes.map(n => n.name));

    expect(allSourcesAndTargets).toEqual(nodeNames);
  });
});
