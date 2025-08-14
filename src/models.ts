import { pipeline } from '@xenova/transformers';

// Types
export interface SegmentationResult {
  label: string;
  score: number;
  mask: ImageData;
}

export interface DepthResult {
  data: Float32Array;
  width: number;
  height: number;
}

export interface OcclusionMask {
  floorMask: Uint8Array;
  furnitureMask: Uint8Array;
  occluderMask: Uint8Array;
  depthPlane: Float32Array;
}

// Lazy-loaded ML Models (only load when needed)
let segmenterPromise: Promise<any> | null = null;
let depthEstPromise: Promise<any> | null = null;

export async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512');
  }
  return segmenterPromise;
}

export async function getDepthEst() {
  if (!depthEstPromise) {
    depthEstPromise = pipeline('depth-estimation', 'Xenova/midas-v2-small');
  }
  return depthEstPromise;
}

// Furniture classes that occlude the floor (from ADE20K dataset)
const FURNITURE_CLASSES = [
  'cabinet', 'table', 'chair', 'sofa', 'counter', 'appliance', 'bed', 'toilet',
  'sink', 'refrigerator', 'stove', 'microwave', 'dishwasher', 'washing machine',
  'dryer', 'tv', 'monitor', 'computer', 'lamp', 'light', 'curtain', 'blind',
  'plant', 'vase', 'book', 'magazine', 'newspaper', 'phone', 'remote', 'key',
  'wallet', 'bag', 'backpack', 'purse', 'shoe', 'boot', 'sneaker', 'sandal',
  'hat', 'cap', 'scarf', 'glove', 'sock', 'underwear', 'shirt', 'pants',
  'dress', 'skirt', 'jacket', 'coat', 'sweater', 'hoodie', 't-shirt', 'jeans',
  'shorts', 'tank top', 'blouse', 'cardigan', 'vest', 'tie', 'belt', 'watch',
  'ring', 'necklace', 'earring', 'bracelet', 'anklet', 'glasses', 'sunglasses',
  'contact lens', 'hearing aid', 'cane', 'walker', 'wheelchair', 'crutch',
  'pillow', 'blanket', 'sheet', 'comforter', 'duvet', 'mattress', 'box spring',
  'headboard', 'footboard', 'nightstand', 'dresser', 'wardrobe', 'closet',
  'mirror', 'picture', 'frame', 'painting', 'poster', 'calendar', 'clock',
  'alarm clock', 'radio', 'speaker', 'headphone', 'earphone', 'microphone',
  'camera', 'video camera', 'tripod', 'stand', 'mount', 'bracket', 'shelf',
  'rack', 'hook', 'hanger', 'rod', 'pole', 'pipe', 'tube', 'wire', 'cable',
  'plug', 'outlet', 'switch', 'button', 'knob', 'handle', 'lever', 'pedal',
  'footrest', 'armrest', 'backrest', 'seat', 'cushion', 'pad', 'mat', 'rug',
  'carpet', 'tile', 'wood', 'stone', 'metal', 'plastic', 'glass', 'ceramic',
  'fabric', 'leather', 'vinyl', 'linoleum', 'concrete', 'brick', 'marble',
  'granite', 'slate', 'limestone', 'sandstone', 'travertine', 'onyx', 'jade',
  'turquoise', 'coral', 'pearl', 'diamond', 'ruby', 'emerald', 'sapphire',
  'opal', 'amber', 'jet', 'coal', 'charcoal', 'ash', 'dust', 'dirt', 'mud',
  'sand', 'gravel', 'rock', 'boulder', 'cliff', 'mountain', 'hill', 'valley',
  'canyon', 'gorge', 'ravine', 'gully', 'ditch', 'trench', 'moat', 'pond',
  'lake', 'river', 'stream', 'creek', 'brook', 'spring', 'well', 'fountain',
  'waterfall', 'rapids', 'whirlpool', 'eddy', 'current', 'wave', 'tide',
  'surf', 'spray', 'mist', 'fog', 'cloud', 'rain', 'snow', 'sleet', 'hail',
  'ice', 'frost', 'dew', 'steam', 'smoke', 'fire', 'flame', 'spark', 'ember',
  'coal', 'charcoal', 'wood', 'paper', 'cardboard', 'fabric', 'plastic',
  'rubber', 'leather', 'metal', 'glass', 'ceramic', 'stone', 'concrete'
];

// Floor classes from ADE20K
const FLOOR_CLASSES = [
  'floor', 'ground', 'pavement', 'road', 'street', 'sidewalk', 'path',
  'trail', 'track', 'lane', 'driveway', 'parking lot', 'playground',
  'field', 'meadow', 'grass', 'lawn', 'turf', 'soil', 'earth', 'dirt',
  'sand', 'gravel', 'stone', 'rock', 'concrete', 'asphalt', 'tile',
  'wood', 'carpet', 'rug', 'mat', 'linoleum', 'vinyl', 'marble',
  'granite', 'slate', 'limestone', 'sandstone', 'travertine'
];

// Advanced floor and furniture detection with occlusion handling
export function createOcclusionMask(
  segmentation: any[],
  depth: any,
  width: number,
  height: number
): OcclusionMask {
  // Extract depth data
  let depthData: Float32Array;
  if (Array.isArray(depth)) {
    depthData = depth[0].data;
  } else {
    depthData = depth.data;
  }

  // Create masks
  const floorMask = new Uint8Array(width * height);
  const furnitureMask = new Uint8Array(width * height);
  const occluderMask = new Uint8Array(width * height);

  // Process segmentation results
  for (const seg of segmentation) {
    const label = seg.label.toLowerCase();
    const mask = seg.mask;
    
    if (FLOOR_CLASSES.some(floorClass => label.includes(floorClass))) {
      // Floor class - add to floor mask
      for (let i = 0; i < mask.data.length; i += 4) {
        if (mask.data[i] > 128) {
          floorMask[i / 4] = 255;
        }
      }
    } else if (FURNITURE_CLASSES.some(furnitureClass => label.includes(furnitureClass))) {
      // Furniture class - add to furniture mask
      for (let i = 0; i < mask.data.length; i += 4) {
        if (mask.data[i] > 128) {
          furnitureMask[i / 4] = 255;
        }
      }
    }
  }

  // Post-process floor mask
  const processedFloorMask = postProcessMask(floorMask, width, height);
  
  // Estimate floor plane from depth data
  const depthPlane = estimateFloorPlaneFromDepth(depthData, processedFloorMask, width, height);
  
  // Create occluder mask using depth testing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (processedFloorMask[idx] === 255) {
        // This is a floor pixel
        const pixelDepth = depthData[idx];
        const expectedFloorDepth = getPlaneDepth(depthPlane, x, y);
        
        // Check if something is closer than the floor (occluding it)
        if (pixelDepth < expectedFloorDepth - 0.1) { // 0.1 threshold
          occluderMask[idx] = 255;
        }
      }
      
      // Also include furniture in occluder mask
      if (furnitureMask[idx] === 255) {
        occluderMask[idx] = 255;
      }
    }
  }

  // Refine occluder mask with morphological operations
  const refinedOccluderMask = refineOccluderMask(occluderMask, width, height);

  return {
    floorMask: processedFloorMask,
    furnitureMask,
    occluderMask: refinedOccluderMask,
    depthPlane
  };
}

// Floor mask processing
export function toFloorMask(segmentation: any[], width: number, height: number): Uint8Array {
  // Find the "floor" class from ADE20K dataset
  const floorClass = segmentation.find(seg =>
    FLOOR_CLASSES.some(floorClass => 
      seg.label.toLowerCase().includes(floorClass)
    )
  );

  if (!floorClass) {
    // Default to bottom 60% of image if no floor detected
    const mask = new Uint8Array(width * height);
    const floorY = Math.floor(height * 0.4);
    for (let y = floorY; y < height; y++) {
      for (let x = 0; x < width; x++) {
        mask[y * width + x] = 255;
      }
    }
    return mask;
  }

  // Convert mask to binary
  const mask = new Uint8Array(width * height);
  const imageData = floorClass.mask;

  for (let i = 0; i < imageData.data.length; i += 4) {
    // Use red channel as mask (assuming grayscale mask)
    mask[i / 4] = imageData.data[i] > 128 ? 255 : 0;
  }

  // Post-process: opening/closing + largest connected component
  return postProcessMask(mask, width, height);
}

function postProcessMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  // Simple morphological operations
  const processed = new Uint8Array(mask);

  // Erosion (opening)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (mask[idx] === 255) {
        // Check 3x3 neighborhood
        let hasNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (mask[(y + dy) * width + (x + dx)] === 255) {
              hasNeighbor = true;
              break;
            }
          }
        }
        if (!hasNeighbor) processed[idx] = 0;
      }
    }
  }

  // Find largest connected component
  const visited = new Set<number>();
  let largestComponent: number[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (processed[idx] === 255 && !visited.has(idx)) {
        const component = floodFill(processed, width, height, x, y, visited);
        if (component.length > largestComponent.length) {
          largestComponent = component;
        }
      }
    }
  }

  // Keep only the largest component
  const result = new Uint8Array(width * height);
  largestComponent.forEach(idx => result[idx] = 255);

  return result;
}

function floodFill(mask: Uint8Array, width: number, height: number, startX: number, startY: number, visited: Set<number>): number[] {
  const stack: [number, number][] = [[startX, startY]];
  const component: number[] = [];

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const idx = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx) || mask[idx] !== 255) {
      continue;
    }

    visited.add(idx);
    component.push(idx);

    // Add neighbors
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return component;
}

// Estimate floor plane from depth data using RANSAC
function estimateFloorPlaneFromDepth(
  depthData: Float32Array,
  floorMask: Uint8Array,
  width: number,
  height: number
): Float32Array {
  const points: [number, number, number][] = [];

  // Collect depth points from floor mask
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (floorMask[idx] === 255) {
        const depthValue = depthData[idx];
        if (depthValue > 0) {
          points.push([x, y, depthValue]);
        }
      }
    }
  }

  // Use RANSAC to fit plane
  return fitPlaneRANSAC(points);
}

// Get expected depth at a point from the plane equation
function getPlaneDepth(plane: Float32Array, x: number, y: number): number {
  // Plane equation: ax + by + cz + d = 0
  // So z = -(ax + by + d) / c
  const [a, b, c, d] = plane;
  return -(a * x + b * y + d) / c;
}

// Refine occluder mask with morphological operations
function refineOccluderMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const refined = new Uint8Array(mask);
  
  // Small dilation to hide seams
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (mask[idx] === 255) {
        // Dilate by setting neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = (y + dy) * width + (x + dx);
            if (neighborIdx >= 0 && neighborIdx < mask.length) {
              refined[neighborIdx] = 255;
            }
          }
        }
      }
    }
  }
  
  return refined;
}

// Homography estimation from depth plane
export function estimateHomographyFromDepthPlane(
  depth: any,
  floorMask: Uint8Array,
  width: number,
  height: number
): Float32Array {
  // Use RANSAC to fit a plane to the depth data within the floor mask
  const points: [number, number, number][] = [];

  // Extract depth data from the pipeline output
  let depthData: Float32Array;
  if (Array.isArray(depth)) {
    depthData = depth[0].data;
  } else {
    depthData = depth.data;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (floorMask[idx] === 255) {
        const depthValue = depthData[idx];
        if (depthValue > 0) {
          points.push([x, y, depthValue]);
        }
      }
    }
  }

  // Simple plane fitting (for now, use a basic approach)
  // In a real implementation, you'd use RANSAC for robust plane fitting
  fitPlaneRANSAC(points);

  // Create homography matrix (simplified - in reality this would be more complex)
  // For now, return identity matrix as placeholder
  return new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ]);
}

function fitPlaneRANSAC(points: [number, number, number][], iterations: number = 1000): Float32Array {
  if (points.length < 3) {
    return new Float32Array([0, 0, 1, 0]); // Default plane
  }

  let bestPlane: Float32Array = new Float32Array([0, 0, 1, 0]);
  let bestInliers = 0;

  for (let i = 0; i < iterations; i++) {
    // Randomly sample 3 points
    const sample = [];
    for (let j = 0; j < 3; j++) {
      sample.push(points[Math.floor(Math.random() * points.length)]);
    }

    // Fit plane through these points
    const plane = fitPlaneThroughPoints(sample);

    // Count inliers
    let inliers = 0;
    for (const point of points) {
      const distance = Math.abs(
        plane[0] * point[0] + plane[1] * point[1] + plane[2] * point[2] + plane[3]
      ) / Math.sqrt(plane[0] * plane[0] + plane[1] * plane[1] + plane[2] * plane[2]);

      if (distance < 0.1) { // Threshold for inlier
        inliers++;
      }
    }

    if (inliers > bestInliers) {
      bestInliers = inliers;
      bestPlane = plane;
    }
  }

  return bestPlane;
}

function fitPlaneThroughPoints(points: [number, number, number][]): Float32Array {
  if (points.length < 3) {
    return new Float32Array([0, 0, 1, 0]);
  }

  // Use cross product to find normal vector
  const p1 = points[0];
  const p2 = points[1];
  const p3 = points[2];

  const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
  const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

  const normal = [
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  ];

  // Normalize
  const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
  normal[0] /= length;
  normal[1] /= length;
  normal[2] /= length;

  // Calculate d
  const d = -(normal[0] * p1[0] + normal[1] * p1[1] + normal[2] * p1[2]);

  return new Float32Array([normal[0], normal[1], normal[2], d]);
}
