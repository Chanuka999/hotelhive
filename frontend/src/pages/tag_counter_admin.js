import fs from 'fs';
const content = fs.readFileSync('f:/Mern_stack_project/hotelhive/frontend/src/pages/AdminAnalytics.js', 'utf8');

let openDivs = (content.match(/<div\b/g) || []).length;
let closeDivs = (content.match(/<\/div>/g) || []).length;
let openSections = (content.match(/<section\b/g) || []).length;
let closeSections = (content.match(/<\/section>/g) || []).length;

console.log(`Open Divs: ${openDivs}, Close Divs: ${closeDivs}`);
console.log(`Open Sections: ${openSections}, Close Sections: ${closeSections}`);
