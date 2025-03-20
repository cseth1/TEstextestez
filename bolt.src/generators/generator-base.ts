import { GameForgeProject, Scene, GameObject, Behavior } from '../core/types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Base class for engine-specific generators
 */
export abstract class GeneratorBase {
    protected project: GameForgeProject;
    protected projectPath: string;
    protected outputPath: string;

    constructor(project: GameForgeProject, projectPath: string, outputPath: string) {
        this.project = project;
        this.projectPath = projectPath;
        this.outputPath = outputPath;
    }

    /**
     * Generate project specific code
     */
    abstract generateProject(): Promise<void>;

    /**
     * Generate code for a scene
     */
    abstract generateScene(scene: Scene): Promise<void>;

    /**
     * Generate code for a game object
     */
    abstract generateGameObject(gameObject: GameObject, parentPath: string): Promise<void>;

    /**
     * Generate code for a behavior
     */
    abstract generateBehavior(behavior: Behavior): Promise<void>;

    /**
     * Generate boilerplate code for the project
     */
    abstract generateBoilerplate(): Promise<void>;

    /**
     * Ensure a directory exists
     */
    protected ensureDirectory(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Write content to a file
     */
    protected writeFile(filePath: string, content: string): void {
        const dir = path.dirname(filePath);
        this.ensureDirectory(dir);
        fs.writeFileSync(filePath, content);
    }

    /**
     * Load scenes from the project directory
     */
    protected async loadScenes(): Promise<any[]> {
        const scenesDir = path.join(this.projectPath, 'scenes');
        const scenes: any[] = [];

        if (fs.existsSync(scenesDir)) {
            const files = fs.readdirSync(scenesDir);
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    // In a real implementation, this would load and parse the scene files
                    console.log(`Found scene file: ${file}`);
                }
            }
        }

        return scenes;
    }

    /**
     * Load behaviors from the project directory
     */
    protected async loadBehaviors(): Promise<any[]> {
        const behaviorsDir = path.join(this.projectPath, 'behaviors');
        const behaviors: any[] = [];

        if (fs.existsSync(behaviorsDir)) {
            const files = fs.readdirSync(behaviorsDir);
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    // In a real implementation, this would load and parse the behavior files
                    console.log(`Found behavior file: ${file}`);
                }
            }
        }

        return behaviors;
    }
} 