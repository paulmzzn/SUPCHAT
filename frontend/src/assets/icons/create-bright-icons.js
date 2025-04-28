/**
 * Script to create brighter versions of SVG icons for mobile view
 * Run this with Node.js if you want to generate brighter versions of your icons
 * 
 * To run: node create-bright-icons.js
 */

const fs = require('fs');
const path = require('path');

const iconFiles = [
  'tchat.svg',
  'workspaces.svg',
  'discover.svg'
];

const iconsDir = __dirname;

// Function to brighten SVG colors
function brightenSvg(svgContent) {
  // Replace dark colors with lighter colors
  // This is a simplified approach - actual implementation depends on your SVG structure
  return svgContent
    .replace(/#000000/g, '#FFFFFF') // Black to White
    .replace(/#333333/g, '#EEEEEE') // Dark gray to Light gray
    .replace(/fill="black"/g, 'fill="white"')
    .replace(/stroke="black"/g, 'stroke="white"')
    .replace(/fill="#[0-9A-F]{6}"/gi, function(match) {
      // Make any color brighter
      return 'fill="#FFFFFF"'; // Simple approach: just use white
    });
}

// Create brighter versions for mobile
iconFiles.forEach(filename => {
  const filepath = path.join(iconsDir, filename);
  
  if (fs.existsSync(filepath)) {
    const svgContent = fs.readFileSync(filepath, 'utf8');
    const brighterSvg = brightenSvg(svgContent);
    
    // Write to a new file with -bright suffix
    const brightFilepath = path.join(
      iconsDir, 
      filename.replace('.svg', '-bright.svg')
    );
    
    fs.writeFileSync(brightFilepath, brighterSvg);
    console.log(`Created bright version: ${brightFilepath}`);
  } else {
    console.log(`File not found: ${filepath}`);
  }
});

console.log('Done creating bright icons for mobile view');
