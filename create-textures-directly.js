import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple HTML file that will generate textures
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Direct Texture Creator</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .texture { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
        canvas { border: 1px solid #000; margin: 10px; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
        .download { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Direct Texture Creator</h1>
    <p>This will create the exact texture files your app needs.</p>
    
    <div class="texture">
        <h3>Oak Wood</h3>
        <canvas id="oakCanvas" width="200" height="100"></canvas><br>
        <button onclick="createOak()">Generate Oak</button>
        <div class="download" id="oakDownload"></div>
    </div>
    
    <div class="texture">
        <h3>Walnut Wood</h3>
        <canvas id="walnutCanvas" width="200" height="100"></canvas><br>
        <button onclick="createWalnut()">Generate Walnut</button>
        <div class="download" id="walnutDownload"></div>
    </div>
    
    <div class="texture">
        <h3>Gray LVP</h3>
        <canvas id="grayCanvas" width="200" height="100"></canvas><br>
        <button onclick="createGray()">Generate Gray LVP</button>
        <div class="download" id="grayDownload"></div>
    </div>
    
    <div class="texture">
        <h3>Demo Laminate</h3>
        <canvas id="demoCanvas" width="200" height="100"></canvas><br>
        <button onclick="createDemo()">Generate Demo Laminate</button>
        <div class="download" id="demoDownload"></div>
    </div>

    <script>
        function createOak() {
            const canvas = document.getElementById('oakCanvas');
            const ctx = canvas.getContext('2d');
            
            // Base color
            ctx.fillStyle = '#d4a574';
            ctx.fillRect(0, 0, 200, 100);
            
            // Wood grain
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 1;
            for (let x = 0; x < 200; x += 10) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 100);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y < 100; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(200, y);
                ctx.stroke();
            }
            
            showDownload('oakDownload', canvas, 'oak.jpg');
        }
        
        function createWalnut() {
            const canvas = document.getElementById('walnutCanvas');
            const ctx = canvas.getContext('2d');
            
            // Base color
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, 0, 200, 100);
            
            // Wood grain
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            for (let x = 0; x < 200; x += 8) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 100);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y < 100; y += 16) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(200, y);
                ctx.stroke();
            }
            
            showDownload('walnutDownload', canvas, 'walnut.jpg');
        }
        
        function createGray() {
            const canvas = document.getElementById('grayCanvas');
            const ctx = canvas.getContext('2d');
            
            // Base color
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 200, 100);
            
            // LVP pattern
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 1;
            for (let x = 0; x < 200; x += 12) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 100);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y < 100; y += 15) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(200, y);
                ctx.stroke();
            }
            
            showDownload('grayDownload', canvas, 'gray-lvp.jpg');
        }
        
        function createDemo() {
            const canvas = document.getElementById('demoCanvas');
            const ctx = canvas.getContext('2d');
            
            // Base color
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(0, 0, 200, 100);
            
            // Laminate pattern
            ctx.strokeStyle = '#D2B48C';
            ctx.lineWidth = 1;
            for (let x = 0; x < 200; x += 15) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 100);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y < 100; y += 18) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(200, y);
                ctx.stroke();
            }
            
            showDownload('demoDownload', canvas, 'demo-laminate.jpg');
        }
        
        function showDownload(elementId, canvas, filename) {
            const div = document.getElementById(elementId);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            div.innerHTML = \`
                <a href="\${dataUrl}" download="\${filename}" style="
                    display: inline-block;
                    padding: 10px 15px;
                    background: #28a745;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 5px;
                ">📥 Download \${filename}</a>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">
                    Save to: <code>floor-preview-app/public/textures/\${filename}</code>
                </p>
            \`;
        }
        
        // Auto-generate all textures
        window.onload = function() {
            createOak();
            createWalnut();
            createGray();
            createDemo();
        };
    </script>
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'create-textures-directly.html'), htmlContent);

console.log('✅ Direct texture creator created: create-textures-directly.html');
console.log('');
console.log('🚨 CRITICAL: You need to create the texture files!');
console.log('');
console.log('📋 Steps to fix:');
console.log('1. Open create-textures-directly.html in your browser');
console.log('2. Download all 4 texture files');
console.log('3. Save them to: floor-preview-app/public/textures/');
console.log('4. Refresh your app - textures should work!');
console.log('');
console.log('📁 Required files:');
console.log('  - oak.jpg');
console.log('  - walnut.jpg'); 
console.log('  - gray-lvp.jpg');
console.log('  - demo-laminate.jpg');
