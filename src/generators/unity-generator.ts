import { GeneratorBase } from './generator-base';
import { GameForgeProject, Scene, GameObject, Behavior } from '../core/types';
import * as path from 'path';
import * as fs from 'fs';

export class UnityGenerator extends GeneratorBase {
    /**
     * Generate the Unity project
     */
    async generateProject(): Promise<void> {
        console.log('Generating Unity project...');

        // Create project structure
        this.ensureDirectory(this.outputPath);
        this.ensureDirectory(path.join(this.outputPath, 'Assets'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Scripts'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Scenes'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Materials'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Models'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Textures'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Audio'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Animations'));
        this.ensureDirectory(path.join(this.outputPath, 'Assets', 'Prefabs'));

        // Generate boilerplate code
        await this.generateBoilerplate();

        // Generate behaviors
        const behaviors = await this.loadBehaviors();
        for (const behavior of behaviors) {
            await this.generateBehavior(behavior);
        }

        // Generate scenes
        const scenes = await this.loadScenes();
        for (const scene of scenes) {
            await this.generateScene(scene);
        }

        console.log('Unity project generation complete!');
    }

    /**
     * Generate code for a scene
     */
    async generateScene(scene: Scene): Promise<void> {
        console.log(`Generating Unity scene: ${scene.name}`);

        // Generate a C# script to create the scene programmatically
        const sceneBuilder = `
using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

namespace GameForge
{
    public class SceneBuilder_${this.sanitizeIdentifier(scene.name)}
    {
        [MenuItem("GameForge/Build Scenes/${scene.name}")]
        public static void BuildScene()
        {
            // Create a new scene
            var scene = UnityEditor.SceneManagement.EditorSceneManager.NewScene(UnityEditor.SceneManagement.NewSceneSetup.EmptyScene, UnityEditor.SceneManagement.NewSceneMode.Single);
            
            // Set up environment
            SetupEnvironment();
            
            // Create game objects
            CreateGameObjects();
            
            // Save the scene
            string scenePath = "Assets/Scenes/${this.sanitizeIdentifier(scene.name)}.unity";
            UnityEditor.SceneManagement.EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log("Scene saved to " + scenePath);
        }
        
        private static void SetupEnvironment()
        {
            // Set up lighting, skybox, fog, etc.
            ${scene.environment?.skybox ? `RenderSettings.skybox = AssetDatabase.LoadAssetAtPath<Material>("Assets/Materials/Skyboxes/Default.mat");` : ''}
            ${scene.environment?.fog?.enabled ? `RenderSettings.fog = true;\nRenderSettings.fogColor = new Color(${scene.environment.fog.color.join('f, ')}f);\nRenderSettings.fogDensity = ${scene.environment.fog.density}f;` : ''}
            ${scene.environment?.ambientLight ? `RenderSettings.ambientLight = new Color(${scene.environment.ambientLight.join('f, ')}f);` : ''}
        }
        
        private static void CreateGameObjects()
        {
            // Create root game objects
            ${Object.entries(scene.gameObjects || {}).map(([id, gameObject]) => {
                return `CreateGameObject_${this.sanitizeIdentifier(id)}();`;
            }).join('\n            ')}
        }
        
        ${Object.entries(scene.gameObjects || {}).map(([id, gameObject]) => {
            return `
        private static void CreateGameObject_${this.sanitizeIdentifier(id)}()
        {
            GameObject obj = new GameObject("${gameObject.name}");
            ${gameObject.transform ? `obj.transform.position = new Vector3(${gameObject.transform.position.join('f, ')}f);
            obj.transform.eulerAngles = new Vector3(${gameObject.transform.rotation.join('f, ')}f);
            obj.transform.localScale = new Vector3(${gameObject.transform.scale.join('f, ')}f);` : ''}
            
            ${gameObject.tags && gameObject.tags.length > 0 ? `obj.tag = "${gameObject.tags[0]}";` : ''}
            ${gameObject.layer ? `obj.layer = LayerMask.NameToLayer("${gameObject.layer}");` : ''}
            
            // Add components
            ${Object.entries(gameObject.components || {}).map(([componentId, component]) => {
                switch (component.type) {
                    case 'model':
                        return `// Add model component\nvar modelRenderer = obj.AddComponent<MeshRenderer>();\nvar modelFilter = obj.AddComponent<MeshFilter>();\n// TODO: Load model from asset: ${component.asset}`;
                    case 'script':
                        return `// Add behavior script\nobj.AddComponent<${this.sanitizeIdentifier(component.behavior)}>();`;
                    case 'camera':
                        return `// Add camera\nCamera camera = obj.AddComponent<Camera>();\ncamera.fieldOfView = ${component.field_of_view || 60}f;\ncamera.nearClipPlane = ${component.near_clip || 0.3}f;\ncamera.farClipPlane = ${component.far_clip || 1000}f;`;
                    default:
                        return `// TODO: Add component of type ${component.type}`;
                }
            }).join('\n            ')}
            
            // Add children
            ${Object.entries(gameObject.children || {}).map(([childId, child]) => {
                return `// TODO: Add child ${childId}`;
            }).join('\n            ')}
        }`;
        }).join('\n        ')}
    }
}
`;

        this.writeFile(
            path.join(this.outputPath, 'Assets', 'Scripts', `SceneBuilder_${this.sanitizeIdentifier(scene.name)}.cs`),
            sceneBuilder
        );
    }

    /**
     * Generate code for a game object
     */
    async generateGameObject(gameObject: GameObject, parentPath: string): Promise<void> {
        // In Unity, game objects are typically created in scenes or as prefabs
        // This would be implemented in a real generator
        console.log(`TODO: Generate Unity game object: ${gameObject.name}`);
    }

    /**
     * Generate code for a behavior
     */
    async generateBehavior(behavior: Behavior): Promise<void> {
        console.log(`Generating Unity behavior: ${behavior.name}`);

        const className = this.sanitizeIdentifier(behavior.name);
        const script = `
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace GameForge
{
    public class ${className} : MonoBehaviour
    {
        // Behavior parameters
        ${Object.entries(behavior.parameters || {}).map(([paramName, param]) => {
            const typeName = this.getUnityType(param.type);
            return `public ${typeName} ${this.sanitizeIdentifier(paramName)} = ${this.getDefaultValueForType(param.type, param.default)};`;
        }).join('\n        ')}
        
        // State machine variables
        private string currentState = "idle";
        
        // Behavior variables
        ${Object.entries(behavior.variables || {}).map(([varName, variable]) => {
            const typeName = this.getUnityType(variable.type);
            return `private ${typeName} ${this.sanitizeIdentifier(varName)} = ${this.getDefaultValueForType(variable.type, variable.default)};`;
        }).join('\n        ')}
        
        void Start()
        {
            // Initialize the behavior
            EnterState("${Object.keys(behavior.states)[0] || 'idle'}");
        }
        
        void Update()
        {
            // Update based on current state
            switch (currentState)
            {
                ${Object.entries(behavior.states || {}).map(([stateName, state]) => {
                    return `case "${stateName}":\n                    Update_${this.sanitizeIdentifier(stateName)}();\n                    break;`;
                }).join('\n                ')}
            }
        }
        
        ${Object.entries(behavior.states || {}).map(([stateName, state]) => {
            return `
        // State: ${stateName}
        void Enter_${this.sanitizeIdentifier(stateName)}()
        {
            ${(state.entryActions || []).map(action => this.generateActionCode(action)).join('\n            ')}
        }
        
        void Update_${this.sanitizeIdentifier(stateName)}()
        {
            ${(state.updateActions || []).map(action => this.generateActionCode(action)).join('\n            ')}
            
            // Check transitions
            ${(state.transitions || []).map(transition => {
                return `if (${this.generateConditionCode(transition.condition)}) {\n                EnterState("${transition.to}");\n                return;\n            }`;
            }).join('\n            ')}
        }
        
        void Exit_${this.sanitizeIdentifier(stateName)}()
        {
            ${(state.exitActions || []).map(action => this.generateActionCode(action)).join('\n            ')}
        }`;
        }).join('\n        ')}
        
        // Helper method to change states
        void EnterState(string newState)
        {
            // Exit the current state
            switch (currentState)
            {
                ${Object.entries(behavior.states || {}).map(([stateName, state]) => {
                    return `case "${stateName}":\n                    Exit_${this.sanitizeIdentifier(stateName)}();\n                    break;`;
                }).join('\n                ')}
            }
            
            // Set the new state
            currentState = newState;
            
            // Enter the new state
            switch (currentState)
            {
                ${Object.entries(behavior.states || {}).map(([stateName, state]) => {
                    return `case "${stateName}":\n                    Enter_${this.sanitizeIdentifier(stateName)}();\n                    break;`;
                }).join('\n                ')}
            }
        }
    }
}
`;

        this.writeFile(
            path.join(this.outputPath, 'Assets', 'Scripts', `${className}.cs`),
            script
        );
    }

    /**
     * Generate boilerplate code for the project
     */
    async generateBoilerplate(): Promise<void> {
        // Generate GameForge core classes
        const coreScript = `
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace GameForge
{
    public static class GameForgeCore
    {
        // Helper method to load assets
        public static T LoadAsset<T>(string assetUri) where T : UnityEngine.Object
        {
            // Parse asset URI (asset://{category}/{id})
            string[] parts = assetUri.Replace("asset://", "").Split('/');
            if (parts.Length < 2)
            {
                Debug.LogError($"Invalid asset URI format: {assetUri}");
                return null;
            }
            
            string category = parts[0];
            string id = string.Join("/", parts, 1, parts.Length - 1);
            
            // Map category to directory
            string directory = "";
            switch (category.ToLower())
            {
                case "models":
                    directory = "Models";
                    break;
                case "textures":
                    directory = "Textures";
                    break;
                case "materials":
                    directory = "Materials";
                    break;
                case "audio":
                    directory = "Audio";
                    break;
                case "animations":
                    directory = "Animations";
                    break;
                case "prefabs":
                    directory = "Prefabs";
                    break;
                default:
                    directory = category;
                    break;
            }
            
            // Load the asset
            string assetPath = $"Assets/{directory}/{id}";
            T asset = Resources.Load<T>(assetPath);
            if (asset == null)
            {
                Debug.LogError($"Failed to load asset: {assetPath}");
            }
            
            return asset;
        }
    }
}
`;

        this.writeFile(
            path.join(this.outputPath, 'Assets', 'Scripts', 'GameForgeCore.cs'),
            coreScript
        );

        // Generate a basic project settings script
        const projectSettings = `
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace GameForge
{
    public static class ProjectSettings
    {
        public static string ProjectName = "${this.project.name}";
        public static string ProjectVersion = "${this.project.version}";
    }
}
`;

        this.writeFile(
            path.join(this.outputPath, 'Assets', 'Scripts', 'ProjectSettings.cs'),
            projectSettings
        );
    }

    /**
     * Convert behavior actions to C# code
     */
    private generateActionCode(action: any): string {
        switch (action.type) {
            case 'play_animation':
                return `// Play animation\n// TODO: Implement animation playback: ${action.animation}`;
            case 'move':
                return `// Move character\n// TODO: Implement movement: ${JSON.stringify(action)}`;
            case 'apply_force':
                return `// Apply force\n// TODO: Implement force application: ${JSON.stringify(action)}`;
            case 'set_variable':
                return `${this.sanitizeIdentifier(action.name)} = ${this.parseValue(action.value)};`;
            default:
                return `// TODO: Implement action of type ${action.type}: ${JSON.stringify(action)}`;
        }
    }

    /**
     * Convert behavior conditions to C# code
     */
    private generateConditionCode(condition: string): string {
        // This is a simplified version - in a real implementation, we would parse the condition expression
        return `/* ${condition} */ false /* TODO: Implement condition parsing */`;
    }

    /**
     * Parse a value from the DSL to C# code
     */
    private parseValue(value: any): string {
        if (typeof value === 'string') {
            // Check if it's a reference to a parameter or variable
            if (value.startsWith('parameters.')) {
                return this.sanitizeIdentifier(value.substr(11));
            } else if (value.startsWith('variables.')) {
                return this.sanitizeIdentifier(value.substr(10));
            } else {
                return `"${value}"`;
            }
        } else if (typeof value === 'number') {
            return `${value}f`;
        } else if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        } else if (Array.isArray(value)) {
            // Vector handling
            if (value.length === 3) {
                return `new Vector3(${value.map(v => `${v}f`).join(', ')})`;
            } else if (value.length === 2) {
                return `new Vector2(${value.map(v => `${v}f`).join(', ')})`;
            } else {
                return `new float[] { ${value.map(v => `${v}f`).join(', ')} }`;
            }
        } else {
            return 'null';
        }
    }

    /**
     * Get the Unity C# type for a DSL type
     */
    private getUnityType(type: string): string {
        switch (type) {
            case 'float':
                return 'float';
            case 'int':
                return 'int';
            case 'boolean':
                return 'bool';
            case 'string':
                return 'string';
            case 'vector2':
                return 'Vector2';
            case 'vector3':
                return 'Vector3';
            case 'color':
                return 'Color';
            default:
                return 'object';
        }
    }

    /**
     * Get a default value for a type in C# syntax
     */
    private getDefaultValueForType(type: string, defaultValue: any): string {
        if (defaultValue !== undefined) {
            return this.parseValue(defaultValue);
        }

        switch (type) {
            case 'float':
                return '0f';
            case 'int':
                return '0';
            case 'boolean':
                return 'false';
            case 'string':
                return '""';
            case 'vector2':
                return 'Vector2.zero';
            case 'vector3':
                return 'Vector3.zero';
            case 'color':
                return 'Color.white';
            default:
                return 'null';
        }
    }

    /**
     * Sanitize an identifier for C# code
     */
    private sanitizeIdentifier(identifier: string): string {
        // Convert to PascalCase
        return identifier
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            .replace(/^([a-z])/, (_, letter) => letter.toUpperCase());
    }
} 