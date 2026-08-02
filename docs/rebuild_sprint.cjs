const fs = require('fs');
const { execSync } = require('child_process');

const PAGE_ID = '3b02c9c0-7e66-818a-8fbf-dd3de6dba77d';

const modules = [
  {
    title: '🔐 Auth Module',
    assignee: 'SARA / LOJY',
    endpoints: [
      ['POST', '/api/auth/register', 'User Registration.', '🌐 Public'],
      ['POST', '/api/auth/login', 'Login / Role-Based Access Setup.', '🌐 Public'],
      ['POST', '/api/auth/logout', 'Invalidate session token.', '🔒 Auth'],
      ['POST', '/api/auth/forgot-password', 'Request password reset.', '🌐 Public'],
      ['POST', '/api/auth/verify-email', 'Verify Email.', '🔒 Auth'],
      ['GET', '/api/profile', 'Fetch Profile Management data.', '👤 Owner'],
      ['PATCH', '/api/profile', 'Update Profile Management data.', '👤 Owner']
    ]
  },
  {
    title: '📋 User Onboarding (Survey)',
    assignee: 'SAMA',
    endpoints: [
      ['GET', '/api/onboarding', 'Get user preferences.', '👤 Owner'],
      ['POST', '/api/onboarding', 'Save Travel Style, Budget, Interests.', '👤 Owner']
    ]
  },
  {
    title: '🗺️ Trip Planner Engine',
    assignee: 'FADY / ADHAM',
    endpoints: [
      ['GET', '/api/trips/create', 'Select Destination, Days, Budget.', '🔒 Auth'],
      ['POST', '/api/trips', 'Save basic Trip parameters.', '🔒 Auth'],
      ['GET', '/api/trips/{trip}', 'View Daily Travel Itinerary.', '👤 Owner'],
      ['POST', '/api/trips/{trip}/attach/{type}', 'Attach Hotels / Restaurants.', '👤 Owner'],
      ['DELETE', '/api/trips/{trip}/detach/{id}', 'Remove attached items.', '👤 Owner']
    ]
  },
  {
    title: '🌍 Explore Directory',
    assignee: 'KENZY / HANA',
    endpoints: [
      ['GET', '/api/destinations', 'List all destinations + filters.', '🌐 Public'],
      ['GET', '/api/destinations/{id}', 'Destination details + Leaflet map.', '🌐 Public'],
      ['GET', '/api/hotels', 'List hotels + search & filter.', '🌐 Public'],
      ['GET', '/api/hotels/{id}', 'Hotel details.', '🌐 Public'],
      ['GET', '/api/restaurants', 'List restaurants + filter.', '🌐 Public'],
      ['GET', '/api/restaurants/{id}', 'Restaurant details.', '🌐 Public'],
      ['GET', '/api/attractions', 'List attractions.', '🌐 Public'],
      ['GET', '/api/attractions/{id}', 'Attraction details.', '🌐 Public']
    ]
  },
  {
    title: '🏷️ Categories Module',
    assignee: 'RANA',
    endpoints: [
      ['GET', '/api/categories', 'List categories as clickable cards.', '🌐 Public'],
      ['GET', '/api/categories/{id}', 'View everything in a specific category.', '🌐 Public']
    ]
  },
  {
    title: '💬 User Interactions (Community)',
    assignee: 'TYSON',
    endpoints: [
      ['POST', '/api/favourites/{type}/{id}', 'Add/Remove Favorite (Polymorphic).', '🔒 Auth'],
      ['POST', '/api/reviews/{type}/{id}', 'Submit a review (saved as pending).', '🔒 Auth'],
      ['DELETE', '/api/reviews/{id}', 'Delete user review.', '👤 Owner']
    ]
  },
  {
    title: '🤖 AI & API Proxies',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/weather/{city}', 'Weather API: Current weather, temp, wind.', '🌐 Public'],
      ['POST', '/api/trips/{trip}/generate-ai', 'Trigger OpenAI Itinerary Generation.', '👤 Owner']
    ]
  },
  {
    title: '📍 Interactive Maps',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/maps/destination/{id}', 'Attractions, Hotels, Restaurants Locations.', '🌐 Public'],
      ['GET', '/api/maps/trip/{id}', 'Route Directions between trip itinerary points.', '👤 Owner']
    ]
  },
  {
    title: '📊 User Dashboard',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/dashboard', 'Trip Statistics & Overview.', '👤 Owner'],
      ['GET', '/api/dashboard/trips', 'Saved Trips & Booking History.', '👤 Owner'],
      ['GET', '/api/dashboard/favourites', 'Favorite Destinations & Places.', '👤 Owner']
    ]
  },
  {
    title: '💳 Payments & Transactions (Pending)',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['POST', '/api/payments/checkout', 'Init Stripe/PayPal booking session.', '🔒 Auth'],
      ['POST', '/api/payments/webhook', 'Receive payment gateway callbacks.', '🌐 Public'],
      ['GET', '/api/transactions', 'List user payment history/receipts.', '👤 Owner']
    ]
  },
  {
    title: '👥 Admin Users',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/admin/users', 'View Users.', '🛡️ Admin'],
      ['POST', '/api/admin/users', 'Add Users.', '🛡️ Admin'],
      ['PUT', '/api/admin/users/{id}', 'Edit Users.', '🛡️ Admin'],
      ['PATCH', '/api/admin/users/{id}/activate', 'Activate Account.', '🛡️ Admin'],
      ['PATCH', '/api/admin/users/{id}/block', 'Block Account.', '🛡️ Admin']
    ]
  },
  {
    title: '✈️ Admin Trips',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/admin/trips', 'View Trips.', '🛡️ Admin'],
      ['PUT', '/api/admin/trips/{id}', 'Edit Trips.', '🛡️ Admin'],
      ['DELETE', '/api/admin/trips/{id}', 'Delete Trips.', '🛡️ Admin']
    ]
  },
  {
    title: '📍 Admin Destinations',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET/POST/PUT', '/api/admin/countries', 'Countries CRUD.', '🛡️ Admin'],
      ['GET/POST/PUT', '/api/admin/destinations', 'Destinations/Cities CRUD.', '🛡️ Admin'],
      ['GET/POST/PUT', '/api/admin/attractions', 'Attractions CRUD.', '🛡️ Admin']
    ]
  },
  {
    title: '🏨 Admin Hotels & Restaurants',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET/POST/PUT', '/api/admin/hotels', 'Hotels CRUD.', '🛡️ Admin'],
      ['GET/POST/PUT', '/api/admin/restaurants', 'Restaurants CRUD.', '🛡️ Admin']
    ]
  },
  {
    title: '🏷️ Admin Categories',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET/POST/PUT', '/api/admin/categories', 'Manage Beaches, Mountains, etc.', '🛡️ Admin']
    ]
  },
  {
    title: '🚨 Admin Reviews Moderation',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/admin/reviews', 'View all reviews.', '🛡️ Admin'],
      ['PATCH', '/api/admin/reviews/{id}/approve', 'Approve Review (Publish).', '🛡️ Admin'],
      ['PATCH', '/api/admin/reviews/{id}/reject', 'Reject Review (Hide).', '🛡️ Admin'],
      ['DELETE', '/api/admin/reviews/{id}', 'Delete Reviews.', '🛡️ Admin']
    ]
  },
  {
    title: '✉️ Admin Contacts Inbox',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/admin/contacts', 'Manage user inquiries.', '🛡️ Admin'],
      ['PATCH', '/api/admin/contacts/{id}/read', 'Mark message as Read.', '🛡️ Admin'],
      ['PATCH', '/api/admin/contacts/{id}/resolve', 'Mark message as Resolved.', '🛡️ Admin']
    ]
  },
  {
    title: '⚙️ Admin Analytics & Settings',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/admin/analytics', 'Analytics Charts (Users, Revenue).', '🛡️ Admin'],
      ['GET', '/api/admin/settings', 'Manage Logo, Site Name, Socials.', '🛡️ Admin'],
      ['PUT', '/api/admin/settings', 'Save Settings.', '🛡️ Admin']
    ]
  },
  {
    title: '📄 Admin Reports (Pending)',
    assignee: 'FUTURE SPRINTS',
    endpoints: [
      ['GET', '/api/admin/reports', 'List generated PDF/CSV exports.', '🛡️ Admin'],
      ['POST', '/api/admin/reports/generate', 'Generate Revenue/Growth reports.', '🛡️ Admin']
    ]
  }
];

function renderTable(endpoints, assignee) {
  let table = '<table header-row="true">\n<tr><td>#</td><td>Method</td><td>Route</td><td>Description</td><td>Authorize</td><td>Backend</td></tr>\n';
  let counter = 1;
  for (let e of endpoints) {
    table += `<tr><td>${counter}</td><td>${e[0]}</td><td>\`${e[1]}\`</td><td>${e[2]}</td><td>${e[3]}</td><td>${assignee}</td></tr>\n`;
    counter++;
  }
  table += '</table>\n';
  return table;
}

let finalMasterMd = `# 🌍 ThreeDOS Unified API Specification

<callout icon="💡" color="blue_bg">
	**Purpose of this document:** <span color="yellow_bg">frontend/backend integration contract. This is the source used to generate OpenAPI/Postman collections. Every endpoint below defines exactly what the frontend sends and what it gets back — no backend implementation detail included, since that's not where integration problems come from.</span>
</callout>
---

## 🗂️ Table of Contents (Modules)

### 🏃‍♂️ Sprint 1 (Active)
<page url="https://app.notion.com/p/3b02c9c07e6681ad86a7c8d57086c462">🔐 Auth Module</page>
<page url="https://app.notion.com/p/3b02c9c07e668183969cf53adfdfc5a4">📋 User Onboarding (Survey)</page>
<page url="https://app.notion.com/p/3b02c9c07e668108afa4f97a3482b704">🗺️ Trip Planner Engine</page>
<page url="https://app.notion.com/p/3b02c9c07e668180853ff3dd092c284b">🌍 Explore Directory</page>
<page url="https://app.notion.com/p/3b02c9c07e6681ca9fc6f5c1f27ad679">🏷️ Categories Module</page>
<page url="https://app.notion.com/p/3b02c9c07e66819e8450c1175e23de0b">💬 User Interactions (Community)</page>

### 📅 Future Sprints (Backlog)
<page url="https://app.notion.com/p/3b02c9c07e6681c6a062f4ffe8b56f3a">🤖 AI & API Proxies</page>
<page url="https://app.notion.com/p/3b02c9c07e6681fdb100c765961df9fc">📍 Interactive Maps</page>
<page url="https://app.notion.com/p/3b02c9c07e6681b9b838da389c11327e">📊 User Dashboard</page>
<page url="https://app.notion.com/p/3b02c9c07e6681589f33f7c721010856">💳 Payments & Transactions (Pending)</page>
<page url="https://app.notion.com/p/3b02c9c07e6681149145c822118ef3c4">👥 Admin Users</page>
<page url="https://app.notion.com/p/3b02c9c07e6681aab1d8fb635992e0e5">✈️ Admin Trips</page>
<page url="https://app.notion.com/p/3b02c9c07e6681f3a700e95e4ae51090">📍 Admin Destinations</page>
<page url="https://app.notion.com/p/3b02c9c07e6681e5b9ebe0917d5e1d71">🏨 Admin Hotels & Restaurants</page>
<page url="https://app.notion.com/p/3b02c9c07e66811786c7c3399dc05513">🏷️ Admin Categories</page>
<page url="https://app.notion.com/p/3b02c9c07e668101891feb764bed6bda">🚨 Admin Reviews Moderation</page>
<page url="https://app.notion.com/p/3b02c9c07e6681349088f1884a9ddf49">✉️ Admin Contacts Inbox</page>
<page url="https://app.notion.com/p/3b02c9c07e6681e7abb0c834b708800b">⚙️ Admin Analytics & Settings</page>
<page url="https://app.notion.com/p/3b02c9c07e66814b825fe9068b43daac">📄 Admin Reports (Pending)</page>

---
## Global Conventions
<callout icon="🚨" color="red_bg">
	**FRONTEND TEAM:** The access token MUST be sent in the \`Authorization: Bearer {token}\` HTTP header. **NEVER** put the token inside the JSON request body.
</callout>

### Standard Response Envelope
<callout icon="✅" color="green_bg">
	**Success:**
	\`\`\`json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
	\`\`\`
</callout>
<callout icon="🚨" color="red_bg">
	**Error:**
	\`\`\`json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": { }
}
	\`\`\`
	<span color="red">Note:</span> \`errors\` is only present on \`422\` validation failures.
</callout>

### Status Code Legend (used across every endpoint)
<table header-row="true">
<tr><td>Code</td><td>Meaning</td><td>When</td></tr>
<tr><td>\`200\`</td><td>OK</td><td>Successful GET/PUT/POST that doesn't create a resource</td></tr>
<tr><td>\`201\`</td><td>Created</td><td>Successful POST that creates a new resource</td></tr>
<tr><td>\`204\`</td><td>No Content</td><td>Successful DELETE</td></tr>
<tr><td>\`400\`</td><td>Bad Request</td><td>Malformed request (rare → usually caught by 422 instead)</td></tr>
<tr><td>\`401\`</td><td>Unauthorized</td><td>Missing/invalid/expired token</td></tr>
<tr><td>\`403\`</td><td>Forbidden</td><td>Valid token, but wrong role or not the resource owner</td></tr>
<tr><td>\`404\`</td><td>Not Found</td><td>Resource ID doesn't exist</td></tr>
<tr><td>\`422\`</td><td>Unprocessable Entity</td><td>Validation failed</td></tr>
<tr><td>\`429\`</td><td>Too Many Requests</td><td>Rate limit hit</td></tr>
<tr><td>\`500\`</td><td>Server Error</td><td>Unhandled failure — frontend should show generic error state</td></tr>
</table>

### Access Level Key
- 🌐 **Public** → no token needed
- 🔒 **Auth** → any logged-in user (customer or admin)
- 🛡️ **Admin** → logged-in user with \`role = admin\`
- 👤 **Owner** → logged-in user, and must own the resource (checked server-side via Policy)

---
## 1. Quick Reference — Endpoint Summary Tables

### 🏃‍♂️ Sprint 1 (Deadline: Sunday 11:59 pm)
> Backend tasks assigned based on team structure.

`;

let globalCounter = 1;
// Sprint 1
for (let i = 0; i <= 5; i++) {
  let mod = modules[i];
  finalMasterMd += `### 1.${globalCounter} ${mod.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}\n`;
  finalMasterMd += renderTable(mod.endpoints, mod.assignee) + '\n';
  globalCounter++;
}

finalMasterMd += '\n---\n### 📅 Future Sprints (Backlog)\n> These modules are scheduled for later sprints.\n\n';

// Future Sprints
for (let i = 6; i < modules.length; i++) {
  let mod = modules[i];
  finalMasterMd += `### 1.${globalCounter} ${mod.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}\n`;
  finalMasterMd += renderTable(mod.endpoints, mod.assignee) + '\n';
  globalCounter++;
}

fs.writeFileSync('C:/Programming/conference/Team2-Conference-Project/docs/temp_master_revert.md', finalMasterMd);

console.log('Pushing to Notion...');
execSync(`npx --yes ntn pages edit ${PAGE_ID} < "C:/Programming/conference/Team2-Conference-Project/docs/temp_master_revert.md"`);
console.log('Update Complete!');
