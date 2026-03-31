const fs = require('fs');
const path = require('path');

const dir = 'E:\\山麓众创科技有限公司\\太古';

console.log('\n📁 太古文件夹内容:\n');

try {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const size = stat.isDirectory() ? '[文件夹]' : stat.size + ' 字节';
    console.log(`  ${file} - ${size}`);
  });
  
  // 读取 Excel 文件（如果是 xlsx 格式）
  const xlsxFile = files.find(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  if (xlsxFile) {
    console.log(`\n📄 找到 Excel 文件：${xlsxFile}`);
    console.log(`   路径：${path.join(dir, xlsxFile)}`);
  }
} catch (e) {
  console.log('错误:', e.message);
}

console.log('\n');
