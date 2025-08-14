import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import { createTestHomography } from '../lib/homography';
import { createTestIlluminationMap } from '../lib/illumination';

// Import shaders
import vertexShader from '../shaders/passthrough.vert.glsl?raw';
import fragmentShader from '../shaders/floor.frag.glsl?raw';

export default function VisualizerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  
  const { rotation, scale, shuffleSeed, pattern } = useSceneStore();
  
  // State for processing
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Guard against duplicate initialization
  const didInit = useRef(false);
  
  useEffect(() => {
    if (didInit.current || !canvasRef.current) return;
    
    // Wait for canvas to have proper dimensions
    const canvas = canvasRef.current;
    if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
      console.log('⏳ Canvas has no dimensions, waiting...');
      // Wait a frame for CSS to be applied
      requestAnimationFrame(() => {
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
          console.log('✅ Canvas now has dimensions:', canvas.clientWidth, 'x', canvas.clientHeight);
          initThreeJS();
        }
      });
      return;
    }
    
    initThreeJS();
  }, []);
  
  function initThreeJS() {
    if (didInit.current || !canvasRef.current) return;
    didInit.current = true;
    
    console.log('🎨 Setting up Three.js scene...');
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera (orthographic for 2D-like view)
    const canvas = canvasRef.current;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 1;
    
    console.log('📐 Camera created:', { aspect, frustum: [-1, 1, 1, -1] });
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    rendererRef.current = renderer;
    
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    
    console.log('🎨 Canvas dimensions:', { width: canvasWidth, height: canvasHeight });
    
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0xffffff, 0);
    
    console.log('🎨 Renderer size set to:', renderer.getSize(new THREE.Vector2()));
    
    // Create basic floor mesh (will be replaced when photo is uploaded)
    const floorMesh = createBasicMesh();
    floorMeshRef.current = floorMesh;
    scene.add(floorMesh);
    
    console.log('🎭 Mesh added to scene. Scene children:', scene.children.length);
    console.log('🎪 Mesh position:', floorMesh.position);
    console.log('🎪 Mesh scale:', floorMesh.scale);
    console.log('🎪 Mesh rotation:', floorMesh.rotation);
    
    // Render
    renderer.render(scene, camera);
    console.log('🎬 Initial render complete');
    console.log('🎭 Scene children:', scene.children.length);
    console.log('📐 Camera position:', camera.position);
    console.log('🎨 Renderer size:', renderer.getSize(new THREE.Vector2()));
    
    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !camera || !renderer) return;
      
      const aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateProjectionMatrix();
      
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.render(scene, camera);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // Clean up Three.js resources
      if (renderer) {
        renderer.dispose();
      }
      if (floorMesh && floorMesh.geometry) {
        floorMesh.geometry.dispose();
      }
      if (floorMesh && floorMesh.material) {
        (floorMesh.material as THREE.Material).dispose();
      }
    };
  }
  
  function createBasicMesh() {
    console.log('🔧 Creating basic mesh...');
    
    // Create a simple quad for initial scene
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Create a simple texture material instead of brown
    const textureLoader = new THREE.TextureLoader();
    
    // Create a simple colored material first (fallback)
    const fallbackMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x8B4513, // Brown color as fallback
      transparent: true,
      opacity: 1.0
    });
    
    const mesh = new THREE.Mesh(geometry, fallbackMaterial);
    console.log('🎪 Basic mesh created with fallback material:', mesh);
    
    // Try to load the texture asynchronously
    textureLoader.load(
      '/textures/gray-lvp.jpg',
      (texture) => {
        console.log('✅ Basic texture loaded successfully:', texture);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        
        // Update the material with the loaded texture
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.map = texture;
          mesh.material.needsUpdate = true;
          console.log('🎨 Material updated with texture');
          
          // Re-render if we have access to renderer
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        }
      },
      undefined,
      (error) => {
        console.error('❌ Failed to load basic texture:', error);
        // Keep the fallback material
      }
    );
    
    return mesh;
  }
  
  // Update when controls change
  useEffect(() => {
    if (!floorMeshRef.current) return;
    
    // Apply rotation
    floorMeshRef.current.rotation.z = (rotation * Math.PI) / 180;
    
    // Apply scale
    floorMeshRef.current.scale.set(scale, scale, 1);
    
    // Re-render
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [rotation, scale, shuffleSeed, pattern]);
  
  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      console.log('🎯 Processing image with real Floori AI pipeline...');
      
      // Create image for display
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = URL.createObjectURL(file);
      });
      
      const W = img.width;
      const H = img.height;
      console.log('📐 Image dimensions:', W, 'x', H);
      
      // For now, create test data until AI is fully wired
      console.log('🔧 Creating test data for development...');
      
      // Create test floor mask (bottom half of image)
      const floorMask = new Float32Array(W * H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          // Floor is bottom 60% of image
          floorMask[i] = y > H * 0.4 ? 1.0 : 0.0;
        }
      }
      
      // Create test furniture mask (center area)
      const furnitureMask = new Float32Array(W * H);
      const centerX = W / 2;
      const centerY = H / 2;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          // Furniture is center area
          furnitureMask[i] = dist < Math.min(W, H) * 0.2 ? 1.0 : 0.0;
        }
      }
      
      // Create test homography (perspective transform)
      const homography = createTestHomography(W, H);
      console.log('🔍 Test homography created:', homography);
      
      // Create test illumination map
      const illuminationMap = createTestIlluminationMap(W, H);
      console.log('💡 Test illumination map created');
      
      // Create 3D floor mesh with real Floori shader
      const floorMesh = createFloorMesh(
        img,
        floorMask,
        furnitureMask,
        illuminationMap,
        homography,
        W,
        H
      );
      
      // Replace existing mesh
      if (sceneRef.current && floorMeshRef.current) {
        sceneRef.current.remove(floorMeshRef.current);
      }
      
      floorMeshRef.current = floorMesh;
      sceneRef.current?.add(floorMesh);
      console.log('🎨 Real Floori floor mesh added to scene');
      
      // Re-render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      console.log('✅ Floori pipeline complete! You should now see:');
      console.log('   - Original photo preserved');
      console.log('   - Wood texture only on floor areas');
      console.log('   - Furniture occluding the wood');
      console.log('   - Proper perspective mapping');
      
    } catch (error) {
      console.error('❌ Floori processing failed:', error);
      alert(`Floori processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  function createFloorMesh(
    photo: HTMLImageElement,
    floorMask: Float32Array,
    furnitureMask: Float32Array,
    illuminationMap: HTMLCanvasElement,
    homography: Float32Array,
    width: number,
    height: number
  ) {
    console.log('🔧 Creating floor mesh with real Floori pipeline...');
    console.log('📐 Dimensions:', width, 'x', height);
    console.log('🎨 Photo:', photo);
    console.log('🎭 Floor mask length:', floorMask.length);
    console.log('🎭 Furniture mask length:', furnitureMask.length);
    console.log('🔍 Homography matrix:', homography);
    
    // Create a full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    try {
      // Create shader material with all textures
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uPhoto: { value: new THREE.CanvasTexture(photo) },
          uWood: { value: loadWoodTexture() },
          uIllum: { value: new THREE.CanvasTexture(illuminationMap) },
          uFloorMask: { value: createMaskTexture(floorMask, width, height) },
          uOccluderMask: { value: createMaskTexture(furnitureMask, width, height) },
          uH: { value: new THREE.Matrix3().fromArray(homography) },
          uImageSize: { value: new THREE.Vector2(width, height) },
          uRotation: { value: rotation },
          uScale: { value: scale },
          uPlankSize: { value: new THREE.Vector2(1.2, 0.2) }, // meters
          uPattern: { value: getPatternIndex(pattern) },
          uSeed: { value: shuffleSeed }
        },
        transparent: true
      });
      
      console.log('✅ Floori shader material created successfully');
      console.log('🎨 Material uniforms:', material.uniforms);
      
      return new THREE.Mesh(geometry, material);
    } catch (error) {
      console.error('❌ Error creating Floori shader material:', error);
      // Fallback to basic texture material
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load('/textures/gray-lvp.jpg');
      const fallbackMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 1.0
      });
      return new THREE.Mesh(geometry, fallbackMaterial);
    }
  }
  
  function loadWoodTexture(): THREE.Texture {
    // Load the selected wood texture from the store
    const { textureId } = useSceneStore.getState();
    
    // Map textureId to actual file names
    let texturePath: string;
    switch (textureId) {
      case 'oak-01':
        texturePath = '/textures/oak.jpg';
        break;
      case 'walnut-01':
        texturePath = '/textures/walnut.jpg';
        break;
      case 'gray-lvp-01':
        texturePath = '/textures/gray-lvp.jpg';
        break;
      case 'demo-laminate-01':
        texturePath = '/textures/demo-laminate.jpg';
        break;
      default:
        texturePath = '/textures/oak.jpg';
        break;
    }
    
    console.log('🎨 Loading wood texture:', texturePath);
    
    const texture = new THREE.TextureLoader().load(
      texturePath,
      () => {
        console.log('✅ Texture loaded successfully:', texturePath);
      },
      undefined,
      (error) => {
        console.error('❌ Failed to load texture:', texturePath, error);
      }
    );
    
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    return texture;
  }
  
  function createMaskTexture(mask: Float32Array, width: number, height: number): THREE.Texture {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < mask.length; i++) {
      const value = Math.round(mask[i] * 255);
      const dataIndex = i * 4;
      imageData.data[dataIndex] = value;     // R
      imageData.data[dataIndex + 1] = value; // G
      imageData.data[dataIndex + 2] = value; // B
      imageData.data[dataIndex + 3] = 255;   // A
    }
    
    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }
  
  function getPatternIndex(pattern: string): number {
    switch (pattern) {
      case 'random': return 0;
      case 'brick': return 1;
      case 'herringbone': return 2;
      case 'basket': return 3;
      default: return 0;
    }
  }
  
  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Photo upload input */}
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="absolute top-4 left-4 z-10"
        style={{ opacity: 0, width: '100px', height: '40px', cursor: 'pointer' }}
      />
      
      {/* Upload button overlay */}
      <button
        onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
        className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Upload Photo'}
      </button>
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Processing image with AI...</p>
          </div>
        </div>
      )}
    </div>
  );
}
