# 电商数据导入脚本 - 大福纯银店铺
# 用法：.\import-dafu.ps1

$ErrorActionPreference = "Stop"

# Supabase 配置
$SUPABASE_URL = "https://ergesvxuiajxrewfpydk.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ2Vzdnh1aWFqeHJld2ZweWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIzNzksImV4cCI6MjA4OTc5ODM3OX0.tbJyeC_PixTwk6fnAE1m6w_uQ2nXMdECFBCUGeph8V0"
$SHOP_ID = 15  # 大福纯银店铺 ID

# 请求头
$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# 加载 Excel 模块
Write-Host "📦 加载 Excel 模块..." -ForegroundColor Cyan
if (!(Get-Module -ListAvailable -Name ImportExcel)) {
    Write-Host "  安装 ImportExcel 模块..." -ForegroundColor Yellow
    Install-Module -Name ImportExcel -Force -Scope CurrentUser
}
Import-Module ImportExcel

$DATA_DIR = "E:\山麓众创科技有限公司\大福纯银"

# 1. 导入店铺日概况报表
Write-Host "`n📊 1. 导入店铺日概况报表..." -ForegroundColor Cyan
$shopDailyFile = Join-Path $DATA_DIR "店铺日概况.xlsx"
if (Test-Path $shopDailyFile) {
    $data = Import-Excel -Path $shopDailyFile
    
    $rows = $data | ForEach-Object {
        @{
            shop_id = $SHOP_ID
            stat_date = $_.统计日期
            shop_name = $_.店铺名称
            visitors = [int]($_.访客数 -as [double] -as [int] -or 0)
            cart_users = [int]($_.加购人数 -as [double] -as [int] -or 0)
            paying_amount = [decimal]($_.支付金额 -as [double] -or 0)
            paying_buyers = [int]($_.支付买家数 -as [double] -as [int] -or 0)
            ad_cost_total = [decimal]($_.全站推广花费 -as [double] -or 0)
            ad_keyword_cost = [decimal]($_.关键词推广花费 -as [double] -or 0)
            ad_smart_cost = [decimal]($_.智能场景花费 -as [double] -or 0)
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/shop_daily_reports?on_conflict=shop_id,stat_date" -Headers $headers -Method Post -Body $rows
        Write-Host "  ✅ 成功导入 $($response.Count) 行店铺日报数据" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ 导入失败：$($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  文件不存在：$shopDailyFile" -ForegroundColor Yellow
}

# 2. 导入销售数据
Write-Host "`n📈 2. 导入销售数据..." -ForegroundColor Cyan
$salesFile = Join-Path $DATA_DIR "销售数据.xlsx"
if (Test-Path $salesFile) {
    $data = Import-Excel -Path $salesFile
    
    $rows = $data | ForEach-Object {
        @{
            shop_id = $SHOP_ID
            date = $_.日期
            week_day = $_.星期
            pay_amount = [decimal]($_.支付金额 -as [double] -or 0)
            pay_orders = [int]($_.支付订单数 -as [double] -as [int] -or 0)
            visitors = [int]($_.访客数 -as [double] -as [int] -or 0)
            ad_cost_total = [decimal]($_.全站推广 -as [double] -or 0)
            gross_profit = [decimal]($_.毛利 -as [double] -or 0)
            net_profit = [decimal]($_.净利 -as [double] -or 0)
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/sales_data?on_conflict=shop_id,date" -Headers $headers -Method Post -Body $rows
        Write-Host "  ✅ 成功导入 $($response.Count) 行销售数据" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ 导入失败：$($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  文件不存在：$salesFile" -ForegroundColor Yellow
}

# 3. 导入商品日报
Write-Host "`n📦 3. 导入商品日报..." -ForegroundColor Cyan
$productDailyFile = Join-Path $DATA_DIR "商品日报.xls"
if (Test-Path $productDailyFile) {
    $data = Import-Excel -Path $productDailyFile
    
    $rows = $data | ForEach-Object {
        @{
            shop_id = $SHOP_ID
            report_date = $_.日期
            product_id_external = $_.'商品 ID'
            product_name = $_.'商品名称'
            visitors = [int]($_.访客数 -as [double] -as [int] -or 0)
            paying_buyers = [int]($_.支付买家数 -as [double] -as [int] -or 0)
            paying_amount = [decimal]($_.支付金额 -as [double] -or 0)
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/product_daily_reports?on_conflict=shop_id,report_date,product_id_external" -Headers $headers -Method Post -Body $rows
        Write-Host "  ✅ 成功导入 $($response.Count) 行商品日报数据" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ 导入失败：$($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  文件不存在：$productDailyFile" -ForegroundColor Yellow
}

# 4. 导入刷单数据
Write-Host "`n📝 4. 导入刷单数据..." -ForegroundColor Cyan
$fakeOrderFile = Join-Path $DATA_DIR "刷单.xlsx"
if (Test-Path $fakeOrderFile) {
    $data = Import-Excel -Path $fakeOrderFile
    
    $rows = $data | ForEach-Object {
        @{
            shop_id = $SHOP_ID
            order_created_at = $_.时间
            paid_amount = [decimal]($_.实际付款金额 -as [double] -or 0)
            product_order_count = [int]($_.购买数量 -as [double] -as [int] -or 0)
            commission = [decimal]($_.佣金 -as [double] -or 0)
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/fake_order_reports" -Headers $headers -Method Post -Body $rows
        Write-Host "  ✅ 成功导入 $($response.Count) 行刷单数据" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ 导入失败：$($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  文件不存在：$fakeOrderFile" -ForegroundColor Yellow
}

# 5. 导入退款数据
Write-Host "`n💰 5. 导入退款数据..." -ForegroundColor Cyan
$refundFile = Join-Path $DATA_DIR "退款.xls"
if (Test-Path $refundFile) {
    $data = Import-Excel -Path $refundFile
    
    $rows = $data | Select-Object -First 50 | ForEach-Object {
        @{
            shop_id = $SHOP_ID
            order_id = $_.订单编号
            refund_id = $_.退款 ID
            refund_amount = [decimal]($_.退款金额 -as [double] -or 0)
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/refund_reports" -Headers $headers -Method Post -Body $rows
        Write-Host "  ✅ 成功导入 $($response.Count) 行退款数据" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  导入失败（可能表不存在）：$($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  文件不存在：$refundFile" -ForegroundColor Yellow
}

Write-Host "`n✅ 数据导入完成！" -ForegroundColor Green
Write-Host "请访问 http://localhost:3000 查看数据" -ForegroundColor Cyan
