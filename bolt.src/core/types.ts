export interface GameForgeProject {
    name: string;
    version: string;
    engine: 'unreal' | 'unity';
    engineVersion: string;
    description?: string;
}

export interface Transform {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

export interface Component {
    type: string;
    [key: string]: any;
}

export interface GameObject {
    name: string;
    tags?: string[];
    layer?: string;
    transform: Transform;
    components: { [key: string]: Component };
    children?: { [key: string]: GameObject };
}

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

export interface Behavior {
    name: string;
    states: { [key: string]: BehaviorState };
    variables?: { [key: string]: any };
    parameters?: { [key: string]: any };
}

export interface BehaviorState {
    entryActions?: Action[];
    updateActions?: Action[];
    exitActions?: Action[];
    transitions?: BehaviorTransition[];
}

export interface Action {
    type: string;
    [key: string]: any;
}

export interface BehaviorTransition {
    to: string;
    condition: string;
}

export interface AssetReference {
    category: string;
    id: string;
    uri: string;
}

export interface BuildTarget {
    platform: string;
    architecture?: string;
    configuration: 'development' | 'testing' | 'shipping';
    description?: string;
} 