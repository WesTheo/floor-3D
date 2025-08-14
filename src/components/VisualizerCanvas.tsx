import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import { buildMasksFromSegmentation } from '../lib/masks';

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
  const [currentPhoto, setCurrentPhoto] = useState<HTMLImageElement | null>(null);
  
  // Guard against duplicate initialization
  const didInit = useRef(false);
  
  useEffect(() => {
    if (didInit.current || !canvasRef.current) return;
    didInit.current = true;
    
    console.log('🎨 Setting up Three.js scene...');
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera (orthographic for 2D-like view)
    const aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 1;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setClearColor(0xffffff, 0);
    
    // Create basic floor mesh (will be replaced when photo is uploaded)
    const floorMesh = createBasicMesh();
    floorMeshRef.current = floorMesh;
    scene.add(floorMesh);
    
    // Render
    renderer.render(scene, camera);
    
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
  }, []);
  
  function createBasicMesh() {
    // Create a simple quad for initial scene
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x8B4513, // Brown color for now
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Mesh(geometry, material);
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
      console.log('🎯 Processing image with basic texture rendering...');
      
      // Create image for display
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = URL.createObjectURL(file);
      });
      setCurrentPhoto(img);
      
      // For now, create basic masks (no AI yet)
      const W = img.width;
      const H = img.height;
      
      // Temporary masks: 1 for floor, 0 for occluders
      const fullMask = new Float32Array(W * H).fill(1.0);
      const emptyMask = new Float32Array(W * H).fill(0.0);
      
      // Create photo texture
      const photoTex = new THREE.TextureLoader().load(URL.createObjectURL(file));
      photoTex.colorSpace = THREE.SRGBColorSpace;
      
      // Create basic homography (identity matrix for now)
      const basicHomography = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
      
      // Create basic illumination map
      const illuminationMap = createBasicIlluminationMap(W, H);
      
      // Create 3D floor mesh with shader
      const floorMesh = createFloorMesh(
        img,
        fullMask,
        emptyMask,
        illuminationMap,
        basicHomography,
        W,
        H
      );
      
      // Replace existing mesh
      if (sceneRef.current && floorMeshRef.current) {
        sceneRef.current.remove(floorMeshRef.current);
      }
      
      floorMeshRef.current = floorMesh;
      sceneRef.current?.add(floorMesh);
      console.log('🎨 Floor mesh added to scene');
      
      // Re-render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
    } catch (error) {
      console.error('❌ Processing failed:', error);
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
    // Create a simple quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Create shader material with all textures
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPhoto: { value: new THREE.CanvasTexture(photo) },
        uWood: { value: loadWoodTexture() }, // Load selected wood texture
        uIllum: { value: new THREE.CanvasTexture(illuminationMap) },
        uFloorMask: { value: createMaskTexture(floorMask, width, height) },
        uOccluderMask: { value: createMaskTexture(furnitureMask, width, height) },
        uH: { value: new THREE.Matrix3().fromArray(homography) },
        uImageSize: { value: new THREE.Vector2(width, height) },
        uRotation: { value: rotation },
        uScale: { value: scale },
        uPlankSize: { value: new THREE.Vector2(1.2, 0.2) }, // meters, just a feel value
        uPattern: { value: getPatternIndex(pattern) },
        uSeed: { value: shuffleSeed }
      },
      transparent: true
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  function loadWoodTexture(): THREE.Texture {
    // Load the selected wood texture from the store
    const { textureId } = useSceneStore.getState();
    const texturePath = `/textures/${textureId}.jpg`;
    
    const texture = new THREE.TextureLoader().load(texturePath);
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
  
  // Helper functions (simplified for now)
  async function decodeDepthPNGToFloat32(pngBuffer: ArrayBuffer, width: number, height: number): Promise<Float32Array> {
    // Placeholder - decode PNG depth to Float32Array
    // In real implementation, decode the depth PNG properly
    return new Float32Array(width * height).fill(0.5);
  }
  
  function fitFloorPlane(depth: Float32Array, floorMask: Float32Array, width: number, height: number) {
    // Placeholder - fit plane to depth data
    // In real implementation, use RANSAC to fit floor plane
    return { normal: [0, 0, 1], d: 0 };
  }
  
  function computeHomographies(plane: any, width: number, height: number) {
    // Placeholder - compute homography matrices
    // In real implementation, compute proper homography from plane
    return {
      H_img2uv: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
      H_uv2img: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
    };
  }
  
  function makeIlluminationMap(image: HTMLImageElement, floorMask: Float32Array, width: number, height: number): HTMLCanvasElement {
    // Placeholder - create illumination map
    // In real implementation, compute luminance and blur
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = 'rgb(128, 128, 128)';
    ctx.fillRect(0, 0, width, height);
    return canvas;
  }

  function createBasicIlluminationMap(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = 'rgb(128, 128, 128)';
    ctx.fillRect(0, 0, width, height);
    return canvas;
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
