const fs = require('fs');
const path = require('path');

function replaceIcons(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceIcons(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("from 'lucide-react'")) {
                content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g, (match, p1) => {
                    const icons = p1.split(',').map(i => i.trim()).filter(i => i);
                    const aliases = icons.map(i => `Lu${i} as ${i}`);
                    return `import { ${aliases.join(', ')} } from 'react-icons/lu';`;
                });
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceIcons(path.join(__dirname, 'src'));
