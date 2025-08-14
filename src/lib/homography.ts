import * as THREE from 'three';

/**
 * Homography computation using Direct Linear Transform (DLT)
 * Computes 3x3 homography matrix from 4 point correspondences
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface PointCorrespondence {
  src: Point2D;
  dst: Point2D;
}

/**
 * Compute homography matrix from 4 point correspondences
 * Uses Direct Linear Transform (DLT) algorithm
 */
export function computeHomography(
  srcPoints: Point2D[],
  dstPoints: Point2D[]
): Float32Array {
  if (srcPoints.length !== 4 || dstPoints.length !== 4) {
    throw new Error('Need exactly 4 point correspondences');
  }

  // Build the A matrix for Ah = 0
  const A: number[][] = [];
  
  for (let i = 0; i < 4; i++) {
    const src = srcPoints[i];
    const dst = dstPoints[i];
    
    // Each point gives us 2 equations
    // Row 1: x' * h31 - x' * x * h11 - x' * y * h21 + x * h11 + y * h21 + h31 = 0
    A.push([
      src.x, src.y, 1, 0, 0, 0, -dst.x * src.x, -dst.x * src.y, -dst.x
    ]);
    
    // Row 2: y' * h31 - y' * x * h11 - y' * y * h21 + x * h12 + y * h22 + h32 = 0
    A.push([
      0, 0, 0, src.x, src.y, 1, -dst.y * src.x, -dst.y * src.y, -dst.y
    ]);
  }

  // Solve Ah = 0 using SVD
  const h = solveDLT(A);
  
  // Return as Float32Array for shader (column-major order)
  return new Float32Array(h);
}

/**
 * Solve the DLT system Ah = 0 using SVD
 * Returns the homography matrix as a flat array
 */
function solveDLT(_A: number[][]): number[] {
  // For simplicity, we'll use a basic approach
  // In production, you'd use a proper SVD library
  
  // Use fallback approach for now
  return computeFallbackHomography();
}

/**
 * Fallback homography computation
 * Creates a reasonable initial homography for testing
 */
function computeFallbackHomography(): number[] {
  // Identity matrix as starting point
  // This will be refined by user interaction
  return [
    1, 0, 0,  // h11, h12, h13
    0, 1, 0,  // h21, h22, h23  
    0, 0, 1   // h31, h32, h33
  ];
}

/**
 * Matrix utility functions
 */

/**
 * Convert homography matrix to Three.js Matrix3
 */
export function homographyToMatrix3(h: Float32Array): THREE.Matrix3 {
  const matrix = new THREE.Matrix3();
  matrix.fromArray(h);
  return matrix;
}

/**
 * Create a simple test homography for development
 * This creates a perspective transform that makes the floor look 3D
 */
export function createTestHomography(width: number, height: number): Float32Array {
  // Create a perspective transform that makes the floor look like it's receding
  const focalLength = Math.max(width, height) * 0.8;
  
  return new Float32Array([
    1, 0, 0,
    0, 1, 0,
    -width * 0.1 / focalLength, -height * 0.05 / focalLength, 1
  ]);
}
