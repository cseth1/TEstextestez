/**
 * Project-related type definitions
 */

/**
 * Main project configuration interface
 */
export interface GameForgeProject {
    name: string;
    version: string;
    engine: 'unreal' | 'unity';
    engineVersion: string;
    description?: string;
}

/**
 * Simple project configuration for initialization
 */
export interface GameConfig {
    name: string;
    description?: string;
    version: string;
} 