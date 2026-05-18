const sharp = require('sharp');
const fs = require('fs');

async function generarIconoElegante() {
  const size = 1024;
  
  // SVG más elegante y moderno
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Fondo con gradiente -->
      <rect width="${size}" height="${size}" rx="${size * 0.23}" fill="url(#grad)"/>
      
      <!-- Círculo decorativo sutil -->
      <circle cx="${size * 0.85}" cy="${size * 0.15}" r="${size * 0.15}" fill="white" opacity="0.1"/>
      
      <!-- Texto JJ con sombra y estilo elegante -->
      <text 
        x="50%" 
        y="54%" 
        font-family="'Segoe UI', Arial, sans-serif" 
        font-size="${size * 0.45}" 
        font-weight="700"
        text-anchor="middle" 
        dominant-baseline="middle"
        fill="white"
        filter="url(#shadow)"
        letter-spacing="${size * 0.02}"
      >JJ</text>
      
      <!-- Línea decorativa debajo -->
      <line 
        x1="${size * 0.35}" 
        y1="${size * 0.75}" 
        x2="${size * 0.65}" 
        y2="${size * 0.75}" 
        stroke="white" 
        stroke-width="${size * 0.008}" 
        opacity="0.6"
        stroke-linecap="round"
      />
    </svg>
  `;

  try {
    // Generar PNG desde SVG
    await sharp(Buffer.from(svg))
      .resize(1024, 1024)
      .png()
      .toFile('assets/icon.png');
    
    console.log('✅ Icono elegante generado: assets/icon.png');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generarIconoElegante();
