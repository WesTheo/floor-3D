import { PhotoUploader } from './components/PhotoUploader';
import VisualizerCanvas from './components/VisualizerCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { useSceneStore } from './store/sceneStore';

function App() {
  const { image } = useSceneStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Floor Preview Pro</h1>
              <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                AI-Powered
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Professional Floor Visualization
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!image ? (
          // Upload State
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Transform Your Space with AI
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                Upload a photo of your room and our advanced AI will automatically detect floor areas,
                furniture, and create professional occlusion masks for realistic floor visualization.
              </p>
              
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI Segmentation</h3>
                  <p className="text-sm text-gray-600">
                    Advanced semantic segmentation using SegFormer-B0 to detect floors and furniture
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Depth Estimation</h3>
                  <p className="text-sm text-gray-600">
                    MiDaS v2 depth estimation for accurate occlusion detection and 3D understanding
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Professional Rendering</h3>
                  <p className="text-sm text-gray-600">
                    Floori-style quality with furniture masking, shadow preservation, and edge refinement
                  </p>
                </div>
              </div>
            </div>
            <PhotoUploader />
          </div>
        ) : (
          // Visualization State
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Visualization Area */}
            <div className="lg:col-span-3">
              <VisualizerCanvas />
            </div>

            {/* Controls Panel */}
            <div className="lg:col-span-1">
              <ControlsPanel />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">Powered by advanced AI segmentation and depth estimation</p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                SegFormer-B0 (ADE20K)
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                MiDaS v2 Small
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Professional Rendering
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Achieve Floori-quality results with our advanced occlusion detection pipeline
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
