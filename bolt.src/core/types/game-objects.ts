/**
 * Game object-related type definitions
 */

/**
 * 3D transform for game objects
 */
export interface Transform {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

/**
 * Base component interface
 */
export interface Component {
    type: string;
    [key: string]: any;
}

/**
 * Game object definition
 */
export interface GameObject {
    name: string;
    tags?: string[];
    layer?: string;
    transform: Transform;
    components: { [key: string]: Component };
    children?: { [key: string]: GameObject };
} 