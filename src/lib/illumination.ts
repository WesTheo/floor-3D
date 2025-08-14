/**
 * Illumination map creation for preserving room lighting
 * Converts photo to luminance and blurs it to create lighting map
 */

/**
 * Create illumination map from photo
 * Converts to luminance, blurs, and normalizes to 0.8-1.2 range
 */
export function createIlluminationMap(
  photo: HTMLImageElement,
  floorMask: Float32Array,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  
  // Draw photo to canvas
  ctx.drawImage(photo, 0, 0, width, height);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to luminance and apply floor mask
  const luminance = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const pixelIndex = i * 4;
    const r = data[pixelIndex];
    const g = data[pixelIndex + 1];
    const b = data[pixelIndex + 2];
    
    // Convert to luminance (standard formula)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply floor mask (only process floor areas)
    const maskValue = floorMask[i] || 0;
    luminance[i] = lum * maskValue;
  }
  
  // Create blurred illumination map
  const blurredLum = blurLuminance(luminance, width, height, 40);
  
  // Normalize to 0.8-1.2 range
  const normalizedLum = normalizeLuminance(blurredLum);
  
  // Convert back to canvas
  const illumCanvas = document.createElement('canvas');
  const illumCtx = illumCanvas.getContext('2d')!;
  illumCanvas.width = width;
  illumCanvas.height = height;
  
  const illumImageData = illumCtx.createImageData(width, height);
  const illumData = illumImageData.data;
  
  for (let i = 0; i < width * height; i++) {
    const pixelIndex = i * 4;
    const lumValue = Math.round(normalizedLum[i] * 255);
    
    illumData[pixelIndex] = lumValue;     // R
    illumData[pixelIndex + 1] = lumValue; // G
    illumData[pixelIndex + 2] = lumValue; // B
    illumData[pixelIndex + 3] = 255;      // A
  }
  
  illumCtx.putImageData(illumImageData, 0, 0);
  return illumCanvas;
}

/**
 * Simple box blur for luminance data
 */
function blurLuminance(
  luminance: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  const result = new Float32Array(luminance.length);
  
  // Horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < width) {
          sum += luminance[y * width + nx];
          count++;
        }
      }
      
      result[y * width + x] = sum / count;
    }
  }
  
  // Vertical blur
  const temp = new Float32Array(result);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < height) {
          sum += temp[ny * width + x];
          count++;
        }
      }
      
      result[y * width + x] = sum / count;
    }
  }
  
  return result;
}

/**
 * Normalize luminance to 0.8-1.2 range
 */
function normalizeLuminance(luminance: Float32Array): Float32Array {
  const min = Math.min(...luminance);
  const max = Math.max(...luminance);
  const range = max - min;
  
  if (range === 0) {
    return new Float32Array(luminance.length).fill(1.0);
  }
  
  const normalized = new Float32Array(luminance.length);
  for (let i = 0; i < luminance.length; i++) {
    // Normalize to 0-1, then scale to 0.8-1.2
    const normalizedValue = (luminance[i] - min) / range;
    normalized[i] = 0.8 + (normalizedValue * 0.4);
  }
  
  return normalized;
}

/**
 * Create a simple test illumination map for development
 */
export function createTestIlluminationMap(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  
  // Create a simple vignette effect
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const normalizedDist = dist / maxDist;
      
      // Create vignette: bright in center, darker at edges
      const intensity = Math.max(0.8, 1.0 - normalizedDist * 0.3);
      const value = Math.round(intensity * 255);
      
      const pixelIndex = (y * width + x) * 4;
      data[pixelIndex] = value;     // R
      data[pixelIndex + 1] = value; // G
      data[pixelIndex + 2] = value; // B
      data[pixelIndex + 3] = 255;   // A
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
