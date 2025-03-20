import { mat4, vec3 } from 'gl-matrix';

export interface ShaderSource {
  vertex: string;
  fragment: string;
}

export interface UniformLocation {
  [key: string]: WebGLUniformLocation | null;
}

export class ShaderManager {
  private gl: WebGLRenderingContext;
  private programs: Map<string, WebGLProgram> = new Map();
  private uniforms: Map<string, UniformLocation> = new Map();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  public async loadShader(name: string, source: ShaderSource): Promise<void> {
    const vertexShader = this.compileShader(source.vertex, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(source.fragment, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      throw new Error(`Failed to compile shaders for ${name}`);
    }

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error(`Failed to create program for ${name}`);
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error(`Failed to link program: ${info}`);
    }

    // Store program
    this.programs.set(name, program);

    // Cache uniform locations
    const uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    const uniformLocations: UniformLocation = {};

    for (let i = 0; i < uniformCount; i++) {
      const uniformInfo = this.gl.getActiveUniform(program, i);
      if (uniformInfo) {
        uniformLocations[uniformInfo.name] = this.gl.getUniformLocation(program, uniformInfo.name);
      }
    }

    this.uniforms.set(name, uniformLocations);

    // Cleanup
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(`Shader compilation error: ${this.gl.getShaderInfoLog(shader)}`);
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  public useProgram(name: string): void {
    const program = this.programs.get(name);
    if (program) {
      this.gl.useProgram(program);
    }
  }

  public setUniform(programName: string, uniformName: string, value: any): void {
    const uniformLocations = this.uniforms.get(programName);
    if (!uniformLocations) return;

    const location = uniformLocations[uniformName];
    if (!location) return;

    if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          this.gl.uniform2fv(location, value);
          break;
        case 3:
          this.gl.uniform3fv(location, value);
          break;
        case 4:
          this.gl.uniform4fv(location, value);
          break;
        case 16:
          this.gl.uniformMatrix4fv(location, false, value);
          break;
      }
    } else if (typeof value === 'number') {
      this.gl.uniform1f(location, value);
    } else if (value instanceof Float32Array) {
      if (value.length === 16) {
        this.gl.uniformMatrix4fv(location, false, value);
      }
    }
  }

  public getProgram(name: string): WebGLProgram | undefined {
    return this.programs.get(name);
  }

  public cleanup(): void {
    this.programs.forEach(program => {
      this.gl.deleteProgram(program);
    });
    this.programs.clear();
    this.uniforms.clear();
  }
}