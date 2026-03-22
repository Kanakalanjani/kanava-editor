# scripts/setup-dev.ps1
#
# One-time developer machine setup. Run once after cloning:
#
#   pnpm run setup:dev
#   or: powershell -ExecutionPolicy Bypass -File scripts/setup-dev.ps1
#
# Compatible with Windows PowerShell 5.1 and PowerShell 7+.
# ASCII-only: PS 5.1 reads UTF-8 without BOM as Windows-1252.
#
# What it does:
#   1. Wires up the committed .githooks/ directory as git's hooks path.
#   2. Copies patterns from .privatefiles into .git/info/exclude so that
#      private files are invisible to git but remain readable by AI agents.

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path $PSScriptRoot -Parent

Push-Location $repoRoot

# Step 1: Configure git hooks path
git config core.hooksPath .githooks
Write-Host "[setup] Git hooks configured -> .githooks/pre-commit is now active."

# Step 2: Populate .git/info/exclude
$excludePath     = Join-Path (Join-Path (Join-Path $repoRoot ".git") "info") "exclude"
$privateListPath = Join-Path $repoRoot ".privatefiles"
$marker          = "# --- managed by scripts/setup-dev.ps1 (from .privatefiles) ---"

if (-not (Test-Path $privateListPath)) {
    Write-Host "[setup] .privatefiles not found -- skipping exclude layer."
} else {
    $currentContent = ""
    if (Test-Path $excludePath) {
        $currentContent = Get-Content $excludePath -Raw
    }

    if ($currentContent -match [regex]::Escape($marker)) {
        Write-Host "[setup] .git/info/exclude already contains private patterns -- skipping."
    } else {
        $patterns = @(Get-Content $privateListPath | Where-Object { $_ -notmatch "^\s*#" -and $_ -match "\S" })
        Add-Content -Path $excludePath -Value ""
        Add-Content -Path $excludePath -Value $marker
        foreach ($p in $patterns) {
            Add-Content -Path $excludePath -Value $p
        }
        Write-Host "[setup] .git/info/exclude updated with $($patterns.Count) private patterns."
        Write-Host "        These files are now invisible to git (but remain on disk for AI agents)."
    }
}

Pop-Location

Write-Host ""
Write-Host "[setup] Done. Private files are protected by two layers:"
Write-Host "  * .git/info/exclude    -- files invisible to git status / git add"
Write-Host "  * .githooks/pre-commit -- blocks commit if a file is staged anyway"
Write-Host ""
Write-Host "  To protect more paths: edit .privatefiles and re-run pnpm run setup:dev"
