import fs from 'fs';
const content = fs.readFileSync('f:/Mern_stack_project/hotelhive/frontend/src/pages/UserDashboard.js', 'utf8');

let stack = [];
let pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>'
};

// Very simple tokenizer for brackets
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(' || char === '[' || char === '{') {
        stack.push({ char, pos: i });
    } else if (char === ')' || char === ']' || char === '}') {
        if (stack.length > 0) {
            const last = stack[stack.length - 1];
            if (pairs[last.char] === char) {
                stack.pop();
            } else {
                console.log(`Mismatch: found ${char} at ${i}, expected ${pairs[last.char]} for ${last.char} at ${last.pos}`);
            }
        } else {
            console.log(`Extra ${char} at ${i}`);
        }
    }
}

stack.forEach(s => {
    // find line number
    const lineNum = content.substring(0, s.pos).split('\n').length;
    console.log(`Unclosed ${s.char} from line ${lineNum}`);
});
