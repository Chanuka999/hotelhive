import fs from 'fs';
const content = fs.readFileSync('f:/Mern_stack_project/hotelhive/frontend/src/pages/UserDashboard.js', 'utf8');

const lines = content.split('\n');
let tagStack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find all tags: <tagName or </tagName> or <tagName ... />
    // This is hard to do with naive regex if tags span multiple lines.
    // But let's look for tags that start with < and end on the SAME line if possible.
}

// Better Approach: check for unclosed div/section manually
const openDivs = (content.match(/<div(?![^>]*\/>)/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
const openSections = (content.match(/<section(?![^>]*\/>)/g) || []).length;
const closeSections = (content.match(/<\/section>/g) || []).length;

console.log(`Open Divs: ${openDivs}, Close Divs: ${closeDivs}`);
console.log(`Open Sections: ${openSections}, Close Sections: ${closeSections}`);
