const AdmZip = require('adm-zip');
const path = require('path');

const zipPath = 'E:\\山麓众创科技有限公司\\太古\\太古店铺数据统计 1.zip';

console.log('\n📦 解压并查看太古店铺数据统计 1.zip:\n');

try {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  
  console.log('压缩包内容:');
  entries.forEach(entry => {
    console.log(`  ${entry.entryName} (${entry.header.size} 字节)`);
  });
  
  // 读取第一个 Excel 文件
  const excelEntry = entries.find(e => e.entryName.endsWith('.xlsx') || e.entryName.endsWith('.xls'));
  if (excelEntry) {
    console.log(`\n✅ 找到 Excel 文件：${excelEntry.entryName}`);
    console.log(`   大小：${excelEntry.header.size} 字节`);
  }
} catch (e) {
  console.log('错误:', e.message);
  console.log('\n提示：需要安装 adm-zip 模块：npm install adm-zip');
}

console.log('\n');
