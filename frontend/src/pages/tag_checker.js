import fs from 'fs';
const content = fs.readFileSync('f:/Mern_stack_project/hotelhive/frontend/src/pages/UserDashboard.js', 'utf8');
const lines = content.split('\n');
let divStack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openMatches = line.matchAll(/<div/g);
    for (const match of openMatches) {
        divStack.push({ line: i + 1, col: match.index + 1 });
    }
    const closeMatches = line.matchAll(/<\/div>/g);
    for (const match of closeMatches) {
        if (divStack.length > 0) {
            const last = divStack.pop();
            // Optional: log everything
        } else {
            console.log(`Extra </div> at line ${i + 1}:${match.index + 1}`);
        }
    }
}

divStack.forEach(d => console.log(`Unclosed <div> from line ${d.line}`));
