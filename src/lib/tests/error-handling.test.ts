import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorHandler, safeExecute, safeChartOperation } from '$lib/utils/error-handler';
import { validateFlowInput, createFlowData } from '$lib/validation';
import type { FlowInput, AppError } from '$lib/types';

describe('Error Handling System', () => {
    beforeEach(() => {
        // Clear all errors before each test
        errorHandler.clearAllErrors();
    });

    describe('ErrorHandler', () => {
        it('should create and store errors', () => {
            const error = errorHandler.createError('Test error', 'error', 'test');

            expect(error.message).toBe('Test error');
            expect(error.severity).toBe('error');
            expect(error.context).toBe('test');
            expect(error.recoverable).toBe(true);
            expect(error.userMessage).toContain('error occurred');

            const allErrors = errorHandler.getAllErrors();
            expect(allErrors).toHaveLength(1);
            expect(allErrors[0].id).toBe(error.id);
        });

        it('should create chart-specific errors', () => {
            const originalError = new Error('Chart failed');
            const chartError = errorHandler.createChartError(
                'rendering_failed',
                originalError,
                { nodes: [], links: [] }
            );

            expect(chartError.type).toBe('rendering_failed');
            expect(chartError.message).toBe('Chart failed');
            expect(chartError.context).toBe('chart');
            expect(chartError.userMessage).toContain('Chart rendering failed');
        });

        it('should handle validation errors', () => {
            const validationError = errorHandler.handleValidationError(
                'source',
                '',
                ['Source cannot be empty']
            );

            expect(validationError.context).toBe('validation:source');
            expect(validationError.message).toContain('Validation failed for source');
            expect(validationError.userMessage).toContain('check your input');
        });

        it('should handle performance warnings', () => {
            const perfWarning = errorHandler.handlePerformanceWarning(
                'nodes',
                60,
                50
            );

            expect(perfWarning.severity).toBe('warning');
            expect(perfWarning.context).toBe('performance');
            expect(perfWarning.userMessage).toContain('60 nodes');
        });

        it('should clear errors by ID', () => {
            const error1 = errorHandler.createError('Error 1');
            const error2 = errorHandler.createError('Error 2');

            expect(errorHandler.getAllErrors()).toHaveLength(2);

            errorHandler.clearError(error1.id);
            const remainingErrors = errorHandler.getAllErrors();

            expect(remainingErrors).toHaveLength(1);
            expect(remainingErrors[0].id).toBe(error2.id);
        });

        it('should filter errors by severity', () => {
            errorHandler.createError('Error 1', 'error');
            errorHandler.createError('Warning 1', 'warning');
            errorHandler.createError('Info 1', 'info');

            const errors = errorHandler.getErrorsBySeverity('error');
            const warnings = errorHandler.getErrorsBySeverity('warning');
            const infos = errorHandler.getErrorsBySeverity('info');

            expect(errors).toHaveLength(1);
            expect(warnings).toHaveLength(1);
            expect(infos).toHaveLength(1);
        });

        it('should notify error listeners', () => {
            const listener = vi.fn();
            const unsubscribe = errorHandler.onError(listener);

            const error = errorHandler.createError('Test error');

            expect(listener).toHaveBeenCalledWith(error);

            unsubscribe();
            errorHandler.createError('Another error');

            // Should not be called again after unsubscribe
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('Safe Execution Utilities', () => {
        it('should execute successful operations', async () => {
            const result = await safeExecute(
                () => 'success',
                'test'
            );

            expect(result).toBe('success');
            expect(errorHandler.getAllErrors()).toHaveLength(0);
        });

        it('should handle failed operations', async () => {
            const result = await safeExecute(
                () => {
                    throw new Error('Operation failed');
                },
                'test',
                'fallback'
            );

            expect(result).toBe('fallback');
            expect(errorHandler.getAllErrors()).toHaveLength(1);
        });

        it('should handle chart operations safely', async () => {
            const result = await safeChartOperation(
                () => {
                    throw new Error('Chart failed');
                },
                'rendering_failed',
                { nodes: [], links: [] },
                'fallback'
            );

            expect(result).toBe('fallback');

            const errors = errorHandler.getAllErrors();
            expect(errors).toHaveLength(1);
            expect(errors[0].context).toBe('chart');
        });
    });

    describe('Validation Error Handling', () => {
        it('should validate empty source input', () => {
            const input: FlowInput = {
                source: '',
                target: 'B',
                value: '10'
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Source cannot be empty or just spaces');
        });

        it('should validate empty target input', () => {
            const input: FlowInput = {
                source: 'A',
                target: '',
                value: '10'
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Target cannot be empty or just spaces');
        });

        it('should validate same source and target', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'A',
                value: '10'
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Source and target must be different nodes');
        });

        it('should validate invalid value', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: 'invalid'
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Value must be a valid number (e.g., 10, 5.5, 100)');
        });

        it('should validate negative value', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: '-5'
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Value must be greater than zero');
        });

        it('should validate zero value', () => {
            const input: FlowInput = {
                source: 'A',
                target: 'B',
                value: '0'
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Value must be greater than zero');
        });

        it('should provide warnings for edge cases', () => {
            const input: FlowInput = {
                source: 'A'.repeat(60), // Very long name
                target: 'B',
                value: '0.001' // Very small value
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Source name is quite long - consider shortening for better display');
            expect(result.warnings).toContain('Very small values may be hard to see in the chart');
        });

        it('should handle special characters warning', () => {
            const input: FlowInput = {
                source: 'A<script>',
                target: 'B&amp;',
                value: '10'
            };

            const result = validateFlowInput(input);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Source contains special characters that may affect display');
            expect(result.warnings).toContain('Target contains special characters that may affect display');
        });

        it('should throw error when creating invalid flow data', () => {
            const invalidInput: FlowInput = {
                source: '',
                target: 'B',
                value: '10'
            };

            expect(() => createFlowData(invalidInput)).toThrow('Invalid flow input');
        });
    });

    describe('Error Message Generation', () => {
        it('should generate user-friendly messages for common errors', () => {
            const chartError = errorHandler.createError(
                'Failed to initialize ECharts',
                'error',
                'chart'
            );

            expect(chartError.userMessage).toBe('Unable to load the chart. Please refresh the page.');
        });

        it('should generate context-specific messages', () => {
            const validationError = errorHandler.createError(
                'Some validation error',
                'error',
                'validation'
            );

            expect(validationError.userMessage).toBe('Please check your input and correct any errors.');
        });

        it('should generate default message for unknown errors', () => {
            const unknownError = errorHandler.createError(
                'Unknown error occurred',
                'error',
                'unknown'
            );

            expect(unknownError.userMessage).toBe('An error occurred. Please try again or refresh the page.');
        });
    });

    describe('Error Recovery', () => {
        it('should identify critical errors', () => {
            errorHandler.createError('Recoverable error', 'error', 'test', true);
            expect(errorHandler.hasCriticalErrors()).toBe(false);

            errorHandler.createError('Critical error', 'error', 'test', false);
            expect(errorHandler.hasCriticalErrors()).toBe(true);
        });

        it('should clear all errors', () => {
            errorHandler.createError('Error 1');
            errorHandler.createError('Error 2');
            errorHandler.createError('Error 3');

            expect(errorHandler.getAllErrors()).toHaveLength(3);

            errorHandler.clearAllErrors();
            expect(errorHandler.getAllErrors()).toHaveLength(0);
        });
    });
});

describe('Integration Error Scenarios', () => {
    beforeEach(() => {
        errorHandler.clearAllErrors();
    });

    it('should handle complete flow creation failure', async () => {
        const invalidInput: FlowInput = {
            source: '',
            target: '',
            value: 'invalid'
        };

        const result = await safeExecute(
            () => createFlowData(invalidInput),
            'flow_creation'
        );

        expect(result).toBeUndefined();
        expect(errorHandler.getAllErrors()).toHaveLength(1);
    });

    it('should handle data transformation errors', async () => {
        const result = await safeExecute(
            () => {
                // Simulate transformation error
                throw new Error('Invalid data structure');
            },
            'data_transformation'
        );

        expect(result).toBeUndefined();

        const errors = errorHandler.getAllErrors();
        expect(errors).toHaveLength(1);
        expect(errors[0].context).toBe('data_transformation');
    });

    it('should handle multiple concurrent errors', async () => {
        const promises = [
            safeExecute(() => { throw new Error('Error 1'); }, 'test1'),
            safeExecute(() => { throw new Error('Error 2'); }, 'test2'),
            safeExecute(() => { throw new Error('Error 3'); }, 'test3')
        ];

        await Promise.all(promises);

        expect(errorHandler.getAllErrors()).toHaveLength(3);
    });
});
