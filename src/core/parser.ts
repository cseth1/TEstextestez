import * as yaml from 'js-yaml';
import { GameForgeProject, Scene, GameObject, Behavior } from './types';
import { Validator, ValidationError } from '../validators/validator';

export class GameForgeParser {
    /**
     * Parse a GameForge project file
     */
    static parseProject(content: string): { project: GameForgeProject, errors: ValidationError[] } {
        try {
            const doc = yaml.load(content) as any;
            const errors = Validator.validateProject(doc);
            
            return {
                project: doc as GameForgeProject,
                errors
            };
        } catch (error: any) {
            throw new Error(`Failed to parse project file: ${error.message}`);
        }
    }

    /**
     * Parse a scene definition file
     */
    static parseScene(content: string): { scene: Scene, errors: ValidationError[] } {
        try {
            const doc = yaml.load(content) as any;
            const errors = Validator.validateScene(doc);
            
            return {
                scene: doc as Scene,
                errors
            };
        } catch (error: any) {
            throw new Error(`Failed to parse scene file: ${error.message}`);
        }
    }

    /**
     * Parse a behavior definition file
     */
    static parseBehavior(content: string): { behavior: Behavior, errors: ValidationError[] } {
        try {
            const doc = yaml.load(content) as any;
            const errors = Validator.validateBehavior(doc);
            
            return {
                behavior: doc as Behavior,
                errors
            };
        } catch (error: any) {
            throw new Error(`Failed to parse behavior file: ${error.message}`);
        }
    }

    /**
     * Parse an asset reference URI
     * Format: asset://{category}/{id}
     */
    static parseAssetUri(uri: string): { category: string; id: string; errors: ValidationError[] } {
        const errors = Validator.validateAssetReference(uri);
        if (errors.length > 0) {
            return {
                category: '',
                id: '',
                errors
            };
        }
        
        const match = uri.match(/^asset:\/\/([^/]+)\/(.+)$/);
        if (!match) {
            return {
                category: '',
                id: '',
                errors: [{
                    code: 'ASSET_REFERENCE_MALFORMED',
                    message: 'Malformed asset reference',
                    path: 'uri',
                    severity: 'error'
                }]
            };
        }

        return {
            category: match[1],
            id: match[2],
            errors: []
        };
    }
} 