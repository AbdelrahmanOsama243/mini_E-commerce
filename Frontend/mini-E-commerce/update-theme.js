const fs = require('fs');
const path = require('path');

const lightColors = {
  "on-error-container": "#93000a",
  "primary": "#1a1a1a",
  "on-secondary": "#1a1a1a",
  "surface": "#f5f0e8",
  "surface-container": "#eee9e0",
  "surface-bright": "#faf7f2",
  "outline-variant": "#d0cbc3",
  "surface-variant": "#e8e3da",
  "secondary": "#e63b2e",
  "on-primary": "#ffffff",
  "inverse-on-surface": "#f5f0e8",
  "surface-container-low": "#f2ede5",
  "on-tertiary-fixed-variant": "#1a1a1a",
  "on-tertiary-container": "#1a1a1a",
  "inverse-surface": "#1a1a1a",
  "secondary-fixed": "#ffdad6",
  "on-tertiary": "#ffffff",
  "on-secondary-fixed-variant": "#1a1a1a",
  "error": "#cc0000",
  "on-surface-variant": "#4a4a4a",
  "on-tertiary-fixed": "#1a1a1a",
  "on-background": "#1a1a1a",
  "inverse-primary": "#f5f0e8",
  "on-primary-fixed": "#1a1a1a",
  "on-primary-container": "#1a1a1a",
  "surface-container-lowest": "#ffffff",
  "primary-container": "#ffcc00",
  "on-primary-fixed-variant": "#1a1a1a",
  "surface-container-highest": "#e2ddd4",
  "secondary-container": "#ffdad6",
  "primary-fixed-dim": "#e6b800",
  "tertiary": "#0055ff",
  "secondary-fixed-dim": "#ffb3ab",
  "surface-dim": "#d6d1c9",
  "error-container": "#ffdad6",
  "tertiary-fixed": "#d6e3ff",
  "tertiary-container": "#d6e3ff",
  "surface-tint": "#1a1a1a",
  "on-surface": "#1a1a1a",
  "tertiary-fixed-dim": "#a8c6ff",
  "on-error": "#ffffff",
  "on-secondary-container": "#1a1a1a",
  "background": "#f5f0e8",
  "outline": "#1a1a1a",
  "surface-container-high": "#e8e3da",
  "primary-fixed": "#ffcc00",
  "on-secondary-fixed": "#1a1a1a"
};

const darkColors = {
  "inverse-primary": "#c0000a",
  "on-primary": "#1a1612",
  "inverse-surface": "#f5ede2",
  "primary-fixed-dim": "#e8ded1",
  "error": "#ffb4ab",
  "secondary": "#adc6ff",
  "on-error-container": "#ffdad6",
  "on-secondary": "#002e69",
  "outline-variant": "#4a453e",
  "surface-variant": "#2e2b27",
  "surface": "#141311",
  "tertiary-container": "#d0a600",
  "surface-container-lowest": "#0e0d0c",
  "on-tertiary-fixed-variant": "#584400",
  "surface-container-high": "#262420",
  "secondary-fixed-dim": "#adc6ff",
  "surface-tint": "#f5ede2",
  "on-primary-container": "#1a1612",
  "surface-dim": "#141311",
  "primary-fixed": "#fdfaf6",
  "primary": "#f5ede2",
  "on-secondary-fixed": "#001a41",
  "on-background": "#f5ede2",
  "background": "#141311",
  "on-primary-fixed": "#1a1612",
  "secondary-fixed": "#d8e2ff",
  "error-container": "#93000a",
  "on-tertiary-container": "#4f3d00",
  "inverse-on-surface": "#313030",
  "primary-container": "#dfb27c",
  "surface-container-low": "#1c1b18",
  "on-error": "#690005",
  "on-surface": "#f5ede2",
  "secondary-container": "#4b8eff",
  "on-secondary-container": "#00285c",
  "tertiary-fixed": "#ffe08b",
  "on-tertiary": "#3d2f00",
  "on-tertiary-fixed": "#241a00",
  "surface-container-highest": "#33302b",
  "on-primary-fixed-variant": "#1a1612",
  "surface-bright": "#38352f",
  "tertiary": "#f1c100",
  "tertiary-fixed-dim": "#f1c100",
  "on-surface-variant": "#d5c8b8",
  "outline": "#8c8275",
  "on-secondary-fixed-variant": "#004493",
  "surface-container": "#201e1a"
};

const tailwindColors = {};
const rootVars = [];
const darkVars = [];

// Ensure all keys from both exist, fallback to light if dark is missing, etc.
const allKeys = new Set([...Object.keys(lightColors), ...Object.keys(darkColors)]);

allKeys.forEach(key => {
  const lColor = lightColors[key] || '#000000';
  const dColor = darkColors[key] || lColor;
  
  rootVars.push(`  --color-${key}: ${lColor};`);
  darkVars.push(`  --color-${key}: ${dColor};`);
  tailwindColors[key] = `var(--color-${key})`;
});

const cssStyles = `
<style>
  :root {
${rootVars.join('\n')}
  }
  .dark {
${darkVars.join('\n')}
  }
</style>
`;

const configObjStr = JSON.stringify(tailwindColors, null, 14).trim();

const htmlPath = path.join('d:', 'mini_E-commerce', 'Frontend', 'mini-E-commerce', 'src', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace colors in config
const colorMatch = html.match(/"colors"\s*:\s*\{[\s\S]*?\},/);
if (colorMatch) {
  html = html.replace(/"colors"\s*:\s*\{[\s\S]*?\},/, `"colors": ${configObjStr},`);
}

// Add styles
if (!html.includes('--color-primary')) {
  html = html.replace('</head>', cssStyles + '</head>');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated index.html');
