const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const outDir = path.join(__dirname, '../out');

/**
 * Recursively get all files and directories in a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles.push(fullPath);
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Safe replacement for contents
 */
function replaceInFile(filePath, search, replace) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(search)) {
    const updatedContent = content.split(search).join(replace);
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated references in: ${path.relative(outDir, filePath)} - [${search} -> ${replace}]`);
  }
}

// ---------------------------------------------------------
// 1. Collect all paths that start with an underscore
// ---------------------------------------------------------
const allPaths = getAllFiles(outDir).sort((a, b) => b.length - a.length);
const renameMap = [];

allPaths.forEach(oldPath => {
  const fileName = path.basename(oldPath);
  if (fileName.startsWith('_')) {
    if (fileName === '_locales' || fileName === '_metadata') return;

    const newFileName = fileName.replace(/^_/, 'ext_'); 
    const newPath = path.join(path.dirname(oldPath), newFileName);
    
    renameMap.push({
      oldRel: '/' + path.relative(outDir, oldPath).replace(/\\/g, '/'),
      newRel: '/' + path.relative(outDir, newPath).replace(/\\/g, '/'),
      oldPath,
      newPath
    });
  }
});

// ---------------------------------------------------------
// 2. Perform replacements (More targeted)
// ---------------------------------------------------------
const textFiles = getAllFiles(outDir).filter(f => 
  f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.json') || f.endsWith('.txt')
);

renameMap.sort((a, b) => b.oldRel.length - a.oldRel.length).forEach(mapping => {
  textFiles.forEach(file => {
    // Replace with leading slash (URL style)
    replaceInFile(file, mapping.oldRel + '/', mapping.newRel + '/');
    replaceInFile(file, mapping.oldRel + '"', mapping.newRel + '"');
    replaceInFile(file, mapping.oldRel + "'", mapping.newRel + "'");
  });
});

// Separate pass for internal NEXT variables to avoid double-replacement of paths
textFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Only replace _next if it's NOT already preceded by "ext" (to avoid extext_next)
  // We use a simple but effective strategy: replace _next that isn't part of ext_next
  if (content.includes('_next')) {
    const updatedContent = content.replace(/(?<!ext)_next/g, 'ext_next');
    if (content !== updatedContent) {
      fs.writeFileSync(file, updatedContent);
      console.log(`Updated internal markers in: ${path.relative(outDir, file)}`);
    }
  }
});

// ---------------------------------------------------------
// 3. Extract inline scripts to solve CSP issues (Manifest V3)
// ---------------------------------------------------------
const htmlFiles = getAllFiles(outDir).filter(f => f.endsWith('.html'));
const jsDir = path.join(outDir, 'ext_inline');
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir, { recursive: true });

htmlFiles.forEach(htmlFile => {
  let content = fs.readFileSync(htmlFile, 'utf8');
  const scriptRegex = /<script\b(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let inlineCount = 0;

  content = content.replace(scriptRegex, (fullMatch, attrs, scriptContent) => {
    if (!scriptContent.trim()) return fullMatch;

    const hash = crypto.createHash('sha256').update(scriptContent).digest('hex').substring(0, 10);
    const fileName = `inline-${hash}-${inlineCount++}.js`;
    const filePath = path.join(jsDir, fileName);
    
    fs.writeFileSync(filePath, scriptContent);
    console.log(`Extracted inline script from ${path.relative(outDir, htmlFile)} to ${fileName}`);
    
    return `<script src="/ext_inline/${fileName}" ${attrs}></script>`;
  });

  fs.writeFileSync(htmlFile, content);
});

// ---------------------------------------------------------
// 4. Rename the actual files and directories
// ---------------------------------------------------------
renameMap.forEach(mapping => {
  if (fs.existsSync(mapping.oldPath)) {
    if (fs.existsSync(mapping.newPath)) {
      fs.rmSync(mapping.newPath, { recursive: true, force: true });
    }
    fs.renameSync(mapping.oldPath, mapping.newPath);
    console.log(`Renamed: ${path.relative(outDir, mapping.oldPath)} -> ${path.basename(mapping.newPath)}`);
  }
});

console.log('Post-build processing for Chrome Extension completed (with CSP fixes).');
