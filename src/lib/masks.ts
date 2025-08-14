// lib/masks.ts - Clean mask processing without AI dependencies

export async function buildMasksFromSegmentation(segJson: any[], width: number, height: number) {
  // Floor labels in ADE20K dataset
  const floorLabels = ['floor', 'ground', 'pavement', 'road', 'flooring', 'wood floor', 'tile'];
  
  // Furniture/occluder labels
  const furnitureLabels = ['cabinet', 'table', 'chair', 'sofa', 'bed', 'appliance', 'toilet', 'sink', 'counter', 'desk', 'nightstand'];
  
  // Initialize masks
  const floorMask = new Float32Array(width * height);
  const furnitureMask = new Float32Array(width * height);
  
  // Process segmentation results
  for (const segment of segJson) {
    const isFloor = floorLabels.some(label => 
      segment.label.toLowerCase().includes(label)
    );
    const isFurniture = furnitureLabels.some(label => 
      segment.label.toLowerCase().includes(label)
    );
    
    if (isFloor || isFurniture) {
      // Decode base64 PNG mask
      const mask = await decodeBase64PngToMask(segment.mask, width, height);
      
      if (isFloor) {
        // Union floor masks
        for (let i = 0; i < mask.length; i++) {
          floorMask[i] = Math.max(floorMask[i], mask[i]);
        }
      }
      
      if (isFurniture) {
        // Union furniture masks
        for (let i = 0; i < mask.length; i++) {
          furnitureMask[i] = Math.max(furnitureMask[i], mask[i]);
        }
      }
    }
  }
  
  // Post-process masks
  const processedFloorMask = largestComponent(floorMask, width, height);
  const processedFurnitureMask = dilateErode(furnitureMask, width, height, 2);
  
  return {
    floorMask: processedFloorMask,
    furnitureMask: processedFurnitureMask,
    W: width,
    H: height
  };
}

async function decodeBase64PngToMask(base64: string, width: number, height: number): Promise<Float32Array> {
  // Convert base64 to blob
  const response = await fetch(`data:image/png;base64,${base64}`);
  const blob = await response.blob();
  
  // Create canvas to decode PNG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  
  // Create image from blob
  const img = await createImageBitmap(blob);
  ctx.drawImage(img, 0, 0);
  
  // Get image data and convert to mask
  const imageData = ctx.getImageData(0, 0, width, height);
  const mask = new Float32Array(width * height);
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const pixelIndex = i / 4;
    const alpha = imageData.data[i + 3];
    mask[pixelIndex] = alpha > 128 ? 1.0 : 0.0;
  }
  
  return mask;
}

function largestComponent(mask: Float32Array, width: number, height: number): Float32Array {
  // Simple flood fill to find largest connected component
  const visited = new Set<number>();
  const components: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] > 0.5 && !visited.has(idx)) {
        const component: number[] = [];
        floodFill(x, y, mask, width, height, visited, component);
        components.push(component);
      }
    }
  }
  
  // Find largest component
  const largestComponent = components.reduce((largest, current) => 
    current.length > largest.length ? current : largest, components[0] || []
  );
  
  // Create new mask with only largest component
  const result = new Float32Array(width * height);
  for (const idx of largestComponent) {
    result[idx] = 1.0;
  }
  
  return result;
}

function floodFill(x: number, y: number, mask: Float32Array, width: number, height: number, visited: Set<number>, component: number[]) {
  const idx = y * width + x;
  if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx) || mask[idx] <= 0.5) {
    return;
  }
  
  visited.add(idx);
  component.push(idx);
  
  // 4-connected flood fill
  floodFill(x + 1, y, mask, width, height, visited, component);
  floodFill(x - 1, y, mask, width, height, visited, component);
  floodFill(x, y + 1, mask, width, height, visited, component);
  floodFill(x, y - 1, mask, width, height, visited, component);
}

function dilateErode(mask: Float32Array, width: number, height: number, radius: number): Float32Array {
  // Simple morphological operations
  const dilated = new Float32Array(mask);
  const eroded = new Float32Array(mask);
  
  // Dilate
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] > 0.5) {
        // Set neighbors
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              dilated[ny * width + nx] = 1.0;
            }
          }
        }
      }
    }
  }
  
  // Erode
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (dilated[idx] > 0.5) {
        // Check if all neighbors are set
        let allNeighbors = true;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (dilated[ny * width + nx] <= 0.5) {
                allNeighbors = false;
                break;
              }
            }
          }
          if (!allNeighbors) break;
        }
        if (!allNeighbors) {
          eroded[idx] = 0.0;
        }
      }
    }
  }
  
  return eroded;
}
