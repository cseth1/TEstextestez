/**
 * GameForge Engine - Core Engine Class
 * 
 * This is the main engine class that integrates all subsystems and provides
 * a unified interface for game development.
 */

import AssetManager, { AssetType } from '../assets/AssetManager';
import InputSystem from '../input/InputSystem';
import { PhysicsSystem } from '../physics/PhysicsSystem';
import { AdvancedRenderer } from '../rendering/AdvancedRenderer';
import { AnimationSystem } from '../animation/AnimationSystem';
import { AudioSystem } from '../audio/AudioSystem';
import { AISystem } from '../ai/AISystem';

export interface GameConfig {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  assets?: {
    baseUrl?: string;
    cacheSize?: number;
  };
  physics?: {
    gravity?: [number, number, number];
    stepSize?: number;
  };
  rendering?: {
    shadows?: boolean;
    antialiasing?: boolean;
    postProcessing?: boolean;
  };
  audio?: {
    volume?: {
      master?: number;
      sfx?: number;
      music?: number;
      voice?: number;
    };
  };
  debug?: boolean;
}

export interface SceneConfig {
  name: string;
  objects: any[];
  lights: any[];
  cameras: any[];
  environment?: any;
}

export interface GameObject {
  id: string;
  name: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  components: any[];
  children: GameObject[];
  parent?: GameObject;
  active: boolean;
  layer: number;
  tags: string[];
}

export class GameEngine {
  private static instance: GameEngine;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  
  // Core systems
  private assetManager: AssetManager;
  private inputSystem: InputSystem;
  private physicsSystem: PhysicsSystem;
  private renderer: AdvancedRenderer;
  private animationSystem: AnimationSystem;
  private audioSystem: AudioSystem;
  private aiSystem: AISystem;
  
  // Game state
  private currentScene: string = '';
  private scenes: Map<string, SceneConfig> = new Map();
  private gameObjects: Map<string, GameObject> = new Map();
  private mainCamera: any = null;
  
  // Timing
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private fixedTimeStep: number = 1 / 60;
  private timeAccumulator: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateInterval: number = 1;
  private fpsTime: number = 0;
  
  // Configuration
  private config: GameConfig = {
    width: 800,
    height: 600,
    debug: false
  };
  
  // Canvas and context
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  
  // Animation frame request ID
  private animationFrameId: number = 0;
  
  private constructor() {
    // Get all system singletons
    this.assetManager = AssetManager.getInstance();
    this.inputSystem = InputSystem.getInstance();
    this.physicsSystem = PhysicsSystem.getInstance();
    this.renderer = AdvancedRenderer.getInstance();
    this.animationSystem = AnimationSystem.getInstance();
    this.audioSystem = AudioSystem.getInstance();
    this.aiSystem = AISystem.getInstance();
  }
  
  public static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }
  
  public initialize(config: GameConfig = {}): void {
    if (this.isInitialized) return;
    
    console.log('Initializing GameForge Engine...');
    
    // Merge configurations
    this.config = {
      ...this.config,
      ...config
    };
    
    // Set up canvas
    if (config.canvas) {
      this.canvas = config.canvas;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.config.width || 800;
      this.canvas.height = this.config.height || 600;
      document.body.appendChild(this.canvas);
    }
    
    // Initialize WebGL context
    try {
      this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }
    } catch (error) {
      console.error('Error initializing WebGL:', error);
      return;
    }
    
    // Initialize subsystems
    try {
      // Asset manager
      this.assetManager.initialize(
        config.assets?.baseUrl || '', 
        config.assets?.cacheSize
      );
      
      // Input system
      this.inputSystem.initialize();
      
      // Physics system
      this.physicsSystem.initialize({
        gravity: config.physics?.gravity || [0, -9.81, 0],
        stepSize: config.physics?.stepSize || this.fixedTimeStep
      });
      
      // Renderer
      this.renderer.initialize({
        gl: this.gl,
        width: this.canvas.width,
        height: this.canvas.height,
        shadows: config.rendering?.shadows || false,
        antialiasing: config.rendering?.antialiasing || false,
        postProcessing: config.rendering?.postProcessing || false
      });
      
      // Animation system
      this.animationSystem.initialize();
      
      // Audio system
      this.audioSystem.initialize({
        volume: {
          master: config.audio?.volume?.master || 1.0,
          sfx: config.audio?.volume?.sfx || 1.0,
          music: config.audio?.volume?.music || 1.0,
          voice: config.audio?.volume?.voice || 1.0
        }
      });
      
      // AI system
      this.aiSystem.initialize();
      
      this.isInitialized = true;
      console.log('GameForge Engine initialized successfully');
    } catch (error) {
      console.error('Error initializing GameForge Engine:', error);
    }
  }
  
  public loadScene(sceneName: string): Promise<void> {
    if (!this.isInitialized) {
      return Promise.reject(new Error('Engine not initialized'));
    }
    
    const scene = this.scenes.get(sceneName);
    
    if (!scene) {
      return Promise.reject(new Error(`Scene not found: ${sceneName}`));
    }
    
    console.log(`Loading scene: ${sceneName}`);
    
    // Unload current scene if any
    if (this.currentScene) {
      this.unloadScene(this.currentScene);
    }
    
    // Set as current scene
    this.currentScene = sceneName;
    
    // TODO: Load scene assets, create game objects, etc.
    // This would typically involve:
    // 1. Loading all scene assets
    // 2. Creating game objects and components
    // 3. Setting up physics, lights, cameras, etc.
    
    // For now, we'll just create a simple implementation
    
    // Create all game objects specified in the scene
    scene.objects.forEach(objDef => {
      this.createGameObject(objDef);
    });
    
    // Set up cameras
    if (scene.cameras && scene.cameras.length > 0) {
      this.mainCamera = scene.cameras[0]; // Use first camera as main
    }
    
    // Set up lighting
    if (scene.lights && scene.lights.length > 0) {
      scene.lights.forEach(light => {
        this.renderer.addLight(light);
      });
    }
    
    // Set up environment
    if (scene.environment) {
      this.renderer.setEnvironment(scene.environment);
    }
    
    console.log(`Scene ${sceneName} loaded successfully`);
    
    return Promise.resolve();
  }
  
  public unloadScene(sceneName: string): void {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized');
    }
    
    console.log(`Unloading scene: ${sceneName}`);
    
    // Clear game objects, lights, etc.
    this.gameObjects.clear();
    this.renderer.clearLights();
    this.renderer.clearRenderables();
    this.physicsSystem.clearWorld();
    
    // Clear current scene reference if it matches
    if (this.currentScene === sceneName) {
      this.currentScene = '';
    }
    
    console.log(`Scene ${sceneName} unloaded successfully`);
  }
  
  public registerScene(scene: SceneConfig): void {
    this.scenes.set(scene.name, scene);
    console.log(`Scene registered: ${scene.name}`);
  }
  
  public createGameObject(definition: any): GameObject {
    // Create a game object from the definition
    const gameObject: GameObject = {
      id: definition.id || `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: definition.name || 'GameObject',
      transform: definition.transform || {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      components: [],
      children: [],
      active: definition.active !== undefined ? definition.active : true,
      layer: definition.layer || 0,
      tags: definition.tags || []
    };
    
    // Process components
    if (definition.components) {
      definition.components.forEach((compDef: any) => {
        this.addComponent(gameObject, compDef);
      });
    }
    
    // Process children
    if (definition.children) {
      definition.children.forEach((childDef: any) => {
        const child = this.createGameObject(childDef);
        child.parent = gameObject;
        gameObject.children.push(child);
      });
    }
    
    // Register the game object
    this.gameObjects.set(gameObject.id, gameObject);
    
    return gameObject;
  }
  
  public destroyGameObject(id: string): void {
    const gameObject = this.gameObjects.get(id);
    
    if (!gameObject) {
      console.warn(`Game object not found: ${id}`);
      return;
    }
    
    // Remove from parent if any
    if (gameObject.parent) {
      const parent = gameObject.parent;
      const index = parent.children.indexOf(gameObject);
      
      if (index !== -1) {
        parent.children.splice(index, 1);
      }
    }
    
    // Destroy children recursively
    gameObject.children.forEach(child => {
      this.destroyGameObject(child.id);
    });
    
    // Remove components
    gameObject.components.forEach(component => {
      this.removeComponent(gameObject, component);
    });
    
    // Remove from registry
    this.gameObjects.delete(id);
  }
  
  public addComponent(gameObject: GameObject, component: any): void {
    // TODO: Implement component creation based on type
    // This would typically involve creating the component, initializing it,
    // and registering it with the appropriate system
    
    // For now, just add to the game object's components
    gameObject.components.push(component);
    
    // Register with relevant system based on component type
    if (component.type === 'renderer') {
      this.renderer.addRenderable({
        gameObjectId: gameObject.id,
        transform: gameObject.transform,
        ...component
      });
    } else if (component.type === 'rigidbody') {
      this.physicsSystem.createRigidBody({
        gameObjectId: gameObject.id,
        transform: gameObject.transform,
        ...component
      });
    } else if (component.type === 'collider') {
      this.physicsSystem.createCollider({
        gameObjectId: gameObject.id,
        transform: gameObject.transform,
        ...component
      });
    } else if (component.type === 'animator') {
      this.animationSystem.createAnimator({
        gameObjectId: gameObject.id,
        ...component
      });
    } else if (component.type === 'audioSource') {
      this.audioSystem.createAudioSource({
        gameObjectId: gameObject.id,
        transform: gameObject.transform,
        ...component
      });
    } else if (component.type === 'aiAgent') {
      this.aiSystem.createAgent({
        gameObjectId: gameObject.id,
        transform: gameObject.transform,
        ...component
      });
    }
  }
  
  public removeComponent(gameObject: GameObject, component: any): void {
    // Remove from game object's components
    const index = gameObject.components.indexOf(component);
    
    if (index !== -1) {
      gameObject.components.splice(index, 1);
    }
    
    // Unregister from relevant system based on component type
    if (component.type === 'renderer') {
      this.renderer.removeRenderable(gameObject.id);
    } else if (component.type === 'rigidbody') {
      this.physicsSystem.removeRigidBody(gameObject.id);
    } else if (component.type === 'animator') {
      this.animationSystem.removeAnimator(gameObject.id);
    } else if (component.type === 'audioSource') {
      this.audioSystem.removeAudioSource(gameObject.id);
    } else if (component.type === 'aiAgent') {
      this.aiSystem.removeAgent(gameObject.id);
    }
  }
  
  public getGameObject(id: string): GameObject | undefined {
    return this.gameObjects.get(id);
  }
  
  public findGameObjectsByName(name: string): GameObject[] {
    const results: GameObject[] = [];
    
    this.gameObjects.forEach(obj => {
      if (obj.name === name) {
        results.push(obj);
      }
    });
    
    return results;
  }
  
  public findGameObjectsByTag(tag: string): GameObject[] {
    const results: GameObject[] = [];
    
    this.gameObjects.forEach(obj => {
      if (obj.tags.includes(tag)) {
        results.push(obj);
      }
    });
    
    return results;
  }
  
  public start(): void {
    if (!this.isInitialized) {
      console.error('Cannot start engine: not initialized');
      return;
    }
    
    if (this.isRunning) {
      console.warn('Engine is already running');
      return;
    }
    
    console.log('Starting engine...');
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    
    // Start main loop
    this.mainLoop();
    
    console.log('Engine started successfully');
  }
  
  public stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    console.log('Stopping engine...');
    
    this.isRunning = false;
    
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    
    console.log('Engine stopped successfully');
  }
  
  public pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    console.log('Pausing engine...');
    
    this.isPaused = true;
  }
  
  public resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    console.log('Resuming engine...');
    
    this.isPaused = false;
    this.lastFrameTime = performance.now();
  }
  
  public setTimeScale(scale: number): void {
    // Adjust time scale (can be used for slow motion effects, etc.)
    this.physicsSystem.setTimeScale(scale);
  }
  
  private mainLoop(): void {
    if (!this.isRunning) {
      return;
    }
    
    // Request next frame
    this.animationFrameId = requestAnimationFrame(() => this.mainLoop());
    
    // Skip if paused
    if (this.isPaused) {
      return;
    }
    
    // Calculate delta time
    const now = performance.now();
    this.deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = now;
    
    // Cap delta time to avoid spiral of death
    if (this.deltaTime > 0.1) {
      this.deltaTime = 0.1;
    }
    
    // Update FPS counter
    this.frameCount++;
    this.fpsTime += this.deltaTime;
    
    if (this.fpsTime >= this.fpsUpdateInterval) {
      this.fps = this.frameCount / this.fpsTime;
      this.frameCount = 0;
      this.fpsTime = 0;
      
      if (this.config.debug) {
        console.log(`FPS: ${this.fps.toFixed(2)}`);
      }
    }
    
    // Update systems
    this.update();
    this.fixedUpdate();
    this.lateUpdate();
    this.render();
  }
  
  private update(): void {
    // Update input
    this.inputSystem.update();
    
    // Update animations
    this.animationSystem.update(this.deltaTime);
    
    // Update AI
    this.aiSystem.update(this.deltaTime);
    
    // Update audio
    this.audioSystem.update(this.deltaTime);
    
    // Update game objects
    this.updateGameObjects(this.deltaTime);
  }
  
  private fixedUpdate(): void {
    // Accumulate time
    this.timeAccumulator += this.deltaTime;
    
    // Run fixed updates as needed
    while (this.timeAccumulator >= this.fixedTimeStep) {
      // Update physics
      this.physicsSystem.update(this.fixedTimeStep);
      
      // Subtract fixed time step from accumulator
      this.timeAccumulator -= this.fixedTimeStep;
    }
  }
  
  private lateUpdate(): void {
    // Late update is typically used for camera follow, etc.
    // after all other updates have completed
    
    // In a real engine, you would iterate through components
    // that need late updates here
  }
  
  private render(): void {
    // Render the scene
    if (this.renderer && this.mainCamera) {
      this.renderer.render(this.mainCamera);
    }
  }
  
  private updateGameObjects(deltaTime: number): void {
    // In a real engine, this would iterate through all game objects
    // and call update on their components
    
    // Update transform based on physics
    this.gameObjects.forEach(obj => {
      // Check if object has a rigidbody
      const rigidbody = obj.components.find(c => c.type === 'rigidbody');
      
      if (rigidbody) {
        // Get transform from physics system
        const transform = this.physicsSystem.getTransform(obj.id);
        
        if (transform) {
          // Update game object transform
          obj.transform = transform;
        }
      }
      
      // Call update on all components
      obj.components.forEach(component => {
        if (component.update && typeof component.update === 'function') {
          component.update(deltaTime);
        }
      });
    });
  }
  
  // Utility methods
  
  public loadAsset(path: string, type: AssetType): Promise<any> {
    return this.assetManager.loadAsset(path);
  }
  
  public isKeyPressed(key: string): boolean {
    return this.inputSystem.isKeyPressed(key);
  }
  
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
  
  public getGLContext(): WebGLRenderingContext | null {
    return this.gl;
  }
  
  public getDeltaTime(): number {
    return this.deltaTime;
  }
  
  public getFPS(): number {
    return this.fps;
  }
}

export default GameEngine; 