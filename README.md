# FloorPreview App

A React-based web application that allows users to visualize different floor textures in their room photos using AI-powered segmentation and depth estimation.

## 🎯 Features

- **Photo Upload**: Upload room photos to visualize floor replacements
- **AI-Powered Analysis**: Server-side AI for semantic segmentation and depth estimation
- **Real-time Visualization**: Three.js WebGL rendering with custom shaders
- **Floor Texture Library**: Multiple wood and laminate textures
- **Pattern Controls**: Adjust rotation, scale, and pattern styles
- **Responsive Design**: Modern UI with Tailwind CSS

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Three.js** for 3D rendering
- **Custom WebGL Shaders** for floor texture mapping
- **Tailwind CSS** for styling
- **Zustand** for state management

### Backend (Planned)
- **Node.js/Express** server
- **Hugging Face Inference API** for AI models
- **Segmentation**: `nvidia/segformer-b0-finetuned-ade-512-512`
- **Depth Estimation**: `Intel/dpt-hybrid-midas`

### AI Pipeline
1. **Image Upload** → Convert to ArrayBuffer
2. **Segmentation** → Extract floor and furniture masks
3. **Depth Estimation** → Generate depth map
4. **Plane Fitting** → Fit floor plane using RANSAC
5. **Homography** → Compute perspective mapping
6. **Rendering** → Apply textures with custom shaders

## 🚀 Getting Started

### Prerequisites
- Node.js 20.17.0 or higher
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd floor-preview-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
Create a `.env` file in the root directory:
```env
HF_TOKEN=your_huggingface_token_here
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── VisualizerCanvas.tsx    # Main 3D renderer
│   ├── PhotoUploader.tsx       # Image upload
│   └── ControlsPanel.tsx       # UI controls
├── lib/                # Utility libraries
│   └── masks.ts        # Mask processing
├── shaders/            # WebGL shaders
│   ├── passthrough.vert.glsl   # Vertex shader
│   └── floor.frag.glsl         # Fragment shader
├── store/              # State management
│   └── sceneStore.ts   # Zustand store
└── assets/             # Static assets
    └── textures/       # Floor textures
```

## 🎨 Available Textures

- **Oak Wood**: Natural light brown wood
- **Walnut**: Rich dark brown wood
- **Gray LVP**: Modern gray laminate
- **Demo Laminate**: Sample laminate texture

## 🔧 Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Preview Build
```bash
npm run preview
```

## 🎯 Current Status

- ✅ **Basic Three.js setup** - Working 3D scene
- ✅ **Photo upload** - Basic texture rendering
- ✅ **UI controls** - Rotation, scale, pattern selection
- ✅ **Shader pipeline** - Custom WebGL shaders
- 🔄 **AI integration** - Server-side API routes ready
- 🔄 **Mask processing** - Basic implementation complete

## 🚧 Roadmap

1. **Server Setup** - Mount API routes in dev server
2. **AI Integration** - Connect Hugging Face models
3. **Advanced Patterns** - Herringbone, basket weave
4. **Performance** - Optimize rendering pipeline
5. **Mobile** - Responsive design improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Floori** - Inspiration for the computer vision approach
- **Three.js** - 3D rendering library
- **Hugging Face** - AI model hosting
- **Tailwind CSS** - Utility-first CSS framework
