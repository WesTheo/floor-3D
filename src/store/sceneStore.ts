import { create } from 'zustand';

export interface PlankSize {
  length: number;
  width: number;
}

export interface SceneState {
  // Image and processing
  image: string | null;
  imageWidth: number;
  imageHeight: number;
  floorMask: Uint8Array | null;
  homography: Float32Array | null;
  
  // Advanced occlusion detection
  furnitureMask: Uint8Array | null;
  depthMap: Float32Array | null;
  occlusionMask: Uint8Array | null;
  floorPlane: {
    normal: [number, number, number];
    distance: number;
    points: [number, number, number][];
  } | null;
  
  // Processing state
  isProcessing: boolean;
  processingStep: string;
  
  // Controls
  rotation: number; // degrees
  scale: number;
  pattern: 'random' | 'brick' | 'herringbone' | 'basket';
  shuffleSeed: number;
  plankSize: PlankSize;
  textureId: string;
  
  // Occlusion settings
  occlusionThreshold: number;
  edgeRefinement: boolean;
  shadowPreservation: boolean;
  
  // Actions
  setImage: (image: string, width: number, height: number) => void;
  setFloorMask: (mask: Uint8Array) => void;
  setHomography: (homography: Float32Array) => void;
  setFurnitureMask: (mask: Uint8Array) => void;
  setDepthMap: (depth: Float32Array) => void;
  setOcclusionMask: (mask: Uint8Array) => void;
  setFloorPlane: (plane: SceneState['floorPlane']) => void;
  setProcessingState: (isProcessing: boolean, step?: string) => void;
  setRotation: (rotation: number) => void;
  setScale: (scale: number) => void;
  setPattern: (pattern: 'random' | 'brick' | 'herringbone' | 'basket') => void;
  setShuffleSeed: (seed: number) => void;
  setPlankSize: (plankSize: PlankSize) => void;
  setTextureId: (textureId: string) => void;
  setOcclusionThreshold: (threshold: number) => void;
  setEdgeRefinement: (enabled: boolean) => void;
  setShadowPreservation: (enabled: boolean) => void;
  resetScene: () => void;
  
  // Export/Import
  exportScene: () => string;
  importScene: (json: string) => void;
}

const initialState = {
  image: null,
  imageWidth: 0,
  imageHeight: 0,
  floorMask: null,
  homography: null,
  furnitureMask: null,
  depthMap: null,
  occlusionMask: null,
  floorPlane: null,
  isProcessing: false,
  processingStep: '',
  rotation: 0,
  scale: 1.0,
  pattern: 'random' as const,
  shuffleSeed: 0,
  plankSize: { length: 1.0, width: 0.2 },
  textureId: 'oak-01',
  occlusionThreshold: 0.1,
  edgeRefinement: true,
  shadowPreservation: true,
};

export const useSceneStore = create<SceneState>((set, get) => ({
  ...initialState,
  
  setImage: (image: string, width: number, height: number) => {
    set({ image, imageWidth: width, imageHeight: height });
  },
  
  setFloorMask: (floorMask: Uint8Array) => {
    set({ floorMask });
  },
  
  setHomography: (homography: Float32Array) => {
    set({ homography });
  },
  
  setFurnitureMask: (furnitureMask: Uint8Array) => {
    set({ furnitureMask });
  },
  
  setDepthMap: (depthMap: Float32Array) => {
    set({ depthMap });
  },
  
  setOcclusionMask: (occlusionMask: Uint8Array) => {
    set({ occlusionMask });
  },
  
  setFloorPlane: (floorPlane: SceneState['floorPlane']) => {
    set({ floorPlane });
  },
  
  setProcessingState: (isProcessing: boolean, step: string = '') => {
    set({ isProcessing, processingStep: step });
  },
  
  setRotation: (rotation: number) => {
    set({ rotation });
  },
  
  setScale: (scale: number) => {
    set({ scale });
  },
  
  setPattern: (pattern: 'random' | 'brick' | 'herringbone' | 'basket') => {
    set({ pattern });
  },
  
  setShuffleSeed: (shuffleSeed: number) => {
    set({ shuffleSeed });
  },
  
  setPlankSize: (plankSize: PlankSize) => {
    set({ plankSize });
  },
  
  setTextureId: (textureId: string) => {
    console.log('Store: setTextureId called with:', textureId);
    set({ textureId });
    console.log('Store: textureId updated to:', textureId);
  },
  
  setOcclusionThreshold: (occlusionThreshold: number) => {
    set({ occlusionThreshold });
  },
  
  setEdgeRefinement: (edgeRefinement: boolean) => {
    set({ edgeRefinement });
  },
  
  setShadowPreservation: (shadowPreservation: boolean) => {
    set({ shadowPreservation });
  },
  
  resetScene: () => {
    set(initialState);
  },
  
  exportScene: () => {
    const state = get();
    const sceneData = {
      image: state.image,
      imageWidth: state.imageWidth,
      imageHeight: state.imageHeight,
      floorMaskRLE: state.floorMask ? runLengthEncode(state.floorMask) : null,
      furnitureMaskRLE: state.furnitureMask ? runLengthEncode(state.furnitureMask) : null,
      depthMap: state.depthMap ? Array.from(state.depthMap) : null,
      occlusionMaskRLE: state.occlusionMask ? runLengthEncode(state.occlusionMask) : null,
      floorPlane: state.floorPlane,
      homography: state.homography ? Array.from(state.homography) : null,
      rotation: state.rotation,
      scale: state.scale,
      pattern: state.pattern,
      shuffleSeed: state.shuffleSeed,
      plankSize: state.plankSize,
      textureId: state.textureId,
      occlusionThreshold: state.occlusionThreshold,
      edgeRefinement: state.edgeRefinement,
      shadowPreservation: state.shadowPreservation,
    };
    return JSON.stringify(sceneData, null, 2);
  },
  
  importScene: (json: string) => {
    try {
      const sceneData = JSON.parse(json);
      const floorMask = sceneData.floorMaskRLE ? 
        runLengthDecode(sceneData.floorMaskRLE, sceneData.imageWidth, sceneData.imageHeight) : 
        null;
      const furnitureMask = sceneData.furnitureMaskRLE ? 
        runLengthDecode(sceneData.furnitureMaskRLE, sceneData.imageWidth, sceneData.imageHeight) : 
        null;
      const depthMap = sceneData.depthMap ? 
        new Float32Array(sceneData.depthMap) : 
        null;
      const occlusionMask = sceneData.occlusionMaskRLE ? 
        runLengthDecode(sceneData.occlusionMaskRLE, sceneData.imageWidth, sceneData.imageHeight) : 
        null;
      const homography = sceneData.homography ? 
        new Float32Array(sceneData.homography) : 
        null;
      
      set({
        image: sceneData.image,
        imageWidth: sceneData.imageWidth,
        imageHeight: sceneData.imageHeight,
        floorMask,
        furnitureMask,
        depthMap,
        occlusionMask,
        floorPlane: sceneData.floorPlane,
        homography,
        rotation: sceneData.rotation,
        scale: sceneData.scale,
        pattern: sceneData.pattern,
        shuffleSeed: sceneData.shuffleSeed,
        plankSize: sceneData.plankSize,
        textureId: sceneData.textureId,
        occlusionThreshold: sceneData.occlusionThreshold ?? 0.1,
        edgeRefinement: sceneData.edgeRefinement ?? true,
        shadowPreservation: sceneData.shadowPreservation ?? true,
      });
    } catch (error) {
      console.error('Failed to import scene:', error);
    }
  },
}));

// Utility functions for RLE encoding/decoding
function runLengthEncode(mask: Uint8Array): [number, number][] {
  const rle: [number, number][] = [];
  let currentValue = mask[0];
  let count = 1;
  
  for (let i = 1; i < mask.length; i++) {
    if (mask[i] === currentValue) {
      count++;
    } else {
      rle.push([currentValue, count]);
      currentValue = mask[i];
      count = 1;
    }
  }
  rle.push([currentValue, count]);
  
  return rle;
}

function runLengthDecode(rle: [number, number][], width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height);
  let index = 0;
  
  for (const [value, count] of rle) {
    for (let i = 0; i < count; i++) {
      if (index < mask.length) {
        mask[index] = value;
        index++;
      }
    }
  }
  
  return mask;
}
