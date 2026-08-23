const fs = require('fs');
const path = require('path');

const EXCLUDES = ['node_modules', '.next', '.git'];
const EXTENSIONS = ['.ts', '.tsx', '.json'];

function walkAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (EXCLUDES.includes(file)) continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            walkAndReplace(fullPath);
        } else if (EXTENSIONS.includes(path.extname(fullPath)) || file === 'package.json') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            if (content.includes('@villa-platform/auth')) {
                content = content.replace(/@villa-platform\/auth/g, '@villa-platform/identity');
                modified = true;
            }
            if (content.includes('@villa-platform/rbac')) {
                content = content.replace(/@villa-platform\/rbac/g, '@villa-platform/authorization');
                modified = true;
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated', fullPath);
            }
        }
    }
}

walkAndReplace(process.cwd());
console.log('Done');
