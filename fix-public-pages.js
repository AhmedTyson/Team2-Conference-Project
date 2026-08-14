/**
 * fix-public-pages.js
 * Fixes all public/*.html pages:
 *  1. Removes duplicate script tags (config.js, api.js, session.js loaded twice)
 *  2. Removes old app-shell.js and nav-config.js (not needed in new arch)
 *  3. Ensures FA is included
 *  4. Ensures topbar-right is empty (topbar.js fills it dynamically)
 *  5. Fixes FOUC to use classList.add('dark') instead of setAttribute('data-theme')
 */

const fs = require('fs');
const path = require('path');
const glob = require('path');

const publicDir = 'fullstack/Frontend/public';
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const FA_LINK = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">';

let fixed = 0;

files.forEach(fname => {
  const full = path.join(publicDir, fname);
  let html = fs.readFileSync(full, 'utf8');
  const orig = html;

  // 1. Fix FOUC script to use classList.add('dark') not setAttribute
  html = html.replace(
    /document\.documentElement\.setAttribute\(['"]data-theme['"],\s*['"]dark['"]\)/g,
    "document.documentElement.classList.add('dark')"
  );

  // 2. Add FA if missing
  if (!html.includes('font-awesome') && !html.includes('fontawesome')) {
    html = html.replace('</head>', FA_LINK + '\n</head>');
  }

  // 3. Remove duplicate script tags within the script block
  // (keep first occurrence, remove subsequent ones)
  const scriptSources = ['core/config.js', 'core/api.js', 'core/session.js'];
  scriptSources.forEach(src => {
    const pattern = new RegExp('<script src="[^"]*' + src.replace('.', '\\.') + '"[^>]*><\\/script>', 'g');
    let count = 0;
    html = html.replace(pattern, match => {
      count++;
      return count === 1 ? match : '';
    });
  });

  // 4. Remove old nav-config.js and app-shell.js references
  html = html.replace(/<script src="[^"]*nav-config\.js[^"]*"><\/script>\r?\n?/g, '');
  html = html.replace(/<script src="[^"]*app-shell\.js[^"]*"><\/script>\r?\n?/g, '');

  // 5. Remove It.app.boot() script blocks (no longer needed)
  html = html.replace(/<script>\s*It\.app\.boot\(\);\s*<\/script>\r?\n?/g, '');

  if (html !== orig) {
    fs.writeFileSync(full, html, 'utf8');
    console.log('Fixed: ' + fname);
    fixed++;
  } else {
    console.log('No changes: ' + fname);
  }
});

console.log('\nTotal fixed: ' + fixed + '/' + files.length);
