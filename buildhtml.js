const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build TypeScript files for Node-RED
function buildNodeRedTypeScript() {
  const srcDir = path.join(__dirname, 'src', 'nodered');
  const nodesDir = path.join(__dirname, 'nodes');
  
  // Create nodes directory if it doesn't exist
  if (!fs.existsSync(nodesDir)) {
    fs.mkdirSync(nodesDir, { recursive: true });
  }
  
  // Compile TypeScript files
  try {
    execSync('npx tsc --project tsconfig.nodered.json', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation completed');
  } catch (error) {
    console.error('❌ TypeScript compilation failed:', error.message);
    process.exit(1);
  }
}

// Copy HTML files and inject compiled JavaScript
function copyAndInjectHTML() {
  const srcDir = path.join(__dirname, 'src', 'nodered');
  const nodesDir = path.join(__dirname, 'nodes');
  
  // Copy HTML files
  const htmlFiles = findFiles(srcDir, '.html');
  htmlFiles.forEach(htmlFile => {
    const srcPath = path.join(srcDir, htmlFile);
    const destPath = path.join(nodesDir, htmlFile);
    fs.copyFileSync(srcPath, destPath);
    console.log(`📋 Copied ${htmlFile}`);
  });
  
  // Find all HTML files in the nodes directory
  const nodesHtmlFiles = findFiles(nodesDir, '.html');
  
  nodesHtmlFiles.forEach(htmlFile => {
    const htmlPath = path.join(nodesDir, htmlFile);
    const tsFile = htmlFile.replace('.html', '.ts');
    const tsPath = path.join(srcDir, tsFile);
    const jsFile = htmlFile.replace('.html', '.js');
    const jsPath = path.join(nodesDir, jsFile);
    
    if (fs.existsSync(tsPath) && fs.existsSync(jsPath)) {
      console.log(`📝 Processing ${htmlFile}...`);
      
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      // Remove existing script tags
      htmlContent = htmlContent.replace(/<script type="text\/javascript">[\s\S]*?<\/script>/g, '');
      
      // Add the compiled JavaScript
      const scriptTag = `<script type="text/javascript">\n${jsContent}\n</script>`;
      
      // Insert the script tag before the closing </script> tags
      const scriptInsertionPoint = htmlContent.lastIndexOf('</script>');
      if (scriptInsertionPoint !== -1) {
        htmlContent = htmlContent.slice(0, scriptInsertionPoint) + scriptTag + '\n' + htmlContent.slice(scriptInsertionPoint);
      } else {
        // If no script tags found, add at the end
        htmlContent += '\n' + scriptTag;
      }
      
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`✅ Updated ${htmlFile}`);
      
      // Remove the compiled JS file since it's now embedded
      fs.unlinkSync(jsPath);
    }
  });
}

// Helper function to find files recursively
function findFiles(dir, extension) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith(extension)) {
        files.push(path.relative(dir, fullPath));
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Main execution
console.log('🔨 Building Node-RED HTML files...');
buildNodeRedTypeScript();
copyAndInjectHTML();
console.log('✅ Node-RED build completed!'); 