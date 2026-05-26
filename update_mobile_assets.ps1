$ErrorActionPreference = "Stop"

$distPath = "C:\Users\SSAFY\Desktop\risu\risuai 원본 수정하지말것\dist"
$targetPath = "C:\Users\SSAFY\Desktop\risu\risuai mobile\app\src\main\assets"
$targetAssetsPath = "$targetPath\assets"

Write-Host "Starting update assets..."

# 1. dist/index.html에서 새 JS/CSS 파일명 추출
$distIndexContent = Get-Content "$distPath\index.html" -Raw
$jsFile = $null
$cssFile = $null

if ($distIndexContent -match 'src="(/assets/index-[^"]+\.js)"') {
    $jsFile = $matches[1] -replace '^/', ''
}
if ($distIndexContent -match 'href="(/assets/index-[^"]+\.css)"') {
    $cssFile = $matches[1] -replace '^/', ''
}

if (-not $jsFile -or -not $cssFile) {
    Write-Error "Failed to extract JS or CSS file name from dist/index.html"
}

Write-Host "New JS File: $jsFile"
Write-Host "New CSS File: $cssFile"

# 2. 기존 assets/assets 폴더 정리 (JS, CSS 삭제)
if (Test-Path $targetAssetsPath) {
    Get-ChildItem $targetAssetsPath -Include "index-*.js", "index-*.css" -Recurse | Remove-Item -Force
    Write-Host "Cleaned old JS/CSS files."
} else {
    New-Item -ItemType Directory -Path $targetAssetsPath -Force
}

# 3. dist/assets 내용 복사
Copy-Item "$distPath\assets\*" $targetAssetsPath -Recurse -Force
Write-Host "Copied new assets."

# 4. dist 루트 파일 복사 (index.html 제외)
Get-ChildItem $distPath -Exclude "index.html" | ForEach-Object {
    Copy-Item $_.FullName $targetPath -Recurse -Force
}
Write-Host "Copied root files (excluding index.html)."

# 5. target index.html 업데이트
$targetIndexFile = "$targetPath\index.html"
$targetIndexContent = Get-Content $targetIndexFile -Raw

# JS 교체
$targetIndexContent = $targetIndexContent -replace 'src="assets/index-[^"]+\.js"', "src=""$jsFile"""
# CSS 교체
$targetIndexContent = $targetIndexContent -replace 'href="assets/index-[^"]+\.css"', "href=""$cssFile"""

# 변경된 내용 저장
Set-Content -Path $targetIndexFile -Value $targetIndexContent -Encoding UTF8
Write-Host "Updated index.html references."

Write-Host "Assets update completed successfully."
