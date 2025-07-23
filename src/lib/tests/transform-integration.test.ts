/**
 * Integration tests for the complete data transformation pipeline
 */

import { describe, it, expect } from 'vitest';
import type { FlowInput } from '../types';
import { createFlowData } from '../validation';
import { transformFlowsToSankeyData, validateSankeyTransformation } from '../transform';

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

  it('should handle edge cases in the pipeline', () => {
    // Test with minimal data
    const minimalInput: FlowInput[] = [
      { source: 'A', target: 'B', value: '1' }
    ];

    const flows = minimalInput.map(input =>
      createFlowData(input)
    );

    const sankeyData = transformFlowsToSankeyData(flows);

    expect(sankeyData.nodes).toHaveLength(2);
    expect(sankeyData.links).toHaveLength(1);
    expect(sankeyData.links[0].value).toBe(1);
  });

  it('should detect and warn about problematic data patterns', () => {
    // Create flows manually since self-loops are rejected by validation
    const flows = [
      { id: 'prob-0', source: 'A', target: 'A', value: 10 }, // Self-loop
      { id: 'prob-1', source: 'B', target: 'C', value: 0 },  // Zero value
      { id: 'prob-2', source: 'D', target: 'E', value: 5 }   // Normal flow
    ];

    const validation = validateSankeyTransformation(flows);

    expect(validation.isValid).toBe(true); // Should still be valid
    expect(validation.warnings).toHaveLength(2); // Self-loop and zero value warnings
    expect(validation.warnings.some(w => w.includes('self-loop'))).toBe(true);
    expect(validation.warnings.some(w => w.includes('zero values'))).toBe(true);
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
