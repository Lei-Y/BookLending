# verify.ps1 — Run the same checks CI runs, locally, before you push.
#
# Usage:
#   ./verify.ps1            # run all checks, stop on first failure
#   ./verify.ps1 -Fix       # auto-fix formatting before checking
#
# Exits 0 if everything passes, non-zero on the first failing step so
# you can chain it (e.g. ./verify.ps1; if ($?) { git push }).

[CmdletBinding()]
param(
    # When set, run the *writing* variants of the formatters first
    # (dotnet format / prettier --write) so that fixable issues are
    # corrected in place before the verification pass.
    [switch] $Fix
)

$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
Set-Location $repoRoot

function Invoke-Step {
    param(
        [string] $Name,
        [scriptblock] $Action
    )

    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan

    & $Action

    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $Name (exit $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# ---------------- Backend (.NET) ----------------

if ($Fix) {
    Invoke-Step 'dotnet format (write)' {
        dotnet format
    }
}

Invoke-Step 'dotnet restore' {
    dotnet restore
}

Invoke-Step 'dotnet format (verify)' {
    # Mirrors the CI lint step; fails if any file is not formatted.
    dotnet format --verify-no-changes --severity warn --no-restore
}

Invoke-Step 'dotnet build (Release)' {
    dotnet build --no-restore --configuration Release
}

Invoke-Step 'dotnet test' {
    # Runs unit + integration test projects and collects coverage,
    # same flags CI uses so behaviour is identical locally.
    dotnet test --no-build --configuration Release `
        --collect:"XPlat Code Coverage" `
        --results-directory ./TestResults
}

# ---------------- Frontend (web) ----------------

Push-Location web
try {
    if ($Fix) {
        Invoke-Step 'web: prettier --write' {
            npm run format
        }
    }

    Invoke-Step 'web: prettier --check' {
        npm run format:check
    }

    Invoke-Step 'web: eslint' {
        npm run lint
    }

    Invoke-Step 'web: vitest' {
        # `test:run` is the single-shot variant (no watch mode) so the
        # script terminates cleanly.
        npm run test:run
    }

    Invoke-Step 'web: build' {
        npm run build
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "All checks passed." -ForegroundColor Green
