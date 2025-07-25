import { writable } from 'svelte/store';

// Define the structure for a single error
export interface AppError {
    userUserMessage: any;
    userMessage: any;
    recoverable: any;
    id: string;
    message: string;
    type: 'validation' | 'performance' | 'runtime' | 'generic';
    context?: unknown; // Optional context for debugging
    timestamp: Date;
    isUserFacing: boolean; // Should this error be displayed to the user?
}

// Create a writable store for holding a list of errors
const { subscribe, update, set } = writable<AppError[]>([]);

// Function to generate a unique ID for errors
const generateErrorId = () => `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Main error handler object
export const errorHandler = {
    subscribe,
    // Method to add a new error to the store
    addError: (error: Omit<AppError, 'id' | 'timestamp'>) => {
        const newError: AppError = {
            ...error,
            id: generateErrorId(),
            timestamp: new Date(),
        };
        update(errors => [...errors, newError]);

        // For critical, user-facing errors, we might also log to a remote service
        if (newError.isUserFacing) {
            console.error(`User-facing error: ${newError.message}`, newError.context);
        }

        return newError;
    },
    // Method to dismiss an error by its ID
    dismissError: (errorId: string) => {
        update(errors => errors.filter(e => e.id !== errorId));
    },
    // Method to clear all errors
    clearErrors: () => {
        set([]);
    },
    // Method to get all errors (for testing)
    getAllErrors: () => {
        let currentErrors: AppError[] = [];
        const unsubscribe = subscribe(errors => {
            currentErrors = errors;
        });
        unsubscribe();
        return currentErrors;
    },
    // Specific error creation helpers
    handleValidationError: (component: string, input: unknown, validationErrors: string[]) => {
        return errorHandler.addError({
            message: `Invalid input in ${component}: ${validationErrors.join(', ')}`,
            type: 'validation',
            context: { component, input, validationErrors },
            userMessage: `Please check your input for ${component}.`,
            userUserMessage: `Please check your input for ${component}.`, // Typo in original, keeping for now
            recoverable: true,
            isUserFacing: true,
        });
    },
    handlePerformanceWarning: (warningType: string, current: number, limit: number) => {
        return errorHandler.addError({
            message: `Performance limit reached for ${warningType}. Current: ${current}, Limit: ${limit}.`,
            type: 'performance',
            context: { warningType, current, limit },
            userMessage: `The application is approaching its performance limits. Consider reducing the complexity of your data.`,
            userUserMessage: `The application is approaching its performance limits. Consider reducing the complexity of your data.`, // Typo in original, keeping for now
            recoverable: true,
            isUserFacing: true,
        });
    },
    createError: (message: string, type: AppError['type'], context?: unknown, isUserFacing = false, userMessage?: string, recoverable = false) => {
        return errorHandler.addError({
            message,
            type,
            context,
            userMessage: userMessage || 'An unexpected error occurred.',
            userUserMessage: userMessage || 'An unexpected error occurred.', // Typo in original, keeping for now
            recoverable,
            isUserFacing,
        });
    }
};

// Utility function to safely execute code and catch errors
export async function safeExecute<T>(
    fn: () => T | Promise<T>,
    errorContext: string
): Promise<T | null> {
    try {
        return await fn();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        errorHandler.createError(
            `Operation failed in ${errorContext}: ${errorMessage}`,
            'runtime',
            { context: errorContext, originalError: error }, // Context
            true, // isUserFacing
            'An unexpected error occurred during an operation. Please try again.', // userMessage
            true // recoverable
        );
        return null;
    }
}
