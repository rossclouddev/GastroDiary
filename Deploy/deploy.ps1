#Requires -Version 7.0

<#
.SYNOPSIS
    Deploys the Health Diary application to Azure

.DESCRIPTION
    This script deploys the complete Health Diary application including:
    - Azure Storage Account with tables
    - Azure Static Web App with GitHub integration
    - Automatic GitHub Actions workflow setup
    - Environment variable configuration

.PARAMETER SubscriptionId
    Your Azure subscription ID

.PARAMETER ResourceGroupName
    Name for the resource group (default: healthdiary-rg)

.PARAMETER Location
    Azure region (default: uksouth)

.PARAMETER AppName
    Application name (default: healthdiary)

.PARAMETER GitHubRepoName
    Your GitHub repository in format: username/repo-name

.PARAMETER GitHubToken
    GitHub Personal Access Token with repo scope

.PARAMETER AnthropicApiKey
    Your Anthropic API key for Claude

.EXAMPLE
    .\deploy.ps1 -SubscriptionId "xxx" -GitHubRepo "yourusername/health-diary" -GitHubToken "ghp_xxx" -AnthropicApiKey "sk-ant-xxx"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory=$false)]
    [string]$Location = "uksouth",

    [Parameter(Mandatory=$false)]
    [string]$SWALocation = "westeurope",

    [Parameter(Mandatory=$false)]
    [string]$AppName = "IBSApp",

    [Parameter(Mandatory=$true)]
    [string]$GitHubRepoName,

    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,

    [Parameter(Mandatory=$true)]
    [string]$AnthropicApiKey,

    [Parameter(Mandatory=$false)]
    [array]$StorageTables = @("foodentries", "symptomentries", "analysisentries", "medicationentries", "drinkentries")
)



$suffix = -join ((48..57) + (97..122) | Get-Random -Count 6 | ForEach-Object {[char]$_})
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Health Diary Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✓ Azure CLI version: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI is not installed. Please install from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Check if user is logged in
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "✗ Not logged in to Azure. Running 'az login'..." -ForegroundColor Red
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "✓ Logged in as: $($account.user.name)" -ForegroundColor Green

# Set subscription
Write-Host "Setting subscription..." -ForegroundColor Yellow
az account set --subscription $SubscriptionId
Write-Host "✓ Using subscription: $SubscriptionId" -ForegroundColor Green

# Validate GitHub repo format
if ($GitHubRepoName -notmatch '^[\w-]+/[\w-]+$') {
    Write-Host "✗ Invalid GitHub repository format. Expected: username/repo-name" -ForegroundColor Red
    exit 1
}
$GitHubRepoUrl = "https://github.com/$GitHubRepoName"
Write-Host "✓ GitHub repository: $GitHubRepoUrl" -ForegroundColor Green

Write-Host ""
Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "  Subscription ID:    $SubscriptionId"
Write-Host "  Resource Group:     $ResourceGroupName"
Write-Host "  Location:           $Location"
Write-Host "  App Name:           $AppName"
Write-Host "  GitHub Repo:        $GitHubRepoName"
Write-Host ""

$confirmation = Read-Host "Continue with deployment? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create resource group
Write-Host "[1/5] Creating resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq 'true') {
    Write-Host "✓ Resource group already exists" -ForegroundColor Green
} else {
    az group create --name $ResourceGroupName --location $Location --output none
    Write-Host "✓ Resource group created" -ForegroundColor Green
}

# Deploy storage account using Bicep
Write-Host "[2/5] Deploying storage account..." -ForegroundColor Yellow
$storageDeployment = az storage account create `
    --name "stfoodtrkr$($suffix)" `
    --resource-group $ResourceGroupName `
    --location $Location `
     --sku Standard_LRS `
     --output json | ConvertFrom-Json

$StorageTables | ForEach-Object {
    az storage table create --name $_ --account-name $storageDeployment.name --output none
    Write-Host "✓ Table created: $_" -ForegroundColor Green
}


$storageAccountName = $storageDeployment.name
$connectionString = az storage account show-connection-string --name $storageAccountName --resource-group $ResourceGroupName --subscription $SubscriptionId
$connectionstring = ($connectionstring | ConvertFrom-Json).connectionstring
Write-Host "✓ Storage account created: $storageAccountName" -ForegroundColor Green

# Deploy Static Web App with GitHub integration
Write-Host "[3/5] Deploying Static Web App..." -ForegroundColor Yellow
Write-Host "    This will automatically create a GitHub Actions workflow in your repository" -ForegroundColor Gray

$swaName = "swa-$AppName-$suffix"
$swaDeployment = az staticwebapp create `
    --name $swaName `
    --resource-group $ResourceGroupName `
    --source $GitHubRepoUrl `
    --location $SWALocation `
    --branch main `
    --app-location "/" `
    --api-location "api" `
    --output-location "build" `
    --login-with-github `
    --output json | ConvertFrom-Json

$swaHostname = $swaDeployment.defaultHostname
Write-Host "✓ Static Web App created: $swaName" -ForegroundColor Green
Write-Host "✓ URL: https://$swaHostname" -ForegroundColor Green
Write-Host "✓ GitHub Actions workflow automatically created in your repository" -ForegroundColor Green

# Configure environment variables
Write-Host "[4/5] Configuring environment variables..." -ForegroundColor Yellow
az staticwebapp appsettings set `
    --name $swaName `
    --resource-group $ResourceGroupName `
    --setting-names AZURE_STORAGE_CONNECTION_STRING=$connectionString ANTHROPIC_API_KEY=$AnthropicApiKey `
    --output none
Write-Host "✓ Environment variables configured" -ForegroundColor Green

# Wait a moment for the deployment to stabilize
Write-Host "[5/5] Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "✓ Deployment complete!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Resource Group:      $ResourceGroupName" -ForegroundColor Green
Write-Host "✓ Storage Account:     $storageAccountName" -ForegroundColor Green
Write-Host "✓ Static Web App:      $swaName" -ForegroundColor Green
Write-Host "✓ Application URL:     https://$swaHostname" -ForegroundColor Green
Write-Host ""
Write-Host "Azure Tables Created:" -ForegroundColor Cyan
Write-Host "  - foodentries" -ForegroundColor Gray
Write-Host "  - symptomentries" -ForegroundColor Gray
Write-Host "  - medicationentries" -ForegroundColor Gray
Write-Host "  - drinkentries" -ForegroundColor Gray
Write-Host "  - analysisentries" -ForegroundColor Gray
Write-Host ""
Write-Host "GitHub Integration:" -ForegroundColor Cyan
Write-Host "  - GitHub Actions workflow created automatically" -ForegroundColor Gray
Write-Host "  - Located at: .github/workflows/azure-static-web-apps-*.yml" -ForegroundColor Gray
Write-Host "  - Will trigger on push to main branch" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 2-3 minutes for initial deployment to complete" -ForegroundColor Yellow
Write-Host "  2. Check GitHub Actions status: https://github.com/$GitHubRepo/actions" -ForegroundColor Yellow
Write-Host "  3. Configure authentication (see DEPLOYMENT.md)" -ForegroundColor Yellow
Write-Host "  4. Invite users to your app" -ForegroundColor Yellow
Write-Host "  5. Visit your app: https://$swaHostname" -ForegroundColor Yellow
Write-Host ""
Write-Host "To configure authentication:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://portal.azure.com/#resource/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.Web/staticSites/$swaName/authentication" -ForegroundColor Gray
Write-Host "  2. Select 'Simple' authentication" -ForegroundColor Gray
Write-Host "  3. Choose 'Entra ID' or 'GitHub'" -ForegroundColor Gray
Write-Host "  4. Save configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan