# CacaoTrack Cloud Run Deployment Script (PowerShell)
# Make sure you have gcloud CLI installed and configured

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "cacaotrack-6a1db"
$SERVICE_NAME = "cacao-track-api"
$REGION = "us-central1"

Write-Host "🚀 Starting CacaoTrack API deployment to Cloud Run..." -ForegroundColor Green

# Check if gcloud is installed
try {
    gcloud version | Out-Null
} catch {
    Write-Host "❌ gcloud CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set the project
Write-Host "📋 Setting project to: $PROJECT_ID" -ForegroundColor Blue
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Blue
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Build the container image
Write-Host "🏗️ Building container image..." -ForegroundColor Blue
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --timeout 900

# Deploy to Cloud Run
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Blue
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --memory 1Gi `
    --cpu 1 `
    --timeout 120s `
    --concurrency 10 `
    --min-instances 0 `
    --max-instances 10

# Get the service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME `
    --region $REGION `
    --format 'value(status.url)'

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your API is now live at: $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Available endpoints:" -ForegroundColor Yellow
Write-Host "  Health: $SERVICE_URL/health" -ForegroundColor White
Write-Host "  Predict: $SERVICE_URL/predict" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To update your production environment:" -ForegroundColor Yellow
Write-Host "  EXPO_PUBLIC_API_BASE_URL=$SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 To view logs:" -ForegroundColor Yellow
Write-Host "  gcloud logs read `"resource.type=cloud_run_revision`" --limit 50" -ForegroundColor White
