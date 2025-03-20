/**
 * Build-related type definitions
 */

/**
 * Build target configuration
 */
export interface BuildTarget {
    platform: string;
    architecture?: string;
    configuration: 'development' | 'testing' | 'shipping';
    description?: string;
}

/**
 * Build options
 */
export interface BuildOptions {
    clean: boolean;
    verbose: boolean;
} 