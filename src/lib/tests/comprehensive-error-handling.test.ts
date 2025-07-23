import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler } from '$lib/utils/error-handler';
import { validateFlowInput, createFlowData } from '$lib/validation';
import { transformFlowsToSankeyData } from '$lib/transform';
import type { FlowInput, FlowData } from '$lib/types';

describe('Comprehensive Error Handling Integration', () => {
    beforeEach(() => {
        errorHandler.clearAllErrors();
    });

    describe('End-to-End Error Scenarios', () => {
        it('should handle complete invalid flow creation workflow', async () => {
            // Test completely invalid input
            const invalidInput: FlowInput = {
                source: '',
                target: '',
                value: 'not-a-number'
            };

            // Validation should catch all errors
            const validation = validateFlowInput(invalidInput);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);

            // Creating flow data should throw
            expect(() => createFlowData(invalidInput)).toThrow();
        });

        it('should handle edge case inputs gracefully', async () => {
            const edgeCases: FlowInput[] = [
                { source: 'A'.repeat(100), target: 'B', value: '0.000001' }, // Very long + very small
                { source: 'A<script>', target: 'B&amp;', value: '999999' }, // Special chars + large value
                { source: '🚀', target: '🎯', value: '10' }, // Unicode characters
                { source: '   A   ', target: '   B   ', value: '  10  ' }, // Whitespace
            ];

            edgeCases.forEach(input => {
                const result = validateFlowInput(input);
                // Should be valid but may have warnings
                expect(result.isValid).toBe(true);

                // Should be able to create flow data
                expect(() => createFlowData(input)).not.toThrow();
            });
        });

        it('should handle data transformation errors', () => {
            // Test with invalid flow data structures
            const invalidFlows: any[] = [
                { id: '1', source: 'A', target: 'B' }, // Missing value
                { id: '2', source: 'C', value: 10 }, // Missing target
                { source: 'D', target: 'E', value: 15 }, // Missing id
            ];

            expect(() => transformFlowsToSankeyData(invalidFlows)).toThrow();
        });

        it('should handle performance limit scenarios', () => {
            // Create flows that exceed performance limits
            const manyFlows: FlowData[] = [];

            // Create 110 flows (exceeds 100 limit)
            for (let i = 0; i < 110; i++) {
                manyFlows.push({
                    id: `flow_${i}`,
                    source: `Source_${i % 10}`, // Reuse sources to avoid too many nodes
                    target: `Target_${i % 10}`,
                    value: 10
                });
            }

            // Should still transform but may have warnings
            const result = transformFlowsToSankeyData(manyFlows);
            expect(result.nodes.length).toBeGreaterThan(0);
            expect(result.links.length).toBe(110);
        });
    });

    describe('Error Recovery Scenarios', () => {
        it('should recover from validation errors', () => {
            // Start with invalid input
            let input: FlowInput = { source: '', target: 'B', value: '10' };
            let validation = validateFlowInput(input);
            expect(validation.isValid).toBe(false);

            // Fix the source
            input.source = 'A';
            validation = validateFlowInput(input);
            expect(validation.isValid).toBe(true);

            // Should now be able to create flow data
            expect(() => createFlowData(input)).not.toThrow();
        });

        it('should handle progressive error fixing', () => {
            // Start with multiple errors
            let input: FlowInput = { source: '', target: '', value: 'invalid' };
            let validation = validateFlowInput(input);
            expect(validation.errors.length).toBe(3);

            // Fix source
            input.source = 'A';
            validation = validateFlowInput(input);
            expect(validation.errors.length).toBe(2);

            // Fix target
            input.target = 'B';
            validation = validateFlowInput(input);
            expect(validation.errors.length).toBe(1);

            // Fix value
            input.value = '10';
            validation = validateFlowInput(input);
            expect(validation.isValid).toBe(true);
            expect(validation.errors.length).toBe(0);
        });
    });

    describe('Error Message Quality', () => {
        it('should provide helpful error messages for common mistakes', () => {
            const testCases = [
                {
                    input: { source: '', target: 'B', value: '10' },
                    expectedError: 'Source cannot be empty or just spaces'
                },
                {
                    input: { source: 'A', target: 'A', value: '10' },
                    expectedError: 'Source and target must be different nodes'
                },
                {
                    input: { source: 'A', target: 'B', value: '0' },
                    expectedError: 'Value must be greater than zero'
                },
                {
                    input: { source: 'A', target: 'B', value: 'abc' },
                    expectedError: 'Value must be a valid number'
                }
            ];

            testCases.forEach(({ input, expectedError }) => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errors.some(error => error.includes(expectedError.split(' ')[0]))).toBe(true);
            });
        });

        it('should provide warnings for edge cases', () => {
            const testCases = [
                {
                    input: { source: 'A'.repeat(60), target: 'B', value: '10' },
                    expectedWarning: 'long'
                },
                {
                    input: { source: 'A', target: 'B', value: '0.001' },
                    expectedWarning: 'small'
                },
                {
                    input: { source: 'A<script>', target: 'B', value: '10' },
                    expectedWarning: 'special characters'
                }
            ];

            testCases.forEach(({ input, expectedWarning }) => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(true);
                expect(result.warnings?.some(warning =>
                    warning.toLowerCase().includes(expectedWarning.toLowerCase())
                )).toBe(true);
            });
        });
    });

    describe('Error Handler Integration', () => {
        it('should track errors through the error handler', () => {
            // Create some errors
            const error1 = errorHandler.createError('Test error 1', 'error');
            const error2 = errorHandler.createError('Test warning', 'warning');
            const error3 = errorHandler.createError('Test info', 'info');

            // Check they're tracked
            expect(errorHandler.getAllErrors()).toHaveLength(3);
            expect(errorHandler.getErrorsBySeverity('error')).toHaveLength(1);
            expect(errorHandler.getErrorsBySeverity('warning')).toHaveLength(1);
            expect(errorHandler.getErrorsBySeverity('info')).toHaveLength(1);

            // Clear specific error
            errorHandler.clearError(error1.id);
            expect(errorHandler.getAllErrors()).toHaveLength(2);

            // Clear all
            errorHandler.clearAllErrors();
            expect(errorHandler.getAllErrors()).toHaveLength(0);
        });

        it('should handle validation errors through error handler', () => {
            const invalidInput: FlowInput = { source: '', target: 'B', value: '10' };

            const validationError = errorHandler.handleValidationError(
                'source',
                invalidInput.source,
                ['Source cannot be empty']
            );

            expect(validationError.context).toBe('validation:source');
            expect(validationError.severity).toBe('error');
            expect(validationError.userMessage).toContain('check your input');
        });
    });

    describe('Performance Under Error Conditions', () => {
        it('should handle many validation errors efficiently', () => {
            const startTime = Date.now();

            // Create many invalid inputs
            for (let i = 0; i < 100; i++) {
                const invalidInput: FlowInput = {
                    source: '',
                    target: '',
                    value: 'invalid'
                };
                validateFlowInput(invalidInput);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (less than 100ms)
            expect(duration).toBeLessThan(100);
        });

        it('should handle error handler operations efficiently', () => {
            const startTime = Date.now();

            // Create many errors
            for (let i = 0; i < 100; i++) {
                errorHandler.createError(`Error ${i}`, 'error');
            }

            // Perform operations
            errorHandler.getAllErrors();
            errorHandler.getErrorsBySeverity('error');
            errorHandler.clearAllErrors();

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time (less than 50ms)
            expect(duration).toBeLessThan(50);
        });
    });
});
