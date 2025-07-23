/**
 * Core data models for the Sankey Diagram App
 */

/**
 * Represents a single flow of data between two nodes
 */
export interface FlowData {
  id: string;
  source: string;
  target: string;
  value: number;
}

/**
 * Represents a node in the Sankey diagram
 */
export interface SankeyNode {
  name: string;
}

/**
 * Represents a link/connection between nodes in the Sankey diagram
 */
export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

/**
 * Complete data structure for ECharts Sankey diagram
 */
export interface SankeyChartData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * Validation result for flow data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Input data for creating a new flow (before validation)
 */
export interface FlowInput {
  source: string;
  target: string;
  value: string | number;
}

/**
 * Theme mode options
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Theme configuration object
 */
export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    background: string;
    text: string;
    border: string;
    accent: string;
    chartBackground: string;
  };
  chartTheme: {
    backgroundColor: string;
    textStyle: {
      color: string;
    };
    series: {
      itemStyle: {
        color: string;
        borderColor: string;
      };
      lineStyle: {
        color: string;
      };
    };
  };
}
