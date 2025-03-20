/**
 * GameForge Types - Core type definitions for the GameForge framework
 */

export * from './project';
export * from './game-objects';
export * from './behaviors';
export * from './assets';
export * from './build';

// Export scene types, but avoid ambiguity with game-objects' Scene
import * as SceneTypes from './scenes';
export { SceneTypes };

// Export validation types
export * from './validation';

// Re-export specific types for clarity
export { GameConfig } from './project';
export { BuildOptions } from './build'; 