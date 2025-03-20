/**
 * Behavior-related type definitions
 */

/**
 * Behavior definition
 */
export interface Behavior {
    name: string;
    states: { [key: string]: BehaviorState };
    variables?: { [key: string]: any };
    parameters?: { [key: string]: any };
}

/**
 * Behavior state definition
 */
export interface BehaviorState {
    entryActions?: Action[];
    updateActions?: Action[];
    exitActions?: Action[];
    transitions?: BehaviorTransition[];
}

/**
 * Action definition
 */
export interface Action {
    type: string;
    [key: string]: any;
}

/**
 * Transition definition
 */
export interface BehaviorTransition {
    to: string;
    condition: string;
} 