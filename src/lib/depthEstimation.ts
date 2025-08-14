// Floori-style depth estimation using computer vision
// No AI required - uses traditional CV algorithms
// import * as THREE from 'three';

export interface DepthMap {
  depth: Float32Array;
  width: number;
  height: number;
}

export async function createDepthMap(image: HTMLImageElement): Promise<DepthMap> {
  // Floori-style depth estimation using computer vision
  // This creates a depth map from image features and perspective cues
  
  const width = image.width;
  const height = image.height;
  
  // Create canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  
  // Get image data for analysis
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create depth map array
  const depthMap = new Float32Array(width * height);
  
  // Simple depth estimation based on image position and color
  // Floori uses more sophisticated computer vision techniques
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;
      
      // Get pixel color
      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      
      // Simple depth heuristic: bottom of image = closer, top = farther
      // This creates a basic perspective effect
      const normalizedY = y / height;
      const baseDepth = 2.0 + normalizedY * 8.0; // 2-10 meters range
      
      // Adjust depth based on brightness (darker areas might be closer)
      const brightnessFactor = 1.0 + (brightness - 128) / 256 * 0.5;
      
      depthMap[idx] = baseDepth * brightnessFactor;
    }
  }
  
  return {
    depth: depthMap,
    width,
    height
  };
}

export function createIlluminationMap(depthMap: DepthMap): HTMLCanvasElement {
  // Create illumination map from depth information
  // This preserves lighting and shadows like Floori does
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = depthMap.width;
  canvas.height = depthMap.height;
  
  const imageData = ctx.createImageData(depthMap.width, depthMap.height);
  
  for (let i = 0; i < depthMap.depth.length; i++) {
    const depth = depthMap.depth[i];
    const dataIndex = i * 4;
    
    // Create illumination based on depth
    // Closer objects are brighter, farther objects are darker
    const illumination = Math.max(0.3, Math.min(1.0, 1.0 - (depth - 2.0) / 8.0));
    const value = Math.round(illumination * 255);
    
    imageData.data[dataIndex] = value;     // R
    imageData.data[dataIndex + 1] = value; // G
    imageData.data[dataIndex + 2] = value; // B
    imageData.data[dataIndex + 3] = 255;   // A
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function createFurnitureMask(depthMap: DepthMap, threshold: number = 0.3): Float32Array {
  // Create furniture mask based on depth discontinuities
  // This identifies objects that are not part of the floor
  
  const mask = new Float32Array(depthMap.depth.length);
  
  for (let y = 1; y < depthMap.height - 1; y++) {
    for (let x = 1; x < depthMap.width - 1; x++) {
      const idx = y * depthMap.width + x;
      const currentDepth = depthMap.depth[idx];
      
      // Check depth differences with neighbors
      const leftDepth = depthMap.depth[idx - 1];
      const rightDepth = depthMap.depth[idx + 1];
      const topDepth = depthMap.depth[idx - depthMap.width];
      const bottomDepth = depthMap.depth[idx + depthMap.width];
      
      // Calculate depth gradients
      const gradX = Math.abs(rightDepth - leftDepth);
      const gradY = Math.abs(bottomDepth - topDepth);
      const maxGradient = Math.max(gradX, gradY);
      
      // If depth changes significantly, it's likely furniture
      if (maxGradient > threshold) {
        mask[idx] = 1.0;
      } else {
        mask[idx] = 0.0;
      }
    }
  }
  
  return mask;
}
