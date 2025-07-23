import { describe, it, expect, beforeEach } from 'vitest';
import { validateFlowInput, validateFlowDataArray, createFlowData } from '$lib/validation';
import { transformFlowsToSankeyData } from '$lib/transform';
import type { FlowInput, FlowData } from '$lib/types';

describe('Invalid Data Input Handling', () => {
    describe('Extreme Input Values', () => {
        it('should handle extremely long node names', () => {
            const longName = 'A'.repeat(1000);
            const input: FlowInput = {
                source: longName,
                target: 'B',
                value: '10'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Source name is quite long - consider shortening for better display');
        });

        it('should handle extremely large values', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: '999999999999'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Very large values may affect chart readability');
        });

        it('should handle extremely small values', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: '0.000001'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Very small values may be hard to see in the chart');
        });

        it('should reject infinite values', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: 'Infinity'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Value must be a finite number (not infinity)');
        });

        it('should reject NaN values', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: 'NaN'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Value must be a valid number (e.g., 10, 5.5, 100)');
        });
    });

    describe('Malicious Input Handling', () => {
        it('should handle HTML injection attempts', () => {
            const input: FlowInput = {
                source: '<script>alert("xss")</script>',
                target: '<img src="x" onerror="alert(1)">',
                value: '10'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Source contains special characters that may affect display');
            expect(result.warnings).toContain('Target contains special characters that may affect display');
        });

        it('should handle SQL injection patterns', () => {
            const input: FlowInput = {
                source: "'; DROP TABLE users; --",
                target: "1' OR '1'='1",
                value: '10'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Source contains special characters that may affect display');
            expect(result.warnings).toContain('Target contains special characters that may affect display');
        });

        it('should handle Unicode and emoji characters', () => {
            const input: FlowInput = {
                source: '🚀 Source Node 中文',
                target: '🎯 Target Node العربية',
                value: '10'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            // Unicode characters should be allowed
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Edge Case Data Structures', () => {
        it('should handle null and undefined inputs', () => {
            const inputs = [
                { source: null, target: 'B', value: '10' },
                { source: 'A', target: undefined, value: '10' },
                { source: 'A', target: 'B', value: null }
            ];

            inputs.forEach((input: any) => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });

        it('should handle whitespace-only inputs', () => {
            const input: FlowInput = {
                source: '   ',
                target: '\t\n',
                value: '  10  '
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Source cannot be empty or just spaces');
            expect(result.errors).toContain('Target cannot be empty or just spaces');
        });

        it('should handle mixed data types', () => {
            const input: any = {
                source: 123,
                target: true,
                value: { number: 10 }
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('Performance Limit Testing', () => {
        it('should validate arrays exceeding node limits', () => {
            const flows: FlowData[] = [];

            // Create flows that will generate more than 50 unique nodes
            for (let i = 0; i < 60; i++) {
                flows.push({
                    id: `flow_${i}`,
                    source: `Source_${i}`,
                    target: `Target_${i}`,
                    value: 10
                });
            }

            const result = validateFlowDataArray(flows);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Maximum of 50 nodes allowed for optimal performance');
        });

        it('should validate arrays exceeding connection limits', () => {
            const flows: FlowData[] = [];

            // Create more than 100 connections
            for (let i = 0; i < 110; i++) {
                flows.push({
                    id: `flow_${i}`,
                    source: 'A',
                    target: 'B',
                    value: 10
                });
            }

            const result = validateFlowDataArray(flows);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Maximum of 100 connections allowed for optimal performance');
        });
    });

    describe('Data Transformation Error Handling', () => {
        it('should handle empty flow arrays', () => {
            const result = transformFlowsToSankeyData([]);
            expect(result.nodes).toHaveLength(0);
            expect(result.links).toHaveLength(0);
        });

        it('should handle flows with missing properties', () => {
            const invalidFlows: any[] = [
                { id: '1', source: 'A' }, // missing target and value
                { id: '2', target: 'B', value: 10 }, // missing source
                { id: '3', source: 'A', target: 'B' } // missing value
            ];

            expect(() => transformFlowsToSankeyData(invalidFlows)).toThrow();
        });

        it('should handle flows with invalid value types', () => {
            const invalidFlows: any[] = [
                { id: '1', source: 'A', target: 'B', value: 'invalid' },
                { id: '2', source: 'C', target: 'D', value: null },
                { id: '3', source: 'E', target: 'F', value: undefined }
            ];

            expect(() => transformFlowsToSankeyData(invalidFlows)).toThrow();
        });

        it('should handle circular references', () => {
            const flows: FlowData[] = [
                { id: '1', source: 'A', target: 'B', value: 10 },
                { id: '2', source: 'B', target: 'C', value: 10 },
                { id: '3', source: 'C', target: 'A', value: 10 }
            ];

            // Should not throw - circular references are valid in Sankey diagrams
            const result = transformFlowsToSankeyData(flows);
            expect(result.nodes).toHaveLength(3);
            expect(result.links).toHaveLength(3);
        });
    });

    describe('Boundary Value Testing', () => {
        it('should handle minimum valid values', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: '0.01'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
        });

        it('should handle maximum reasonable values', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: '999999'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
        });

        it('should reject values at the boundary', () => {
            const zeroInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: '0'
            };

            const negativeInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: '-0.01'
            };

            expect(validateFlowInput(zeroInput).isValid).toBe(false);
            expect(validateFlowInput(negativeInput).isValid).toBe(false);
        });
    });

    describe('Concurrent Error Scenarios', () => {
        it('should handle multiple validation errors simultaneously', () => {
            const input: FlowInput = {
                source: '',
                target: '',
                value: 'invalid'
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(3); // source, target, and value errors
        });

        it('should handle validation errors with warnings', () => {
            const input: FlowInput = {
                source: 'A'.repeat(60), // Long name (warning)
                target: 'A'.repeat(60), // Same long name (error + warning)
                value: '0.001' // Small value (warning)
            };

            const result = validateFlowInput(input);
            expect(result.isValid).toBe(false); // Due to same source/target
            expect(result.errors).toContain('Source and target must be different nodes');
            expect(result.warnings).toHaveLength(3); // Two long names + small value
        });
    });

    describe('Recovery Testing', () => {
        it('should allow valid input after invalid input', () => {
            // First invalid input
            const invalidInput: FlowInput = {
                source: '',
                target: 'B',
                value: '10'
            };

            const invalidResult = validateFlowInput(invalidInput);
            expect(invalidResult.isValid).toBe(false);

            // Then valid input
            const validInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: '10'
            };

            const validResult = validateFlowInput(validInput);
            expect(validResult.isValid).toBe(true);
        });

        it('should create valid flow data after fixing errors', () => {
            const validInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: '10'
            };

            expect(() => createFlowData(validInput)).not.toThrow();

            const flowData = createFlowData(validInput);
            expect(flowData.source).toBe('A');
            expect(flowData.target).toBe('B');
            expect(flowData.value).toBe(10);
            expect(flowData.id).toBeDefined();
        });
    });
});
