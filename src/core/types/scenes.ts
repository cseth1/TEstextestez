/**
 * Scene-related type definitions
 */

import { GameObject } from './game-objects';

/**
 * Scene definition
 */
export interface Scene {
    name: string;
    description?: string;
    environment?: {
        skybox?: string;
        ambientLight?: [number, number, number];
        fog?: {
            enabled: boolean;
            color: [number, number, number];
            density: number;
        };
    };
    gameObjects: { [key: string]: GameObject };
} 