$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js was not found. Install Node.js or open index.html directly." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
$listener.Stop()

$env:PORT = "$port"
$server = Start-Process -FilePath $node.Source -ArgumentList "`"$root\server.js`"" -WorkingDirectory $root -PassThru
$url = "http://127.0.0.1:$port/"

for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    Start-Sleep -Milliseconds 250
    if ($server.HasExited) { break }
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
        if ($response.StatusCode -eq 200) {
            Write-Host "ChronoTrace UI is running at $url" -ForegroundColor Green
            if ($env:CT_NO_BROWSER -ne "1") { Start-Process $url }
            exit 0
        }
    } catch {
    }
}

if (-not $server.HasExited) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
Write-Host "Could not start the UI server." -ForegroundColor Red
Write-Host "Open ui\index.html directly in a browser instead."
Read-Host "Press Enter to close"
exit 1
