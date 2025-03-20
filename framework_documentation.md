# GameForge DSL: Framework Documentation

## Introduction

GameForge DSL is a comprehensive text-based domain-specific language designed to enable AI-driven game development for complex engines like Unreal and Unity. This framework bridges the gap between the simplicity of Three.js and the power of advanced game engines, providing a unified, engine-agnostic interface that abstracts away engine complexities while maintaining access to their powerful features.

The GameForge DSL allows developers and AI systems to define complete games in a text-based format, including assets, scenes, behaviors, and build configurations, without manually using the engine editor. This approach makes game development more accessible, version-control friendly, and ideal for AI-driven content creation.

## Core Components

The GameForge DSL framework consists of the following core components:

1. **DSL Format & Syntax**: A human and AI-readable YAML-based syntax for defining all aspects of a game.

2. **Asset Referencing & Integration**: A unified system for referencing and managing game assets across different engine platforms.

3. **Scene & GameObject Definition**: A flexible approach to defining game worlds, object hierarchies, and component-based entities.

4. **Script & Behavior Linking**: A state machine-based system for defining game logic and behaviors.

5. **Build & Platform Configuration**: A unified approach to defining build targets, platform-specific settings, and deployment configurations.

6. **Plugin & Extension Support**: A framework for integrating third-party plugins and engine extensions.

7. **Error Handling & Validation**: A robust system for detecting, reporting, and resolving issues in GameForge DSL projects.

## Key Benefits

### For AI-Driven Development

1. **Text-Based Representation**: All game elements are defined in a text format that AI systems can easily generate and modify.

2. **Structured Validation**: Clear error reporting helps AI systems understand and fix issues in generated content.

3. **Abstracted Complexity**: Engine-specific details are abstracted away, allowing AI to focus on game design rather than engine quirks.

4. **Consistent Interface**: The same DSL works across different engines, enabling AI to create engine-agnostic game definitions.

### For Human Developers

1. **Version Control Friendly**: Text-based definitions work well with Git and other version control systems.

2. **Reduced Editor Dependence**: Less reliance on manual editor operations for game creation.

3. **Cross-Engine Compatibility**: Skills and knowledge transfer between different engine ecosystems.

4. **Automated Workflows**: Streamlined build and deployment processes through command-line tools.

## Getting Started

### Installation

```bash
# Install GameForge CLI
npm install -g gameforge-cli

# Initialize a new GameForge project
gameforge init my-game-project
cd my-game-project
```

### Project Structure

A typical GameForge project has the following structure:

```
my-game-project/
├── project.yaml              # Project configuration
├── assets/                   # Asset definitions
│   ├── models.yaml
│   ├── textures.yaml
│   ├── materials.yaml
│   └── audio.yaml
├── scenes/                   # Scene definitions
│   └── main_level.yaml
├── behaviors/                # Behavior definitions
│   ├── player_controller.yaml
│   └── enemy_ai.yaml
├── build/                    # Build configurations
│   └── targets.yaml
└── plugins/                  # Plugin configurations
    └── plugins.yaml
```

### Basic Workflow

1. **Define Assets**: Create asset definitions for models, textures, materials, etc.
2. **Create Behaviors**: Define game logic using the behavior system.
3. **Build Scenes**: Compose scenes with game objects, lighting, and environment.
4. **Configure Builds**: Set up build targets for different platforms.
5. **Compile & Run**: Use the GameForge compiler to generate engine-specific projects and build them.

## DSL Format & Syntax

GameForge DSL uses YAML as its primary format due to its human readability, support for hierarchical structures, and widespread tooling. The syntax is designed to be intuitive for both humans and AI systems.

### Core Syntax Elements

#### Project Definition

```yaml
project:
  name: "Adventure Game"
  version: "1.0.0"
  engine: "unreal"  # or "unity"
  engine_version: "5.1"
  description: "A third-person adventure game with puzzle elements"
```

#### Asset References

Assets are referenced using a URI-like scheme:

```yaml
asset://models/player_character
asset://textures/grass_diffuse
asset://audio/footstep_grass
```

#### Game Objects

Game objects are defined with transforms, components, and hierarchical relationships:

```yaml
game_objects:
  player:
    transform:
      position: [0, 0, 100]
      rotation: [0, 0, 0]
      scale: [1, 1, 1]
    components:
      model:
        asset: "asset://models/player_character"
      character_controller:
        height: 180
        radius: 30
      script:
        behavior: "player_controller"
        parameters:
          move_speed: 500
    children:
      camera:
        transform:
          position: [0, 100, 50]
        components:
          camera:
            fov: 75
```

#### Behaviors

Behaviors define game logic using a state machine approach:

```yaml
behaviors:
  player_controller:
    states:
      idle:
        entry_actions:
          - play_animation:
              animation: "asset://animations/player_idle"
        transitions:
          - to: "walking"
            condition: "input.movement_magnitude > 0.1"
      
      walking:
        update_actions:
          - move_character:
              direction: "input.movement_direction"
              speed: "parameters.move_speed"
```

## Asset Referencing & Integration

The Asset Referencing & Integration System provides a unified approach to defining, referencing, and managing game assets across different engine platforms.

### Asset Categories

- **Models**: 3D meshes, skeletal meshes
- **Textures**: Diffuse, normal, specular, etc.
- **Materials**: Surface definitions
- **Audio**: Sound effects, music, voice
- **Animations**: Skeletal animations, blend spaces
- **VFX**: Particle systems, visual effects

### Asset Definition Example

```yaml
assets:
  models:
    player_character:
      path: "models/character/hero.fbx"
      import_settings:
        scale: [1.0, 1.0, 1.0]
      skeleton: "humanoid"
      materials:
        body: "asset://materials/character_body"
        face: "asset://materials/character_face"
```

### Asset Import Pipeline

GameForge includes an automated asset import pipeline that handles the conversion of source assets into engine-specific formats:

```yaml
import_pipeline:
  source_directories:
    - "source_assets/models"
    - "source_assets/textures"
  output_directory: "game_assets"
  global_settings:
    texture_compression: "high"
```

## Scene & GameObject Definition

The Scene & GameObject Definition System provides a structured approach to defining game worlds, object hierarchies, and component-based entities.

### Scene Definition

```yaml
scenes:
  forest_level:
    environment:
      skybox: "asset://skyboxes/daytime_forest"
      ambient_light: [0.2, 0.2, 0.3]
    
    terrain:
      heightmap: "asset://terrain/forest_heightmap"
      size: [8192, 8192]
      layers:
        - material: "asset://materials/grass"
          mask: "asset://textures/forest_grass_mask"
    
    lighting:
      directional_light:
        direction: [0.5, -0.8, 0.2]
        color: [1.0, 0.9, 0.8]
        intensity: 2.0
```

### Component Types

GameForge supports a wide range of component types that map to equivalent features in both Unity and Unreal:

- **Transform**: Position, rotation, and scale
- **Rendering**: Models, particles, effects
- **Physics**: Colliders, rigid bodies
- **Audio**: Sound sources, listeners
- **Camera**: View settings, effects
- **Script**: Custom behaviors

## Script & Behavior Linking

The Script & Behavior Linking Mechanism provides a text-based approach to defining game logic, AI behaviors, and interactive elements.

### State Machine System

```yaml
behaviors:
  enemy_ai:
    states:
      idle:
        entry_actions:
          - play_animation:
              animation: "asset://animations/enemy_idle"
        transitions:
          - to: "patrol"
            condition: "variables.idle_time > parameters.idle_duration"
          - to: "chase"
            condition: "perception.can_see_target('player')"
```

### Action System

```yaml
actions:
  move:
    direction: [0, 0, 1]
    speed: 5.0
  
  play_animation:
    animation: "asset://animations/player_jump"
    loop: false
  
  spawn_object:
    prefab: "asset://prefabs/explosion"
    position: [0, 0, 0]
```

### Event System

```yaml
event_handlers:
  on_damage_received:
    - set_variable:
        name: "health"
        value: "variables.health - event.damage_amount"
    - condition:
        if: "variables.health <= 0"
        then:
          - change_state:
              state: "death"
```

## Build & Platform Configuration

The Build & Platform Configuration System provides a unified, text-based approach to defining build targets, platform-specific settings, and deployment configurations.

### Build Target Definition

```yaml
build_targets:
  windows_shipping:
    platform: "windows"
    architecture: "x64"
    configuration: "shipping"
    
  ps5_shipping:
    platform: "ps5"
    configuration: "shipping"
```

### Platform Settings

```yaml
platform_settings:
  windows:
    graphics:
      default_resolution: [1920, 1080]
      fullscreen_mode: "windowed_fullscreen"
    
  ps5:
    graphics:
      resolution_mode: "dynamic_4k"
      ray_tracing: true
```

### Build Pipeline

```yaml
build_pipeline:
  pre_build:
    - name: "Clean build directory"
      action: "clean"
  
  build:
    - name: "Compile shaders"
      action: "compile_shaders"
    
    - name: "Process assets"
      action: "process_assets"
    
  post_build:
    - name: "Package game"
      action: "package"
```

## Plugin & Extension Support

The Plugin & Extension Support System provides a flexible framework for integrating third-party plugins, engine extensions, and custom features.

### Plugin Manifest

```yaml
plugins:
  water_system:
    name: "Advanced Water System"
    version: "2.1.0"
    settings:
      simulation_quality: "high"
      wave_complexity: 8
    
    features:
      foam:
        enabled: true
      caustics:
        enabled: true
```

### Extension Points

```yaml
extension_points:
  rendering_pipeline:
    post_processing:
      description: "Add custom post-processing effects"
    
  physics_system:
    custom_simulation:
      description: "Add custom physics simulation"
```

## Error Handling & Validation

The Error Handling & Validation System provides a robust framework for detecting, reporting, and resolving issues in GameForge DSL projects.

### Validation Rules

```yaml
validation_rules:
  asset_references:
    - rule: "asset_exists"
      description: "Referenced asset must exist in the project"
      severity: "error"
      message: "Asset '{reference}' does not exist in the project"
```

### Error Reporting

```yaml
error_report:
  errors:
    - id: "ERR-1001"
      category: "reference"
      severity: "error"
      message: "Asset 'asset://models/player_character' does not exist"
      location:
        line: 42
        column: 10
      suggestion: "Check the asset path or create the missing asset"
```

## Command-Line Interface

GameForge provides a simple command-line interface for building and managing projects:

```bash
# Initialize a new project
gameforge init my-game

# Build for a specific target
gameforge build windows_shipping

# Clean and rebuild
gameforge clean
gameforge build ps5_shipping --clean

# Validate project
gameforge validate
```

## Engine Integration

### Unreal Engine Integration

GameForge integrates with Unreal Engine by:
- Generating C++ classes and Blueprint assets
- Creating Unreal project files and build configurations
- Mapping DSL concepts to Unreal Engine equivalents

### Unity Integration

GameForge integrates with Unity by:
- Generating C# scripts and prefabs
- Creating Unity project files and build settings
- Mapping DSL concepts to Unity equivalents

## Best Practices

1. **Modular Design**: Break down game elements into reusable components.
2. **Clear Naming**: Use consistent, descriptive names for assets and behaviors.
3. **Version Control**: Commit DSL files regularly to track changes.
4. **Validation**: Run validation frequently to catch issues early.
5. **Documentation**: Add comments and descriptions to clarify intent.

## Conclusion

GameForge DSL provides a powerful, text-based approach to game development that bridges the gap between the simplicity of Three.js and the power of advanced game engines like Unreal and Unity. By abstracting away engine-specific details while maintaining access to powerful features, GameForge enables both AI systems and human developers to create complex games more efficiently.

The framework's comprehensive components—from asset referencing to behavior definition to build configuration—provide a complete solution for text-based game development. Whether you're an AI system generating game content or a human developer seeking a more streamlined workflow, GameForge DSL offers a flexible, powerful approach to modern game creation.
