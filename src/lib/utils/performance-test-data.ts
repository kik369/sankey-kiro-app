/**
 * Performance testing utilities for generating test data
 */

import type { FlowData } from '$lib/types.js';
import { PERFORMANCE_LIMITS } from './performance-limits.js';

/**
 * Generates test data with specified number of nodes and connections
 */
export function generateTestData(nodeCount: number, connectionCount: number): FlowData[] {
  const flows: FlowData[] = [];

  // Generate node names
  const nodeNames: string[] = [];
  for (let i = 0; i < nodeCount; i++) {
    nodeNames.push(`Node_${i + 1}`);
  }

  // Generate connections
  for (let i = 0; i < connectionCount; i++) {
    const sourceIndex = Math.floor(Math.random() * nodeNames.length);
    let targetIndex = Math.floor(Math.random() * nodeNames.length);

    // Ensure source and target are different
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * nodeNames.length);
    }

    const value = Math.floor(Math.random() * 100) + 1; // Random value between 1-100

    flows.push({
      id: `flow_${i + 1}`,
      source: nodeNames[sourceIndex],
      target: nodeNames[targetIndex],
      value: value
    });
  }

  return flows;
}

/**
 * Generates maximum allowed test data (50 nodes, 100 connections)
 */
export function generateMaxTestData(): FlowData[] {
  return generateTestData(PERFORMANCE_LIMITS.MAX_NODES, PERFORMANCE_LIMITS.MAX_CONNECTIONS);
}

/**
 * Generates warning-level test data (40 nodes, 80 connections)
 */
export function generateWarningTestData(): FlowData[] {
  return generateTestData(PERFORMANCE_LIMITS.WARNING_NODES, PERFORMANCE_LIMITS.WARNING_CONNECTIONS);
}

/**
 * Generates realistic business scenario test data
 */
export function generateBusinessScenarioData(): FlowData[] {
  const businessNodes = [
    'Marketing', 'Sales', 'Customer_Service', 'Product_Development', 'Engineering',
    'Quality_Assurance', 'Operations', 'Finance', 'HR', 'Legal',
    'Research', 'Design', 'Manufacturing', 'Supply_Chain', 'Distribution',
    'Retail', 'Online_Sales', 'Mobile_App', 'Website', 'Social_Media',
    'Email_Marketing', 'Content_Marketing', 'SEO', 'PPC', 'Analytics'
  ];

  const flows: FlowData[] = [];
  let flowId = 1;

  // Create realistic business flows
  const businessFlows = [
    { source: 'Marketing', target: 'Sales', value: 85 },
    { source: 'Marketing', target: 'Online_Sales', value: 120 },
    { source: 'Sales', target: 'Customer_Service', value: 45 },
    { source: 'Online_Sales', target: 'Customer_Service', value: 30 },
    { source: 'Product_Development', target: 'Engineering', value: 95 },
    { source: 'Engineering', target: 'Quality_Assurance', value: 75 },
    { source: 'Quality_Assurance', target: 'Manufacturing', value: 65 },
    { source: 'Manufacturing', target: 'Supply_Chain', value: 80 },
    { source: 'Supply_Chain', target: 'Distribution', value: 70 },
    { source: 'Distribution', target: 'Retail', value: 50 },
    { source: 'Research', target: 'Product_Development', value: 40 },
    { source: 'Design', target: 'Product_Development', value: 35 },
    { source: 'Website', target: 'Online_Sales', value: 60 },
    { source: 'Mobile_App', target: 'Online_Sales', value: 45 },
    { source: 'Social_Media', target: 'Marketing', value: 55 },
    { source: 'Email_Marketing', target: 'Marketing', value: 40 },
    { source: 'Content_Marketing', target: 'SEO', value: 25 },
    { source: 'SEO', target: 'Website', value: 35 },
    { source: 'PPC', target: 'Website', value: 30 },
    { source: 'Analytics', target: 'Marketing', value: 20 }
  ];

  businessFlows.forEach(flow => {
    flows.push({
      id: `business_flow_${flowId++}`,
      source: flow.source,
      target: flow.target,
      value: flow.value
    });
  });

  return flows;
}

/**
 * Measures performance of data operations
 */
export function measurePerformance<T>(operation: () => T, label: string): T {
  const startTime = performance.now();
  const result = operation();
  const endTime = performance.now();

  console.log(`${label}: ${(endTime - startTime).toFixed(2)}ms`);
  return result;
}

/**
 * Performance test suite for the application
 */
export class PerformanceTestSuite {
  private results: { [key: string]: number } = {};

  async testDataGeneration() {
    console.log('🧪 Testing data generation performance...');

    this.results.smallDataGeneration = this.measureOperation(
      () => generateTestData(10, 20),
      'Small dataset generation (10 nodes, 20 connections)'
    );

    this.results.mediumDataGeneration = this.measureOperation(
      () => generateTestData(25, 50),
      'Medium dataset generation (25 nodes, 50 connections)'
    );

    this.results.largeDataGeneration = this.measureOperation(
      () => generateTestData(50, 100),
      'Large dataset generation (50 nodes, 100 connections)'
    );
  }

  async testChartDataTransformation() {
    console.log('🧪 Testing chart data transformation performance...');

    const { transformFlowsToSankeyData } = await import('../transform.js');

    const smallData = generateTestData(10, 20);
    const mediumData = generateTestData(25, 50);
    const largeData = generateTestData(50, 100);

    this.results.smallTransformation = this.measureOperation(
      () => transformFlowsToSankeyData(smallData),
      'Small dataset transformation'
    );

    this.results.mediumTransformation = this.measureOperation(
      () => transformFlowsToSankeyData(mediumData),
      'Medium dataset transformation'
    );

    this.results.largeTransformation = this.measureOperation(
      () => transformFlowsToSankeyData(largeData),
      'Large dataset transformation'
    );
  }

  private measureOperation<T>(operation: () => T, label: string): number {
    const startTime = performance.now();
    operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`  ✓ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  getResults() {
    return this.results;
  }

  printSummary() {
    console.log('\n📊 Performance Test Summary:');
    console.log('================================');

    Object.entries(this.results).forEach(([test, duration]) => {
      const status = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
      console.log(`${status} ${test}: ${duration.toFixed(2)}ms`);
    });

    const avgDuration = Object.values(this.results).reduce((a, b) => a + b, 0) / Object.values(this.results).length;
    console.log(`\n📈 Average duration: ${avgDuration.toFixed(2)}ms`);
  }
}

/**
 * Runs a comprehensive performance test
 */
export async function runPerformanceTests(): Promise<void> {
  console.log('🚀 Starting Performance Tests...\n');

  const testSuite = new PerformanceTestSuite();

  await testSuite.testDataGeneration();
  await testSuite.testChartDataTransformation();

  testSuite.printSummary();
}
