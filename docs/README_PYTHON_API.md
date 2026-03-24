# Python API Setup Guide

This guide explains how to set up and use your Python-trained model with the CacaoTrack mobile app.

## Overview

The mobile app now uses a Python API endpoint instead of Roboflow for image classification. You'll need to:

1. Train your model using Python (TensorFlow, PyTorch, or scikit-learn)
2. Create an API endpoint to serve predictions
3. Configure the mobile app to use your API

## Quick Start

### 1. Install Dependencies

```bash
pip install -r python_api_requirements.txt
```

### 2. Train Your Model

Train your model using your preferred framework. The model should classify images into 7 classes:
- day0: Fresh
- day1: Anaerobic
- day2: Anaerobic / Alcoholic
- day3: Aerobic
- day4: Aerobic
- day5: Maturation
- day6: Drying Ready

### 3. Set Up the API

1. Save your trained model (e.g., `models/cacao_fermentation_model.h5`)
2. Update `python_api_example.py` with your model loading code
3. Adjust image preprocessing to match your model's requirements

### 4. Run the API Server

```bash
python python_api_example.py
```

The API will run on `http://localhost:8000`

### 5. Configure the Mobile App

Update `utils/imageInference.js` with your API endpoint:

```javascript
const PYTHON_API_ENDPOINT = 'http://your-server-ip:8000/predict';
```

For production, use your deployed API URL:
```javascript
const PYTHON_API_ENDPOINT = 'https://your-api-domain.com/predict';
```

## API Endpoint Requirements

Your Python API should accept POST requests with this format:

**Request:**
```json
{
  "image_url": "https://example.com/image.jpg"
}
```

**Response (Option 1 - Recommended):**
```json
{
  "prediction": "day0",
  "confidence": 0.95
}
```

**Response (Option 2):**
```json
{
  "class": "day0",
  "confidence": 0.95
}
```

**Response (Option 3):**
```json
{
  "stage": "Fresh",
  "day": "day0",
  "confidence": 0.95
}
```

## Model Training Tips

1. **Data Collection**: Collect images for each fermentation stage (day0-day6)
2. **Preprocessing**: Normalize images, resize to consistent dimensions (e.g., 224x224)
3. **Augmentation**: Use data augmentation to improve model robustness
4. **Validation**: Split data into train/validation/test sets
5. **Export**: Save model in a format compatible with your inference framework

## Deployment Options

### Local Development
- Run API on your local machine
- Use `http://localhost:8000` or `http://your-ip:8000`
- Ensure mobile device/emulator can reach the IP

### Cloud Deployment
- Deploy to services like:
  - Heroku
  - AWS Lambda
  - Google Cloud Run
  - Azure Functions
  - DigitalOcean App Platform

### Example Deployment (Heroku)

1. Create `Procfile`:
```
web: python python_api_example.py
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

3. Update mobile app with Heroku URL:
```javascript
const PYTHON_API_ENDPOINT = 'https://your-app-name.herokuapp.com/predict';
```

## Testing

Test your API endpoint:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/test-image.jpg"}'
```

## Troubleshooting

1. **CORS Issues**: Ensure Flask-CORS is installed and configured
2. **Model Loading**: Check model path and format
3. **Image Download**: Ensure API can download images from URLs
4. **Network**: For local testing, ensure mobile device and computer are on same network

## Next Steps

- Optimize model for production (quantization, TensorFlow Lite, etc.)
- Add caching for frequently accessed images
- Implement batch prediction for multiple images
- Add authentication if needed
- Monitor API performance and accuracy

