import { GameForgeProject, Scene, GameObject, Behavior, BuildTarget } from '../core/types';

export interface ValidationError {
    code: string;
    message: string;
    path: string;
    severity: 'error' | 'warning' | 'info';
}

export class Validator {
    /**
     * Validate a project definition
     */
    static validateProject(project: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!project) {
            errors.push({
                code: 'PROJECT_MISSING',
                message: 'Project definition is missing',
                path: '',
                severity: 'error'
            });
            return errors;
        }
        
        if (!project.name) {
            errors.push({
                code: 'PROJECT_NAME_MISSING',
                message: 'Project name is required',
                path: 'name',
                severity: 'error'
            });
        }
        
        if (!project.version) {
            errors.push({
                code: 'PROJECT_VERSION_MISSING',
                message: 'Project version is required',
                path: 'version',
                severity: 'error'
            });
        }
        
        if (!project.engine) {
            errors.push({
                code: 'PROJECT_ENGINE_MISSING',
                message: 'Project engine is required',
                path: 'engine',
                severity: 'error'
            });
        } else if (project.engine !== 'unity' && project.engine !== 'unreal') {
            errors.push({
                code: 'PROJECT_ENGINE_INVALID',
                message: 'Project engine must be either "unity" or "unreal"',
                path: 'engine',
                severity: 'error'
            });
        }
        
        return errors;
    }
    
    /**
     * Validate a scene definition
     */
    static validateScene(scene: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!scene) {
            errors.push({
                code: 'SCENE_MISSING',
                message: 'Scene definition is missing',
                path: '',
                severity: 'error'
            });
            return errors;
        }
        
        if (!scene.name) {
            errors.push({
                code: 'SCENE_NAME_MISSING',
                message: 'Scene name is required',
                path: 'name',
                severity: 'error'
            });
        }
        
        return errors;
    }
    
    /**
     * Validate a behavior definition
     */
    static validateBehavior(behavior: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!behavior) {
            errors.push({
                code: 'BEHAVIOR_MISSING',
                message: 'Behavior definition is missing',
                path: '',
                severity: 'error'
            });
            return errors;
        }
        
        if (!behavior.name) {
            errors.push({
                code: 'BEHAVIOR_NAME_MISSING',
                message: 'Behavior name is required',
                path: 'name',
                severity: 'error'
            });
        }
        
        if (!behavior.states || Object.keys(behavior.states).length === 0) {
            errors.push({
                code: 'BEHAVIOR_STATES_MISSING',
                message: 'Behavior must have at least one state',
                path: 'states',
                severity: 'error'
            });
        }
        
        return errors;
    }
    
    /**
     * Validate an asset reference
     */
    static validateAssetReference(uri: string): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!uri) {
            errors.push({
                code: 'ASSET_REFERENCE_MISSING',
                message: 'Asset reference is missing',
                path: 'uri',
                severity: 'error'
            });
            return errors;
        }
        
        if (!uri.startsWith('asset://')) {
            errors.push({
                code: 'ASSET_REFERENCE_INVALID_SCHEME',
                message: 'Asset reference must start with "asset://"',
                path: 'uri',
                severity: 'error'
            });
        }
        
        const parts = uri.replace('asset://', '').split('/');
        if (parts.length < 2) {
            errors.push({
                code: 'ASSET_REFERENCE_INVALID_FORMAT',
                message: 'Asset reference must have format "asset://{category}/{id}"',
                path: 'uri',
                severity: 'error'
            });
        }
        
        return errors;
    }
} 