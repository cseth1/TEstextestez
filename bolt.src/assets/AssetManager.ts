/**
 * Asset Management System for GameForge
 * 
 * Provides efficient loading, caching, and access to game assets
 * including models, textures, audio, and other resources.
 */

export enum AssetType {
  TEXTURE = 'texture',
  MODEL = 'model',
  MATERIAL = 'material',
  AUDIO = 'audio',
  SHADER = 'shader',
  FONT = 'font',
  JSON = 'json',
  TEXT = 'text',
  BINARY = 'binary',
  PREFAB = 'prefab',
  SCENE = 'scene',
  OTHER = 'other'
}

export interface AssetMetadata {
  id: string;
  type: AssetType;
  path: string;
  dependencies?: string[];
  createdAt?: number;
  updatedAt?: number;
  size?: number;
  compression?: string;
  tags?: string[];
  customProperties?: Record<string, any>;
}

export interface AssetOptions {
  cache?: boolean;
  timeout?: number;
  priority?: number;
  onProgress?: (progress: number) => void;
}

export interface AssetLoadingTask {
  asset: AssetMetadata;
  promise: Promise<any>;
  status: 'pending' | 'loading' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: Error;
  dependencies: AssetLoadingTask[];
}

export interface AssetCache {
  [key: string]: {
    data: any;
    lastAccessed: number;
    size: number;
    refCount: number;
  };
}

export interface LoadingGroup {
  id: string;
  assets: AssetMetadata[];
  onProgress?: (progress: number) => void;
  onComplete?: (results: Record<string, any>) => void;
  onError?: (errors: Record<string, Error>) => void;
  priority: number;
  status: 'pending' | 'loading' | 'success' | 'error' | 'canceled';
  progress: number;
  tasks: AssetLoadingTask[];
}

export class AssetManager {
  private static instance: AssetManager;
  private isInitialized: boolean = false;
  
  private baseUrl: string = '';
  private cache: AssetCache = {};
  private maxCacheSize: number = 1024 * 1024 * 512; // 512MB by default
  private currentCacheSize: number = 0;
  
  private loadingTasks: Map<string, AssetLoadingTask> = new Map();
  private loadingGroups: Map<string, LoadingGroup> = new Map();
  
  private assetRegistry: Map<string, AssetMetadata> = new Map();
  private assetLoaders: Map<AssetType, (asset: AssetMetadata, options?: AssetOptions) => Promise<any>> = new Map();
  
  private constructor() {}
  
  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }
  
  public initialize(baseUrl: string = '', maxCacheSize?: number): void {
    if (this.isInitialized) return;
    
    console.log('Initializing asset management system...');
    
    this.baseUrl = baseUrl;
    
    if (maxCacheSize) {
      this.maxCacheSize = maxCacheSize;
    }
    
    this.registerDefaultLoaders();
    
    this.isInitialized = true;
    console.log('Asset management system initialized successfully');
  }
  
  private registerDefaultLoaders(): void {
    // Image/Texture loader
    this.registerLoader(AssetType.TEXTURE, (asset) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load texture: ${asset.path}`));
        
        image.src = this.getFullPath(asset.path);
      });
    });
    
    // JSON loader
    this.registerLoader(AssetType.JSON, async (asset) => {
      const response = await fetch(this.getFullPath(asset.path));
      if (!response.ok) {
        throw new Error(`Failed to load JSON: ${asset.path} (${response.status} ${response.statusText})`);
      }
      return response.json();
    });
    
    // Text loader
    this.registerLoader(AssetType.TEXT, async (asset) => {
      const response = await fetch(this.getFullPath(asset.path));
      if (!response.ok) {
        throw new Error(`Failed to load text: ${asset.path} (${response.status} ${response.statusText})`);
      }
      return response.text();
    });
    
    // Binary loader
    this.registerLoader(AssetType.BINARY, async (asset) => {
      const response = await fetch(this.getFullPath(asset.path));
      if (!response.ok) {
        throw new Error(`Failed to load binary: ${asset.path} (${response.status} ${response.statusText})`);
      }
      return response.arrayBuffer();
    });
    
    // Audio loader
    this.registerLoader(AssetType.AUDIO, (asset) => {
      return new Promise<AudioBuffer>((resolve, reject) => {
        // This would need the AudioContext to decode the data
        // In a real implementation, we would create or use an existing AudioContext
        // For now, we'll just return a placeholder with fetch
        
        fetch(this.getFullPath(asset.path))
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to load audio: ${asset.path} (${response.status} ${response.statusText})`);
            }
            return response.arrayBuffer();
          })
          .then(buffer => {
            // In a real implementation:
            // return audioContext.decodeAudioData(buffer);
            resolve(buffer as unknown as AudioBuffer);
          })
          .catch(reject);
      });
    });
    
    // For shaders, materials, models etc., in a real implementation
    // we would need the specific engines (like THREE.js) to be loaded
    // Here we just define placeholders
    
    // Shader loader
    this.registerLoader(AssetType.SHADER, async (asset) => {
      const response = await fetch(this.getFullPath(asset.path));
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${asset.path} (${response.status} ${response.statusText})`);
      }
      return response.text();
    });
    
    // Model loader (simplified)
    this.registerLoader(AssetType.MODEL, async (asset) => {
      const response = await fetch(this.getFullPath(asset.path));
      if (!response.ok) {
        throw new Error(`Failed to load model: ${asset.path} (${response.status} ${response.statusText})`);
      }
      // In a real implementation, we would parse the model based on its format
      // For example, using a GLTF loader for .glb/.gltf files
      return response.json();
    });
    
    // Font loader
    this.registerLoader(AssetType.FONT, (asset) => {
      return new Promise<FontFace>((resolve, reject) => {
        // In a real implementation:
        const fontName = asset.id;
        const fontFace = new FontFace(fontName, `url(${this.getFullPath(asset.path)})`);
        
        fontFace.load()
          .then(loaded => {
            // In a browser environment:
            // document.fonts.add(loaded);
            resolve(loaded);
          })
          .catch(reject);
      });
    });
  }
  
  /**
   * Registers custom asset loader for a specific asset type
   */
  public registerLoader(
    type: AssetType, 
    loader: (asset: AssetMetadata, options?: AssetOptions) => Promise<any>
  ): void {
    this.assetLoaders.set(type, loader);
  }
  
  /**
   * Gets the full path to an asset based on the baseUrl
   */
  private getFullPath(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    
    return `${this.baseUrl}/${path}`;
  }
  
  /**
   * Registers an asset in the registry
   */
  public registerAsset(asset: AssetMetadata): void {
    this.assetRegistry.set(asset.id, asset);
  }
  
  /**
   * Registers multiple assets in the registry
   */
  public registerAssets(assets: AssetMetadata[]): void {
    assets.forEach(asset => this.registerAsset(asset));
  }
  
  /**
   * Gets asset metadata from the registry
   */
  public getAssetMetadata(id: string): AssetMetadata | undefined {
    return this.assetRegistry.get(id);
  }
  
  /**
   * Loads a single asset by its ID
   */
  public async loadAsset<T = any>(
    assetId: string, 
    options: AssetOptions = {}
  ): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Asset manager is not initialized');
    }
    
    const metadata = this.assetRegistry.get(assetId);
    
    if (!metadata) {
      throw new Error(`Asset not found in registry: ${assetId}`);
    }
    
    // Check if already cached
    if (options.cache !== false && this.cache[assetId]) {
      this.cache[assetId].lastAccessed = Date.now();
      this.cache[assetId].refCount++;
      return this.cache[assetId].data as T;
    }
    
    // Check if already loading
    if (this.loadingTasks.has(assetId)) {
      const task = this.loadingTasks.get(assetId)!;
      return task.promise as Promise<T>;
    }
    
    // Create loading task
    const task: AssetLoadingTask = {
      asset: metadata,
      status: 'pending',
      progress: 0,
      dependencies: [],
      promise: Promise.resolve(null) // Will be replaced
    };
    
    // Load dependencies first if any
    if (metadata.dependencies && metadata.dependencies.length > 0) {
      for (const depId of metadata.dependencies) {
        const depTask = await this.loadAssetInternal(depId, options);
        task.dependencies.push(depTask);
      }
    }
    
    // Now load the asset itself
    const loader = this.assetLoaders.get(metadata.type);
    
    if (!loader) {
      throw new Error(`No loader registered for asset type: ${metadata.type}`);
    }
    
    task.status = 'loading';
    this.loadingTasks.set(assetId, task);
    
    // Create the promise to load the asset
    task.promise = loader(metadata, options)
      .then(result => {
        task.result = result;
        task.status = 'success';
        task.progress = 1;
        
        // Cache the result if enabled
        if (options.cache !== false) {
          const size = this.estimateSize(result);
          this.addToCache(assetId, result, size);
        }
        
        return result;
      })
      .catch(error => {
        task.error = error;
        task.status = 'error';
        console.error(`Failed to load asset ${assetId}:`, error);
        throw error;
      });
    
    return task.promise as Promise<T>;
  }
  
  /**
   * Internal method to load an asset and return its task
   */
  private async loadAssetInternal(
    assetId: string, 
    options: AssetOptions = {}
  ): Promise<AssetLoadingTask> {
    if (this.loadingTasks.has(assetId)) {
      return this.loadingTasks.get(assetId)!;
    }
    
    const metadata = this.assetRegistry.get(assetId);
    
    if (!metadata) {
      throw new Error(`Asset not found in registry: ${assetId}`);
    }
    
    // Check if already cached
    if (options.cache !== false && this.cache[assetId]) {
      const task: AssetLoadingTask = {
        asset: metadata,
        status: 'success',
        progress: 1,
        dependencies: [],
        result: this.cache[assetId].data,
        promise: Promise.resolve(this.cache[assetId].data)
      };
      
      this.cache[assetId].lastAccessed = Date.now();
      this.cache[assetId].refCount++;
      return task;
    }
    
    // Create loading task
    const task: AssetLoadingTask = {
      asset: metadata,
      status: 'pending',
      progress: 0,
      dependencies: [],
      promise: Promise.resolve(null) // Will be replaced
    };
    
    this.loadingTasks.set(assetId, task);
    
    // Load dependencies first if any
    if (metadata.dependencies && metadata.dependencies.length > 0) {
      for (const depId of metadata.dependencies) {
        const depTask = await this.loadAssetInternal(depId, options);
        task.dependencies.push(depTask);
      }
    }
    
    // Now load the asset itself
    const loader = this.assetLoaders.get(metadata.type);
    
    if (!loader) {
      throw new Error(`No loader registered for asset type: ${metadata.type}`);
    }
    
    task.status = 'loading';
    
    // Create the promise to load the asset
    task.promise = loader(metadata, options)
      .then(result => {
        task.result = result;
        task.status = 'success';
        task.progress = 1;
        
        // Cache the result if enabled
        if (options.cache !== false) {
          const size = this.estimateSize(result);
          this.addToCache(assetId, result, size);
        }
        
        return task;
      })
      .catch(error => {
        task.error = error;
        task.status = 'error';
        console.error(`Failed to load asset ${assetId}:`, error);
        throw error;
      });
    
    return task.promise as Promise<AssetLoadingTask>;
  }
  
  /**
   * Creates a loading group to load multiple assets with progress tracking
   */
  public createLoadingGroup(
    assets: string[] | AssetMetadata[],
    options: {
      id?: string;
      priority?: number;
      onProgress?: (progress: number) => void;
      onComplete?: (results: Record<string, any>) => void;
      onError?: (errors: Record<string, Error>) => void;
    } = {}
  ): string {
    const groupId = options.id || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const assetsList: AssetMetadata[] = assets.map(asset => {
      if (typeof asset === 'string') {
        const metadata = this.assetRegistry.get(asset);
        if (!metadata) {
          throw new Error(`Asset not found in registry: ${asset}`);
        }
        return metadata;
      }
      return asset;
    });
    
    const group: LoadingGroup = {
      id: groupId,
      assets: assetsList,
      priority: options.priority || 0,
      status: 'pending',
      progress: 0,
      tasks: [],
      onProgress: options.onProgress,
      onComplete: options.onComplete,
      onError: options.onError
    };
    
    this.loadingGroups.set(groupId, group);
    
    return groupId;
  }
  
  /**
   * Starts loading a previously created loading group
   */
  public startLoadingGroup(groupId: string): Promise<Record<string, any>> {
    const group = this.loadingGroups.get(groupId);
    
    if (!group) {
      throw new Error(`Loading group not found: ${groupId}`);
    }
    
    if (group.status !== 'pending') {
      throw new Error(`Loading group ${groupId} is already ${group.status}`);
    }
    
    group.status = 'loading';
    
    const promises: Promise<any>[] = [];
    const results: Record<string, any> = {};
    const errors: Record<string, Error> = {};
    
    // Start loading all assets in the group
    for (const asset of group.assets) {
      const promise = this.loadAsset(asset.id, {
        priority: group.priority,
        onProgress: (progress) => {
          // Update overall group progress
          this.updateGroupProgress(groupId);
        }
      })
        .then(result => {
          results[asset.id] = result;
          return result;
        })
        .catch(error => {
          errors[asset.id] = error;
          console.error(`Failed to load asset ${asset.id} in group ${groupId}:`, error);
          throw error;
        });
      
      promises.push(promise);
      
      const task = this.loadingTasks.get(asset.id)!;
      group.tasks.push(task);
    }
    
    // Wait for all assets to load
    Promise.allSettled(promises)
      .then(results => {
        // Check if all assets loaded successfully
        const allSuccess = results.every(result => result.status === 'fulfilled');
        
        if (allSuccess) {
          group.status = 'success';
          if (group.onComplete) {
            group.onComplete(results);
          }
        } else {
          group.status = 'error';
          if (group.onError) {
            group.onError(errors);
          }
        }
      });
    
    return Promise.all(promises)
      .then(() => results);
  }
  
  /**
   * Updates the progress of a loading group
   */
  private updateGroupProgress(groupId: string): void {
    const group = this.loadingGroups.get(groupId);
    
    if (!group) return;
    
    // Calculate average progress of all tasks
    let totalProgress = 0;
    
    for (const task of group.tasks) {
      totalProgress += task.progress;
    }
    
    const progress = group.tasks.length > 0 ? totalProgress / group.tasks.length : 0;
    
    // Update group progress
    group.progress = progress;
    
    // Notify callback
    if (group.onProgress) {
      group.onProgress(progress);
    }
  }
  
  /**
   * Cancels a loading group
   */
  public cancelLoadingGroup(groupId: string): void {
    const group = this.loadingGroups.get(groupId);
    
    if (!group) {
      throw new Error(`Loading group not found: ${groupId}`);
    }
    
    group.status = 'canceled';
    
    // Can't actually cancel promises in JavaScript, but we can mark them as canceled
    // and ignore their results
    
    // Remove the group
    this.loadingGroups.delete(groupId);
  }
  
  /**
   * Adds an asset to the cache
   */
  private addToCache(id: string, data: any, size: number): void {
    // Check if the cache can fit the asset
    if (size > this.maxCacheSize) {
      console.warn(`Asset ${id} is too large for the cache (${size} bytes)`);
      return;
    }
    
    // Make room in the cache if needed
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.evictFromCache(size);
    }
    
    // Add to cache
    this.cache[id] = {
      data,
      lastAccessed: Date.now(),
      size,
      refCount: 1
    };
    
    this.currentCacheSize += size;
  }
  
  /**
   * Evicts assets from the cache to make room for new ones
   */
  private evictFromCache(requiredSize: number): void {
    // Sort assets by last accessed time (oldest first)
    const entries = Object.entries(this.cache)
      .filter(([, cache]) => cache.refCount === 0) // Only evict unreferenced assets
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSize = 0;
    
    for (const [id, entry] of entries) {
      delete this.cache[id];
      freedSize += entry.size;
      this.currentCacheSize -= entry.size;
      
      if (freedSize >= requiredSize) {
        break;
      }
    }
    
    // If we still don't have enough space, log a warning
    if (freedSize < requiredSize) {
      console.warn(`Could not free enough space in the cache: needed ${requiredSize}, freed ${freedSize}`);
    }
  }
  
  /**
   * Unloads an asset from the cache
   */
  public unloadAsset(id: string): void {
    if (!this.cache[id]) {
      return;
    }
    
    // Decrease reference count
    this.cache[id].refCount--;
    
    // If no more references, mark it for potential eviction
    if (this.cache[id].refCount <= 0) {
      this.cache[id].refCount = 0;
    }
  }
  
  /**
   * Clears the entire cache
   */
  public clearCache(): void {
    this.cache = {};
    this.currentCacheSize = 0;
  }
  
  /**
   * Estimates the size of an asset in bytes
   */
  private estimateSize(data: any): number {
    if (data === null || data === undefined) {
      return 0;
    }
    
    if (typeof data === 'boolean' || typeof data === 'number') {
      return 8;
    }
    
    if (typeof data === 'string') {
      return data.length * 2;
    }
    
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    
    if (ArrayBuffer.isView(data)) {
      return (data as any).buffer.byteLength;
    }
    
    if (data instanceof HTMLImageElement) {
      return data.width * data.height * 4; // Approximate RGBA size
    }
    
    if (data instanceof HTMLAudioElement) {
      // Rough estimation based on typical audio sizes
      // This is not accurate and should be replaced with a better method
      return 1024 * 1024; // 1MB
    }
    
    if (Array.isArray(data)) {
      let size = 0;
      for (const item of data) {
        size += this.estimateSize(item);
      }
      return size;
    }
    
    if (typeof data === 'object') {
      let size = 0;
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Account for key storage too
          size += key.length * 2;
          size += this.estimateSize(data[key]);
        }
      }
      return size;
    }
    
    // Default fallback
    return 1024; // 1KB
  }
  
  /**
   * Gets the current cache usage statistics
   */
  public getCacheStats(): { size: number; maxSize: number; usage: number; itemCount: number } {
    return {
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      usage: this.maxCacheSize > 0 ? this.currentCacheSize / this.maxCacheSize : 0,
      itemCount: Object.keys(this.cache).length
    };
  }
  
  /**
   * Finds assets by their tags
   */
  public findAssetsByTags(tags: string[]): AssetMetadata[] {
    const results: AssetMetadata[] = [];
    
    for (const [, asset] of this.assetRegistry) {
      if (asset.tags && tags.every(tag => asset.tags!.includes(tag))) {
        results.push(asset);
      }
    }
    
    return results;
  }
  
  /**
   * Finds assets by their type
   */
  public findAssetsByType(type: AssetType): AssetMetadata[] {
    const results: AssetMetadata[] = [];
    
    for (const [, asset] of this.assetRegistry) {
      if (asset.type === type) {
        results.push(asset);
      }
    }
    
    return results;
  }
  
  /**
   * Finds assets by a custom predicate
   */
  public findAssets(predicate: (asset: AssetMetadata) => boolean): AssetMetadata[] {
    const results: AssetMetadata[] = [];
    
    for (const [, asset] of this.assetRegistry) {
      if (predicate(asset)) {
        results.push(asset);
      }
    }
    
    return results;
  }
}

export default AssetManager; 