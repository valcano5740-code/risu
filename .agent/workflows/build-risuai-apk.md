---
description: RisuAI Android APK 빌드 절차
---

# RisuAI APK 빌드 워크플로우

이 워크플로우는 RisuAI Android WebView 앱을 빌드하고 형상관리(Git) 및 공유 폴더 배포를 잇는 "End-to-End 표준 절차"입니다. **모든 코드 수정 완료 후 반드시 이 절차를 따르세요.**

## 배포 파이프라인 (자동화 스크립트)

모든 작업(코드 수정)을 마친 뒤 다음 스크립트 블록을 순서대로 실행하세요.

### 1. 코드 검증 (컴파일)
빌드 전 문법 오류나 의존성 문제를 잡아내기 위해 코틀린 컴파일을 수행합니다.
```powershell
cd "c:\Users\SSAFY\Desktop\risu\risuai mobile"
.\gradlew compileReleaseKotlin
```
> 컴파일 실패 시 반드시 코드 수정 후 다시 시도하세요.

### 2. APK 빌드
```powershell
cd "c:\Users\SSAFY\Desktop\risu\risuai mobile"
.\gradlew assembleRelease
```

### 3. Git 커밋 및 갱신
GitHub (`https://github.com/valcano5740-code/risu.git`) 리포지토리에 푸시합니다. 구버전 APK와 민감한 폴더(`arca_profile/`)는 반드시 `.gitignore`에 등록되어 있어야 합니다.
```powershell
cd "c:\Users\SSAFY\Desktop\risu"
git add -A
git commit -m "버전 및 주요 변경 내용 (예: v1.7.4: 패치 내용)"
git push -u github HEAD:main
```

### 4. 공유 폴더에 최종 산출물 복사
구글 드라이브(공유 폴더)에 APK를 버전명과 함께 자동으로 복사합니다.
```powershell
$apk = "C:\Users\SSAFY\Desktop\risu\risuai mobile\app\build\outputs\apk\release\app-release.apk"
$sharedDir = "C:\Users\SSAFY\Desktop\GD\Antigravity_Shared\RisuAI_APKs"
$version = [regex]::Match((Get-Content "C:\Users\SSAFY\Desktop\risu\risuai mobile\app\build.gradle.kts"), 'versionName\s*=\s*"([^"]+)"').Groups[1].Value
$targetName = "RisuAI_v$version.apk"

if (!(Test-Path $sharedDir)) { New-Item -ItemType Directory -Path $sharedDir | Out-Null }
Copy-Item $apk "$sharedDir\$targetName" -Force

# 로컬(C:\Users\SSAFY\Desktop\risu)에도 직관적으로 복사해둠
Copy-Item $apk "C:\Users\SSAFY\Desktop\risu\$targetName" -Force

Write-Host "배포 완료: $sharedDir\$targetName"
```

---

## 중요 정보 (Troubleshooting)

### Keystore
- **위치**: `c:\Users\SSAFY\Desktop\risu\risuai-native.keystore`
- **비밀번호**: `risu1234`
- **Alias**: `risuai`

### 예상 APK 크기
- **정상 (v1.7.x)**: 약 90MB 내외 (Svelte 정적 에셋, WASM 등 로컬 에셋 전체 포함)
- **비정상**: 20MB 이하일 경우 RisuAI 원본 에셋 복사가 누락된 것이므로 반드시 `risuai 원본 수정하지말것` 폴더의 내역을 `assets`에 동기화해야 합니다.
