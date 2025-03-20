#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { GameForgeParser, VERSION } from '../core';
import { TemplateManager } from '../templates/template-manager';
import { BuildManager } from '../build/build-manager';
import { WebViewer } from '../web';

/**
 * Configure the CLI application
 */
export function configureProgram(): Command {
    const program = new Command();

    program
        .name('gameforge')
        .description('GameForge CLI - Text-based game development framework')
        .version(VERSION);

    program
        .command('init')
        .description('Initialize a new GameForge project')
        .argument('<n>', 'Project name')
        .option('-e, --engine <engine>', 'Target engine (unreal or unity)', 'unreal')
        .option('-d, --directory <directory>', 'Target directory', './')
        .action((name, options) => {
            console.log(`Initializing new project: ${name}`);
            
            const engine = options.engine === 'unity' ? 'unity' : 'unreal';
            const targetDir = path.join(options.directory, name);
            
            try {
                TemplateManager.createProject(name, engine, targetDir);
            } catch (error: any) {
                console.error(`Error creating project: ${error.message}`);
                process.exit(1);
            }
        });

    program
        .command('build')
        .description('Build the project for specified target')
        .argument('<target>', 'Build target (e.g., windows_shipping)')
        .option('--clean', 'Clean build', false)
        .option('-v, --verbose', 'Verbose output', false)
        .action(async (target, options) => {
            try {
                // Load project file
                const projectPath = process.cwd();
                const projectFile = path.join(projectPath, 'project.yaml');
                
                if (!fs.existsSync(projectFile)) {
                    console.error(`Project file not found: ${projectFile}`);
                    console.error('Please run this command from the root of a GameForge project');
                    process.exit(1);
                }
                
                const projectContent = fs.readFileSync(projectFile, 'utf8');
                const { project, errors } = GameForgeParser.parseProject(projectContent);
                
                if (errors.length > 0) {
                    console.error('Project validation errors:');
                    errors.forEach(error => {
                        console.error(`  ${error.severity.toUpperCase()}: ${error.message} [${error.path}]`);
                    });
                    process.exit(1);
                }
                
                // Build the project
                const buildManager = new BuildManager(projectPath, project);
                await buildManager.buildTarget(target, {
                    clean: options.clean,
                    verbose: options.verbose
                });
            } catch (error: any) {
                console.error(`Build error: ${error.message}`);
                process.exit(1);
            }
        });

    program
        .command('validate')
        .description('Validate the project files')
        .option('-p, --path <path>', 'Project path', './')
        .action(async (options) => {
            try {
                const projectPath = path.resolve(options.path);
                console.log(`Validating project at: ${projectPath}`);
                
                // Validate project file
                const projectFile = path.join(projectPath, 'project.yaml');
                if (!fs.existsSync(projectFile)) {
                    console.error(`Project file not found: ${projectFile}`);
                    process.exit(1);
                }
                
                const projectContent = fs.readFileSync(projectFile, 'utf8');
                const { project, errors: projectErrors } = GameForgeParser.parseProject(projectContent);
                
                let errorCount = 0;
                let warningCount = 0;
                
                if (projectErrors.length > 0) {
                    console.log('Project validation results:');
                    projectErrors.forEach(error => {
                        console.log(`  ${error.severity.toUpperCase()}: ${error.message} [${error.path}]`);
                        if (error.severity === 'error') errorCount++;
                        if (error.severity === 'warning') warningCount++;
                    });
                    console.log();
                }
                
                // Validate scenes
                const scenesDir = path.join(projectPath, 'scenes');
                if (fs.existsSync(scenesDir)) {
                    console.log('Validating scenes...');
                    const files = fs.readdirSync(scenesDir);
                    for (const file of files) {
                        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                            const filePath = path.join(scenesDir, file);
                            const content = fs.readFileSync(filePath, 'utf8');
                            const { scene, errors } = GameForgeParser.parseScene(content);
                            
                            if (errors.length > 0) {
                                console.log(`Scene: ${file}`);
                                errors.forEach(error => {
                                    console.log(`  ${error.severity.toUpperCase()}: ${error.message} [${error.path}]`);
                                    if (error.severity === 'error') errorCount++;
                                    if (error.severity === 'warning') warningCount++;
                                });
                                console.log();
                            }
                        }
                    }
                }
                
                // Validate behaviors
                const behaviorsDir = path.join(projectPath, 'behaviors');
                if (fs.existsSync(behaviorsDir)) {
                    console.log('Validating behaviors...');
                    const files = fs.readdirSync(behaviorsDir);
                    for (const file of files) {
                        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                            const filePath = path.join(behaviorsDir, file);
                            const content = fs.readFileSync(filePath, 'utf8');
                            const { behavior, errors } = GameForgeParser.parseBehavior(content);
                            
                            if (errors.length > 0) {
                                console.log(`Behavior: ${file}`);
                                errors.forEach(error => {
                                    console.log(`  ${error.severity.toUpperCase()}: ${error.message} [${error.path}]`);
                                    if (error.severity === 'error') errorCount++;
                                    if (error.severity === 'warning') warningCount++;
                                });
                                console.log();
                            }
                        }
                    }
                }
                
                // Output summary
                if (errorCount > 0 || warningCount > 0) {
                    console.log(`Validation complete: ${errorCount} errors, ${warningCount} warnings`);
                    if (errorCount > 0) {
                        process.exit(1);
                    }
                } else {
                    console.log('Validation complete: no issues found');
                }
            } catch (error: any) {
                console.error(`Validation error: ${error.message}`);
                process.exit(1);
            }
        });

    program
        .command('serve')
        .description('Start the web viewer for the current project')
        .option('-p, --port <port>', 'Port to use', '3000')
        .action(async (options) => {
            try {
                const projectPath = process.cwd();
                const projectFile = path.join(projectPath, 'project.yaml');
                
                if (!fs.existsSync(projectFile)) {
                    console.error(`Project file not found: ${projectFile}`);
                    console.error('Please run this command from the root of a GameForge project');
                    process.exit(1);
                }
                
                console.log(`Starting web viewer for project at: ${projectPath}`);
                const port = parseInt(options.port, 10);
                
                const webViewer = new WebViewer(projectPath, port);
                await webViewer.start();
                
                // Keep the process running
                console.log('Server is running. Press Ctrl+C to stop.');
                process.stdin.resume();
                
                // Handle graceful shutdown
                process.on('SIGINT', () => {
                    console.log('Shutting down server...');
                    process.exit(0);
                });
            } catch (error: any) {
                console.error(`Web viewer error: ${error.message}`);
                process.exit(1);
            }
        });

    return program;
}

/**
 * Run the CLI
 */
export function run(): void {
    const program = configureProgram();
    program.parse(process.argv);

    // If no arguments are provided, show help
    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}

// Export the configured CLI program as the default export
export default { configureProgram, run }; 