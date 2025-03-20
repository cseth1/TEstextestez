/**
 * Asset-related type definitions
 */

/**
 * Asset reference
 */
export interface AssetReference {
    category: string;
    id: string;
    uri: string;
}

/**
 * Asset info with additional metadata
 */
export interface AssetInfo {
    uri: string;
    category: string;
    id: string;
    exists: boolean;
    sourcePath?: string;
    outputPath?: string;
} 