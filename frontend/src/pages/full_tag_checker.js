import fs from 'fs';
const content = fs.readFileSync('f:/Mern_stack_project/hotelhive/frontend/src/pages/UserDashboard.js', 'utf8');

const lines = content.split('\n');
let tagStack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find all tags: <tag or </tag>
    const matches = line.matchAll(/<([\/]?)([a-zA-Z0-9]+)/g);
    for (const match of matches) {
        const isClosing = match[1] === '/';
        const tagName = match[2];
        
        if (tagName === 'img' || tagName === 'input' || tagName === 'br' || tagName === 'hr' || tagName === 'rect' || tagName === 'line' || tagName === 'circle' || tagName === 'path' || tagName === 'polygon' || tagName === 'polyline') {
            continue; // void tags
        }

        if (isClosing) {
            if (tagStack.length > 0) {
                const last = tagStack[tagStack.length - 1];
                if (last.tag === tagName) {
                    tagStack.pop();
                } else {
                    console.log(`Mismatch at line ${i+1}: found </${tagName}>, but last open was <${last.tag}> from line ${last.line}`);
                }
            } else {
                console.log(`Extra </${tagName}> at line ${i+1}`);
            }
        } else {
            tagStack.push({ tag: tagName, line: i + 1 });
        }
    }
}

tagStack.forEach(t => console.log(`Unclosed <${t.tag}> from line ${t.line}`));
