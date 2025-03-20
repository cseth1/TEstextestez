import * as fs from 'fs';
import * as path from 'path';

/**
 * Manages project templates and scaffolding
 */
export class TemplateManager {
    /**
     * Create a new project from a template
     */
    static createProject(name: string, engine: 'unreal' | 'unity', targetDir: string): void {
        console.log(`Creating new ${engine} project: ${name} in ${targetDir}`);
        
        // Create project directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Create basic project structure
        this.createProjectStructure(targetDir);
        
        // Create project.yaml file
        this.createProjectFile(name, engine, targetDir);
        
        console.log(`Project created successfully: ${name}`);
    }
    
    /**
     * Create basic project structure
     */
    private static createProjectStructure(targetDir: string): void {
        const directories = [
            'assets',
            'scenes',
            'behaviors',
            'build',
            'docs'
        ];
        
        directories.forEach(dir => {
            const dirPath = path.join(targetDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }
    
    /**
     * Create project.yaml file
     */
    private static createProjectFile(name: string, engine: 'unreal' | 'unity', targetDir: string): void {
        const engineVersion = engine === 'unreal' ? '5.1' : '2022.1';
        
        const projectYaml = `
project:
  name: "${name}"
  version: "0.1.0"
  engine: "${engine}"
  engine_version: "${engineVersion}"
  description: "A GameForge project"

build_targets:
  development:
    platform: "windows"
    architecture: "x64"
    configuration: "development"
    description: "Development build for Windows"
  
  shipping:
    platform: "windows"
    architecture: "x64"
    configuration: "shipping"
    description: "Shipping build for Windows"
`;
        
        fs.writeFileSync(path.join(targetDir, 'project.yaml'), projectYaml.trim());
    }
} 