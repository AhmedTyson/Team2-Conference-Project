const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'fullstack/Frontend/public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Update assets paths
    content = content.replace(/(href|src)="assets\//g, '$1="../assets/');
    
    // Update auth paths (e.g. href="login.html" -> href="../auth/login.html", href="auth/login.html" -> href="../auth/login.html")
    content = content.replace(/(href|src)="auth\//g, '$1="../auth/');
    content = content.replace(/(href|src)="login\.html"/g, '$1="../auth/login.html"');
    content = content.replace(/(href|src)="register\.html"/g, '$1="../auth/register.html"');
    content = content.replace(/(href|src)="forgot\.html"/g, '$1="../auth/forgot.html"');
    
    // Update app paths
    content = content.replace(/(href|src)="app\//g, '$1="../app/');
    
    // Update admin paths
    content = content.replace(/(href|src)="admin\//g, '$1="../admin/');
    
    // Update agency paths
    content = content.replace(/(href|src)="agency\//g, '$1="../agency/');

    fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Updated paths in public HTML files");
