/**
 * Validation-related type definitions
 */

/**
 * Validation error interface
 */
export interface ValidationError {
    code: string;
    message: string;
    path: string;
    severity: 'error' | 'warning' | 'info';
} 