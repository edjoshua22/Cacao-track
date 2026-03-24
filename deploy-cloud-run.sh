#!/bin/bash

# CacaoTrack Cloud Run Deployment Script
# Make sure you have gcloud CLI installed and configured

set -e

# Configuration
PROJECT_ID="cacaotrack-6a1db"
SERVICE_NAME="cacao-track-api"
REGION="us-central1"

echo "🚀 Starting CacaoTrack API deployment to Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Build the container image
echo "🏗️ Building container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --timeout=900

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 120s \
    --concurrency 10 \
    --min-instances 0 \
    --max-instances 10

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

echo ""
echo "✅ Deployment successful!"
echo ""
echo "🌐 Your API is now live at: $SERVICE_URL"
echo ""
echo "📋 Available endpoints:"
echo "  Health: $SERVICE_URL/health"
echo "  Predict: $SERVICE_URL/predict"
echo ""
echo "🔧 To update your production environment:"
echo "  EXPO_PUBLIC_API_BASE_URL=$SERVICE_URL"
echo ""
echo "📊 To view logs:"
echo "  gcloud logs read \"resource.type=cloud_run_revision\" --limit 50"
