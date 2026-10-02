import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0c" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00FF87" />
      <stop offset="100%" stop-color="#60EFFF" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Background with subtle border -->
  <rect width="512" height="512" rx="104" fill="url(#bg)" stroke="#222226" stroke-width="6"/>
  
  <!-- Subtle circular grid / radar effect -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="#16161a" stroke-width="3" stroke-dasharray="8 8"/>
  <circle cx="256" cy="256" r="100" fill="none" stroke="#121215" stroke-width="2"/>
  
  <!-- Candlesticks behind / chart elements -->
  <line x1="160" y1="200" x2="160" y2="340" stroke="#00E676" stroke-width="4" stroke-opacity="0.4"/>
  <rect x="150" y="230" width="20" height="70" rx="3" fill="#00E676" fill-opacity="0.4"/>

  <line x1="352" y1="160" x2="352" y2="300" stroke="#00E676" stroke-width="4" stroke-opacity="0.4"/>
  <rect x="342" y="190" width="20" height="70" rx="3" fill="#00E676" fill-opacity="0.4"/>

  <!-- Dynamic Trending Line / M Stylized Path with Glow -->
  <path d="M 120 340 L 190 220 L 256 290 L 330 170 L 392 230" 
        fill="none" stroke="url(#accent)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
        
  <!-- Glowing Target Marker at peak -->
  <circle cx="330" cy="170" r="10" fill="#FFFFFF"/>
  <circle cx="330" cy="170" r="18" fill="none" stroke="#00FF87" stroke-width="4" opacity="0.8"/>

  <!-- Text Badge -->
  <rect x="176" y="380" width="160" height="42" rx="21" fill="#111115" stroke="#2a2a30" stroke-width="2"/>
  <text x="256" y="407" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#00FF87" text-anchor="middle" letter-spacing="4">MRE TRD</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Function to generate PNG with programmatic drawing
function createPngIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  
  const scale = size / 512;
  const padding = isMaskable ? 0.15 : 0.05; // 15% safe zone for maskable
  const contentScale = 1 - (padding * 2);
  const offset = size * padding;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Normalized coords (0 to 1)
      const nx = x / size;
      const ny = y / size;
      
      // Deep OLED black background (#050508)
      let r = 5;
      let g = 5;
      let b = 8;
      let a = 255;
      
      // Radial glow in center-top
      const distFromGlow = Math.hypot(nx - 0.5, ny - 0.4);
      if (distFromGlow < 0.6) {
        const glowFactor = (1 - distFromGlow / 0.6) * 0.15;
        r += Math.round(0 * glowFactor);
        g += Math.round(230 * glowFactor);
        b += Math.round(118 * glowFactor);
      }
      
      // Draw grid ring
      const distFromCenter = Math.hypot(nx - 0.5, ny - 0.5);
      if (Math.abs(distFromCenter - 0.32) < 0.004) {
        r = 30; g = 30; b = 35;
      }
      
      // Stylized M / Bull trend line:
      // Points: (0.24, 0.66) -> (0.37, 0.44) -> (0.50, 0.57) -> (0.64, 0.33) -> (0.76, 0.45)
      const points = [
        [0.24, 0.66],
        [0.37, 0.44],
        [0.50, 0.57],
        [0.64, 0.33],
        [0.76, 0.45]
      ];
      
      // Calculate distance to polyline
      let minDist = 999;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        
        // Map to scaled coords inside safe zone
        const x1 = offset / size + p1[0] * contentScale;
        const y1 = offset / size + p1[1] * contentScale;
        const x2 = offset / size + p2[0] * contentScale;
        const y2 = offset / size + p2[1] * contentScale;
        
        // Point to line segment distance
        const dx = x2 - x1;
        const dy = y2 - y1;
        const l2 = dx * dx + dy * dy;
        let t = ((nx - x1) * dx + (ny - y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = x1 + t * dx;
        const py = y1 + t * dy;
        const dist = Math.hypot(nx - px, ny - py);
        if (dist < minDist) minDist = dist;
      }
      
      // Line thickness
      const thickness = 0.02 * (isMaskable ? 0.8 : 1);
      const blurRadius = 0.04;
      if (minDist < thickness) {
        // Line core: bright vibrant neon cyan/green gradient
        const tColor = (nx - 0.2) / 0.6;
        r = 0;
        g = Math.min(255, Math.round(230 + tColor * 25));
        b = Math.min(255, Math.round(118 + tColor * 120));
      } else if (minDist < thickness + blurRadius) {
        // Neon glow
        const glowStrength = (1 - (minDist - thickness) / blurRadius);
        r = Math.min(255, r + Math.round(0 * glowStrength * 0.7));
        g = Math.min(255, g + Math.round(230 * glowStrength * 0.7));
        b = Math.min(255, b + Math.round(180 * glowStrength * 0.7));
      }
      
      // Peak bull target marker
      const peakX = offset / size + points[3][0] * contentScale;
      const peakY = offset / size + points[3][1] * contentScale;
      const distToPeak = Math.hypot(nx - peakX, ny - peakY);
      if (distToPeak < 0.018) {
        r = 255; g = 255; b = 255;
      } else if (distToPeak < 0.035) {
        r = 0; g = 255; b = 150;
      }
      
      // Rounded border corner for non-maskable icons
      if (!isMaskable) {
        const cornerR = 0.18;
        let outsideCorner = false;
        const cx = nx < 0.5 ? nx : 1 - nx;
        const cy = ny < 0.5 ? ny : 1 - ny;
        if (cx < cornerR && cy < cornerR) {
          const cornerDist = Math.hypot(cornerR - cx, cornerR - cy);
          if (cornerDist > cornerR) {
            a = 0;
          }
        }
      }
      
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  
  return PNG.sync.write(png);
}

// Write files
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPngIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPngIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPngIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPngIcon(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPngIcon(64, false));

console.log('Icons generated successfully!');
