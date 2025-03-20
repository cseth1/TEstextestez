export interface BufferData {
  vertices: Float32Array;
  indices?: Uint16Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  tangents?: Float32Array;
}

export interface BufferObject {
  vao: WebGLVertexArrayObject | null;
  vbo: WebGLBuffer | null;
  ibo?: WebGLBuffer | null;
  count: number;
}

export class BufferManager {
  private gl: WebGLRenderingContext;
  private buffers: Map<string, BufferObject> = new Map();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  public createBuffer(name: string, data: BufferData): void {
    const vao = this.gl.createVertexArray();
    const vbo = this.gl.createBuffer();
    let ibo: WebGLBuffer | null = null;

    if (!vao || !vbo) {
      throw new Error('Failed to create buffers');
    }

    this.gl.bindVertexArray(vao);

    // Vertex buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
    
    // Calculate stride and offset
    const stride = (3 + (data.normals ? 3 : 0) + (data.uvs ? 2 : 0) + (data.tangents ? 4 : 0)) * 4;
    let offset = 0;
    
    // Create interleaved buffer data
    const vertexCount = data.vertices.length / 3;
    const interleavedData = new Float32Array(vertexCount * stride / 4);
    let idx = 0;

    // Interleave vertex attributes
    for (let i = 0; i < vertexCount; i++) {
      // Position
      interleavedData[idx++] = data.vertices[i * 3];
      interleavedData[idx++] = data.vertices[i * 3 + 1];
      interleavedData[idx++] = data.vertices[i * 3 + 2];

      // Normal
      if (data.normals) {
        interleavedData[idx++] = data.normals[i * 3];
        interleavedData[idx++] = data.normals[i * 3 + 1];
        interleavedData[idx++] = data.normals[i * 3 + 2];
      }

      // UV
      if (data.uvs) {
        interleavedData[idx++] = data.uvs[i * 2];
        interleavedData[idx++] = data.uvs[i * 2 + 1];
      }

      // Tangent
      if (data.tangents) {
        interleavedData[idx++] = data.tangents[i * 4];
        interleavedData[idx++] = data.tangents[i * 4 + 1];
        interleavedData[idx++] = data.tangents[i * 4 + 2];
        interleavedData[idx++] = data.tangents[i * 4 + 3];
      }
    }

    this.gl.bufferData(this.gl.ARRAY_BUFFER, interleavedData, this.gl.STATIC_DRAW);

    // Set up vertex attributes
    // Position
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, stride, offset);
    offset += 12; // 3 * 4 bytes

    // Normal
    if (data.normals) {
      this.gl.enableVertexAttribArray(1);
      this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, stride, offset);
      offset += 12;
    }

    // UV
    if (data.uvs) {
      this.gl.enableVertexAttribArray(2);
      this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, stride, offset);
      offset += 8;
    }

    // Tangent
    if (data.tangents) {
      this.gl.enableVertexAttribArray(3);
      this.gl.vertexAttribPointer(3, 4, this.gl.FLOAT, false, stride, offset);
      offset += 16;
    }

    // Index buffer
    if (data.indices) {
      ibo = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data.indices, this.gl.STATIC_DRAW);
    }

    this.gl.bindVertexArray(null);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

    this.buffers.set(name, {
      vao,
      vbo,
      ibo,
      count: data.indices ? data.indices.length : data.vertices.length / 3
    });
  }

  public bindBuffer(name: string): void {
    const buffer = this.buffers.get(name);
    if (buffer) {
      this.gl.bindVertexArray(buffer.vao);
    }
  }

  public unbindBuffer(): void {
    this.gl.bindVertexArray(null);
  }

  public getBuffer(name: string): BufferObject | undefined {
    return this.buffers.get(name);
  }

  public deleteBuffer(name: string): void {
    const buffer = this.buffers.get(name);
    if (buffer) {
      if (buffer.vao) this.gl.deleteVertexArray(buffer.vao);
      if (buffer.vbo) this.gl.deleteBuffer(buffer.vbo);
      if (buffer.ibo) this.gl.deleteBuffer(buffer.ibo);
      this.buffers.delete(name);
    }
  }

  public cleanup(): void {
    this.buffers.forEach((buffer, name) => {
      this.deleteBuffer(name);
    });
  }
}