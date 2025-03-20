/**
 * GameForge Core Module
 * This module contains the core functionality of the GameForge framework.
 */

// Import specific types
import { GameConfig } from './types/project';

// Re-export all types
export * from './types';

// Export parser functionality
export * from './parser';

// Export version constant
export const VERSION = '1.0.0';

/**
 * Initialize a new GameForge project
 */
export function initializeProject(config: GameConfig): boolean {
  console.log(`Initializing GameForge project: ${config.name}`);
  return true;
} 