# Health Diary - Simple Deployment Guide

Deploy your Health Diary application to Azure in minutes!

## Prerequisites

1. **Azure Account** - [Create free account](https://azure.microsoft.com/free/)
2. **GitHub Account** - [Sign up](https://github.com/join)
3. **Anthropic API Key** - [Get from Anthropic](https://console.anthropic.com/)
4. **Azure CLI** - [Install for Windows](https://aka.ms/installazurecliwindows)

## One-Command Deployment

### Step 1: Get Your GitHub Personal Access Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name: "Health Diary Deployment"
4. Select scope: ✅ **repo** (full control)
5. Click "Generate token"
6. **Copy the token** (starts with `ghp_`)

### Step 2: Fork or Clone This Repository

```bash
# Option A: Fork on GitHub (recommended for open source)
# Click "Fork" button on GitHub

# Option B: Clone to your account
git clone https://github.com/ORIGINAL_AUTHOR/health-diary.git
cd health-diary
# Create new repo on GitHub, then:
git remote set-url origin https://github.com/YOUR_USERNAME/health-diary.git
git push -u origin main
```

### Step 3: Run Deployment Script

Open PowerShell and run:

```powershell
cd health-diary

.\deploy.ps1 `
  -SubscriptionId "YOUR_AZURE_SUBSCRIPTION_ID" `
  -GitHubRepo "YOUR_USERNAME/health-diary" `
  -GitHubToken "ghp_YOUR_GITHUB_TOKEN" `
  -AnthropicApiKey "sk-ant-YOUR_ANTHROPIC_KEY"
```

**That's it!** The script will:
- ✅ Create all Azure resources
- ✅ Set up Azure Tables (5 tables)
- ✅ Create Static Web App
- ✅ Automatically configure GitHub Actions
- ✅ Set environment variables
- ✅ Deploy your application

### Step 4: Configure Authentication (2 minutes)

After deployment completes:

1. Open the Azure Portal link shown in the script output
2. Go to your Static Web App → **Authentication**
3. Select **"Simple"** mode
4. Choose **"Entra ID"** (for Microsoft accounts) or **"GitHub"**
5. Click **Save**

### Step 5: Invite Users

1. In Azure Portal → Your Static Web App → **Role management**
2. Click **Invite**
3. Enter email address
4. Role: `user`
5. Generate and send invite link

## What Gets Created

```
📦 Azure Resources
├── Resource Group: healthdiary-rg
├── Storage Account: healthdiaryprod[unique]
│   └── 5 Tables:
│       ├── foodentries
│       ├── symptomentries
│       ├── medicationentries
│       ├── drinkentries
│       └── analysisentries
└── Static Web App: healthdiary-prod-swa
    ├── Frontend (React)
    ├── API (Azure Functions)
    └── GitHub Actions (auto-configured)
```

## Automatic Updates

Once deployed, any time you push to the `main` branch:
1. GitHub Actions automatically builds your app
2. Deploys to Azure
3. Updates are live in 2-3 minutes

## Cost

**Free Tier:**
- Static Web App: Free (100 GB bandwidth/month)
- Storage: ~£0.02/month
- Functions: Free (1M executions/month)

**Total: ~£0.50/month** 💰

## Customization

### Change App Name or Location

```powershell
.\deploy.ps1 `
  -SubscriptionId "..." `
  -GitHubRepo "..." `
  -GitHubToken "..." `
  -AnthropicApiKey "..." `
  -AppName "myapp" `
  -Location "westeurope" `
  -ResourceGroupName "myapp-rg"
```

### Deploy to Different Regions

Available regions:
- `uksouth` (UK South) - default
- `westeurope` (West Europe)
- `eastus` (East US)
- `westus2` (West US 2)

## Troubleshooting

### "Azure CLI not found"
Install: https://aka.ms/installazurecliwindows

### "Not logged in to Azure"
The script will automatically run `az login` for you

### "GitHub Actions not created"
Check that:
- Your GitHub token has `repo` scope
- The repository exists and you have write access
- Run: `git push origin main` to trigger workflow

### "Storage connection failed"
The script sets environment variables automatically. If needed, manually check:
```powershell
az staticwebapp appsettings list --name healthdiary-prod-swa --resource-group healthdiary-rg
```

## Updating the Application

```bash
# Make your changes
git add .
git commit -m "Update feature X"
git push origin main

# GitHub Actions deploys automatically!
```

## Deleting Everything

To remove all resources:

```powershell
az group delete --name healthdiary-rg --yes --no-wait
```

## Project Structure

```
health-diary/
├── deploy.ps1                    # 👈 Run this to deploy
├── infra/
│   └── modules/
│       └── storage.bicep         # Infrastructure code
├── api/
│   ├── food/                     # API endpoints
│   ├── symptoms/
│   ├── medications/
│   ├── drinks/
│   ├── analysis/
│   └── question/
├── src/
│   └── App.jsx                   # React frontend
└── public/
    └── index.html
```

## Support

### View Logs

**Application Insights** (if enabled):
1. Azure Portal → Your Static Web App
2. Click "Application Insights"
3. View requests, exceptions, performance

**GitHub Actions Logs:**
1. Go to your GitHub repository
2. Click "Actions" tab
3. Click on latest workflow run

### Common Issues

**Authentication not working:**
- Make sure you configured Simple auth in Azure Portal
- Invited users with correct role name (`user`)
- Users clicked the invite link

**API errors:**
- Check environment variables are set
- Verify Anthropic API key is valid
- Check Azure Functions logs in portal

**Deployment failed:**
- Check GitHub Actions logs
- Verify all files committed to Git
- Ensure `package.json` and `api/package.json` exist

## Contributing

This is an open-source project! Contributions welcome:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing`
5. Open Pull Request

## License

MIT License - feel free to use and modify!

## Security

**Never commit secrets to Git!**
- API keys are passed as parameters
- Environment variables set by deployment script
- GitHub token only used during deployment

## Advanced Usage

### Multiple Environments

Deploy dev and prod separately:

```powershell
# Development
.\deploy.ps1 -AppName "healthdiary-dev" -ResourceGroupName "healthdiary-dev-rg" ...

# Production  
.\deploy.ps1 -AppName "healthdiary-prod" -ResourceGroupName "healthdiary-prod-rg" ...
```

### Custom Domain

1. Azure Portal → Static Web App → Custom domains
2. Add your domain
3. Update DNS with provided records

### Backup Data

```powershell
# Export all tables
$storageKey = (az storage account keys list --account-name healthdiaryprod[unique] --query [0].value -o tsv)
az storage table download-batch --account-name healthdiaryprod[unique] --account-key $storageKey --destination ./backup/
```

## What's Next?

After deployment:
1. ✅ Configure authentication
2. ✅ Invite yourself as first user
3. ✅ Start tracking your health!
4. ✅ Customize the app (colors, features)
5. ✅ Share with others

---

Made with ❤️ for anyone tracking their health journey

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Azure Static Web App                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   React UI   │      │  Azure Funcs │        │
│  │   (build/)   │◄────►│    (api/)    │        │
│  └──────────────┘      └───────┬──────┘        │
│                                 │                │
└─────────────────────────────────┼────────────────┘
                                  │
                     ┌────────────▼──────────────┐
                     │  Azure Storage Account    │
                     │  ┌──────────────────────┐ │
                     │  │  Table Storage       │ │
                     │  │  • foodentries       │ │
                     │  │  • symptomentries    │ │
                     │  │  • medicationentries │ │
                     │  │  • drinkentries      │ │
                     │  │  • analysisentries   │ │
                     │  └──────────────────────┘ │
                     └───────────────────────────┘
```

## Prerequisites

1. **Azure Subscription**
   - Active Azure subscription with Owner or Contributor role

2. **GitHub Account**
   - Repository with your application code

3. **Anthropic API Key**
   - Get from https://console.anthropic.com/

4. **Azure CLI** (for local deployment)
   ```bash
   # Install Azure CLI
   # Windows: Download from https://aka.ms/installazurecliwindows
   # Mac: brew install azure-cli
   # Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Login
   az login
   ```

## Setup Instructions

### Option 1: Automated Deployment via GitHub Actions (Recommended)

#### Step 1: Create Azure Service Principal

```bash
# Set your subscription
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"

# Create service principal with contributor role
az ad sp create-for-rbac \
  --name "healthdiary-github-sp" \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID> \
  --sdk-auth
```

This outputs JSON like:
```json
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx",
  ...
}
```

#### Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `AZURE_CLIENT_ID` | From service principal output | Azure AD Application ID |
| `AZURE_TENANT_ID` | From service principal output | Azure AD Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Your subscription ID | Azure Subscription |
| `ANTHROPIC_API_KEY` | Your Anthropic key | Claude API access |
| `GH_PAT` | GitHub Personal Access Token | For Static Web App GitHub integration |

**To create GitHub PAT:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy and save as `GH_PAT` secret

#### Step 3: Deploy Infrastructure

1. Go to GitHub repository → Actions
2. Select "Deploy Infrastructure" workflow
3. Click "Run workflow"
4. Select environment: `prod`
5. Click "Run workflow"

This creates:
- Resource Group
- Storage Account with 5 tables
- Static Web App with authentication configured

#### Step 4: Get Static Web App Deployment Token

After infrastructure deployment:

```bash
# Get the deployment token
az staticwebapp secrets list \
  --name healthdiary-prod-swa \
  --query "properties.apiKey" \
  --output tsv
```

Add this as a GitHub secret:
- Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
- Value: The token from above command

#### Step 5: Deploy Application

The application automatically deploys on every push to `main` branch.

To manually trigger:
1. Go to Actions → "Deploy Application"
2. Click "Run workflow"

### Option 2: Manual Deployment via Azure CLI

#### Step 1: Set Variables

```bash
# Set these variables
SUBSCRIPTION_ID="<your-subscription-id>"
LOCATION="uksouth"
ANTHROPIC_KEY="<your-anthropic-api-key>"
GITHUB_TOKEN="<your-github-pat>"
GITHUB_REPO="https://github.com/<your-username>/<your-repo>"

# Set active subscription
az account set --subscription $SUBSCRIPTION_ID
```

#### Step 2: Deploy Infrastructure

```bash
# Deploy from repository root
az deployment sub create \
  --location $LOCATION \
  --template-file ./infra/main.bicep \
  --parameters \
    appName=healthdiary \
    environment=prod \
    location=$LOCATION \
    anthropicApiKey=$ANTHROPIC_KEY \
    githubToken=$GITHUB_TOKEN \
    githubRepoUrl=$GITHUB_REPO \
    githubBranch=main
```

#### Step 3: Get Deployment Outputs

```bash
# Get resource group name
RG_NAME=$(az deployment sub show \
  --name main \
  --query properties.outputs.resourceGroupName.value \
  --output tsv)

# Get Static Web App URL
SWA_URL=$(az deployment sub show \
  --name main \
  --query properties.outputs.staticWebAppUrl.value \
  --output tsv)

echo "Your app is deployed at: https://$SWA_URL"
```

## Post-Deployment Configuration

### Configure Authentication

1. Go to Azure Portal
2. Navigate to your Static Web App (`healthdiary-prod-swa`)
3. Click "Authentication" in the left menu
4. Select "Simple" mode
5. Choose "Entra ID"
6. Save

### Invite Users

1. In Static Web App → Role management
2. Click "Invite"
3. Enter email address
4. Role: `user` (must match role in `staticwebapp.config.json`)
5. Generate invite link
6. Send to users

## Project Structure

```
health-diary/
├── .github/
│   └── workflows/
│       ├── deploy-infrastructure.yml  # Deploys Azure resources
│       └── deploy-app.yml            # Deploys application code
├── infra/
│   ├── main.bicep                    # Main infrastructure template
│   ├── main.bicepparam               # Default parameters
│   └── modules/
│       ├── storage.bicep             # Storage account + tables
│       └── staticwebapp.bicep        # Static Web App configuration
├── api/
│   ├── food/
│   ├── symptoms/
│   ├── medications/
│   ├── drinks/
│   └── analysis/
├── src/
│   └── App.jsx
└── public/
    └── index.html
```

## Monitoring and Troubleshooting

### View Deployment Logs

**GitHub Actions:**
- Repository → Actions → Select workflow run

**Azure Portal:**
- Static Web App → Deployments
- Storage Account → Monitoring → Insights

### Common Issues

**1. GitHub Token expired**
```bash
# Create new PAT and update secret
# Then re-run infrastructure deployment
```

**2. Storage connection string not working**
```bash
# Regenerate and update
az storage account keys renew \
  --account-name <storage-account-name> \
  --key primary

# Update in Static Web App settings
```

**3. Authentication not working**
- Verify you've configured authentication in portal
- Check users have been invited with correct role
- Ensure `staticwebapp.config.json` has correct role name

### View Application Insights

```bash
# Enable Application Insights (optional)
az monitor app-insights component create \
  --app healthdiary-insights \
  --location $LOCATION \
  --resource-group healthdiary-prod-rg \
  --application-type web

# Link to Static Web App
# (Configure in Azure Portal)
```

## Cost Estimation

**Free Tier (recommended for personal use):**
- Static Web App: Free (100 GB bandwidth/month)
- Storage Account: ~£0.02/month for 1 GB
- Azure Functions: Free (1M requests/month)
- **Total: ~£0.50/month**

**Standard Tier (if you exceed free limits):**
- Static Web App: £7/month
- Storage + Functions: ~£2/month
- **Total: ~£9/month**

## Backup and Disaster Recovery

### Backup Storage Tables

```bash
# Export all tables
STORAGE_KEY=$(az storage account keys list \
  --account-name <storage-name> \
  --query [0].value \
  --output tsv)

az storage table download-batch \
  --account-name <storage-name> \
  --account-key $STORAGE_KEY \
  --destination ./backup/
```

### Restore from Backup

```bash
az storage table upload-batch \
  --account-name <storage-name> \
  --account-key $STORAGE_KEY \
  --source ./backup/
```

## Updating the Application

### Infrastructure Changes

1. Modify Bicep files in `infra/`
2. Commit and push
3. Run "Deploy Infrastructure" workflow

### Application Changes

1. Modify code in `src/` or `api/`
2. Commit and push to `main`
3. GitHub Actions automatically deploys

## Tearing Down

### Delete Everything

```bash
# Delete resource group (removes everything)
az group delete \
  --name healthdiary-prod-rg \
  --yes \
  --no-wait
```

### Delete Just the App (keep storage)

```bash
# Delete only Static Web App
az staticwebapp delete \
  --name healthdiary-prod-swa \
  --resource-group healthdiary-prod-rg
```

## Support

For issues:
1. Check GitHub Actions logs
2. Check Azure Portal → Static Web App → Logs
3. Review Application Insights
4. Check Storage Account metrics

## Security Best Practices

1. ✅ All secrets stored in GitHub Secrets
2. ✅ HTTPS enforced on all endpoints
3. ✅ Authentication required for all routes
4. ✅ TLS 1.2 minimum on storage
5. ✅ No public blob access
6. ✅ Service principal with least privilege

## Next Steps

- [ ] Set up custom domain
- [ ] Configure Application Insights alerts
- [ ] Set up automated backups
- [ ] Add monitoring dashboard
- [ ] Configure WAF rules (if using Standard tier)