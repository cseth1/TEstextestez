export interface TextureOptions {
  format?: number;
  internalFormat?: number;
  type?: number;
  minFilter?: number;
  magFilter?: number;
  wrapS?: number;
  wrapT?: number;
  generateMipmaps?: boolean;
}

export class TextureManager {
  private gl: WebGLRenderingContext;
  private textures: Map<string, WebGLTexture> = new Map();

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  public async loadTexture(name: string, url: string, options: TextureOptions = {}): Promise<void> {
    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create texture');
    }

    // Create a temporary 1x1 pixel until the image loads
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      1,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255])
    );

    // Load the image
    const image = new Image();
    image.src = url;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    // Now that the image has loaded, update the texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      options.internalFormat || this.gl.RGBA,
      options.format || this.gl.RGBA,
      options.type || this.gl.UNSIGNED_BYTE,
      image
    );

    // Set texture parameters
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      options.minFilter || this.gl.LINEAR_MIPMAP_LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      options.magFilter || this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      options.wrapS || this.gl.REPEAT
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      options.wrapT || this.gl.REPEAT
    );

    // Generate mipmaps if requested
    if (options.generateMipmaps !== false) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.textures.set(name, texture);
  }

  public createRenderTarget(
    name: string,
    width: number,
    height: number,
    options: TextureOptions = {}
  ): WebGLFramebuffer | null {
    const texture = this.gl.createTexture();
    const framebuffer = this.gl.createFramebuffer();

    if (!texture || !framebuffer) {
      return null;
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      options.internalFormat || this.gl.RGBA,
      width,
      height,
      0,
      options.format || this.gl.RGBA,
      options.type || this.gl.UNSIGNED_BYTE,
      null
    );

    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      options.minFilter || this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      options.magFilter || this.gl.LINEAR
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      options.wrapS || this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      options.wrapT || this.gl.CLAMP_TO_EDGE
    );

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );

    // Create depth buffer
    const depthBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, depthBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER,
      this.gl.DEPTH_COMPONENT16,
      width,
      height
    );
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.RENDERBUFFER,
      depthBuffer
    );

    // Check framebuffer status
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer is not complete:', status);
      return null;
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);

    this.textures.set(name, texture);
    return framebuffer;
  }

  public bindTexture(name: string, unit: number): void {
    const texture = this.textures.get(name);
    if (texture) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    }
  }

  public unbindTexture(unit: number): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  public getTexture(name: string): WebGLTexture | undefined {
    return this.textures.get(name);
  }

  public deleteTexture(name: string): void {
    const texture = this.textures.get(name);
    if (texture) {
      this.gl.deleteTexture(texture);
      this.textures.delete(name);
    }
  }

  public cleanup(): void {
    this.textures.forEach((texture, name) => {
      this.deleteTexture(name);
    });
  }
}