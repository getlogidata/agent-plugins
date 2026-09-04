# Install Logidata skills for the Codex IDE extension (VS Code / JetBrains) on Windows.
#
# WHY THIS FILE EXISTS: the Codex IDE extension does NOT load plugins - only
# ChatGPT web/desktop/mobile and the Codex CLI do. But it DOES read USER-scope
# skills from ~/.agents/skills/. This script points the plugin's 11 skills there,
# so VS Code users get every skill without a plugin.
#
# Do NOT run this while the plugin is also installed
# (codex plugin add logidata@logidata) - every skill would show up TWICE.
# Pick one: plugin for CLI/desktop, this script for VS Code.
#
#   Install:    .\install-skills.ps1
#   Uninstall:  .\install-skills.ps1 -Uninstall
#
# Skills appear as `logidata:<name>` - the `logidata-` directory prefix becomes
# the namespace, exactly as it does when installed via the plugin.
#
# Skills only teach the assistant how to ask. For actual DATA you also need the
# MCP server:
#   codex mcp add logidata --url https://mcp.logidata.vn/mcp `
#        --bearer-token-env-var LOGIDATA_API_KEY
#
# NOTE: ASCII only, on purpose. Windows PowerShell 5.1 reads .ps1 as ANSI, so
# accented characters here would break parsing on machines without a UTF-8 BOM.

[CmdletBinding()]
param([switch]$Uninstall)

$ErrorActionPreference = "Stop"

$source = Join-Path $PSScriptRoot "plugins\logidata\skills"
$dest = Join-Path $env:USERPROFILE ".agents\skills"

if (-not (Test-Path $source)) {
    throw "Not found: $source. Run this script from the agent-plugins repo root."
}

if ($Uninstall) {
    $n = 0
    $links = Get-ChildItem $dest -Directory -Filter "logidata-*" -ErrorAction SilentlyContinue
    foreach ($link in $links) {
        # Delete the junction only. Remove-Item -Recurse can follow a junction
        # into its target on older PowerShell, so use DirectoryInfo.Delete().
        $link.Delete()
        $n++
    }
    Write-Host "Removed $n skills from $dest"
    return
}

New-Item -ItemType Directory -Force -Path $dest | Out-Null

$n = 0
foreach ($dir in (Get-ChildItem $source -Directory)) {
    $link = Join-Path $dest ("logidata-" + $dir.Name)
    if (Test-Path $link) { (Get-Item $link).Delete() }
    New-Item -ItemType Junction -Path $link -Target $dir.FullName | Out-Null
    $n++
}

Write-Host "Installed $n skills into $dest"
Write-Host 'Reopen VS Code, then type $ in the chat box to see the logidata:* skills'
