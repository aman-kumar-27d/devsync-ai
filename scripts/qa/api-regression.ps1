param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

function Get-RandomSuffix {
    return ([System.Guid]::NewGuid().ToString('N').Substring(0, 8))
}

function Convert-ResponseBody {
    param([string]$Body)
    if ([string]::IsNullOrWhiteSpace($Body)) {
        return $null
    }

    try {
        return $Body | ConvertFrom-Json
    } catch {
        return $Body
    }
}

function Invoke-Api {
    param(
        [ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
        [string]$Method,
        [string]$Url,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session,
        [object]$Body = $null
    )

    $headers = @{}
    $payload = $null
    if ($null -ne $Body) {
        $headers['Content-Type'] = 'application/json'
        $payload = $Body | ConvertTo-Json -Depth 10
    }

    try {
        $response = Invoke-WebRequest -Method $Method -Uri $Url -WebSession $Session -Headers $headers -Body $payload -UseBasicParsing
        $parsed = Convert-ResponseBody -Body $response.Content
        return [PSCustomObject]@{
            StatusCode = [int]$response.StatusCode
            Body = $parsed
        }
    } catch [System.Net.WebException] {
        $httpResponse = $_.Exception.Response
        if ($null -eq $httpResponse) {
            throw
        }

        $stream = $httpResponse.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()

        $parsed = Convert-ResponseBody -Body $content
        return [PSCustomObject]@{
            StatusCode = [int]$httpResponse.StatusCode
            Body = $parsed
        }
    }
}

function Assert-Status {
    param(
        [string]$Name,
        [int]$Actual,
        [int[]]$Expected,
        [ref]$Failures
    )

    if ($Expected -contains $Actual) {
        Write-Host "PASS $Name -> $Actual"
        return
    }

    $expectedString = $Expected -join ','
    Write-Host "FAIL $Name -> expected [$expectedString], got $Actual" -ForegroundColor Red
    $Failures.Value += $Name
}

Write-Host "Running API regression against $BaseUrl"

$health = Invoke-Api -Method GET -Url "$BaseUrl/login" -Session (New-Object Microsoft.PowerShell.Commands.WebRequestSession)
if ($health.StatusCode -lt 200 -or $health.StatusCode -ge 400) {
    Write-Host "Server is not reachable at $BaseUrl. Start the app first with npm run dev." -ForegroundColor Red
    exit 2
}

$sessionA = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sessionB = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sessionC = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$failures = @()
$suffix = Get-RandomSuffix

$userA = @{
    email = "qa-a-$suffix@example.com"
    username = "qaa_$suffix"
    password = "Passw0rd!A"
}

$userB = @{
    email = "qa-b-$suffix@example.com"
    username = "qab_$suffix"
    password = "Passw0rd!B"
}

$userC = @{
    email = "qa-c-$suffix@example.com"
    username = "qac_$suffix"
    password = "Passw0rd!C"
}

$regA = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Session $sessionA -Body $userA
Assert-Status -Name "register user A" -Actual $regA.StatusCode -Expected @(201) -Failures ([ref]$failures)

$regB = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Session $sessionB -Body $userB
Assert-Status -Name "register user B" -Actual $regB.StatusCode -Expected @(201) -Failures ([ref]$failures)

$regC = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Session $sessionC -Body $userC
Assert-Status -Name "register user C" -Actual $regC.StatusCode -Expected @(201) -Failures ([ref]$failures)

$userAId = $null
$userBId = $null
$userCId = $null

if ($regA.Body -and $regA.Body.user -and $regA.Body.user._id) { $userAId = [string]$regA.Body.user._id }
if ($regB.Body -and $regB.Body.user -and $regB.Body.user._id) { $userBId = [string]$regB.Body.user._id }
if ($regC.Body -and $regC.Body.user -and $regC.Body.user._id) { $userCId = [string]$regC.Body.user._id }

if ([string]::IsNullOrWhiteSpace($userCId)) {
    Write-Host "FAIL unable to resolve user C id for DM isolation checks" -ForegroundColor Red
    $failures += 'resolve user C id'
} else {
    $dmIsolationGet = Invoke-Api -Method GET -Url "$BaseUrl/api/dm/$userCId/messages" -Session $sessionA
    Assert-Status -Name "dm isolation GET denies non-shared workspace peer" -Actual $dmIsolationGet.StatusCode -Expected @(403) -Failures ([ref]$failures)

    $dmIsolationPost = Invoke-Api -Method POST -Url "$BaseUrl/api/dm/$userCId/messages" -Session $sessionA -Body @{ content = "should be blocked" }
    Assert-Status -Name "dm isolation POST denies non-shared workspace peer" -Actual $dmIsolationPost.StatusCode -Expected @(403) -Failures ([ref]$failures)
}

$workspaceId = $null
$channelId = $null
$inviteToken = $null

${workspaceCreate} = Invoke-Api -Method POST -Url "$BaseUrl/api/workspaces" -Session $sessionA -Body @{ name = "qa-space-$suffix" }
Assert-Status -Name "create isolated workspace for A" -Actual $workspaceCreate.StatusCode -Expected @(201) -Failures ([ref]$failures)

if ($workspaceCreate.StatusCode -eq 201 -and $workspaceCreate.Body -and $workspaceCreate.Body.workspace) {
    $workspaceId = [string]$workspaceCreate.Body.workspace._id
    $wsDetail = Invoke-Api -Method GET -Url "$BaseUrl/api/workspaces/$workspaceId" -Session $sessionA
    Assert-Status -Name "workspace detail for A" -Actual $wsDetail.StatusCode -Expected @(200) -Failures ([ref]$failures)

    if ($wsDetail.StatusCode -eq 200 -and $wsDetail.Body.workspace) {
        $inviteToken = [string]$wsDetail.Body.workspace.inviteToken
        if ($wsDetail.Body.workspace.channels -and $wsDetail.Body.workspace.channels.Count -gt 0) {
            $channelId = [string]$wsDetail.Body.workspace.channels[0]._id
        }
    }
} else {
    Write-Host "FAIL unable to create isolated workspace" -ForegroundColor Red
    $failures += 'create isolated workspace'
}

if ([string]::IsNullOrWhiteSpace($inviteToken)) {
    Write-Host "FAIL unable to resolve invite token" -ForegroundColor Red
    $failures += 'resolve invite token'
} else {
    $joinB = Invoke-Api -Method POST -Url "$BaseUrl/api/workspaces/join" -Session $sessionB -Body @{ inviteToken = $inviteToken }
    Assert-Status -Name "user B joins workspace" -Actual $joinB.StatusCode -Expected @(200) -Failures ([ref]$failures)
}

if ([string]::IsNullOrWhiteSpace($workspaceId)) {
    Write-Host "FAIL workspaceId unavailable; skipping dependent checks" -ForegroundColor Red
    $failures += 'workspaceId unavailable'
} else {
    $ownerOnly = Invoke-Api -Method POST -Url "$BaseUrl/api/workspaces/$workspaceId/channels" -Session $sessionB -Body @{ name = "qa-non-owner" }
    Assert-Status -Name "non-owner channel creation denied" -Actual $ownerOnly.StatusCode -Expected @(403) -Failures ([ref]$failures)

    $snippetForbidden = Invoke-Api -Method POST -Url "$BaseUrl/api/snippets" -Session $sessionC -Body @{
        messageId = [System.Guid]::NewGuid().ToString('N').Substring(0, 24)
        workspaceId = $workspaceId
        code = "console.log('hi')"
        language = "javascript"
        explain = $false
    }
    Assert-Status -Name "non-member snippet creation denied" -Actual $snippetForbidden.StatusCode -Expected @(403) -Failures ([ref]$failures)
}

if ([string]::IsNullOrWhiteSpace($channelId)) {
    Write-Host "FAIL channelId unavailable; skipping channel message checks" -ForegroundColor Red
    $failures += 'channelId unavailable'
} else {
    $messageOk = Invoke-Api -Method POST -Url "$BaseUrl/api/channels/$channelId/messages" -Session $sessionA -Body @{ content = "qa baseline message" }
    Assert-Status -Name "member channel message allowed" -Actual $messageOk.StatusCode -Expected @(201) -Failures ([ref]$failures)

    $messageForbidden = Invoke-Api -Method POST -Url "$BaseUrl/api/channels/$channelId/messages" -Session $sessionC -Body @{ content = "should fail" }
    Assert-Status -Name "non-member channel message denied" -Actual $messageForbidden.StatusCode -Expected @(403) -Failures ([ref]$failures)
}

$invalidPeer = Invoke-Api -Method GET -Url "$BaseUrl/api/dm/not-an-object-id/messages" -Session $sessionA
Assert-Status -Name "invalid DM peerId returns 400" -Actual $invalidPeer.StatusCode -Expected @(400) -Failures ([ref]$failures)

$randomHex = ([System.Guid]::NewGuid().ToString('N')).Substring(0, 24)
$missingPeer = Invoke-Api -Method GET -Url "$BaseUrl/api/dm/$randomHex/messages" -Session $sessionA
Assert-Status -Name "missing DM peer returns 404" -Actual $missingPeer.StatusCode -Expected @(404) -Failures ([ref]$failures)

# ---------------------------------------------------------------------------
# Rate-limit burst checks
# ---------------------------------------------------------------------------
# Login: 10 req/min limit keyed by email+IP.
# We use a unique email (with run suffix) so each run gets its own window.
# Requests 1-10 should return 401 (wrong password); request 11 should be 429.
Write-Host "`nRunning rate-limit burst checks..."

$rlEmail = "rl-burst-$suffix@example.com"
$rlSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBurstLast = 0
for ($i = 0; $i -lt 11; $i++) {
    $r = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/login" -Session $rlSession -Body @{
        email    = $rlEmail
        password = "WrongPass999!"
    }
    $loginBurstLast = $r.StatusCode
}
Assert-Status -Name "login rate limit triggers 429 after 11-burst" -Actual $loginBurstLast -Expected @(429) -Failures ([ref]$failures)

# Register: 5 req/hour limit keyed by IP (same session = same IP in local testing).
# We register 3 users at the top of this script, so 3 more attempts here should
# push us over the 5/hr cap and yield 429 on attempt 6+.
# Use fresh random emails so we don't collide with the email+IP sub-limit.
Write-Host "Running register IP burst check (expects 429 once IP cap exceeded)..."
$regBurstSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$regBurstLast = 0
for ($i = 0; $i -lt 3; $i++) {
    $rSuffix = Get-RandomSuffix
    $r = Invoke-Api -Method POST -Url "$BaseUrl/api/auth/register" -Session $regBurstSession -Body @{
        email    = "rl-reg-$rSuffix@example.com"
        username = "rlreg_$rSuffix"
        password = "Passw0rd!R"
    }
    $regBurstLast = $r.StatusCode
}
Assert-Status -Name "register IP rate limit triggers 429 after excess registrations" -Actual $regBurstLast -Expected @(429) -Failures ([ref]$failures)

# ---------------------------------------------------------------------------

if ($failures.Count -gt 0) {
    Write-Host "`nRegression completed with failures:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "`nAll API regression checks passed." -ForegroundColor Green
exit 0
