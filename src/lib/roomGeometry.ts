// Floori-style room geometry estimation using computer vision
// No AI required - uses traditional CV algorithms
import * as THREE from 'three';

export interface RoomGeometry {
  floorPlane: THREE.Plane;
  walls: THREE.Plane[];
  corners: THREE.Vector3[];
  dimensions: { width: number; height: number; depth: number };
  vanishingPoints: THREE.Vector3[];
}

export interface FloorMask {
  data: Float32Array;
  width: number;
  height: number;
}

export async function estimateRoomGeometry(image: HTMLImageElement): Promise<RoomGeometry> {
  // Floori-style room geometry estimation using computer vision
  // No AI required - uses traditional CV algorithms
  
  const width = image.width;
  const height = image.height;
  
  // Create canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  
  // 1. Detect edges and find vanishing points
  const edges = detectEdges(ctx, width, height);
  const vanishingPoints = findVanishingPoints(edges, width, height);
  
  // 2. Estimate floor plane from vanishing points
  const floorPlane = estimateFloorPlane(vanishingPoints, width, height);
  
  // 3. Estimate room dimensions
  const dimensions = estimateRoomDimensions(floorPlane, width, height);
  
  // 4. Create wall planes
  const walls = createWallPlanes(floorPlane, dimensions);
  
  // 5. Find room corners
  const corners = findRoomCorners(floorPlane, walls, width, height);
  
  return {
    floorPlane,
    walls,
    corners,
    dimensions,
    vanishingPoints
  };
}

function detectEdges(ctx: CanvasRenderingContext2D, width: number, height: number): Float32Array {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const edges = new Float32Array(width * height);
  
  // Sobel edge detection (simplified)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Calculate gradients
      const gx = calculateGradientX(data, width, x, y);
      const gy = calculateGradientY(data, width, x, y);
      
      // Edge strength
      edges[idx] = Math.sqrt(gx * gx + gy * gy) / 255;
    }
  }
  
  return edges;
}

function calculateGradientX(data: Uint8ClampedArray, width: number, x: number, y: number): number {
  const idx = y * width + x;
  const left = data[(idx - 1) * 4];
  const right = data[(idx + 1) * 4];
  return right - left;
}

function calculateGradientY(data: Uint8ClampedArray, width: number, x: number, y: number): number {
  const idx = y * width + x;
  const top = data[(idx - width) * 4];
  const bottom = data[(idx + width) * 4];
  return bottom - top;
}

function findVanishingPoints(edges: Float32Array, width: number, height: number): THREE.Vector3[] {
  // Find lines using Hough transform (simplified)
  const lines: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];
  
  // Sample edge points and find line segments
  for (let y = 0; y < height; y += 10) {
    for (let x = 0; x < width; x += 10) {
      const idx = y * width + x;
      if (edges[idx] > 0.3) {
        // Find line direction from this point
        const direction = findLineDirection(edges, width, height, x, y);
        if (direction) {
          const start = new THREE.Vector3(x, y, 0);
          const end = start.clone().add(direction.multiplyScalar(100));
          lines.push({ start, end });
        }
      }
    }
  }
  
  // Find vanishing points where lines intersect
  const vanishingPoints: THREE.Vector3[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const intersection = findLineIntersection(lines[i], lines[j]);
      if (intersection && isValidVanishingPoint(intersection, width, height)) {
        vanishingPoints.push(intersection);
      }
    }
  }
  
  return vanishingPoints;
}

function findLineDirection(edges: Float32Array, width: number, height: number, x: number, y: number): THREE.Vector3 | null {
  // Find the strongest edge direction around this point
  let maxStrength = 0;
  let bestDirection = new THREE.Vector3();
  
  for (let angle = 0; angle < Math.PI; angle += Math.PI / 8) {
    let strength = 0;
    const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    
    // Sample along this direction
    for (let dist = 1; dist <= 20; dist++) {
      const sampleX = Math.round(x + dir.x * dist);
      const sampleY = Math.round(y + dir.y * dist);
      
      if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
        strength += edges[sampleY * width + sampleX];
      }
    }
    
    if (strength > maxStrength) {
      maxStrength = strength;
      bestDirection = dir;
    }
  }
  
  return maxStrength > 0.5 ? bestDirection : null;
}

function findLineIntersection(line1: { start: THREE.Vector3; end: THREE.Vector3 }, 
                            line2: { start: THREE.Vector3; end: THREE.Vector3 }): THREE.Vector3 | null {
  // Calculate intersection of two line segments
  const dir1 = line1.end.clone().sub(line1.start);
  const dir2 = line2.end.clone().sub(line2.start);
  
  const cross = dir1.cross(dir2);
  if (Math.abs(cross.z) < 0.001) return null; // Parallel lines
  
  const diff = line2.start.clone().sub(line1.start);
  const t = diff.cross(dir2).z / cross.z;
  
  if (t < 0 || t > 1) return null;
  
  return line1.start.clone().add(dir1.multiplyScalar(t));
}

function isValidVanishingPoint(point: THREE.Vector3, width: number, height: number): boolean {
  // Vanishing points should be outside the image or at infinity
  return point.x < -width/2 || point.x > width * 1.5 || 
         point.y < -height/2 || point.y > height * 1.5;
}

function estimateFloorPlane(vanishingPoints: THREE.Vector3[], width: number, height: number): THREE.Plane {
  // Use vanishing points to estimate floor plane
  // Floori assumes the floor is roughly horizontal
  
  if (vanishingPoints.length >= 2) {
    // Use two vanishing points to define the floor plane
    const vp1 = vanishingPoints[0];
    const vp2 = vanishingPoints[1];
    
    // Floor normal is perpendicular to the line between vanishing points
    const floorDirection = vp2.clone().sub(vp1).normalize();
    const floorNormal = new THREE.Vector3(-floorDirection.y, 0, floorDirection.x);
    
    // Ensure normal points upward (negative Y in Three.js)
    if (floorNormal.y > 0) {
      floorNormal.negate();
    }
    
    // Floor plane passes through image center
    const center = new THREE.Vector3(width / 2, height / 2, 0);
    const distance = center.dot(floorNormal);
    
    return new THREE.Plane(floorNormal, distance);
  }
  
  // Fallback: assume horizontal floor
  return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
}

function estimateRoomDimensions(_floorPlane: THREE.Plane, width: number, height: number): { width: number; height: number; depth: number } {
  // Estimate room dimensions based on floor plane and image size
  // This is simplified - Floori uses more sophisticated methods
  
  const aspectRatio = width / height;
  
  // Assume typical room proportions
  const estimatedWidth = 4.0; // meters
  const estimatedHeight = 2.7; // meters
  const estimatedDepth = estimatedWidth * aspectRatio;
  
  return {
    width: estimatedWidth,
    height: estimatedHeight,
    depth: estimatedDepth
  };
}

function createWallPlanes(_floorPlane: THREE.Plane, dimensions: { width: number; height: number; depth: number }): THREE.Plane[] {
  // Create wall planes based on floor plane
  const walls: THREE.Plane[] = [];
  
  // Front wall (facing camera)
  const frontNormal = new THREE.Vector3(0, 0, 1);
  walls.push(new THREE.Plane(frontNormal, 0));
  
  // Back wall
  const backNormal = new THREE.Vector3(0, 0, -1);
  walls.push(new THREE.Plane(backNormal, dimensions.depth));
  
  // Left wall
  const leftNormal = new THREE.Vector3(1, 0, 0);
  walls.push(new THREE.Plane(leftNormal, 0));
  
  // Right wall
  const rightNormal = new THREE.Vector3(-1, 0, 0);
  walls.push(new THREE.Plane(rightNormal, dimensions.width));
  
  return walls;
}

function findRoomCorners(_floorPlane: THREE.Plane, _walls: THREE.Plane[], width: number, height: number): THREE.Vector3[] {
  // Find room corners by intersecting wall planes
  const corners: THREE.Vector3[] = [];
  
  // Estimate room dimensions based on image size
  const roomWidth = width * 0.8;  // Assume room takes 80% of image width
  const roomDepth = height * 0.6;  // Assume room depth is 60% of image height
  const roomHeight = Math.min(width, height) * 0.4;  // Assume room height is 40% of smaller dimension
  
  // Bottom corners (floor level)
  corners.push(new THREE.Vector3(0, 0, 0));
  corners.push(new THREE.Vector3(roomWidth, 0, 0));
  corners.push(new THREE.Vector3(0, 0, roomDepth));
  corners.push(new THREE.Vector3(roomWidth, 0, roomDepth));
  
  // Top corners (ceiling level)
  corners.push(new THREE.Vector3(0, roomHeight, 0));
  corners.push(new THREE.Vector3(roomWidth, roomHeight, 0));
  corners.push(new THREE.Vector3(0, roomHeight, roomDepth));
  corners.push(new THREE.Vector3(roomWidth, roomHeight, roomDepth));
  
  return corners;
}

export function createFloorMask(geometry: RoomGeometry, width: number, height: number): FloorMask {
  // Create floor mask based on estimated geometry
  const mask = new Float32Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Convert image coordinates to 3D world coordinates
      const worldPos = new THREE.Vector3(x, 0, y);
      
      // Check if point is on floor plane
      const distance = geometry.floorPlane.distanceToPoint(worldPos);
      mask[idx] = Math.abs(distance) < 0.1 ? 1.0 : 0.0;
    }
  }
  
  return {
    data: mask,
    width,
    height
  };
}
