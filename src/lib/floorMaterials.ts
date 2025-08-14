import * as THREE from 'three';

export interface FloorMaterial {
  id: string;
  name: string;
  texture: THREE.Texture;
  normalMap?: THREE.Texture;
  roughness?: number;
  metalness?: number;
}

export class FloorMaterialManager {
  private materials: Map<string, FloorMaterial> = new Map();
  private textureLoader: THREE.TextureLoader;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.initializeMaterials();
  }

  /**
   * Initialize default floor materials
   */
  private async initializeMaterials() {
    console.log('🎨 Initializing floor materials...');
    
    try {
      // Try to load real textures, fallback to generated ones if they fail
      const oakTexture = await this.loadTextureWithFallback('/textures/oak.jpg', 'oak');
      const walnutTexture = await this.loadTextureWithFallback('/textures/walnut.jpg', 'walnut');
      const grayTexture = await this.loadTextureWithFallback('/textures/gray-lvp.jpg', 'gray');
      const demoTexture = await this.loadTextureWithFallback('/textures/demo-laminate.jpg', 'demo');
      
      this.materials.set('oak-01', {
        id: 'oak-01',
        name: 'Oak Wood',
        texture: oakTexture,
        roughness: 0.8,
        metalness: 0.0
      });

      this.materials.set('walnut-01', {
        id: 'walnut-01',
        name: 'Walnut',
        texture: walnutTexture,
        roughness: 0.7,
        metalness: 0.0
      });

      this.materials.set('gray-lvp-01', {
        id: 'gray-lvp-01',
        name: 'Gray LVP',
        texture: grayTexture,
        roughness: 0.3,
        metalness: 0.1
      });

      this.materials.set('demo-laminate-01', {
        id: 'demo-laminate-01',
        name: 'Demo Laminate',
        texture: demoTexture,
        roughness: 0.5,
        metalness: 0.0
      });

      console.log('✅ Floor materials initialized');
    } catch (error) {
      console.warn('⚠️ Failed to load textures, using generated fallbacks:', error);
      this.createFallbackMaterials();
    }
  }

  /**
   * Load texture from URL
   */
  private async loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Load texture with fallback to generated texture
   */
  private async loadTextureWithFallback(url: string, type: string): Promise<THREE.Texture> {
    try {
      const texture = await this.loadTexture(url);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      return texture;
    } catch (error) {
      console.warn(`⚠️ Failed to load ${url}, using generated ${type} texture`);
      return this.generateFallbackTexture(type);
    }
  }

  /**
   * Generate fallback texture when real textures fail to load
   */
  private generateFallbackTexture(type: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 512;
    
    // Generate different patterns based on type
    switch (type) {
      case 'oak':
        this.generateOakPattern(ctx, canvas.width, canvas.height);
        break;
      case 'walnut':
        this.generateWalnutPattern(ctx, canvas.width, canvas.height);
        break;
      case 'gray':
        this.generateGrayPattern(ctx, canvas.width, canvas.height);
        break;
      case 'demo':
      default:
        this.generateDemoPattern(ctx, canvas.width, canvas.height);
        break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }

  /**
   * Generate oak wood pattern
   */
  private generateOakPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Base color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, width, height);
    
    // Wood grain lines
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
      const y = (i * height / 20) + Math.random() * 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + Math.sin(i * 0.5) * 15);
      ctx.stroke();
    }
    
    // Add some variation
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 20 + 5;
      ctx.fillRect(x, y, size, size);
    }
  }

  /**
   * Generate walnut pattern
   */
  private generateWalnutPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Base color
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(0, 0, width, height);
    
    // Darker grain lines
    ctx.strokeStyle = '#1B0F0F';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 25; i++) {
      const y = (i * height / 25) + Math.random() * 8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + Math.sin(i * 0.3) * 20);
      ctx.stroke();
    }
    
    // Add walnut swirls
    ctx.fillStyle = '#5D4037';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 30 + 10;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Generate gray LVP pattern
   */
  private generateGrayPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Base color
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, width, height);
    
    // Modern geometric pattern
    ctx.strokeStyle = '#696969';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Add some metallic shine
    ctx.fillStyle = '#A9A9A9';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 15 + 5;
      ctx.fillRect(x, y, size, size);
    }
  }

  /**
   * Generate demo laminate pattern
   */
  private generateDemoPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Base color
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, width, height);
    
    // Laminate planks
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 2;
    
    // Vertical plank lines
    for (let i = 0; i < width; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    // Horizontal plank lines
    for (let i = 0; i < height; i += 60) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Add some wood texture
    ctx.fillStyle = '#CD853F';
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 25 + 10;
      ctx.fillRect(x, y, size, size);
    }
  }

  /**
   * Create fallback materials when texture loading completely fails
   */
  private createFallbackMaterials() {
    console.log('🔄 Creating fallback materials...');
    
    const oakTexture = this.generateFallbackTexture('oak');
    const walnutTexture = this.generateFallbackTexture('walnut');
    const grayTexture = this.generateFallbackTexture('gray');
    const demoTexture = this.generateFallbackTexture('demo');
    
    this.materials.set('oak-01', {
      id: 'oak-01',
      name: 'Oak Wood (Generated)',
      texture: oakTexture,
      roughness: 0.8,
      metalness: 0.0
    });

    this.materials.set('walnut-01', {
      id: 'walnut-01',
      name: 'Walnut (Generated)',
      texture: walnutTexture,
      roughness: 0.7,
      metalness: 0.0
    });

    this.materials.set('gray-lvp-01', {
      id: 'gray-lvp-01',
      name: 'Gray LVP (Generated)',
      texture: grayTexture,
      roughness: 0.3,
      metalness: 0.1
    });

    this.materials.set('demo-laminate-01', {
      id: 'demo-laminate-01',
      name: 'Demo Laminate (Generated)',
      texture: demoTexture,
      roughness: 0.5,
      metalness: 0.0
    });
    
    console.log('✅ Fallback materials created');
  }

  /**
   * Get material by ID
   */
  getMaterial(id: string): FloorMaterial | undefined {
    return this.materials.get(id);
  }

  /**
   * Get all available materials
   */
  getAllMaterials(): FloorMaterial[] {
    return Array.from(this.materials.values());
  }

  /**
   * Create a 3D floor material with pattern
   */
  createFloorMaterial(
    materialId: string,
    pattern: 'random' | 'brick' | 'herringbone' | 'basket',
    rotation: number = 0,
    scale: number = 1.0,
    plankSize: { length: number, width: number } = { length: 1.0, width: 0.2 }
  ): THREE.Material {
    const baseMaterial = this.materials.get(materialId);
    if (!baseMaterial) {
      console.error(`❌ Material ${materialId} not found, using fallback`);
      // Create a fallback material if the requested one doesn't exist
      return this.createFallbackMaterial();
    }

    console.log(`🎨 Creating floor material for ${materialId} with pattern ${pattern}`);

    // Create a custom shader material for advanced patterns
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D baseTexture;
        uniform int pattern;
        uniform float rotation;
        uniform float scale;
        uniform vec2 plankSize;
        uniform float seed;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        const float PI = 3.14159265359;
        
        // Helper functions
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        
        vec2 rotate(vec2 p, float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
        }
        
        // Plank pattern generation
        vec2 getPlankUV(vec2 uv, int patternType) {
          vec2 plankUV = uv;
          
          if (patternType == 0) { // Random
            vec2 plankCoord = floor(uv / plankSize);
            float randomValue = hash(plankCoord + seed);
            plankUV = fract(uv / plankSize) + randomValue * 0.1;
          }
          else if (patternType == 1) { // Brick
            vec2 plankCoord = floor(uv / plankSize);
            vec2 localUV = fract(uv / plankSize);
            
            // Offset every other row
            if (mod(plankCoord.y, 2.0) > 0.5) {
              localUV.x += 0.5;
            }
            
            plankUV = localUV;
          }
          else if (patternType == 2) { // Herringbone
            vec2 plankCoord = floor(uv / plankSize);
            vec2 localUV = fract(uv / plankSize);
           
            // Herringbone pattern with alternating directions
            float row = plankCoord.y;
            float col = plankCoord.x;
           
            if (mod(row, 2.0) > 0.5) {
              // Offset and rotate for herringbone effect
              localUV.x += 0.5;
              localUV = rotate(localUV - 0.5, PI * 0.25) + 0.5;
            }
           
            plankUV = localUV;
          }
          else if (patternType == 3) { // Basket
            vec2 plankCoord = floor(uv / plankSize);
            vec2 localUV = fract(uv / plankSize);
           
            // Basket weave pattern
            float row = plankCoord.y;
            float col = plankCoord.x;
           
            if (mod(row, 2.0) > 0.5) {
              localUV.x += plankSize.x * 0.5;
            }
            if (mod(col, 2.0) > 0.5) {
              localUV.y += plankSize.y * 0.5;
            }
           
            plankUV = localUV;
          }
          
          return plankUV;
        }
        
        void main() {
          // Apply rotation and scale
          vec2 transformedUV = rotate(vUv - 0.5, rotation * PI / 180.0) + 0.5;
          transformedUV = (transformedUV - 0.5) * scale + 0.5;
          
          // Get plank UV coordinates
          vec2 plankUV = getPlankUV(transformedUV, pattern);
          
          // Sample base texture
          vec4 baseColor = texture2D(baseTexture, plankUV);
          
          // Add plank seams
          vec2 seamUV = fract(transformedUV / plankSize);
          float seamFactor = min(min(seamUV.x, 1.0 - seamUV.x), min(seamUV.y, 1.0 - seamUV.y));
          seamFactor = smoothstep(0.0, 0.05, seamFactor);
          
          // Darken seams slightly
          baseColor.rgb *= mix(0.8, 1.0, seamFactor);
          
          gl_FragColor = baseColor;
        }
      `,
      uniforms: {
        baseTexture: { value: baseMaterial.texture },
        pattern: { value: this.getPatternIndex(pattern) },
        rotation: { value: rotation },
        scale: { value: scale },
        plankSize: { value: new THREE.Vector2(plankSize.length, plankSize.width) },
        seed: { value: Math.random() }
      },
      transparent: false
    });

    // Ensure the material is properly configured
    material.needsUpdate = true;
    
    console.log(`✅ Floor material created successfully for ${materialId}`);
    
    return material;
  }

  /**
   * Create a fallback material if the requested one doesn't exist
   */
  private createFallbackMaterial(): THREE.Material {
    console.log('🔄 Creating fallback material');
    
    // Create a simple colored material as fallback
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513, // Brown color
      transparent: false
    });
    
    return material;
  }

  /**
   * Get pattern index for shader
   */
  private getPatternIndex(pattern: string): number {
    switch (pattern) {
      case 'random': return 0;
      case 'brick': return 1;
      case 'herringbone': return 2;
      case 'basket': return 3;
      default: return 0;
    }
  }

  /**
   * Update material uniforms
   */
  updateMaterialUniforms(
    material: THREE.ShaderMaterial,
    rotation: number,
    scale: number,
    plankSize: { length: number, width: number },
    seed: number
  ) {
    if (material.uniforms) {
      material.uniforms.rotation.value = rotation;
      material.uniforms.scale.value = scale;
      material.uniforms.plankSize.value.set(plankSize.length, plankSize.width);
      material.uniforms.seed.value = seed;
    }
  }
}
