const fs = require('fs');

// 从 git 读取原始内容
const { execSync } = require('child_process');
const buffer = execSync('git show f80afaf:src/app/import/page.tsx', { 
  cwd: process.cwd(),
  encoding: 'buffer',
  maxBuffer: 50 * 1024 * 1024
});

console.log('First 20 bytes:', buffer.slice(0, 20).toString('hex'));

// 检查并移除 BOM
let content;
if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
  console.log('UTF-8 BOM detected, removing...');
  content = buffer.slice(3).toString('utf8');
} else if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
  console.log('UTF-16 LE BOM detected, converting...');
  content = buffer.slice(2).toString('utf16le');
} else {
  console.log('No BOM, reading as UTF-16LE then converting to UTF-8');
  content = buffer.toString('utf16le');
}

// 写入为纯 UTF-8（无 BOM）
fs.writeFileSync('src/app/import/page.tsx', content, 'utf8');
console.log('✓ File restored and saved as UTF-8 without BOM');

// 验证
const verify = fs.readFileSync('src/app/import/page.tsx', 'utf8');
console.log('First line:', verify.split('\n')[0]);
