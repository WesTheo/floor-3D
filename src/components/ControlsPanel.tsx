import React from 'react';
import { useSceneStore } from '../store/sceneStore';

export const ControlsPanel: React.FC = () => {
  const {
    rotation,
    scale,
    pattern,
    shuffleSeed,
    plankSize,
    textureId,
    occlusionThreshold,
    edgeRefinement,
    shadowPreservation,
    setRotation,
    setScale,
    setPattern,
    setShuffleSeed,
    setPlankSize,
    setTextureId,
    setOcclusionThreshold,
    setEdgeRefinement,
    setShadowPreservation
  } = useSceneStore();

  const textures = [
    { id: 'oak-01', name: 'Oak Wood', preview: '/textures/oak.jpg' },
    { id: 'walnut-01', name: 'Walnut', preview: '/textures/walnut.jpg' },
    { id: 'gray-lvp-01', name: 'Gray LVP', preview: '/textures/gray-lvp.jpg' },
    { id: 'demo-laminate-01', name: 'Demo Laminate', preview: '/textures/demo-laminate.jpg' }
  ];

  const patterns = [
    { id: 'random', name: 'Random', description: 'Natural random variation' },
    { id: 'brick', name: 'Brick', description: 'Classic brick pattern' },
    { id: 'herringbone', name: 'Herringbone', description: 'Elegant herringbone' },
    { id: 'basket', name: 'Basket Weave', description: 'Traditional basket weave' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Floor Controls</h3>
        
        {/* Texture Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Floor Texture</label>
          <div className="grid grid-cols-2 gap-2">
            {textures.map((texture) => (
              <button
                key={texture.id}
                onClick={() => {
                  console.log('Texture clicked:', texture.id);
                  setTextureId(texture.id);
                  console.log('Texture ID set to:', texture.id);
                }}
                className={`relative p-2 rounded-lg border-2 transition-all ${
                  textureId === texture.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={texture.preview}
                  alt={texture.name}
                  className="w-full h-16 object-cover rounded mb-1"
                />
                <span className="text-xs text-gray-700 font-medium">{texture.name}</span>
                {textureId === texture.id && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Pattern Style</label>
          <div className="space-y-2">
            {patterns.map((patternOption) => (
              <button
                key={patternOption.id}
                onClick={() => setPattern(patternOption.id as any)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  pattern === patternOption.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{patternOption.name}</div>
                <div className="text-xs text-gray-600">{patternOption.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation: {rotation}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scale: {scale.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shuffle Seed: {shuffleSeed}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={shuffleSeed}
              onChange={(e) => setShuffleSeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Plank Size Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length: {plankSize.length.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={plankSize.length}
                onChange={(e) => setPlankSize({ ...plankSize, length: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width: {plankSize.width.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={plankSize.width}
                onChange={(e) => setPlankSize({ ...plankSize, width: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced AI Controls */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ AI Rendering Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occlusion Threshold: {occlusionThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={occlusionThreshold}
              onChange={(e) => setOcclusionThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-gray-500 mt-1">
              Controls how sensitive the occlusion detection is
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Edge Refinement</label>
              <p className="text-xs text-gray-500">Sharp, clean edges around furniture</p>
            </div>
            <button
              onClick={() => setEdgeRefinement(!edgeRefinement)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                edgeRefinement ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  edgeRefinement ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Shadow Preservation</label>
              <p className="text-xs text-gray-500">Keep original shadows on new floor</p>
            </div>
            <button
              onClick={() => setShadowPreservation(!shadowPreservation)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shadowPreservation ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shadowPreservation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* AI Status */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            AI-powered occlusion detection active
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Professional rendering with furniture masking
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => {
              setRotation(0);
              setScale(1.0);
              setShuffleSeed(0);
              setPlankSize({ length: 1.0, width: 0.2 });
            }}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reset to Default
          </button>
          
          <button
            onClick={() => setShuffleSeed(Math.floor(Math.random() * 100))}
            className="w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
          >
            Randomize Pattern
          </button>
        </div>
      </div>
    </div>
  );
};
