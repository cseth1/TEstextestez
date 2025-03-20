/**
 * GameForge Web Viewer Module
 * This module provides a web-based viewer for GameForge games
 */

import express from 'express';
import * as path from 'path';
import { GameForgeParser } from '../core/parser';
import * as fs from 'fs';

export class WebViewer {
  private app: express.Application;
  private port: number;
  private projectPath: string;

  constructor(projectPath: string, port: number = 3000) {
    this.app = express();
    this.port = port;
    this.projectPath = projectPath;
    console.log(`Creating WebViewer for project path: ${this.projectPath}`);
  }

  /**
   * Start the web viewer server
   */
  public async start(): Promise<void> {
    // Serve static files from the public directory
    const publicPath = path.join(__dirname, 'public');
    console.log(`Serving static files from: ${publicPath}`);
    this.app.use(express.static(publicPath));
    
    // Serve API routes
    console.log('Setting up API routes');
    this.setupApiRoutes();

    // Serve the main HTML page
    this.app.get('/', (req, res) => {
      const indexPath = path.join(__dirname, 'public', 'index.html');
      console.log(`Serving index.html from: ${indexPath}`);
      res.sendFile(indexPath);
    });

    // Start the server
    try {
      this.app.listen(this.port, () => {
        console.log(`GameForge Web Viewer running at http://localhost:${this.port}`);
        console.log('Press Ctrl+C to stop the server');
      });
    } catch (error: any) {
      console.error(`Failed to start server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup API routes for the web viewer
   */
  private setupApiRoutes(): void {
    // Get project information
    this.app.get('/api/project', (req, res) => {
      try {
        const projectFile = path.join(this.projectPath, 'project.yaml');
        console.log(`Loading project from: ${projectFile}`);
        if (!fs.existsSync(projectFile)) {
          console.error(`Project file not found: ${projectFile}`);
          return res.status(404).json({ error: 'Project file not found' });
        }
        
        const projectContent = fs.readFileSync(projectFile, 'utf8');
        const { project, errors } = GameForgeParser.parseProject(projectContent);
        
        if (errors.length > 0) {
          console.error('Project validation errors:', errors);
          return res.status(400).json({ errors });
        }
        
        console.log('Project loaded successfully');
        return res.json({ project });
      } catch (error: any) {
        console.error(`Error loading project: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
    });

    // Get scenes
    this.app.get('/api/scenes', (req, res) => {
      try {
        const scenesDir = path.join(this.projectPath, 'scenes');
        console.log(`Loading scenes from: ${scenesDir}`);
        if (!fs.existsSync(scenesDir)) {
          console.log('Scenes directory not found');
          return res.json({ scenes: [] });
        }
        
        const scenes = [];
        const files = fs.readdirSync(scenesDir);
        console.log(`Found ${files.length} files in scenes directory`);
        
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(scenesDir, file);
            console.log(`Loading scene from: ${filePath}`);
            const content = fs.readFileSync(filePath, 'utf8');
            const { scene, errors } = GameForgeParser.parseScene(content);
            
            if (errors.length === 0) {
              console.log(`Scene loaded successfully: ${scene.name}`);
              scenes.push(scene);
            } else {
              console.error(`Scene validation errors in ${file}:`, errors);
            }
          }
        }
        
        console.log(`Returning ${scenes.length} scenes`);
        return res.json({ scenes });
      } catch (error: any) {
        console.error(`Error loading scenes: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
    });

    // Get a specific scene
    this.app.get('/api/scenes/:sceneName', (req, res) => {
      try {
        const scenesDir = path.join(this.projectPath, 'scenes');
        const sceneName = req.params.sceneName;
        console.log(`Loading scene: ${sceneName} from ${scenesDir}`);
        
        if (!fs.existsSync(scenesDir)) {
          console.error(`Scenes directory not found: ${scenesDir}`);
          return res.status(404).json({ error: 'Scenes directory not found' });
        }
        
        const files = fs.readdirSync(scenesDir);
        let sceneFile = null;
        
        for (const file of files) {
          if ((file === `${sceneName}.yaml` || file === `${sceneName}.yml`)) {
            sceneFile = path.join(scenesDir, file);
            console.log(`Found scene file: ${sceneFile}`);
            break;
          }
        }
        
        if (!sceneFile) {
          console.error(`Scene not found: ${sceneName}`);
          return res.status(404).json({ error: 'Scene not found' });
        }
        
        const content = fs.readFileSync(sceneFile, 'utf8');
        const { scene, errors } = GameForgeParser.parseScene(content);
        
        if (errors.length > 0) {
          console.error(`Scene validation errors:`, errors);
          return res.status(400).json({ errors });
        }
        
        console.log(`Scene loaded successfully: ${sceneName}`);
        return res.json({ scene });
      } catch (error: any) {
        console.error(`Error loading scene: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }
    });
  }
}

export default WebViewer; 