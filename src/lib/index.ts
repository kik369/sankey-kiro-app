// place files you want to import through the `$lib` alias in this folder.

// Export transformation functions
export {
  extractNodes,
  generateLinks,
  transformFlowsToSankeyData,
  validateSankeyTransformation,
  getSankeyDataSummary
} from './transform';

// Export types
export type {
  FlowData,
  SankeyNode,
  SankeyLink,
  SankeyChartData,
  ValidationResult,
  FlowInput,
  ThemeMode,
  ThemeConfig
} from './types';

// Export validation functions
export {
  validateFlowInput,
  validateFlowData,
  validateFlowDataArray,
  createFlowData,
  findDuplicateFlows
} from './validation';
