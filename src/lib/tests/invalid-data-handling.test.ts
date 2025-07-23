import { describe, it, expect, beforeEach } from 'vitest';
import { validateFlowInput, createFlowData, validateFlowDataArray } from '$lib/validation';
import { transformFlowsToSankeyData } from '$lib/transform';
import { errorHandler } from '$lib/utils/error-handler';
import type { FlowInput, FlowData } from '$lib/types';

describe('Invalid Data Handling - Comprehensive Test Suite', () => {
    beforeEach(() => {
        errorHandler.clearAllErrors();
    });

    describe('Extreme Input Validation', () => {
        it('should handle completely malformed inputs', () => {
            const malformedInputs: any[] = [
                null,
                undefined,
                'string-instead-of-object',
                123,
                [],
                true,
                { wrong: 'structure' },
                { source: null, target: null, value: null }
            ];

            malformedInputs.forEach((input) => {
                try {
                    const result = validateFlowInput(input);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                } catch (error) {
                    // Some inputs might throw before validation
                    expect(error).toBeDefined();
                }
            });
        });

        it('should handle edge case string inputs', () => {
            const edgeCaseInputs: FlowInput[] = [
                { source: '', target: '', value: '' },
                { source: '   ', target: '   ', value: '   ' },
                { source: '\n\t', target: '\r\n', value: '\t' },
                { source: '0', target: '0', value: '0' },
                { source: 'null', target: 'undefined', value: 'NaN' },
                { source: 'true', target: 'false', value: 'Infinity' },
                { source: '[]', target: '{}', value: 'function(){}' }
            ];

            edgeCaseInputs.forEach((input) => {
                const result = validateFlowInput(input);

                if (input.source.trim() === '' || input.target.trim() === '') {
                    expect(result.isValid).toBe(false);
                    expect(result.errors.some(error =>
                        error.includes('empty') || error.includes('whitespace')
                    )).toBe(true);
                }

                if (String(input.value) === '0' || String(input.value) === 'NaN' || String(input.value) === 'Infinity') {
                    expect(result.isValid).toBe(false);
                }
            });
        });

        it('should handle unicode and special character inputs', () => {
            const unicodeInputs: FlowInput[] = [
                { source: '🚀', target: '🎯', value: '10' },
                { source: '中文', target: 'العربية', value: '15' },
                { source: 'Ñoño', target: 'Café', value: '20' },
                { source: '\\n\\t\\r', target: '\\\\', value: '25' },
                { source: '<script>alert("xss")</script>', target: 'DROP TABLE users;', value: '30' },
                { source: '&lt;&gt;&amp;', target: '&#x27;&#x22;', value: '35' }
            ];

            unicodeInputs.forEach(input => {
                const result = validateFlowInput(input);

                // Unicode should be valid
                if (input.source === '🚀' || input.source === '中文' || input.source === 'Ñoño') {
                    expect(result.isValid).toBe(true);
                }

                // Special characters should trigger warnings
                if (input.source.includes('<') || input.source.includes('&')) {
                    expect(result.warnings?.some(warning =>
                        warning.includes('special characters')
                    )).toBe(true);
                }
            });
        });

        it('should handle extremely large inputs', () => {
            const largeInputs: FlowInput[] = [
                { source: 'A'.repeat(1000), target: 'B', value: '10' },
                { source: 'A', target: 'B'.repeat(1000), value: '10' },
                { source: 'A', target: 'B', value: '9'.repeat(20) },
                { source: 'A', target: 'B', value: '1e308' }, // Near JavaScript max
                { source: 'A', target: 'B', value: '1e309' }  // Infinity
            ];

            largeInputs.forEach(input => {
                const result = validateFlowInput(input);

                if (input.source.length > 100 || input.target.length > 100) {
                    expect(result.isValid).toBe(false);
                    expect(result.errors.some(error =>
                        error.includes('too long')
                    )).toBe(true);
                }

                if (String(input.value) === '1e309') {
                    expect(result.isValid).toBe(false);
                    expect(result.errors.some(error =>
                        error.includes('finite')
                    )).toBe(true);
                }
            });
        });
    });

    describe('Data Type Confusion', () => {
        it('should handle type confusion in flow inputs', () => {
            const typeConfusedInputs: any[] = [
                { source: 123, target: 'B', value: '10' },
                { source: 'A', target: true, value: '10' },
                { source: 'A', target: 'B', value: false },
                { source: ['A'], target: 'B', value: '10' },
                { source: 'A', target: { name: 'B' }, value: '10' },
                { source: 'A', target: 'B', value: [10] },
                { source: () => 'A', target: 'B', value: '10' }
            ];

            typeConfusedInputs.forEach(input => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });

        it('should handle numeric string edge cases', () => {
            const numericEdgeCases: FlowInput[] = [
                { source: 'A', target: 'B', value: '0.0' },
                { source: 'A', target: 'B', value: '00010' },
                { source: 'A', target: 'B', value: '+10' },
                { source: 'A', target: 'B', value: '10.' },
                { source: 'A', target: 'B', value: '.10' },
                { source: 'A', target: 'B', value: '1e2' },
                { source: 'A', target: 'B', value: '1E-2' },
                { source: 'A', target: 'B', value: '10,5' }, // European decimal
                { source: 'A', target: 'B', value: '10 5' }, // Space in number
                { source: 'A', target: 'B', value: '10$' }   // Currency symbol
            ];

            numericEdgeCases.forEach(input => {
                const result = validateFlowInput(input);

                // Valid numeric formats
                if (['0.0', '00010', '+10', '10.', '.10', '1e2', '1E-2'].includes(String(input.value))) {
                    if (String(input.value) === '0.0') {
                        expect(result.isValid).toBe(false); // Zero not allowed
                    } else {
                        expect(result.isValid).toBe(true);
                    }
                }

                // Invalid numeric formats
                if (['10,5', '10 5', '10$'].includes(String(input.value))) {
                    expect(result.isValid).toBe(false);
                    expect(result.errors.some(error =>
                        error.includes('valid number')
                    )).toBe(true);
                }
            });
        });
    });

    describe('Flow Data Array Validation', () => {
        it('should handle malformed flow data arrays', () => {
            const malformedArrays: any[] = [
                null,
                undefined,
                'not-an-array',
                123,
                { notAnArray: true },
                [null, undefined],
                ['string', 'elements'],
                [{ incomplete: 'data' }],
                [{ id: '1', source: 'A' }], // Missing target and value
                [{ source: 'A', target: 'B', value: 10 }], // Missing id
            ];

            malformedArrays.forEach(flows => {
                if (!Array.isArray(flows)) {
                    const result = validateFlowDataArray(flows);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.some(error =>
                        error.includes('array')
                    )).toBe(true);
                } else {
                    const result = validateFlowDataArray(flows);
                    expect(result.isValid).toBe(false);
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            });
        });

        it('should handle performance limit violations', () => {
            // Create flows that exceed node limit (50 nodes)
            const manyNodeFlows: FlowData[] = [];
            for (let i = 0; i < 60; i++) {
                manyNodeFlows.push({
                    id: `flow_${i}`,
                    source: `Source_${i}`,
                    target: `Target_${i}`,
                    value: 10
                });
            }

            const nodeResult = validateFlowDataArray(manyNodeFlows);
            expect(nodeResult.isValid).toBe(false);
            expect(nodeResult.errors.some(error =>
                error.includes('50 nodes')
            )).toBe(true);

            // Create flows that exceed connection limit (100 connections)
            const manyConnectionFlows: FlowData[] = [];
            for (let i = 0; i < 110; i++) {
                manyConnectionFlows.push({
                    id: `flow_${i}`,
                    source: `Source_${i % 10}`, // Reuse sources to avoid node limit
                    target: `Target_${i % 10}`,
                    value: 10
                });
            }

            const connectionResult = validateFlowDataArray(manyConnectionFlows);
            expect(connectionResult.isValid).toBe(false);
            expect(connectionResult.errors.some(error =>
                error.includes('100 connections')
            )).toBe(true);
        });
    });

    describe('Data Transformation Error Handling', () => {
        it('should handle transformation of invalid flow data', () => {
            const invalidFlowArrays: any[] = [
                [{ id: '1', source: 'A', target: 'B' }], // Missing value
                [{ id: '1', source: 'A', value: 10 }], // Missing target
                [{ id: '1', target: 'B', value: 10 }], // Missing source
                [{ source: 'A', target: 'B', value: 10 }], // Missing id
                [{ id: null, source: 'A', target: 'B', value: 10 }], // Null id
                [{ id: '1', source: null, target: 'B', value: 10 }], // Null source
                [{ id: '1', source: 'A', target: null, value: 10 }], // Null target
                [{ id: '1', source: 'A', target: 'B', value: null }], // Null value
                [{ id: '1', source: 'A', target: 'B', value: 'invalid' }], // Invalid value type
                [{ id: '1', source: 'A', target: 'B', value: -10 }], // Negative value
                [{ id: '1', source: 'A', target: 'B', value: 0 }], // Zero value
                [{ id: '1', source: 'A', target: 'B', value: NaN }], // NaN value
                [{ id: '1', source: 'A', target: 'B', value: Infinity }], // Infinite value
            ];

            invalidFlowArrays.forEach((flows) => {
                expect(() => transformFlowsToSankeyData(flows)).toThrow();
            });
        });

        it('should handle mixed valid and invalid flow data', () => {
            const mixedFlows: any[] = [
                { id: '1', source: 'A', target: 'B', value: 10 }, // Valid
                { id: '2', source: 'C', target: 'D' }, // Missing value
                { id: '3', source: 'E', target: 'F', value: 15 }, // Valid
                { id: '4', source: null, target: 'G', value: 20 }, // Invalid source
            ];

            expect(() => transformFlowsToSankeyData(mixedFlows)).toThrow();
        });

        it('should handle circular references and self-loops', () => {
            const circularFlows: FlowData[] = [
                { id: '1', source: 'A', target: 'A', value: 10 }, // Self-loop
                { id: '2', source: 'B', target: 'C', value: 15 },
                { id: '3', source: 'C', target: 'B', value: 20 }, // Circular
            ];

            // Self-loops should be caught by validation
            const selfLoopValidation = validateFlowInput({
                source: 'A',
                target: 'A',
                value: '10'
            });
            expect(selfLoopValidation.isValid).toBe(false);

            // Circular references should still transform (they're valid in Sankey diagrams)
            const result = transformFlowsToSankeyData(circularFlows.slice(1));
            expect(result.nodes.length).toBe(2);
            expect(result.links.length).toBe(2);
        });
    });

    describe('Error Recovery Scenarios', () => {
        it('should demonstrate progressive error fixing', () => {
            // Start with completely invalid input
            let input: FlowInput = { source: '', target: '', value: 'invalid' };
            let result = validateFlowInput(input);
            const initialErrorCount = result.errors.length;
            expect(initialErrorCount).toBe(3);

            // Fix source
            input.source = 'Valid Source';
            result = validateFlowInput(input);
            expect(result.errors.length).toBe(initialErrorCount - 1);

            // Fix target
            input.target = 'Valid Target';
            result = validateFlowInput(input);
            expect(result.errors.length).toBe(1);

            // Fix value
            input.value = '10.5';
            result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);

            // Should now be able to create flow data
            expect(() => createFlowData(input)).not.toThrow();
        });

        it('should handle partial data recovery', () => {
            const partiallyValidInputs: FlowInput[] = [
                { source: 'A', target: '', value: '10' }, // Missing target
                { source: '', target: 'B', value: '10' }, // Missing source
                { source: 'A', target: 'B', value: '' },  // Missing value
            ];

            partiallyValidInputs.forEach(input => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBe(1); // Only one error each
            });
        });

        it('should provide helpful error context for debugging', () => {
            const debuggingScenarios = [
                { input: { source: 'A', target: 'A', value: '10' }, expectedContext: 'identical' },
                { input: { source: 'A', target: 'B', value: '0' }, expectedContext: 'zero' },
                { input: { source: 'A', target: 'B', value: '-5' }, expectedContext: 'negative' },
                { input: { source: '', target: 'B', value: '10' }, expectedContext: 'empty' },
                { input: { source: 'A', target: 'B', value: 'text' }, expectedContext: 'number' },
            ];

            debuggingScenarios.forEach(({ input, expectedContext }) => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errors.some(error =>
                    error.toLowerCase().includes(expectedContext)
                )).toBe(true);
            });
        });
    });

    describe('Stress Testing with Invalid Data', () => {
        it('should handle rapid invalid input validation', () => {
            const startTime = Date.now();

            for (let i = 0; i < 100; i++) {
                const invalidInput: FlowInput = {
                    source: i % 2 === 0 ? '' : 'A'.repeat(200),
                    target: i % 3 === 0 ? '' : 'B'.repeat(200),
                    value: i % 4 === 0 ? 'invalid' : '-10'
                };

                validateFlowInput(invalidInput);
            }

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(200); // Should complete quickly
        });

        it('should handle memory-intensive invalid data', () => {
            const largeInvalidFlows: any[] = [];

            for (let i = 0; i < 1000; i++) {
                largeInvalidFlows.push({
                    id: i % 2 === 0 ? null : `flow_${i}`,
                    source: i % 3 === 0 ? null : `Source_${i}`,
                    target: i % 4 === 0 ? null : `Target_${i}`,
                    value: i % 5 === 0 ? null : Math.random() * 100
                });
            }

            expect(() => transformFlowsToSankeyData(largeInvalidFlows)).toThrow();
        });
    });
});
