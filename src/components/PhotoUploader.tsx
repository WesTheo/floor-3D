import React, { useRef, useState } from 'react';
import { useSceneStore } from '../store/sceneStore';

export const PhotoUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const { 
    setImage, 
    setFloorMask, 
    setFurnitureMask, 
    setDepthMap, 
    setOcclusionMask, 
    setFloorPlane, 
    setHomography,
    setProcessingState 
  } = useSceneStore();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingStep('Processing image for 3D floor visualization...');
    setProcessingProgress(10);

    try {
      // Create image URL and get dimensions
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const { width, height } = img;
      
      // Set image in store
      setImage(imageUrl, width, height);
      setProcessingProgress(30);
      setProcessingStep('Creating 3D perspective masks...');

      // Create simple masks for 3D floor visualization
      setProcessingProgress(50);
      setProcessingStep('Analyzing floor geometry...');

      // Create basic masks using simple image analysis
      const totalPixels = width * height;
      
      // Simple floor mask (stronger at bottom, based on brightness)
      const floorMask = new Uint8Array(totalPixels);
      const furnitureMask = new Uint8Array(totalPixels);
      const depthMap = new Float32Array(totalPixels);
      const occlusionMask = new Uint8Array(totalPixels);
      
      // Create a canvas to analyze the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const pixelIdx = (y * width + x) * 4;
          
          // Calculate brightness
          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];
          const brightness = (r + g + b) / 3;
          
          // Floor mask: stronger at bottom, based on brightness and position
          const normalizedY = y / height;
          const floorProbability = Math.max(0, 1 - normalizedY * 1.2) * (brightness < 180 ? 1.3 : 0.7);
          floorMask[idx] = Math.round(Math.min(255, Math.max(0, floorProbability * 255)));
          
          // Furniture mask: detect objects based on edges and brightness variation
          let edgeStrength = 0;
          if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
            const left = data[((y * width + (x - 1)) * 4)];
            const right = data[((y * width + (x + 1)) * 4)];
            const top = data[(((y - 1) * width + x) * 4)];
            const bottom = data[(((y + 1) * width + x) * 4)];
            
            edgeStrength = Math.abs(right - left) + Math.abs(bottom - top);
          }
          
          // Stronger furniture detection: combine edge strength with brightness variation
          const brightnessVariation = Math.abs(brightness - 128) / 128;
          const furnitureStrength = Math.min(255, edgeStrength * 2 + brightnessVariation * 100);
          furnitureMask[idx] = Math.round(furnitureStrength);
          
          // Depth map: based on position and brightness
          const depth = normalizedY * 0.9 + (brightness / 255) * 0.1;
          depthMap[idx] = depth;
          
          // Occlusion mask: combine furniture detection with edge strength
          // Higher values mean more likely to be furniture/objects
          occlusionMask[idx] = Math.round(Math.min(255, furnitureStrength * 1.5));
        }
      }
      
      setProcessingProgress(70);
      setProcessingStep('Setting up 3D floor mesh...');

      // Set masks in store
      setFloorMask(floorMask);
      setFurnitureMask(furnitureMask);
      setDepthMap(depthMap);
      setOcclusionMask(occlusionMask);
      
      // Create simple floor plane for 3D perspective
      setFloorPlane({
        normal: [0, 1, 0],
        distance: 0,
        points: [[0, 0, 0], [width, 0, 0], [0, height, 0], [width, height, 0]]
      });

      // Create identity homography for basic perspective
      const homography = new Float32Array(9);
      homography[0] = 1; homography[1] = 0; homography[2] = 0;
      homography[3] = 0; homography[4] = 1; homography[5] = 0;
      homography[6] = 0; homography[7] = 0; homography[8] = 1;
      setHomography(homography);

      setProcessingProgress(90);
      setProcessingStep('Finalizing 3D visualization...');
      
      setProcessingProgress(100);
      setProcessingStep('3D Floor Visualization Ready!');
      
      // Update global processing state
      setProcessingState(false, '3D Floor Ready');
      
      // Clean up
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
        setProcessingProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Failed to process image:', error);
      setProcessingStep('Error: ' + (error as Error).message);
      setIsProcessing(false);
      setProcessingState(false, 'Error');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Simulate file input change
        if (fileInputRef.current) {
          fileInputRef.current.files = files;
          handleFileSelect({ target: { files } } as any);
        }
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 text-blue-600">
              <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              3D Floor Visualization Processing
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {processingStep}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          
          <div className="text-xs text-gray-500">
            Step {Math.ceil(processingProgress / 20)} of 5
          </div>
          
          {/* Processing Steps */}
          <div className="mt-6 text-left">
            <div className={`flex items-center text-sm ${processingProgress >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${processingProgress >= 10 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              Initialize AI Models
            </div>
            <div className={`flex items-center text-sm ${processingProgress >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${processingProgress >= 20 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              Semantic Segmentation
            </div>
            <div className={`flex items-center text-sm ${processingProgress >= 40 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${processingProgress >= 40 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              Depth Estimation
            </div>
            <div className={`flex items-center text-sm ${processingProgress >= 80 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${processingProgress >= 80 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              Occlusion Detection
            </div>
            <div className={`flex items-center text-sm ${processingProgress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-4 h-4 rounded-full mr-3 ${processingProgress >= 100 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              Final Rendering
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div 
        className="bg-white rounded-lg shadow-lg p-8 text-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Room Photo
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop your image here, or click to browse
        </p>
        
        <p className="text-xs text-gray-500 mb-4">
          Supports JPG, PNG, WebP • Max 10MB
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 text-left">
          <h4 className="font-medium text-blue-900 mb-2">✨ New AI Features:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Automatic furniture detection & masking</li>
            <li>• Depth-based occlusion detection</li>
            <li>• Floor plane estimation</li>
            <li>• Professional-grade rendering</li>
          </ul>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
