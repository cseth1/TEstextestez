/**
 * Animation System for GameForge
 * 
 * Provides skeletal animation, animation blending, and state machine functionality
 * for complex character animations and behaviors.
 */

import { GameObject } from '../core/types';

export interface AnimationClip {
  name: string;
  duration: number;
  fps: number;
  loop: boolean;
  tracks: AnimationTrack[];
}

export interface AnimationTrack {
  path: string; // Bone path
  position?: KeyframeTrack<[number, number, number]>;
  rotation?: KeyframeTrack<[number, number, number, number]>; // Quaternion
  scale?: KeyframeTrack<[number, number, number]>;
}

export interface Keyframe<T> {
  time: number;
  value: T;
  interpolation: 'step' | 'linear' | 'cubic';
  inTangent?: T;
  outTangent?: T;
}

export interface KeyframeTrack<T> {
  keyframes: Keyframe<T>[];
}

export interface AnimationState {
  clip: AnimationClip;
  weight: number;
  time: number;
  speed: number;
  enabled: boolean;
}

export type BlendFunction = 'override' | 'additive' | 'blend';

export interface BlendTree {
  type: 'simple1D' | 'simple2D' | 'freeform2D' | 'direct';
  parameter?: string; // For 1D blending
  parameters?: [string, string]; // For 2D blending
  children: Array<{ 
    state: AnimationState, 
    threshold?: number, // For 1D
    position?: [number, number], // For 2D
    weight?: number // For direct blending
  }>;
  blendFunction: BlendFunction;
}

export interface AnimatorTransition {
  from: string;
  to: string;
  conditions: Array<{
    parameter: string;
    mode: 'equals' | 'notEqual' | 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual';
    value: number | boolean;
  }>;
  hasExitTime: boolean;
  exitTime?: number;
  duration: number;
  offset?: number;
}

export interface AnimatorLayer {
  name: string;
  states: Map<string, AnimationState | BlendTree>;
  transitions: AnimatorTransition[];
  defaultState: string;
  currentState?: string;
  weight: number;
  blendMode: 'override' | 'additive';
}

export interface AnimatorParameters {
  [key: string]: number | boolean;
}

export class AnimationSystem {
  private static instance: AnimationSystem;
  private animators: Map<string, Animator> = new Map();
  private isInitialized: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): AnimationSystem {
    if (!AnimationSystem.instance) {
      AnimationSystem.instance = new AnimationSystem();
    }
    return AnimationSystem.instance;
  }
  
  public initialize(): void {
    if (this.isInitialized) return;
    
    console.log('Initializing animation system...');
    
    this.isInitialized = true;
    console.log('Animation system initialized successfully');
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Update all animators
    this.animators.forEach(animator => {
      animator.update(deltaTime);
    });
  }
  
  public createAnimator(id: string, gameObject: GameObject): Animator {
    const animator = new Animator(id, gameObject);
    this.animators.set(id, animator);
    return animator;
  }
  
  public removeAnimator(id: string): void {
    this.animators.delete(id);
  }
  
  public getAnimator(id: string): Animator | undefined {
    return this.animators.get(id);
  }
}

export class Animator {
  private id: string;
  private gameObject: GameObject;
  private layers: AnimatorLayer[] = [];
  private parameters: AnimatorParameters = {};
  private skeleton: any = null; // This would be the skeleton in a real implementation
  
  constructor(id: string, gameObject: GameObject) {
    this.id = id;
    this.gameObject = gameObject;
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getGameObject(): GameObject {
    return this.gameObject;
  }
  
  public update(deltaTime: number): void {
    // Update animation states for each layer
    this.layers.forEach(layer => {
      // Check for transitions
      this.evaluateTransitions(layer);
      
      // Update current state
      if (layer.currentState) {
        const state = layer.states.get(layer.currentState);
        if (state) {
          if ('clip' in state) {
            // Single animation state
            this.updateAnimationState(state, deltaTime);
          } else {
            // Blend tree
            this.updateBlendTree(state, deltaTime);
          }
        }
      }
    });
    
    // Apply animations to skeleton
    this.applyAnimationsToSkeleton();
  }
  
  private updateAnimationState(state: AnimationState, deltaTime: number): void {
    if (!state.enabled) return;
    
    // Update animation time
    state.time += deltaTime * state.speed;
    
    // Handle looping
    if (state.clip.loop && state.time >= state.clip.duration) {
      state.time %= state.clip.duration;
    } else if (!state.clip.loop && state.time > state.clip.duration) {
      state.time = state.clip.duration;
      state.enabled = false;
    }
  }
  
  private updateBlendTree(blendTree: BlendTree, deltaTime: number): void {
    // Update all animation states in the blend tree
    blendTree.children.forEach(child => {
      this.updateAnimationState(child.state, deltaTime);
    });
    
    // Calculate weights based on blend tree type
    switch (blendTree.type) {
      case 'simple1D':
        this.calculate1DBlendWeights(blendTree);
        break;
      case 'simple2D':
      case 'freeform2D':
        this.calculate2DBlendWeights(blendTree);
        break;
      case 'direct':
        // Weights are set directly
        break;
    }
  }
  
  private calculate1DBlendWeights(blendTree: BlendTree): void {
    if (!blendTree.parameter) return;
    
    const paramValue = typeof this.parameters[blendTree.parameter] === 'number' 
      ? this.parameters[blendTree.parameter] as number 
      : 0;
    
    // Sort children by threshold
    const sortedChildren = [...blendTree.children].sort((a, b) => {
      const thresholdA = a.threshold ?? 0;
      const thresholdB = b.threshold ?? 0;
      return thresholdA - thresholdB;
    });
    
    // Find the two animations to blend
    let lowerChild: typeof sortedChildren[0] | null = null;
    let upperChild: typeof sortedChildren[0] | null = null;
    
    for (let i = 0; i < sortedChildren.length; i++) {
      const threshold = sortedChildren[i].threshold ?? 0;
      if (threshold <= paramValue) {
        lowerChild = sortedChildren[i];
        upperChild = sortedChildren[i + 1] || null;
      }
    }
    
    // Set weights
    sortedChildren.forEach(child => {
      child.state.weight = 0;
    });
    
    if (lowerChild && upperChild) {
      const lowerThreshold = lowerChild.threshold ?? 0;
      const upperThreshold = upperChild.threshold ?? 0;
      const blend = (paramValue - lowerThreshold) / (upperThreshold - lowerThreshold);
      
      lowerChild.state.weight = 1 - blend;
      upperChild.state.weight = blend;
    } else if (lowerChild) {
      lowerChild.state.weight = 1;
    } else if (upperChild) {
      upperChild.state.weight = 1;
    }
  }
  
  private calculate2DBlendWeights(blendTree: BlendTree): void {
    if (!blendTree.parameters || blendTree.parameters.length !== 2) return;
    
    const paramX = typeof this.parameters[blendTree.parameters[0]] === 'number' 
      ? this.parameters[blendTree.parameters[0]] as number 
      : 0;
      
    const paramY = typeof this.parameters[blendTree.parameters[1]] === 'number' 
      ? this.parameters[blendTree.parameters[1]] as number 
      : 0;
    
    if (blendTree.type === 'simple2D') {
      // Simple 2D blending uses 4 animations at the corners of a square
      // Find the four closest animations based on their positions
      // Calculate weights based on distance
      
      // Reset weights
      blendTree.children.forEach(child => {
        child.state.weight = 0;
      });
      
      // TODO: Implement simple 2D blending algorithm
    } else {
      // Freeform 2D blending uses barycentric coordinates for triangles
      // or other algorithms for more complex shapes
      
      // Reset weights
      blendTree.children.forEach(child => {
        child.state.weight = 0;
      });
      
      // TODO: Implement freeform 2D blending algorithm
    }
  }
  
  private evaluateTransitions(layer: AnimatorLayer): void {
    if (!layer.currentState) {
      layer.currentState = layer.defaultState;
      return;
    }
    
    // Find valid transitions from current state
    const validTransitions = layer.transitions.filter(transition => 
      transition.from === layer.currentState || transition.from === '*'
    );
    
    // Check each transition
    for (const transition of validTransitions) {
      let conditionsMet = true;
      
      // Check all conditions
      for (const condition of transition.conditions) {
        const paramValue = this.parameters[condition.parameter];
        
        if (paramValue === undefined) {
          conditionsMet = false;
          break;
        }
        
        switch (condition.mode) {
          case 'equals':
            conditionsMet = paramValue === condition.value;
            break;
          case 'notEqual':
            conditionsMet = paramValue !== condition.value;
            break;
          case 'greater':
            conditionsMet = typeof paramValue === 'number' && 
                            typeof condition.value === 'number' && 
                            paramValue > condition.value;
            break;
          case 'less':
            conditionsMet = typeof paramValue === 'number' && 
                            typeof condition.value === 'number' && 
                            paramValue < condition.value;
            break;
          case 'greaterOrEqual':
            conditionsMet = typeof paramValue === 'number' && 
                            typeof condition.value === 'number' && 
                            paramValue >= condition.value;
            break;
          case 'lessOrEqual':
            conditionsMet = typeof paramValue === 'number' && 
                            typeof condition.value === 'number' && 
                            paramValue <= condition.value;
            break;
        }
        
        if (!conditionsMet) break;
      }
      
      // If conditions are met, transition to the target state
      if (conditionsMet) {
        // TODO: Handle transition blending with duration
        layer.currentState = transition.to;
        
        // Reset the state if it's an animation state
        const state = layer.states.get(layer.currentState);
        if (state && 'clip' in state) {
          state.time = transition.offset ?? 0;
          state.enabled = true;
        }
        
        break; // Only process the first valid transition
      }
    }
  }
  
  private applyAnimationsToSkeleton(): void {
    // This would apply the animated bone transforms to the skeleton in a real implementation
    
    // Clear pose
    
    // For each layer (in order)
    this.layers.forEach(layer => {
      if (!layer.currentState) return;
      
      const state = layer.states.get(layer.currentState);
      if (!state) return;
      
      // Apply based on layer blend mode and weight
      if ('clip' in state) {
        // Single animation state
        this.applyAnimationToPose(state.clip, state.time, layer.weight * state.weight, layer.blendMode);
      } else {
        // Blend tree
        this.applyBlendTreeToPose(state, layer.weight, layer.blendMode);
      }
    });
    
    // Update final bone transforms
  }
  
  private applyAnimationToPose(clip: AnimationClip, time: number, weight: number, blendMode: 'override' | 'additive'): void {
    // Sample animation at the current time
    // Apply to skeleton pose with weight and blend mode
  }
  
  private applyBlendTreeToPose(blendTree: BlendTree, layerWeight: number, layerBlendMode: 'override' | 'additive'): void {
    // Apply each weighted animation in the blend tree
    blendTree.children.forEach(child => {
      const weight = child.state.weight * layerWeight;
      if (weight > 0) {
        this.applyAnimationToPose(
          child.state.clip, 
          child.state.time, 
          weight, 
          layerBlendMode
        );
      }
    });
  }
  
  public setParameter(name: string, value: number | boolean): void {
    this.parameters[name] = value;
  }
  
  public getParameter(name: string): number | boolean | undefined {
    return this.parameters[name];
  }
  
  public createLayer(name: string): AnimatorLayer {
    const layer: AnimatorLayer = {
      name,
      states: new Map(),
      transitions: [],
      defaultState: '',
      weight: 1.0,
      blendMode: 'override'
    };
    
    this.layers.push(layer);
    return layer;
  }
  
  public createState(layerIndex: number, name: string, clip: AnimationClip): void {
    if (layerIndex < 0 || layerIndex >= this.layers.length) return;
    
    const layer = this.layers[layerIndex];
    const state: AnimationState = {
      clip,
      weight: 1.0,
      time: 0,
      speed: 1.0,
      enabled: false
    };
    
    layer.states.set(name, state);
    
    // If this is the first state, set it as default
    if (layer.states.size === 1) {
      layer.defaultState = name;
    }
  }
  
  public createBlendTree(layerIndex: number, name: string, type: BlendTree['type'], parameter?: string, parameters?: [string, string]): void {
    if (layerIndex < 0 || layerIndex >= this.layers.length) return;
    
    const layer = this.layers[layerIndex];
    const blendTree: BlendTree = {
      type,
      parameter,
      parameters,
      children: [],
      blendFunction: 'blend'
    };
    
    layer.states.set(name, blendTree);
  }
  
  public addTransition(layerIndex: number, from: string, to: string, duration: number = 0.3): AnimatorTransition {
    if (layerIndex < 0 || layerIndex >= this.layers.length) 
      throw new Error(`Layer index ${layerIndex} is out of bounds`);
    
    const layer = this.layers[layerIndex];
    
    if (!layer.states.has(from) && from !== '*') 
      throw new Error(`State '${from}' does not exist in layer '${layer.name}'`);
    
    if (!layer.states.has(to)) 
      throw new Error(`State '${to}' does not exist in layer '${layer.name}'`);
    
    const transition: AnimatorTransition = {
      from,
      to,
      conditions: [],
      hasExitTime: false,
      duration,
    };
    
    layer.transitions.push(transition);
    return transition;
  }
  
  public addCondition(transition: AnimatorTransition, parameter: string, mode: AnimatorTransition['conditions'][0]['mode'], value: number | boolean): void {
    transition.conditions.push({ parameter, mode, value });
  }
  
  public play(stateName: string, layerIndex: number = 0): void {
    if (layerIndex < 0 || layerIndex >= this.layers.length) return;
    
    const layer = this.layers[layerIndex];
    
    if (layer.states.has(stateName)) {
      layer.currentState = stateName;
      
      const state = layer.states.get(stateName);
      if (state && 'clip' in state) {
        state.time = 0;
        state.enabled = true;
      }
    }
  }
}

export default AnimationSystem; 