$ErrorActionPreference="Stop"
Write-Host "== CLARA LAW: FIX travamento + remove localhost:3001 ==" -ForegroundColor Cyan

# 0) garantir que estamos na raiz do projeto (onde tem package.json)
if (!(Test-Path ".\package.json")) { throw "Rode isso na pasta raiz do projeto (onde existe package.json)." }

# 1) .env.local com API_URL=3000
$envFile = ".env.local"
if (!(Test-Path $envFile)) { New-Item -ItemType File -Path $envFile | Out-Null }

$envLines = @()
$envLines = Get-Content -Path $envFile -ErrorAction SilentlyContinue

if ($envLines -match "^API_URL=") {
  $envLines = $envLines | ForEach-Object { if ($_ -match "^API_URL=") { "API_URL=http://localhost:3000" } else { $_ } }
} else {
  $envLines += "API_URL=http://localhost:3000"
}

Set-Content -Path $envFile -Value $envLines -Encoding UTF8
Write-Host "OK: .env.local atualizado" -ForegroundColor Green

# 2) substituir localhost:3001 -> 3000 em app/lib/components
$roots = @("app","lib","components") | Where-Object { Test-Path $_ }
$changed = 0

Get-ChildItem -Path $roots -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
ForEach-Object {
  $filePath = $_.FullName
  $lines = Get-Content -Path $filePath -ErrorAction SilentlyContinue
  if ($null -eq $lines) { return }

  $newLines = $lines | ForEach-Object {
    $_.Replace("http://localhost:3001","http://localhost:3000").Replace("localhost:3001","localhost:3000")
  }

  $same = (@($lines) -ceq @($newLines))
  if (-not $same) {
    Copy-Item $filePath ($filePath + ".bak") -Force
    Set-Content -Path $filePath -Value $newLines -Encoding UTF8
    $script:changed++
  }
}

Write-Host "OK: arquivos alterados = $changed (backup .bak criado)" -ForegroundColor Green

# 3) limpar build
if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }
Write-Host "OK: .next limpo" -ForegroundColor Green

Write-Host "`nAgora: npm run dev -- -p 3000" -ForegroundColor Yellow
