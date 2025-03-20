/**
 * Audio System for GameForge
 * 
 * Provides 3D spatial audio, sound effects, music playback, and audio mixing.
 */

import { GameObject } from '../core/types';

export interface AudioConfig {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  ambientVolume: number;
  spatialScale: number;
  dopplerFactor: number;
  distanceModel: 'linear' | 'inverse' | 'exponential';
}

export interface AudioClipOptions {
  loop: boolean;
  volume: number;
  pitch: number;
  startTime: number;
  spatial: boolean;
  category: 'sfx' | 'music' | 'voice' | 'ambient';
  priority: number; // 0-100, higher values = higher priority
}

export interface AudioEffectOptions {
  enabled: boolean;
}

export interface ReverbOptions extends AudioEffectOptions {
  decay: number;
  density: number;
  diffusion: number;
  gain: number;
  preDelay: number;
  earlyReflections: number;
  lateReflections: number;
  highFrequencyCutoff: number;
}

export interface EchoOptions extends AudioEffectOptions {
  delay: number;
  feedback: number;
  dryMix: number;
  wetMix: number;
}

export interface FilterOptions extends AudioEffectOptions {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'peaking' | 'allpass';
  frequency: number;
  Q: number;
  gain: number;
}

export interface CompressorOptions extends AudioEffectOptions {
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
}

export type AudioEffects = {
  reverb?: ReverbOptions;
  echo?: EchoOptions;
  filter?: FilterOptions;
  compressor?: CompressorOptions;
}

export class AudioSystem {
  private static instance: AudioSystem;
  private config: AudioConfig;
  private isInitialized: boolean = false;
  private audioContext: any = null; // This would be a Web Audio API AudioContext in a real implementation
  private audioSources: Map<string, AudioSource> = new Map();
  private audioClips: Map<string, AudioClip> = new Map();
  private audioListeners: Map<string, AudioListener> = new Map();
  private masterGain: any = null;
  private categoryGains: Map<string, any> = new Map();
  private effectsChain: any[] = [];
  private activeAudioNodes: Map<string, any> = new Map();
  
  private constructor(config: AudioConfig) {
    this.config = config;
  }
  
  public static getInstance(config?: AudioConfig): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem(config || {
        masterVolume: 1.0,
        sfxVolume: 1.0,
        musicVolume: 0.8,
        voiceVolume: 1.0,
        ambientVolume: 0.6,
        spatialScale: 1.0,
        dopplerFactor: 1.0,
        distanceModel: 'inverse'
      });
    }
    return AudioSystem.instance;
  }
  
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing audio system...');
    
    try {
      // In a real implementation, this would initialize the Web Audio API
      // this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Set up master gain node
      // this.masterGain = this.audioContext.createGain();
      // this.masterGain.gain.value = this.config.masterVolume;
      // this.masterGain.connect(this.audioContext.destination);
      
      // Set up category gain nodes
      // this.setupCategoryGains();
      
      // Set up effects chain
      // this.setupEffectsChain();
      
      this.isInitialized = true;
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      throw error;
    }
  }
  
  private setupCategoryGains(): void {
    // Create gain nodes for each audio category
    const categories = ['sfx', 'music', 'voice', 'ambient'];
    
    categories.forEach(category => {
      // const gain = this.audioContext.createGain();
      // gain.gain.value = this.getCategoryVolume(category);
      // gain.connect(this.masterGain);
      // this.categoryGains.set(category, gain);
    });
  }
  
  private setupEffectsChain(): void {
    // Create and connect effect nodes
    // For example:
    // const compressor = this.audioContext.createDynamicsCompressor();
    // compressor.threshold.value = -24;
    // compressor.knee.value = 30;
    // compressor.ratio.value = 12;
    // compressor.attack.value = 0.003;
    // compressor.release.value = 0.25;
    // compressor.connect(this.masterGain);
    // this.masterGain.disconnect();
    // this.masterGain.connect(compressor);
    // this.effectsChain.push(compressor);
  }
  
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Update spatial audio parameters based on listener and source positions
    this.updateSpatialAudio();
    
    // Update audio sources
    this.audioSources.forEach(source => {
      source.update();
    });
    
    // Clean up completed audio sources
    this.cleanupAudioNodes();
  }
  
  private updateSpatialAudio(): void {
    // Get the primary audio listener (usually attached to the camera)
    const primaryListener = this.getPrimaryListener();
    if (!primaryListener) return;
    
    // In a real implementation, this would update the AudioListener position and orientation
    
    // Update all spatial audio sources
    this.audioSources.forEach(source => {
      if (source.isSpatial()) {
        source.updateSpatialParameters(primaryListener);
      }
    });
  }
  
  private cleanupAudioNodes(): void {
    // Remove audio nodes that have finished playing
    const currentTime = this.audioContext ? this.audioContext.currentTime : 0;
    const nodesToRemove: string[] = [];
    
    this.activeAudioNodes.forEach((node, id) => {
      if (node.endTime && node.endTime <= currentTime) {
        // In a real implementation:
        // node.sourceNode.disconnect();
        nodesToRemove.push(id);
      }
    });
    
    nodesToRemove.forEach(id => {
      this.activeAudioNodes.delete(id);
    });
  }
  
  public createAudioSource(id: string, gameObject: GameObject): AudioSource {
    const source = new AudioSource(id, gameObject, this);
    this.audioSources.set(id, source);
    return source;
  }
  
  public removeAudioSource(id: string): void {
    const source = this.audioSources.get(id);
    if (source) {
      source.stop();
      this.audioSources.delete(id);
    }
  }
  
  public createAudioListener(id: string, gameObject: GameObject, isPrimary: boolean = false): AudioListener {
    const listener = new AudioListener(id, gameObject, isPrimary);
    this.audioListeners.set(id, listener);
    return listener;
  }
  
  public removeAudioListener(id: string): void {
    this.audioListeners.delete(id);
  }
  
  public getPrimaryListener(): AudioListener | undefined {
    return Array.from(this.audioListeners.values()).find(listener => listener.isPrimary());
  }
  
  public async loadAudioClip(id: string, url: string): Promise<AudioClip> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log(`Loading audio clip: ${id}`);
    
    try {
      // In a real implementation, this would load and decode the audio file
      // const response = await fetch(url);
      // const arrayBuffer = await response.arrayBuffer();
      // const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const audioClip = new AudioClip(id, null); // audioBuffer instead of null
      this.audioClips.set(id, audioClip);
      
      console.log(`Audio clip loaded: ${id}`);
      return audioClip;
    } catch (error) {
      console.error(`Failed to load audio clip ${id}:`, error);
      throw error;
    }
  }
  
  public getAudioClip(id: string): AudioClip | undefined {
    return this.audioClips.get(id);
  }
  
  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGain) {
      // this.masterGain.gain.setValueAtTime(this.config.masterVolume, this.audioContext.currentTime);
    }
  }
  
  public setCategoryVolume(category: string, volume: number): void {
    switch (category) {
      case 'sfx':
        this.config.sfxVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'music':
        this.config.musicVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'voice':
        this.config.voiceVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'ambient':
        this.config.ambientVolume = Math.max(0, Math.min(1, volume));
        break;
    }
    
    const gain = this.categoryGains.get(category);
    if (gain) {
      // gain.gain.setValueAtTime(this.getCategoryVolume(category), this.audioContext.currentTime);
    }
  }
  
  public getCategoryVolume(category: string): number {
    switch (category) {
      case 'sfx':
        return this.config.sfxVolume;
      case 'music':
        return this.config.musicVolume;
      case 'voice':
        return this.config.voiceVolume;
      case 'ambient':
        return this.config.ambientVolume;
      default:
        return 1.0;
    }
  }
  
  public getAudioContext(): any {
    return this.audioContext;
  }
  
  public getMasterGain(): any {
    return this.masterGain;
  }
  
  public getCategoryGain(category: string): any {
    return this.categoryGains.get(category);
  }
  
  public registerAudioNode(id: string, node: any, endTime?: number): void {
    this.activeAudioNodes.set(id, {
      sourceNode: node,
      endTime: endTime
    });
  }
  
  public unregisterAudioNode(id: string): void {
    this.activeAudioNodes.delete(id);
  }
  
  public getConfig(): AudioConfig {
    return { ...this.config };
  }
  
  public setConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update audio context with new config
    if (this.isInitialized) {
      // Update master volume
      this.setMasterVolume(this.config.masterVolume);
      
      // Update category volumes
      this.setCategoryVolume('sfx', this.config.sfxVolume);
      this.setCategoryVolume('music', this.config.musicVolume);
      this.setCategoryVolume('voice', this.config.voiceVolume);
      this.setCategoryVolume('ambient', this.config.ambientVolume);
      
      // Update distance model for spatial audio
      // if (this.audioContext.listener && this.audioContext.listener.setDistanceModel) {
      //   this.audioContext.listener.setDistanceModel(this.config.distanceModel);
      // }
    }
  }
}

export class AudioClip {
  private id: string;
  private buffer: any; // AudioBuffer in a real implementation
  
  constructor(id: string, buffer: any) {
    this.id = id;
    this.buffer = buffer;
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getBuffer(): any {
    return this.buffer;
  }
  
  public getDuration(): number {
    return this.buffer ? this.buffer.duration : 0;
  }
}

export class AudioSource {
  private id: string;
  private gameObject: GameObject;
  private audioSystem: AudioSystem;
  private currentClip?: AudioClip;
  private options: AudioClipOptions;
  private effects: AudioEffects;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private currentNodeId?: string;
  
  constructor(id: string, gameObject: GameObject, audioSystem: AudioSystem) {
    this.id = id;
    this.gameObject = gameObject;
    this.audioSystem = audioSystem;
    this.options = {
      loop: false,
      volume: 1.0,
      pitch: 1.0,
      startTime: 0,
      spatial: false,
      category: 'sfx',
      priority: 50
    };
    this.effects = {};
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getGameObject(): GameObject {
    return this.gameObject;
  }
  
  public setOptions(options: Partial<AudioClipOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Update current audio node if playing
    if (this.isPlaying && this.currentNodeId) {
      const node = this.audioSystem.getAudioContext()?.activeAudioNodes?.get(this.currentNodeId);
      if (node) {
        // Update volume
        // node.gainNode.gain.setValueAtTime(
        //   this.options.volume * this.audioSystem.getCategoryVolume(this.options.category),
        //   this.audioSystem.getAudioContext().currentTime
        // );
        
        // Update playback rate (pitch)
        // node.sourceNode.playbackRate.setValueAtTime(
        //   this.options.pitch,
        //   this.audioSystem.getAudioContext().currentTime
        // );
      }
    }
  }
  
  public getOptions(): AudioClipOptions {
    return { ...this.options };
  }
  
  public setEffects(effects: Partial<AudioEffects>): void {
    this.effects = { ...this.effects, ...effects };
    
    // Apply effects to current audio node if playing
    if (this.isPlaying && this.currentNodeId) {
      this.applyEffects();
    }
  }
  
  public getEffects(): AudioEffects {
    return { ...this.effects };
  }
  
  public isSpatial(): boolean {
    return this.options.spatial;
  }
  
  public play(clipId?: string): void {
    if (!this.audioSystem.getAudioContext()) return;
    
    // If a clip ID is provided, get the corresponding audio clip
    if (clipId) {
      const clip = this.audioSystem.getAudioClip(clipId);
      if (!clip) {
        console.error(`Audio clip not found: ${clipId}`);
        return;
      }
      this.currentClip = clip;
    }
    
    if (!this.currentClip) {
      console.error('No audio clip to play');
      return;
    }
    
    // Stop any currently playing audio
    this.stop();
    
    // In a real implementation, this would create and connect audio nodes
    // const audioContext = this.audioSystem.getAudioContext();
    // const sourceNode = audioContext.createBufferSource();
    // sourceNode.buffer = this.currentClip.getBuffer();
    // sourceNode.loop = this.options.loop;
    // sourceNode.playbackRate.value = this.options.pitch;
    
    // const gainNode = audioContext.createGain();
    // gainNode.gain.value = this.options.volume * this.audioSystem.getCategoryVolume(this.options.category);
    // sourceNode.connect(gainNode);
    
    // if (this.options.spatial) {
    //   const pannerNode = audioContext.createPanner();
    //   pannerNode.panningModel = 'HRTF';
    //   pannerNode.distanceModel = this.audioSystem.getConfig().distanceModel;
    //   pannerNode.refDistance = 1;
    //   pannerNode.maxDistance = 10000;
    //   pannerNode.rolloffFactor = this.audioSystem.getConfig().spatialScale;
    //   pannerNode.coneInnerAngle = 360;
    //   pannerNode.coneOuterAngle = 360;
    //   pannerNode.coneOuterGain = 0;
    
    //   // Set initial position
    //   if (this.gameObject && this.gameObject.transform) {
    //     const position = this.gameObject.transform.position;
    //     pannerNode.setPosition(position[0], position[1], position[2]);
    //   }
    
    //   gainNode.connect(pannerNode);
    //   pannerNode.connect(this.audioSystem.getCategoryGain(this.options.category));
    // } else {
    //   gainNode.connect(this.audioSystem.getCategoryGain(this.options.category));
    // }
    
    // Apply audio effects
    // this.applyEffects();
    
    // Start playback
    this.startTime = 0; // audioContext.currentTime;
    // sourceNode.start(0, this.options.startTime);
    
    // Calculate end time for non-looping sounds
    let endTime = undefined;
    if (!this.options.loop) {
      // endTime = this.startTime + (this.currentClip.getDuration() - this.options.startTime) / this.options.pitch;
    }
    
    // Register audio node with system
    this.currentNodeId = `${this.id}_${Date.now()}`;
    // this.audioSystem.registerAudioNode(this.currentNodeId, {
    //   sourceNode,
    //   gainNode,
    //   pannerNode: this.options.spatial ? pannerNode : null
    // }, endTime);
    
    this.isPlaying = true;
    this.isPaused = false;
  }
  
  public stop(): void {
    if (!this.isPlaying || !this.currentNodeId) return;
    
    // Stop the audio source
    const node = this.audioSystem.getAudioContext()?.activeAudioNodes?.get(this.currentNodeId);
    if (node) {
      // try {
      //   node.sourceNode.stop();
      // } catch (e) {
      //   // Ignore errors if already stopped
      // }
      // node.sourceNode.disconnect();
      this.audioSystem.unregisterAudioNode(this.currentNodeId);
    }
    
    this.isPlaying = false;
    this.isPaused = false;
    this.currentNodeId = undefined;
  }
  
  public pause(): void {
    if (!this.isPlaying || this.isPaused || !this.currentNodeId) return;
    
    // In a real implementation:
    // 1. Record current time
    // 2. Stop the current source
    // 3. Mark as paused
    
    // const audioContext = this.audioSystem.getAudioContext();
    // this.pauseTime = audioContext.currentTime;
    
    // Stop the current source
    this.stop();
    
    this.isPlaying = false;
    this.isPaused = true;
  }
  
  public resume(): void {
    if (!this.isPaused || !this.currentClip) return;
    
    // Calculate new start offset
    // const audioContext = this.audioSystem.getAudioContext();
    // const elapsedTime = this.pauseTime - this.startTime;
    // const newStartTime = this.options.startTime + elapsedTime;
    
    // Start playback from the paused position
    const savedOptions = { ...this.options };
    this.options.startTime = 0; // newStartTime;
    this.play();
    this.options = savedOptions;
  }
  
  public update(): void {
    if (!this.isPlaying || !this.currentNodeId) return;
    
    // Update spatial parameters if needed
    if (this.options.spatial) {
      const primaryListener = this.audioSystem.getPrimaryListener();
      if (primaryListener) {
        this.updateSpatialParameters(primaryListener);
      }
    }
  }
  
  public updateSpatialParameters(listener: AudioListener): void {
    if (!this.options.spatial || !this.currentNodeId) return;
    
    const node = this.audioSystem.getAudioContext()?.activeAudioNodes?.get(this.currentNodeId);
    if (!node || !node.pannerNode) return;
    
    // Update position based on GameObject transform
    if (this.gameObject && this.gameObject.transform) {
      const position = this.gameObject.transform.position;
      // node.pannerNode.setPosition(position[0], position[1], position[2]);
      
      // If the GameObject has a forward vector, update orientation
      // if (this.gameObject.transform.forward) {
      //   const forward = this.gameObject.transform.forward;
      //   node.pannerNode.setOrientation(forward[0], forward[1], forward[2]);
      // }
    }
  }
  
  private applyEffects(): void {
    if (!this.currentNodeId || !this.audioSystem.getAudioContext()) return;
    
    // In a real implementation, this would create and connect audio effect nodes
    
    // Reverb
    if (this.effects.reverb && this.effects.reverb.enabled) {
      // Apply reverb effect
    }
    
    // Echo
    if (this.effects.echo && this.effects.echo.enabled) {
      // Apply echo effect
    }
    
    // Filter
    if (this.effects.filter && this.effects.filter.enabled) {
      // Apply filter effect
    }
    
    // Compressor
    if (this.effects.compressor && this.effects.compressor.enabled) {
      // Apply compressor effect
    }
  }
}

export class AudioListener {
  private id: string;
  private gameObject: GameObject;
  private primary: boolean;
  
  constructor(id: string, gameObject: GameObject, primary: boolean) {
    this.id = id;
    this.gameObject = gameObject;
    this.primary = primary;
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getGameObject(): GameObject {
    return this.gameObject;
  }
  
  public isPrimary(): boolean {
    return this.primary;
  }
  
  public setPrimary(primary: boolean): void {
    this.primary = primary;
  }
  
  public getPosition(): [number, number, number] {
    if (this.gameObject && this.gameObject.transform) {
      return this.gameObject.transform.position;
    }
    return [0, 0, 0];
  }
  
  public getOrientation(): { forward: [number, number, number], up: [number, number, number] } {
    if (this.gameObject && this.gameObject.transform) {
      return {
        forward: this.gameObject.transform.forward || [0, 0, -1],
        up: this.gameObject.transform.up || [0, 1, 0]
      };
    }
    return {
      forward: [0, 0, -1],
      up: [0, 1, 0]
    };
  }
}

export default AudioSystem; 