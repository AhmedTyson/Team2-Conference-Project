const fs = require('fs');
const { execSync } = require('child_process');

const MASTER_PAGE_ID = '3b02c9c0-7e66-818a-8fbf-dd3de6dba77d';

console.log('Fetching Master Page...');
let masterMd = execSync(`npx --yes ntn pages get ${MASTER_PAGE_ID}`).toString();

// 1. Extract Subpage IDs
const pageRegex = /<page url="https:\/\/app\.notion\.com\/p\/([a-zA-Z0-9]+)">/g;
let subpageIds = [];
let match;
while ((match = pageRegex.exec(masterMd)) !== null) {
  // Notion URLs usually strip dashes, ntn pages edit accepts them either way or with dashes.
  // We'll capture the raw ID string.
  subpageIds.push(match[1]);
}
console.log(`Found ${subpageIds.length} subpages to update.`);

// 2. Inject New Global Conventions into Master Page
const newConventions = `## Global Conventions

### 🏗️ API Architecture & Versioning
- **Base URL:** All endpoints are prefixed with \`/api/v1/\` to ensure future backward compatibility.
- **Pagination:** All collection endpoints return a \`meta\` object containing pagination details.

### ☁️ File Storage (Railway Constraints)
<callout icon="☁️" color="blue_bg">
	**S3 Absolute URLs:** Railway uses ephemeral storage. All image uploads (Profiles, Trips) are saved to S3. The API will always return **absolute HTTPS URLs** for \`image\` fields.
</callout>

### ⏳ Asynchronous Processing & Polling
<callout icon="⏱️" color="orange_bg">
	**202 Accepted:** Endpoints hitting OpenAI (e.g., \`/generate-ai\`) execute via background jobs to prevent HTTP timeouts. The API returns \`202 Accepted\` immediately. Frontend must poll the resource or listen for websocket events.
</callout>

### 🛑 Strict Rate Limiting
- **Global API Limit:** 60 requests per minute per IP/User.
- **Paid Endpoints Limit:** Routes utilizing OpenAI or RapidAPI are heavily throttled to **3 requests per minute**. Exceeding this yields a \`429 Too Many Requests\`.

`;

// Replace the old Global Conventions header with the new one
masterMd = masterMd.replace('## Global Conventions\n', newConventions);

// 3. Replace /api/ with /api/v1/ globally in Master Page
masterMd = masterMd.replace(/\/api\//g, '/api/v1/');

fs.writeFileSync('C:/Programming/conference/Team2-Conference-Project/docs/temp_master_v1.md', masterMd);
console.log('Pushing updates to Master Page...');
execSync(`npx --yes ntn pages edit ${MASTER_PAGE_ID} < "C:/Programming/conference/Team2-Conference-Project/docs/temp_master_v1.md"`);

// 4. Loop through subpages and update /api/ to /api/v1/
for (let i = 0; i < subpageIds.length; i++) {
    let subId = subpageIds[i];
    console.log(`Updating Subpage ${i+1}/${subpageIds.length} (ID: ${subId})...`);
    try {
        let subMd = execSync(`npx --yes ntn pages get ${subId}`).toString();
        // Skip if already v1
        if (!subMd.includes('/api/v1/')) {
            subMd = subMd.replace(/\/api\//g, '/api/v1/');
            let tempFile = `C:/Programming/conference/Team2-Conference-Project/docs/temp_sub_${subId}.md`;
            fs.writeFileSync(tempFile, subMd);
            execSync(`npx --yes ntn pages edit ${subId} < "${tempFile}"`);
            fs.unlinkSync(tempFile);
        }
    } catch (e) {
        console.error(`Failed to update subpage ${subId}:`, e.message);
    }
}

console.log('API Versioning and Conventions fully applied to all Notion pages!');
