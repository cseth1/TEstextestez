# GameForge

A text-based domain-specific language (DSL) for game development with Unity and Unreal Engine.

## Overview

GameForge DSL is a comprehensive text-based language designed to enable AI-driven game development for complex engines like Unreal and Unity. This framework bridges the gap between the simplicity of Three.js and the power of advanced game engines, providing a unified, engine-agnostic interface that abstracts away engine complexities while maintaining access to their powerful features.

## Key Features

- Define complete games in a text-based YAML format
- Engine-agnostic development (supports both Unity and Unreal Engine)
- Component-based game object system
- State machine-based behavior definition
- Asset referencing and management
- Build and platform configuration
- Plugin and extension support

## Installation

```bash
# Install globally
npm install -g gameforge

# Verify installation
gameforge --version
```

## Quick Start

```bash
# Create a new project
gameforge init my-game

# Navigate to project directory
cd my-game

# Build the project
gameforge build development
```

## Project Structure

A typical GameForge project has the following structure:

```
my-game/
├── project.yaml              # Project configuration
├── assets/                   # Asset definitions
├── scenes/                   # Scene definitions
├── behaviors/                # Behavior definitions
├── build/                    # Build configurations
└── docs/                     # Project documentation
```

## Documentation

For detailed documentation, see the [docs](./docs) directory.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 