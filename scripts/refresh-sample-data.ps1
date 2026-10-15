param(
	[Parameter(Mandatory)]
	[ValidatePattern('^[A-Za-z0-9_]+$')]
	[string]$Username,
    [switch]$ReplaceAll,
    [string]$SampleDate = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTimeOffset]::UtcNow, 'Central Standard Time').ToString('yyyy-MM-dd')
)

$ErrorActionPreference = 'Stop'
$parsedDate = [DateTime]::ParseExact($SampleDate, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
$repoRoot = Split-Path $PSScriptRoot -Parent
$backupDirectory = Join-Path $repoRoot 'backend/target/sample-data-backups'
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$backupPath = Join-Path $backupDirectory ('before-refresh-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff') + '.sql')

Push-Location $repoRoot
try {
    # Connect only to the local Compose database. No remote connection settings are used.
    $backup = docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl'
    if ($LASTEXITCODE -ne 0) { throw 'Database backup failed. No data was changed.' }
    [IO.File]::WriteAllLines($backupPath, [string[]]$backup, [Text.UTF8Encoding]::new($false))

    $mode = if ($ReplaceAll) { 'true' } else { 'false' }
	$sql = "\set replace_all $mode`n\set sample_username '$Username'`n"
	$sql += "select set_config('app.sample_date', '$($parsedDate.ToString('yyyy-MM-dd'))', false);`n"
    $sql += Get-Content -Raw (Join-Path $PSScriptRoot 'sample-data.sql')
    $sql | docker compose exec -T postgres sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
    if ($LASTEXITCODE -ne 0) { throw "Sample refresh failed and was rolled back. Backup: $backupPath" }
    Write-Output 'Created 9 sample exercises, 12 workouts, 3 templates, 2 goals, 72 strength sets, and 16 cardio entries.'
    Write-Output "Backup: $backupPath"
}
finally {
    Pop-Location
}
