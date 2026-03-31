  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const selectedFile = e instanceof File ? e : e.target.files?.[0]
    if (!selectedFile) return
    if (!selectedTemplate) { showToast('请先选择模板', 'error'); return }
    setFile(selectedFile)
    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), {type: 'array'})
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      
      // 使用数组格式读取所有数据
      const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ''})
      
      console.log('=== Excel 原始数据 ===')
      console.log('总行数:', rawData.length)
      console.log('第 1 行:', rawData[0])
      console.log('第 2 行:', rawData[1])
      
      // 提取表头（第一行）
      const headers = rawData[0] || []
      console.log('表头字段:', headers)
      
      // 从第二行开始读取数据
      const dataRows = rawData.slice(1)
      
      // 转换为对象数组
      const jsonData = dataRows.map(row => {
        const obj: any = {}
        headers.forEach((header: string, i: number) => {
          if (header && header.trim()) {
            obj[header.trim()] = row[i] || ''
          }
        })
        return obj
      }).filter(obj => Object.keys(obj).length > 0)
      
      console.log('=== JSON 格式第一行 ===')
      console.log(jsonData[0])
      console.log('字段列表:', Object.keys(jsonData[0] || {}))
      
      setPreview(jsonData.slice(0, 5))
      showToast(`已加载 ${jsonData.length} 行数据，${headers.length} 个字段`, 'success')
    } catch(err) { 
      console.error('文件解析失败:', err)
      showToast('文件解析失败：' + err.message, 'error') 
    }
  }
