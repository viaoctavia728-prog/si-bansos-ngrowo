# Tes alur notifikasi FCM tanpa browser
$ErrorActionPreference = 'Stop'

Write-Host '=== 1. Cek proses backend (port 8000) ==='
$conn = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
    $proc = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $conn.OwningProcess)
    Write-Host ("PID: " + $proc.ProcessId)
    Write-Host ("EXE: " + $proc.ExecutablePath)
    Write-Host ("CMD: " + $proc.CommandLine)
} else { Write-Host 'Port 8000 tidak listening' }

Write-Host ''
Write-Host '=== 2. Login admin ==='
$loginBody = @{ username = 'admin'; password = 'admin' } | ConvertTo-Json
try {
    $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/login' -ContentType 'application/json' -Body $loginBody -TimeoutSec 8
    $token = $login.access_token
    if (-not $token) { $token = $login.token }
    Write-Host ('LOGIN OK, role=' + $login.data.role)
} catch {
    Write-Host ('LOGIN ERROR: ' + $_.Exception.Message)
    Write-Host ($_.ErrorDetails.Message)
    exit 1
}

$headers = @{ Authorization = ('Bearer ' + $token) }

Write-Host ''
Write-Host '=== 3. Coba kirim notifikasi (fcm/send) ==='
$sendBody = @{ title = 'Tes FCM'; body = 'Tes dari skrip verifikasi' } | ConvertTo-Json
try {
    $send = Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/notifications/fcm/send' -Headers $headers -ContentType 'application/json' -Body $sendBody -TimeoutSec 20
    Write-Host ('HASIL: ' + ($send | ConvertTo-Json -Compress))
} catch {
    Write-Host ('SEND ERROR: ' + $_.Exception.Message)
    Write-Host ('DETAIL: ' + $_.ErrorDetails.Message)
}