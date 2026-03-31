const fs = require('fs');
const { execSync } = require('child_process');

// 从 git 读取原始 buffer
const buffer = execSync('git show f80afaf:src/app/import/page.tsx', { 
  cwd: process.cwd(),
  encoding: 'buffer',
  maxBuffer: 50 * 1024 * 1024
});

console.log('First 20 bytes:', buffer.slice(0, 20).toString('hex'));

// UTF-16LE BOM is FF FE
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
  console.log('UTF-16 LE detected, converting to UTF-8...');
  const content = buffer.slice(2).toString('utf16le');
  fs.writeFileSync('src/app/import/page.tsx', content, 'utf8');
  console.log('✓ Converted to UTF-8');
} else {
  console.log('Not UTF-16LE, copying as-is');
  fs.copyFileSync('temp-import.tsx', 'src/app/import/page.tsx');
}

// Verify
const verify = fs.readFileSync('src/app/import/page.tsx', 'utf8');
console.log('First line:', verify.split('\n')[0]);
