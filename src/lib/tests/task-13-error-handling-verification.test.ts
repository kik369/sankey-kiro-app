import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { errorHandler, safeExecute, safeChartOperation } from '$lib/utils/error-handler';
import { validateFlowInput, createFlowData } from '$lib/validation';
import { transformFlowsToSankeyData } from '$lib/transform';
import type { FlowInput, FlowData, ChartErrorType } from '$lib/types';

describe('Task 13: Comprehensive Error Handling Verification', () => {
    beforeEach(() => {
        errorHandler.clearAllErrors();
        vi.clearAllMocks();
    });

    afterEach(() => {
        errorHandler.clearAllErrors();
    });

    describe('1. Validation Error Display in Input Components', () => {
        it('should display comprehensive validation errors for empty inputs', () => {
            const emptyInput: FlowInput = { source: '', target: '', value: '' };
            const result = validateFlowInput(emptyInput);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Source cannot be empty or just spaces');
            expect(result.errors).toContain('Target cannot be empty or just spaces');
            expect(result.errors).toContain('Value field is required');
        });

        it('should display specific validation errors for invalid data types', () => {
            const invalidInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: 'not-a-number'
            };
            const result = validateFlowInput(invalidInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error =>
                error.includes('Value must be a valid number')
            )).toBe(true);
        });

        it('should display validation errors for identical source and target', () => {
            const sameNodeInput: FlowInput = {
                source: 'Node A',
                target: 'Node A',
                value: '10'
            };
            const result = validateFlowInput(sameNodeInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error =>
                error.includes('Source and target must be different')
            )).toBe(true);
        });

        it('should display validation errors for negative values', () => {
            const negativeValueInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: '-5'
            };
            const result = validateFlowInput(negativeValueInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error =>
                error.includes('Value must be greater than zero')
            )).toBe(true);
        });

        it('should display validation warnings for edge cases', () => {
            const edgeCaseInput: FlowInput = {
                source: 'A'.repeat(60),
                target: 'B',
                value: '0.0001'
            };
            const result = validateFlowInput(edgeCaseInput);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toBeDefined();
            expect(result.warnings!.some(warning =>
                warning.includes('long')
            )).toBe(true);
            expect(result.warnings!.some(warning =>
                warning.includes('small')
            )).toBe(true);
        });

        it('should handle special characters with warnings', () => {
            const specialCharsInput: FlowInput = {
                source: 'Node<script>',
                target: 'Target&amp;',
                value: '10'
            };
            const result = validateFlowInput(specialCharsInput);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toBeDefined();
            expect(result.warnings!.some(warning =>
                warning.includes('special characters')
            )).toBe(true);
        });

        it('should validate extremely large values', () => {
            const largeValueInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: '99999999'
            };
            const result = validateFlowInput(largeValueInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error =>
                error.includes('too large')
            )).toBe(true);
        });

        it('should validate precision issues', () => {
            const precisionInput: FlowInput = {
                source: 'A',
                target: 'B',
                value: '10.1234567890'
            };
            const result = validateFlowInput(precisionInput);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toBeDefined();
            expect(result.warnings!.some(warning =>
                warning.includes('decimal places')
            )).toBe(true);
        });
    });

    describe('2. Chart Rendering Error Handling with Fallbacks', () => {
        it('should handle chart initialization failures gracefully', async () => {
            const mockError = new Error('Chart container not available');

            const result = await safeChartOperation(
                () => { throw mockError; },
                'initialization_failed',
                null
            );

            expect(result).toBeUndefined();

            const errors = errorHandler.getAllErrors();
            expect(errors.length).toBeGreaterThan(0);
            const chartError = errors[0] as any;
            expect(chartError.type).toBe('initialization_failed');
            expect(chartError.userMessage).toContain('initialize');
        });

        it('should handle chart rendering failures with data context', async () => {
            const mockChartData = { nodes: [], links: [] };
            const mockError = new Error('ECharts setOption failed');

            const result = await safeChartOperation(
                () => { throw mockError; },
                'rendering_failed',
                mockChartData
            );

            expect(result).toBeUndefined();

            const errors = errorHandler.getAllErrors();
            expect(errors.length).toBeGreaterThan(0);
            const chartError = errors[0] as any;
            expect(chartError.type).toBe('rendering_failed');
            expect(chartError.chartData).toEqual(mockChartData);
            expect(chartError.userMessage).toContain('rendering failed');
        });

        it('should handle data transformation failures', async () => {
            const invalidFlows: any[] = [
                { id: '1', source: 'A' }, // Missing target and value
                { id: '2', target: 'B', value: 10 }, // Missing source
            ];

            expect(() => transformFlowsToSankeyData(invalidFlows)).toThrow();
        });

        it('should handle theme update failures', async () => {
            const mockError = new Error('Theme configuration invalid');

            const result = await safeChartOperation(
                () => { throw mockError; },
                'theme_update_failed',
                { theme: 'dark' }
            );

            expect(result).toBeUndefined();

            const errors = errorHandler.getAllErrors();
            expect(errors.length).toBeGreaterThan(0);
            const chartError = errors[0] as any;
            expect(chartError.type).toBe('theme_update_failed');
            expect(chartError.userMessage).toContain('theme');
        });

        it('should handle chart resize failures', async () => {
            const mockError = new Error('Chart instance not available for resize');

            const result = await safeChartOperation(
                () => { throw mockError; },
                'resize_failed',
                { width: 800, height: 400 }
            );

            expect(result).toBeUndefined();

            const errors = errorHandler.getAllErrors();
            expect(errors.length).toBeGreaterThan(0);
            const chartError = errors[0] as any;
            expect(chartError.type).toBe('resize_failed');
            expect(chartError.userMessage).toContain('resize');
        });
    });

    describe('3. User-Friendly Error Messages for All Failure Scenarios', () => {
        it('should provide user-friendly messages for technical errors', () => {
            const technicalErrors = [
                'Failed to initialize ECharts',
                'Chart instance creation failed',
                'ECharts setOption failed: TypeError',
                'Data transformation failed',
                'Theme update failed',
                'Network connection timeout',
                'Memory allocation error',
                'Permission denied error'
            ];

            technicalErrors.forEach(technicalMessage => {
                const error = errorHandler.createError(technicalMessage, 'error', 'test');
                expect(error.userMessage).not.toBe(technicalMessage);
                expect(error.userMessage.length).toBeGreaterThan(10);
                expect(error.userMessage).not.toContain('TypeError');
                expect(error.userMessage).not.toContain('allocation');
            });
        });

        it('should provide context-specific error messages', () => {
            const contextualErrors = [
                { context: 'validation:source', message: 'Source validation failed' },
                { context: 'chart_initialization', message: 'Chart init error' },
                { context: 'data_transformation', message: 'Transform error' },
                { context: 'performance', message: 'Performance limit exceeded' },
                { context: 'theme_toggle', message: 'Theme change failed' },
                { context: 'storage', message: 'LocalStorage error' },
                { context: 'network', message: 'Network request failed' }
            ];

            contextualErrors.forEach(({ context, message }) => {
                const error = errorHandler.createError(message, 'error', context);
                expect(error.userMessage).toContain('Please');
                expect(error.userMessage.length).toBeGreaterThan(20);
            });
        });

        it('should provide helpful performance warning messages', () => {
            const performanceWarning = errorHandler.handlePerformanceWarning(
                'nodes', 55, 50
            );

            expect(performanceWarning.severity).toBe('warning');
            expect(performanceWarning.userMessage).toContain('55');
            expect(performanceWarning.userMessage).toContain('50');
            expect(performanceWarning.userMessage).toContain('performance');
        });

        it('should provide helpful validation error messages', () => {
            const validationError = errorHandler.handleValidationError(
                'source',
                '',
                ['Source cannot be empty']
            );

            expect(validationError.severity).toBe('error');
            expect(validationError.context).toBe('validation:source');
            expect(validationError.userMessage).toContain('source');
            expect(validationError.userMessage).toContain('check');
        });
    });

    describe('4. Testing Error Handling with Invalid Data Inputs', () => {
        it('should handle null and undefined inputs gracefully', () => {
            const nullInputs = [
                { source: null, target: 'B', value: '10' },
                { source: 'A', target: undefined, value: '10' },
                { source: 'A', target: 'B', value: null }
            ];

            nullInputs.forEach((input: any) => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });

        it('should handle array inputs instead of strings', () => {
            const arrayInput: any = {
                source: ['A'],
                target: ['B'],
                value: [10]
            };
            const result = validateFlowInput(arrayInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle object inputs instead of primitives', () => {
            const objectInput: any = {
                source: { name: 'A' },
                target: { name: 'B' },
                value: { amount: 10 }
            };
            const result = validateFlowInput(objectInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle extremely long strings', () => {
            const longStringInput: FlowInput = {
                source: 'A'.repeat(200),
                target: 'B'.repeat(200),
                value: '10'
            };
            const result = validateFlowInput(longStringInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error =>
                error.includes('too long')
            )).toBe(true);
        });

        it('should handle whitespace-only inputs', () => {
            const whitespaceInput: FlowInput = {
                source: '   ',
                target: '\t\n',
                value: '  10  '
            };
            const result = validateFlowInput(whitespaceInput);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error =>
                error.includes('whitespace')
            )).toBe(true);
        });

        it('should handle infinite and NaN values', () => {
            const infiniteInputs = [
                { source: 'A', target: 'B', value: 'Infinity' },
                { source: 'A', target: 'B', value: '-Infinity' },
                { source: 'A', target: 'B', value: 'NaN' }
            ];

            infiniteInputs.forEach(input => {
                const result = validateFlowInput(input);
                expect(result.isValid).toBe(false);
                expect(result.errors.some(error =>
                    error.includes('finite') || error.includes('valid number')
                )).toBe(true);
            });
        });

        it('should handle scientific notation edge cases', () => {
            const scientificInputs = [
                { source: 'A', target: 'B', value: '1e-10' }, // Very small
                { source: 'A', target: 'B', value: '1e10' },  // Large
                { source: 'A', target: 'B', value: '1e100' }, // Too large
            ];

            scientificInputs.forEach(input => {
                const result = validateFlowInput(input);
                // Should handle scientific notation properly
                if (input.value === '1e100') {
                    expect(result.isValid).toBe(false);
                } else {
                    expect(result.isValid).toBe(true);
                }
            });
        });

        it('should handle malformed flow data arrays', () => {
            const malformedArrays = [
                null,
                undefined,
                'not-an-array',
                [null, undefined, 'string'],
                [{ incomplete: 'data' }],
                [{ id: '1', source: 'A', target: 'B' }], // Missing value
            ];

            malformedArrays.forEach((flows: any) => {
                if (flows === null || flows === undefined || typeof flows === 'string') {
                    // These should be caught by type checking
                    expect(() => transformFlowsToSankeyData(flows)).toThrow();
                } else if (Array.isArray(flows)) {
                    // These should be handled gracefully
                    expect(() => transformFlowsToSankeyData(flows)).toThrow();
                }
            });
        });
    });

    describe('5. Error Recovery and User Guidance', () => {
        it('should provide recovery suggestions for common errors', () => {
            const recoverableErrors = [
                'Chart initialization failed',
                'Data validation failed',
                'Network connection error',
                'Theme update failed'
            ];

            recoverableErrors.forEach(message => {
                const error = errorHandler.createError(message, 'error', 'test', true);
                expect(error.recoverable).toBe(true);
                expect(error.userMessage).toContain('try');
            });
        });

        it('should identify non-recoverable errors', () => {
            const criticalError = errorHandler.createError(
                'Critical system failure',
                'error',
                'system',
                false
            );

            expect(criticalError.recoverable).toBe(false);
            expect(errorHandler.hasCriticalErrors()).toBe(true);
        });

        it('should provide step-by-step error resolution', () => {
            // Simulate progressive error fixing
            let input: FlowInput = { source: '', target: '', value: 'invalid' };

            // Initial state - multiple errors
            let result = validateFlowInput(input);
            expect(result.errors.length).toBe(3);

            // Fix source
            input.source = 'A';
            result = validateFlowInput(input);
            expect(result.errors.length).toBe(2);

            // Fix target
            input.target = 'B';
            result = validateFlowInput(input);
            expect(result.errors.length).toBe(1);

            // Fix value
            input.value = '10';
            result = validateFlowInput(input);
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
        });
    });

    describe('6. Error Handler Integration and Management', () => {
        it('should manage error lifecycle properly', () => {
            const error1 = errorHandler.createError('Error 1', 'error');
            const error2 = errorHandler.createError('Warning 1', 'warning');
            const error3 = errorHandler.createError('Info 1', 'info');

            expect(errorHandler.getAllErrors()).toHaveLength(3);
            expect(errorHandler.getErrorsBySeverity('error')).toHaveLength(1);
            expect(errorHandler.getErrorsBySeverity('warning')).toHaveLength(1);
            expect(errorHandler.getErrorsBySeverity('info')).toHaveLength(1);

            // Clear specific error
            errorHandler.clearError(error1.id);
            expect(errorHandler.getAllErrors()).toHaveLength(2);

            // Clear all errors
            errorHandler.clearAllErrors();
            expect(errorHandler.getAllErrors()).toHaveLength(0);
        });

        it('should handle error listeners properly', () => {
            const mockListener = vi.fn();
            const unsubscribe = errorHandler.onError(mockListener);

            const error = errorHandler.createError('Test error', 'error');
            expect(mockListener).toHaveBeenCalledWith(error);

            unsubscribe();
            errorHandler.createError('Another error', 'error');
            expect(mockListener).toHaveBeenCalledTimes(1);
        });

        it('should handle safe execution wrapper', async () => {
            const successOperation = () => 'success';
            const failureOperation = () => { throw new Error('Test error'); };

            const successResult = await safeExecute(successOperation, 'test');
            expect(successResult).toBe('success');

            const failureResult = await safeExecute(failureOperation, 'test', 'fallback');
            expect(failureResult).toBe('fallback');
            expect(errorHandler.getAllErrors()).toHaveLength(1);
        });
    });

    describe('7. Performance Under Error Conditions', () => {
        it('should handle many errors efficiently', () => {
            const startTime = Date.now();

            // Create many errors
            for (let i = 0; i < 100; i++) {
                errorHandler.createError(`Error ${i}`, 'error');
            }

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(100);
            expect(errorHandler.getAllErrors()).toHaveLength(100);
        });

        it('should handle validation errors efficiently', () => {
            const startTime = Date.now();

            // Validate many invalid inputs
            for (let i = 0; i < 50; i++) {
                validateFlowInput({ source: '', target: '', value: 'invalid' });
            }

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(50);
        });
    });
});
