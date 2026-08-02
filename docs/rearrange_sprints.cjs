const fs = require('fs');
let md = fs.readFileSync('C:/Programming/conference/Team2-Conference-Project/docs/temp_master.md', 'utf-8');

// 1. Replace RANA with FUTURE SPRINTS
md = md.replace(/RANA/g, 'FUTURE SPRINTS');

// 2. Split document
const parts = md.split('## Global Conventions');
let topPart = parts[0];
let bottomPart = '## Global Conventions' + parts[1];

// Process TOP PART (Table of Contents)
const pageRegex = /<page url="[^"]+">(.+?)<\/page>/g;
let pages = [];
let match;
while ((match = pageRegex.exec(topPart)) !== null) {
  pages.push(match[0]);
}

// Sprint 1 Pages (Indices: 0=Auth, 1=Onboarding, 2=Trip, 3=Explore, 5=Interactions)
let sprint1Pages = [pages[0], pages[1], pages[2], pages[3], pages[5]];
// Future Pages (Indices: 4=Categories, 6..18=Rest)
let futurePages = [pages[4]].concat(pages.slice(6));

// Remove old pages block
topPart = topPart.replace(/<page url="[^"]+">.+?<\/page>\n?/g, '');

let newTopPart = topPart.trim() + '\n\n### 🏃‍♂️ Sprint 1 (Active)\n' + sprint1Pages.join('\n') + '\n\n### 📅 Future Sprints (Backlog)\n' + futurePages.join('\n') + '\n\n';

// Process BOTTOM PART (Summary Tables)
const tableParts = bottomPart.split('### 1.');
let conventionsAndHeader = tableParts[0];

let tableBlocks = [];
for (let i = 1; i < tableParts.length; i++) {
  tableBlocks.push('### 1.' + tableParts[i]);
}

// Group tables
let sprint1Tables = [tableBlocks[0], tableBlocks[1], tableBlocks[2], tableBlocks[3], tableBlocks[5]];
let futureTables = [tableBlocks[4]].concat(tableBlocks.slice(6));

conventionsAndHeader = conventionsAndHeader.replace('> Backend tasks assigned based on team structure. Sprint 1 Deadline: Sunday 11:59 pm.\n', '');

let newBottomPart = conventionsAndHeader + 
  '\n### 🏃‍♂️ Sprint 1 (Deadline: Sunday 11:59 pm)\n> Backend tasks assigned based on team structure.\n\n' + 
  sprint1Tables.join('') + 
  '\n---\n### 📅 Future Sprints (Backlog)\n> These modules are deferred since Rana is away, and the rest are scheduled for later sprints.\n\n' + 
  futureTables.join('');

let finalMd = newTopPart + '---\n' + newBottomPart;

fs.writeFileSync('C:/Programming/conference/Team2-Conference-Project/docs/temp_master_updated.md', finalMd);
console.log('Markdown successfully restructured.');
