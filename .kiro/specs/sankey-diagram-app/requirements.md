# Requirements Document

## 🚨 MANDATORY TECHNOLOGY STACK

**CRITICAL: This project MUST use the following stack - NO SUBSTITUTIONS:**

-   **Frontend Framework**: Svelte 5 with runes
-   **Application Framework**: SvelteKit
-   **Runtime & Package Manager**: Bun (NEVER npm/yarn/pnpm)
-   **Build Tool**: Vite (integrated with SvelteKit)
-   **Charting Library**: Apache ECharts
-   **Styling**: Tailwind CSS with dark/light themes
-   **Language**: TypeScript

## Introduction

This feature involves creating a web application that allows users to create and visualize Sankey diagrams in real-time. Users will be able to input numerical data and immediately see the corresponding Sankey diagram update dynamically.

**Technology Stack:**

-   **Frontend Framework**: Svelte 5 with runes for reactive state management
-   **Build Tool**: SvelteKit for application framework
-   **Runtime & Package Manager**: Bun (NOT npm or yarn)
-   **Charting Library**: Apache ECharts for rendering Sankey diagrams
-   **Styling**: Tailwind CSS for styling with dark/light theme system
-   **Language**: TypeScript for type safety

## Requirements

### Requirement 1

**User Story:** As a user, I want to input numerical data for my Sankey diagram, so that I can visualize data flows between different nodes.

#### Acceptance Criteria

1. WHEN the user opens the application THEN the system SHALL display an input interface for entering Sankey diagram data
2. WHEN the user enters source node, target node, and value data THEN the system SHALL validate the input format
3. WHEN the user provides valid data THEN the system SHALL accept and store the input for diagram generation
4. IF the user enters invalid data THEN the system SHALL display clear error messages indicating what needs to be corrected

### Requirement 2

**User Story:** As a user, I want to see my Sankey diagram update in real-time as I modify the data, so that I can immediately visualize the impact of my changes.

#### Acceptance Criteria

1. WHEN the user modifies any input data THEN the system SHALL automatically update the Sankey diagram within 500ms
2. WHEN the user adds a new data connection THEN the system SHALL immediately render the new flow in the diagram
3. WHEN the user removes a data connection THEN the system SHALL immediately remove the corresponding flow from the diagram
4. WHEN the user changes a flow value THEN the system SHALL update the thickness of the corresponding connection in real-time

### Requirement 3

**User Story:** As a user, I want to add and remove multiple data flows, so that I can create complex Sankey diagrams with multiple connections.

#### Acceptance Criteria

1. WHEN the user clicks an "Add Flow" button THEN the system SHALL provide a new input row for source, target, and value
2. WHEN the user clicks a "Remove" button next to a flow THEN the system SHALL delete that specific data entry and update the diagram
3. WHEN the user has multiple flows THEN the system SHALL render all connections simultaneously in the diagram
4. WHEN the user has no data flows THEN the system SHALL display an empty diagram with helpful placeholder text

### Requirement 4

**User Story:** As a user, I want the Sankey diagram to be visually clear and interactive, so that I can easily understand the data relationships.

#### Acceptance Criteria

1. WHEN the diagram is rendered THEN the system SHALL use Apache ECharts to display a properly formatted Sankey diagram
2. WHEN the user hovers over a node or connection THEN the system SHALL display tooltip information showing relevant values
3. WHEN the diagram contains multiple flows THEN the system SHALL use distinct colors or visual cues to differentiate between connections
4. WHEN the diagram is displayed THEN the system SHALL automatically scale and position nodes for optimal readability

### Requirement 5

**User Story:** As a user, I want the application to be responsive and performant, so that I can use it effectively on different devices.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL be fully interactive within 3 seconds
2. WHEN the user interacts with the interface THEN the system SHALL respond to input changes within 100ms
3. WHEN the application is viewed on different screen sizes THEN the system SHALL adapt the layout appropriately
4. WHEN the diagram contains up to 50 nodes and 100 connections THEN the system SHALL maintain smooth performance

### Requirement 6

**User Story:** As a user, I want to clear all data and start over, so that I can create new diagrams without manual deletion of each entry.

#### Acceptance Criteria

1. WHEN the user clicks a "Clear All" button THEN the system SHALL remove all input data
2. WHEN all data is cleared THEN the system SHALL reset the diagram to an empty state
3. WHEN the user confirms the clear action THEN the system SHALL provide a confirmation dialog to prevent accidental data loss
4. WHEN the diagram is cleared THEN the system SHALL maintain the input interface ready for new data entry

### Requirement 7

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the application in different lighting conditions and according to my preferences.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display the interface in dark theme by default
2. WHEN the user clicks the theme switcher button THEN the system SHALL toggle between dark and light themes
3. WHEN the theme is switched THEN the system SHALL apply the new theme to all UI components including the diagram
4. WHEN the user switches themes THEN the system SHALL remember the preference for future sessions
5. WHEN the theme changes THEN the system SHALL update the ECharts diagram colors to match the selected theme

### Requirement 8

**User Story:** As a user, I want the application to have a modern and clean visual design, so that it's pleasant and intuitive to use.

#### Acceptance Criteria

1. WHEN the application is displayed THEN the system SHALL use Tailwind CSS for consistent styling
2. WHEN the interface is rendered THEN the system SHALL follow modern design principles with appropriate spacing and typography
3. WHEN elements are interactive THEN the system SHALL provide visual feedback through hover states and transitions
4. WHEN the application is in dark theme THEN the system SHALL use appropriate dark colors that are easy on the eyes
5. WHEN the application is in light theme THEN the system SHALL use clean, high-contrast colors for good readability
