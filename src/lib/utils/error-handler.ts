import type { AppError, ChartError, ChartErrorType, ErrorSeverity } from '$lib/types';

/**
 * Error handler utility for comprehensive error management
 */
export class ErrorHandler {
    private static instance: ErrorHandler;
    private errors: Map<string, AppError> = new Map();
    private errorListeners: ((error: AppError) => void)[] = [];

    private constructor() {}

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    /**
     * Create a standardized application error
     */
    createError(
        message: string,
        severity: ErrorSeverity = 'error',
        context?: string,
        recoverable: boolean = true
    ): AppError {
        const error: AppError = {
            id: this.generateErrorId(),
            message,
            severity,
            timestamp: new Date(),
            context,
            recoverable,
            userMessage: this.getUserFriendlyMessage(message, context)
        };

        this.errors.set(error.id, error);
        this.notifyListeners(error);

        return error;
    }

    /**
     * Create a chart-specific error
     */
    createChartError(
        type: ChartErrorType,
        originalError: Error,
        chartData?: any
    ): ChartError {
        const userMessage = this.getChartErrorMessage(type);

        const error: ChartError = {
            id: this.generateErrorId(),
            type,
            message: originalError.message,
            severity: 'error',
            timestamp: new Date(),
            context: 'chart',
            recoverable: true,
            userMessage,
            chartData
        };

        this.errors.set(error.id, error);
        this.notifyListeners(error);

        // Log technical details for debugging
        console.error(`Chart Error [${type}]:`, {
            error: originalError,
            chartData,
            timestamp: error.timestamp
        });

        return error;
    }

    /**
     * Handle validation errors with user-friendly messages
     */
    handleValidationError(
        field: string,
        value: any,
        validationErrors: string[]
    ): AppError {
        const context = `validation:${field}`;
        const message = `Validation failed for ${field}: ${validationErrors.join(', ')}`;

        return this.createError(message, 'error', context, true);
    }

    /**
     * Handle performance warnings
     */
    handlePerformanceWarning(
        metric: string,
        currentValue: number,
        threshold: number
    ): AppError {
        const message = `Performance warning: ${metric} (${currentValue}) exceeds threshold (${threshold})`;
        const userMessage = this.getPerformanceWarningMessage(metric, currentValue, threshold);

        const error: AppError = {
            id: this.generateErrorId(),
            message,
            severity: 'warning',
            timestamp: new Date(),
            context: 'performance',
            recoverable: true,
            userMessage
        };

        this.errors.set(error.id, error);
        this.notifyListeners(error);

        return error;
    }

    /**
     * Clear error by ID
     */
    clearError(errorId: string): void {
        this.errors.delete(errorId);
    }

    /**
     * Clear all errors
     */
    clearAllErrors(): void {
        this.errors.clear();
    }

    /**
     * Get all current errors
     */
    getAllErrors(): AppError[] {
        return Array.from(this.errors.values());
    }

    /**
     * Get errors by severity
     */
    getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
        return this.getAllErrors().filter(error => error.severity === severity);
    }

    /**
     * Subscribe to error notifications
     */
    onError(callback: (error: AppError) => void): () => void {
        this.errorListeners.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.errorListeners.indexOf(callback);
            if (index > -1) {
                this.errorListeners.splice(index, 1);
            }
        };
    }

    /**
     * Check if there are any critical errors
     */
    hasCriticalErrors(): boolean {
        return this.getAllErrors().some(error =>
            error.severity === 'error' && !error.recoverable
        );
    }

    private generateErrorId(): string {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getUserFriendlyMessage(message: string, context?: string): string {
        // Map technical messages to user-friendly ones
        const messageMap: Record<string, string> = {
            'Failed to initialize ECharts': 'Unable to load the chart. Please refresh the page.',
            'Failed to update chart': 'Chart update failed. Your data is safe, please try again.',
            'Invalid flow input': 'Please check your input data and try again.',
            'Performance limit exceeded': 'Too much data may slow down the app. Consider reducing the number of flows.',
            'Theme update failed': 'Unable to change theme. Please try again.',
            'Data transformation failed': 'Unable to process your data. Please check the format and try again.'
        };

        // Check for partial matches
        for (const [key, userMessage] of Object.entries(messageMap)) {
            if (message.includes(key)) {
                return userMessage;
            }
        }

        // Default user-friendly message based on context
        if (context && context.startsWith('validation')) {
            return 'Please check your input and correct any errors.';
        }

        switch (context) {
            case 'chart':
                return 'Chart operation failed. Please try again or refresh the page.';
            case 'validation':
                return 'Please check your input and correct any errors.';
            case 'performance':
                return 'Performance issue detected. Consider reducing data complexity.';
            case 'theme':
                return 'Theme change failed. Please try again.';
            default:
                return 'An error occurred. Please try again or refresh the page.';
        }
    }

    private getChartErrorMessage(type: ChartErrorType): string {
        const messages: Record<ChartErrorType, string> = {
            'initialization_failed': 'Failed to initialize the chart. Please refresh the page.',
            'rendering_failed': 'Chart rendering failed. Your data is safe, please try again.',
            'data_transformation_failed': 'Unable to process chart data. Please check your input format.',
            'theme_update_failed': 'Chart theme update failed. The chart will continue to work normally.',
            'resize_failed': 'Chart resize failed. Try refreshing the page if the chart appears distorted.'
        };

        return messages[type];
    }

    private getPerformanceWarningMessage(
        metric: string,
        currentValue: number,
        threshold: number
    ): string {
        const messages: Record<string, string> = {
            'nodes': `You have ${currentValue} nodes (limit: ${threshold}). Consider reducing data complexity for better performance.`,
            'connections': `You have ${currentValue} connections (limit: ${threshold}). Large datasets may slow down the app.`,
            'update_frequency': `Updates are happening too frequently. The app will automatically slow them down.`,
            'memory_usage': `High memory usage detected. Consider clearing some data.`
        };

        return messages[metric] || `Performance warning: ${metric} value ${currentValue} exceeds recommended limit of ${threshold}.`;
    }

    private notifyListeners(error: AppError): void {
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (err) {
                console.error('Error in error listener:', err);
            }
        });
    }
}

/**
 * Global error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Utility function to safely execute operations with error handling
 */
export async function safeExecute<T>(
    operation: () => T | Promise<T>,
    context: string,
    fallback?: T
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        const appError = errorHandler.createError(
            error instanceof Error ? error.message : String(error),
            'error',
            context,
            true
        );

        console.error(`Safe execute failed in ${context}:`, error);

        return fallback;
    }
}

/**
 * Utility function for handling chart operations safely
 */
export async function safeChartOperation<T>(
    operation: () => T | Promise<T>,
    errorType: ChartErrorType,
    chartData?: any,
    fallback?: T
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        errorHandler.createChartError(
            errorType,
            error instanceof Error ? error : new Error(String(error)),
            chartData
        );

        return fallback;
    }
}
