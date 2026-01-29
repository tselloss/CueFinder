#!/usr/bin/env node
/**
 * Build helper for monorepo migration
 * Bridges old cuefinderfe structure with new packages structure
 */

const fs = require('fs');
const path = require('path');

// Get the parent directory (CueFinderFE root, not scripts)
const rootDir = path.resolve(__dirname, '..');
const oldSrcDir = path.join(rootDir, 'cuefinderfe', 'src');
const newAppDir = path.join(rootDir, 'packages', 'app');
const newSrcDir = path.join(newAppDir, 'src');

// Create src directory if it doesn't exist
if (!fs.existsSync(newSrcDir)) {
  fs.mkdirSync(newSrcDir, { recursive: true });
  console.log('✓ Created packages/app/src');
}

// Copy src files from old location to new
if (fs.existsSync(oldSrcDir)) {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach(file => {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);
      const stat = fs.statSync(srcFile);
      
      if (stat.isDirectory()) {
        copyDir(srcFile, destFile);
      } else {
        // Always overwrite to ensure latest changes are copied
        fs.copyFileSync(srcFile, destFile);
      }
    });
  };
  
  copyDir(oldSrcDir, newSrcDir);
  console.log('✓ Synced source files to packages/app/src');
} else {
  console.warn('⚠ Old source directory not found:', oldSrcDir);
}

// Copy config files
const configFiles = [
  'public',
  'nginx-frontend.conf',
  '.env.example'
];

configFiles.forEach(file => {
  const src = path.join(rootDir, 'cuefinderfe', file);
  const dest = path.join(newAppDir, file);
  
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    if (fs.statSync(src).isDirectory()) {
      const copyDir = (s, d) => {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        fs.readdirSync(s).forEach(f => {
          const stat = fs.statSync(path.join(s, f));
          stat.isDirectory() 
            ? copyDir(path.join(s, f), path.join(d, f))
            : fs.copyFileSync(path.join(s, f), path.join(d, f));
        });
      };
      copyDir(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`✓ Copied ${file}`);
  }
});

console.log('\n✓ Build helper completed successfully');
