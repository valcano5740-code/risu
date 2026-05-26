$ErrorActionPreference = "Stop"

$risuDir = "C:\Users\SSAFY\Desktop\risu"
# dist 폴더를 내부에 가지고 있는 폴더를 원본 폴더로 동적 검색 (한글 인코딩 깨짐 영구 회피)
$originalFolder = Get-ChildItem -Path $risuDir -Directory | Where-Object { Test-Path (Join-Path $_.FullName "dist") } | Select-Object -First 1
if ($null -eq $originalFolder) {
    Write-Error "Could not dynamically find risuai original folder with dist subfolder!"
}

$distPath = Join-Path $originalFolder.FullName "dist"
$targetPath = Join-Path $risuDir "risuai mobile\app\src\main\assets"
$targetAssetsPath = Join-Path $targetPath "assets"

Write-Host "Debug - originalFolder Name: $($originalFolder.Name)"
Write-Host "Debug - originalFolder FullName: $($originalFolder.FullName)"
Write-Host "Debug - distPath: $distPath"
Write-Host "Debug - targetPath: $targetPath"

Write-Host "Starting update assets with patch injection system..."

# 1. 기존 assets/assets 폴더 정리 (해시가 변경된 모든 구버전 Vite 빌드 파일 제거)
if (Test-Path $targetAssetsPath) {
    Remove-Item $targetAssetsPath -Recurse -Force
    Write-Host "Cleaned old assets folder."
}
New-Item -ItemType Directory -Path $targetAssetsPath -Force

# 2. dist/assets 내용 복사
Copy-Item "$distPath\assets\*" $targetAssetsPath -Recurse -Force
Write-Host "Copied new assets."

# 3. dist 루트 파일 및 index.html 통째로 복사 (최신 modulepreload 해시 및 경로 반영)
$risuDir = "C:\Users\SSAFY\Desktop\risu"
$originalFolder = Get-ChildItem -Path $risuDir -Directory | Where-Object { Test-Path (Join-Path $_.FullName "dist") } | Select-Object -First 1
$distPath = Join-Path $originalFolder.FullName "dist"
$targetPath = Join-Path $risuDir "risuai mobile\app\src\main\assets"
$distIndexFile = Join-Path $distPath "index.html"
$targetIndexFile = Join-Path $targetPath "index.html"
Write-Host "Dist index path: $distIndexFile"
Write-Host "Target index path: $targetIndexFile"

if (-not (Test-Path $distIndexFile)) {
    Write-Error "Source index.html not found at $distIndexFile"
}

if (Test-Path $targetIndexFile) {
    Remove-Item $targetIndexFile -Force
    Write-Host "Removed old target index.html"
}
Copy-Item -Path $distIndexFile -Destination $targetIndexFile -Force
Write-Host "Overwrote target index.html from dist."

Get-ChildItem $distPath | ForEach-Object {
    if ($_.Name -ne "assets" -and $_.Name -ne "index.html") {
        Copy-Item -Path $_.FullName -Destination $targetPath -Force -Recurse
    }
}
Write-Host "Copied root files (excluding assets & index.html)."

# 4. 복사된 index.html 로드 및 모바일 패치 동적 재주입
$targetPath = "C:\Users\SSAFY\Desktop\risu\risuai mobile\app\src\main\assets"
$targetIndexFile = "$targetPath\index.html"
Write-Host "Target Index File: $targetIndexFile"
if (-not (Test-Path $targetIndexFile)) {
    Write-Error "Index file not found at $targetIndexFile"
}
$indexContent = Get-Content -Path $targetIndexFile -Raw -Encoding UTF8

$headPatch = @"
  <!-- RPack Polyfill: Injected for Android WebView plugin compatibility -->
  <script src="/patches/rpack_polyfill.js"></script>
  <!-- ScrollIntoView Patch: Fixes flex-col-reverse scroll jump in WebView -->
  <script src="/patches/scrollintoview_patch.js"></script>
</head>
"@

$bodyPatch = @"
    <!-- Edit Button Patch: Fixes textarea not appearing in WebView -->
    <script src="/patches/edit_button_patch.js"></script>
    <!-- Lorebook Library Patch: Global Lorebook Storage -->
    <script src="/patches/lorebook_library_patch.js"></script>
  </body>
"@

# </head>와 </body> 직전에 패치 코드 삽입
if ($indexContent.Contains("</head>")) {
    $indexContent = $indexContent -replace "</head>", $headPatch
    Write-Host "Injected Head patches (rpack_polyfill, scrollintoview_patch)."
} else {
    Write-Error "Could not find </head> tag in index.html"
}

if ($indexContent.Contains("</body>")) {
    $indexContent = $indexContent -replace "</body>", $bodyPatch
    Write-Host "Injected Body patches (edit_button_patch, lorebook_library_patch)."
} else {
    Write-Error "Could not find </body> tag in index.html"
}

# 5. 최종 패치된 index.html 저장 (UTF8 인코딩 명시 및 BOM 회피)
[System.IO.File]::WriteAllText($targetIndexFile, $indexContent, [System.Text.Encoding]::UTF8)
Write-Host "Saved patched index.html with UTF-8 encoding."

Write-Host "Assets update completed successfully. Patch integrity verified."
