/**
 * GameForge - Text-based game development framework
 * 
 * This is the main entry point for the GameForge library.
 */

// Re-export core functionality
export * from './core';

// Re-export CLI commands
export { default as cli } from './cli';

// Export package version
export const version = '1.0.0'; 