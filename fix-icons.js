const fs = require('fs');
const path = require('path');

// Criar ícones PNG simples usando Canvas (se disponível) ou fallback
function createIconDataURL(size) {
  // SVG como string que será convertido para data URL
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#4CAF50"/>
      <text x="${size/2}" y="${size * 0.65}" font-family="Arial, sans-serif" font-size="${size * 0.55}" font-weight="bold" text-anchor="middle" fill="white">&gt;</text>
      ${size >= 48 ? `
        <circle cx="${size * 0.31}" cy="${size * 0.27}" r="${size * 0.05}" fill="white" opacity="0.8"/>
        <circle cx="${size * 0.5}" cy="${size * 0.27}" r="${size * 0.05}" fill="white" opacity="0.8"/>
        <circle cx="${size * 0.69}" cy="${size * 0.27}" r="${size * 0.05}" fill="white" opacity="0.8"/>
      ` : ''}
    </svg>
  `.trim();
  
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// Atualizar manifest para usar data URLs temporariamente
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Usar apenas o ícone 128 como SVG embutido
manifest.icons = {
  "16": "icons/icon.svg",
  "48": "icons/icon.svg",
  "128": "icons/icon.svg"
};

manifest.action.default_icon = {
  "16": "icons/icon.svg",
  "48": "icons/icon.svg",
  "128": "icons/icon.svg"
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('Manifest atualizado para usar SVG único!');
console.log('Agora crie o arquivo icons/icon.svg');
