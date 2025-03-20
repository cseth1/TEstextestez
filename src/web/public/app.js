/**
 * GameForge Web Viewer Application
 */

// Main application class
class GameForgeViewer {
    constructor() {
        this.currentScene = null;
        this.isPlaying = false;
        this.selectedObject = null;
        this.renderer = null;
        this.camera = null;
        this.scene = null;

        this.initThreeJs();
        this.bindUIEvents();
        this.loadScenesList();
    }

    // Initialize Three.js renderer
    initThreeJs() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth - 250, window.innerHeight - 120); // Adjust for sidebar and header/footer
        this.renderer.setClearColor(0x333333);
        document.getElementById('scene-viewer').appendChild(this.renderer.domElement);

        // Create scene
        this.scene = new THREE.Scene();

        // Create default camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            (window.innerWidth - 250) / (window.innerHeight - 120), 
            0.1, 
            1000
        );
        this.camera.position.z = 5;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = (window.innerWidth - 250) / (window.innerHeight - 120);
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth - 250, window.innerHeight - 120);
        });
    }

    // Bind UI events
    bindUIEvents() {
        // Scene selector
        document.getElementById('scene-selector').addEventListener('change', (event) => {
            const sceneName = event.target.value;
            if (sceneName) {
                this.loadScene(sceneName);
            }
        });

        // Play button
        document.getElementById('play-button').addEventListener('click', () => {
            this.isPlaying = true;
            console.log('Playing scene');
        });

        // Pause button
        document.getElementById('pause-button').addEventListener('click', () => {
            this.isPlaying = false;
            console.log('Paused scene');
        });

        // Reset button
        document.getElementById('reset-button').addEventListener('click', () => {
            if (this.currentScene) {
                this.loadScene(this.currentScene.name);
            }
        });

        // Project info button
        document.getElementById('project-info').addEventListener('click', () => {
            this.showProjectInfo();
        });

        // Scenes list button
        document.getElementById('scenes-list').addEventListener('click', () => {
            this.showScenesList();
        });

        // Modal close button
        document.querySelector('.close-button').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('modal')) {
                document.getElementById('modal').style.display = 'none';
            }
        });
    }

    // Animation loop
    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isPlaying) {
            // Update game objects based on behaviors
            // This would be implemented based on behavior definitions
        }

        this.renderer.render(this.scene, this.camera);
    }

    // Load available scenes
    async loadScenesList() {
        try {
            const response = await fetch('/api/scenes');
            const data = await response.json();

            const sceneSelector = document.getElementById('scene-selector');
            
            // Clear existing options except the first one
            while (sceneSelector.options.length > 1) {
                sceneSelector.remove(1);
            }

            // Add scenes to selector
            if (data.scenes && data.scenes.length > 0) {
                data.scenes.forEach(scene => {
                    const option = document.createElement('option');
                    option.value = scene.name;
                    option.textContent = scene.name;
                    sceneSelector.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load scenes list:', error);
        }
    }

    // Load a specific scene
    async loadScene(sceneName) {
        try {
            document.getElementById('loading-indicator').style.display = 'block';
            
            const response = await fetch(`/api/scenes/${sceneName}`);
            const data = await response.json();
            
            if (data.scene) {
                this.currentScene = data.scene;
                
                // Clear existing scene objects
                while (this.scene.children.length > 0) {
                    this.scene.remove(this.scene.children[0]);
                }
                
                // Add default lights and helpers
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(1, 1, 1);
                this.scene.add(directionalLight);
                
                const gridHelper = new THREE.GridHelper(10, 10);
                this.scene.add(gridHelper);
                
                const axesHelper = new THREE.AxesHelper(5);
                this.scene.add(axesHelper);
                
                // Create game objects from scene definition
                this.createGameObjects(data.scene.gameObjects);
                
                // Update scene hierarchy
                this.updateSceneHierarchy(data.scene.gameObjects);
            }
        } catch (error) {
            console.error('Failed to load scene:', error);
        } finally {
            document.getElementById('loading-indicator').style.display = 'none';
        }
    }

    // Create Three.js objects from scene definition
    createGameObjects(gameObjects) {
        if (!gameObjects) return;
        
        // Create game objects
        Object.entries(gameObjects).forEach(([id, gameObject]) => {
            const obj = new THREE.Group();
            obj.name = gameObject.name || id;
            
            // Set transform
            if (gameObject.transform) {
                if (gameObject.transform.position) {
                    obj.position.set(
                        gameObject.transform.position[0] || 0,
                        gameObject.transform.position[1] || 0,
                        gameObject.transform.position[2] || 0
                    );
                }
                
                if (gameObject.transform.rotation) {
                    obj.rotation.set(
                        THREE.MathUtils.degToRad(gameObject.transform.rotation[0] || 0),
                        THREE.MathUtils.degToRad(gameObject.transform.rotation[1] || 0),
                        THREE.MathUtils.degToRad(gameObject.transform.rotation[2] || 0)
                    );
                }
                
                if (gameObject.transform.scale) {
                    obj.scale.set(
                        gameObject.transform.scale[0] || 1,
                        gameObject.transform.scale[1] || 1,
                        gameObject.transform.scale[2] || 1
                    );
                }
            }
            
            // Add components
            if (gameObject.components) {
                Object.entries(gameObject.components).forEach(([componentId, component]) => {
                    switch (component.type) {
                        case 'model':
                            // Add a placeholder cube
                            const geometry = new THREE.BoxGeometry(1, 1, 1);
                            const material = new THREE.MeshStandardMaterial({ color: 0x3498db });
                            const mesh = new THREE.Mesh(geometry, material);
                            obj.add(mesh);
                            break;
                            
                        case 'camera':
                            const camera = new THREE.PerspectiveCamera(
                                component.field_of_view || 75,
                                window.innerWidth / window.innerHeight,
                                component.near_clip || 0.1,
                                component.far_clip || 1000
                            );
                            obj.add(camera);
                            
                            // If this is the main camera, use it for rendering
                            if (component.main === true) {
                                this.camera = camera;
                            }
                            break;
                            
                        case 'light':
                            let light;
                            
                            switch (component.light_type) {
                                case 'point':
                                    light = new THREE.PointLight(
                                        parseInt(component.color || '0xffffff'),
                                        component.intensity || 1,
                                        component.range || 10
                                    );
                                    break;
                                    
                                case 'directional':
                                    light = new THREE.DirectionalLight(
                                        parseInt(component.color || '0xffffff'),
                                        component.intensity || 1
                                    );
                                    break;
                                    
                                case 'spot':
                                    light = new THREE.SpotLight(
                                        parseInt(component.color || '0xffffff'),
                                        component.intensity || 1,
                                        component.range || 10,
                                        component.angle || Math.PI / 3
                                    );
                                    break;
                                    
                                default:
                                    light = new THREE.PointLight(0xffffff, 1, 10);
                            }
                            
                            obj.add(light);
                            break;
                    }
                });
            }
            
            // Add to scene
            this.scene.add(obj);
            
            // Process children recursively
            if (gameObject.children) {
                // This would need to be implemented
            }
        });
    }

    // Update scene hierarchy display
    updateSceneHierarchy(gameObjects) {
        if (!gameObjects) return;
        
        const hierarchyElement = document.getElementById('scene-hierarchy');
        hierarchyElement.innerHTML = '';
        
        Object.entries(gameObjects).forEach(([id, gameObject]) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'hierarchy-item';
            itemElement.dataset.id = id;
            itemElement.textContent = gameObject.name || id;
            
            itemElement.addEventListener('click', () => {
                // Select object in scene
                this.selectObject(id);
                
                // Update properties panel
                this.updatePropertiesPanel(gameObject);
                
                // Visual selection indicator
                document.querySelectorAll('.hierarchy-item').forEach(el => {
                    el.classList.remove('selected');
                });
                itemElement.classList.add('selected');
            });
            
            hierarchyElement.appendChild(itemElement);
        });
    }

    // Select an object in the scene
    selectObject(id) {
        this.selectedObject = this.scene.getObjectByName(id);
        console.log('Selected object:', this.selectedObject);
    }

    // Update properties panel with object properties
    updatePropertiesPanel(gameObject) {
        const propertiesElement = document.getElementById('properties-panel');
        propertiesElement.innerHTML = '';
        
        // General properties
        const generalGroup = document.createElement('div');
        generalGroup.className = 'property-group';
        
        const generalTitle = document.createElement('div');
        generalTitle.className = 'property-group-title';
        generalTitle.textContent = 'General';
        generalGroup.appendChild(generalTitle);
        
        // Name property
        const nameRow = document.createElement('div');
        nameRow.className = 'property-row';
        
        const nameLabel = document.createElement('div');
        nameLabel.className = 'property-name';
        nameLabel.textContent = 'Name';
        nameRow.appendChild(nameLabel);
        
        const nameValue = document.createElement('div');
        nameValue.className = 'property-value';
        nameValue.textContent = gameObject.name || '';
        nameRow.appendChild(nameValue);
        
        generalGroup.appendChild(nameRow);
        
        // Tags property
        if (gameObject.tags) {
            const tagsRow = document.createElement('div');
            tagsRow.className = 'property-row';
            
            const tagsLabel = document.createElement('div');
            tagsLabel.className = 'property-name';
            tagsLabel.textContent = 'Tags';
            tagsRow.appendChild(tagsLabel);
            
            const tagsValue = document.createElement('div');
            tagsValue.className = 'property-value';
            tagsValue.textContent = gameObject.tags.join(', ');
            tagsRow.appendChild(tagsValue);
            
            generalGroup.appendChild(tagsRow);
        }
        
        propertiesElement.appendChild(generalGroup);
        
        // Transform properties
        if (gameObject.transform) {
            const transformGroup = document.createElement('div');
            transformGroup.className = 'property-group';
            
            const transformTitle = document.createElement('div');
            transformTitle.className = 'property-group-title';
            transformTitle.textContent = 'Transform';
            transformGroup.appendChild(transformTitle);
            
            // Position
            if (gameObject.transform.position) {
                const posRow = document.createElement('div');
                posRow.className = 'property-row';
                
                const posLabel = document.createElement('div');
                posLabel.className = 'property-name';
                posLabel.textContent = 'Position';
                posRow.appendChild(posLabel);
                
                const posValue = document.createElement('div');
                posValue.className = 'property-value';
                posValue.textContent = gameObject.transform.position.join(', ');
                posRow.appendChild(posValue);
                
                transformGroup.appendChild(posRow);
            }
            
            // Rotation
            if (gameObject.transform.rotation) {
                const rotRow = document.createElement('div');
                rotRow.className = 'property-row';
                
                const rotLabel = document.createElement('div');
                rotLabel.className = 'property-name';
                rotLabel.textContent = 'Rotation';
                rotRow.appendChild(rotLabel);
                
                const rotValue = document.createElement('div');
                rotValue.className = 'property-value';
                rotValue.textContent = gameObject.transform.rotation.join(', ');
                rotRow.appendChild(rotValue);
                
                transformGroup.appendChild(rotRow);
            }
            
            // Scale
            if (gameObject.transform.scale) {
                const scaleRow = document.createElement('div');
                scaleRow.className = 'property-row';
                
                const scaleLabel = document.createElement('div');
                scaleLabel.className = 'property-name';
                scaleLabel.textContent = 'Scale';
                scaleRow.appendChild(scaleLabel);
                
                const scaleValue = document.createElement('div');
                scaleValue.className = 'property-value';
                scaleValue.textContent = gameObject.transform.scale.join(', ');
                scaleRow.appendChild(scaleValue);
                
                transformGroup.appendChild(scaleRow);
            }
            
            propertiesElement.appendChild(transformGroup);
        }
        
        // Components
        if (gameObject.components) {
            const componentsGroup = document.createElement('div');
            componentsGroup.className = 'property-group';
            
            const componentsTitle = document.createElement('div');
            componentsTitle.className = 'property-group-title';
            componentsTitle.textContent = 'Components';
            componentsGroup.appendChild(componentsTitle);
            
            Object.entries(gameObject.components).forEach(([id, component]) => {
                const compRow = document.createElement('div');
                compRow.className = 'property-row';
                
                const compLabel = document.createElement('div');
                compLabel.className = 'property-name';
                compLabel.textContent = component.type || 'Component';
                compRow.appendChild(compLabel);
                
                const compValue = document.createElement('div');
                compValue.className = 'property-value';
                
                // Different display based on component type
                switch (component.type) {
                    case 'model':
                        compValue.textContent = component.asset || 'No asset';
                        break;
                    case 'script':
                        compValue.textContent = component.behavior || 'Unknown';
                        break;
                    default:
                        compValue.textContent = id;
                }
                
                compRow.appendChild(compValue);
                componentsGroup.appendChild(compRow);
            });
            
            propertiesElement.appendChild(componentsGroup);
        }
    }

    // Show project information
    async showProjectInfo() {
        try {
            const response = await fetch('/api/project');
            const data = await response.json();
            
            if (data.project) {
                const modal = document.getElementById('modal');
                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                
                modalTitle.textContent = 'Project Information';
                
                let content = `
                    <h3>${data.project.name} (v${data.project.version})</h3>
                    <p>${data.project.description || 'No description'}</p>
                    <p><strong>Engine:</strong> ${data.project.engine} ${data.project.engineVersion}</p>
                `;
                
                modalBody.innerHTML = content;
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to load project information:', error);
        }
    }

    // Show scenes list
    async showScenesList() {
        try {
            const response = await fetch('/api/scenes');
            const data = await response.json();
            
            const modal = document.getElementById('modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            
            modalTitle.textContent = 'Available Scenes';
            
            let content = '<ul style="list-style-type: none; padding: 0;">';
            
            if (data.scenes && data.scenes.length > 0) {
                data.scenes.forEach(scene => {
                    content += `
                        <li style="padding: 8px; margin-bottom: 8px; background-color: #f5f5f5; border-radius: 4px;">
                            <div style="font-weight: bold;">${scene.name}</div>
                            <div>${scene.description || 'No description'}</div>
                            <button onclick="app.loadScene('${scene.name}')" style="margin-top: 8px;">Load Scene</button>
                        </li>
                    `;
                });
            } else {
                content += '<li>No scenes available</li>';
            }
            
            content += '</ul>';
            
            modalBody.innerHTML = content;
            modal.style.display = 'block';
        } catch (error) {
            console.error('Failed to load scenes list:', error);
        }
    }
}

// Initialize the application when the DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GameForgeViewer();
    // Expose app to window for access from inline event handlers
    window.app = app;
}); 