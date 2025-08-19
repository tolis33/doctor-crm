const fs = require('fs');

try {
    const code = fs.readFileSync('imaging-window.js', 'utf8');
    new Function(code);
    console.log('✅ Syntax is valid');
} catch (error) {
    console.log('❌ Syntax error:', error.message);
    console.log('Line:', error.lineNumber || 'Unknown');
    console.log('Column:', error.columnNumber || 'Unknown');
}