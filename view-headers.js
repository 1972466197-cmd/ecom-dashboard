// Excel 表头查看工具
// 用法：node view-headers.js 文件名.xlsx

const XLSX = require('xlsx')
const path = require('path')

if (process.argv.length < 3) {
  console.log('用法：node view-headers.js <Excel 文件路径>')
  console.log('例如：node view-headers.js "E:\\店铺日概况.xlsx"')
  process.exit(1)
}

const filePath = process.argv[2]

try {
  console.log('📄 读取文件:', filePath)
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  console.log('📊 工作表:', sheetName)
  
  const worksheet = workbook.Sheets[sheetName]
  
  // 获取原始表头（第一行）
  const rawData = XLSX.utils.sheet_to_json(worksheet, {header: 1})
  const headers = rawData[0]
  
  console.log('\n=== Excel 表头（共', headers.length, '列）===\n')
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i) // A, B, C...
    console.log(`${col}列："${h}" (类型：${typeof h})`)
  })
  
  // 显示第一行数据
  console.log('\n=== 第一行数据示例 ===\n')
  const firstRow = rawData[1]
  if (firstRow) {
    headers.forEach((h, i) => {
      console.log(`${h}: ${firstRow[i]}`)
    })
  }
  
  // 保存表头到文件
  const output = {
    headers: headers,
    sample: firstRow
  }
  require('fs').writeFileSync('excel-headers.json', JSON.stringify(output, null, 2))
  console.log('\n✅ 表头已保存到 excel-headers.json')
  
} catch (err) {
  console.error('❌ 错误:', err.message)
}
