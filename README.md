# Cacao Track 🍫

A comprehensive mobile application for monitoring and tracking cacao fermentation stages using machine learning and computer vision.

## 📱 Overview

Cacao Track is a React Native mobile app with a Python Flask backend that helps farmers and producers monitor cacao bean fermentation in real-time. The app uses image analysis and machine learning to classify fermentation stages, ensuring optimal quality control in chocolate production.

## ✨ Features

### 📊 **Real-time Monitoring**
- Track fermentation stages from Fresh (Day 0) to Drying Ready (Day 6)
- Visual timeline with detailed stage information
- Batch management and organization

### 🤖 **Machine Learning Analysis**
- TensorFlow-powered image classification
- Timestamp-based fallback predictions
- Confidence scoring for each prediction
- Offline capability with local model support

### 📱 **Mobile App Features**
- **Onboarding**: Interactive app introduction
- **Timeline View**: Visual fermentation progress tracking
- **Batch Management**: Create and manage multiple fermentation batches
- **Image Capture**: Take and analyze photos of cacao beans
- **Detailed Analytics**: Charts and statistics for each batch
- **Export Functionality**: Generate reports and share data
- **Dark Mode**: Automatic theme switching

### 🔧 **Backend API**
- RESTful API with CORS support
- Health check endpoints
- Production-ready for Google Cloud Run
- Comprehensive error handling and logging

## 🏗️ Architecture

```
Cacao Track/
├── 📱 Mobile App (React Native/Expo)
│   ├── Screens/
│   ├── Components/
│   ├── Utils/
│   └── Context/
├── 🖥️ Backend API (Python/Flask)
│   ├── app.py
│   ├── ML Models/
│   └── Training Scripts/
├── 🔧 Configuration
│   ├── Firebase Setup
│   ├── Environment Variables
│   └── Build Configurations
└── 📚 Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Expo CLI
- Firebase account (optional)
- Google Cloud account (for production deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/edjoshua22/Cacao-track.git
   cd Cacao-track
   ```

2. **Install Mobile Dependencies**
   ```bash
   npm install
   ```

3. **Setup Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Running the Application

1. **Start the Backend API**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:8080`

2. **Start the Mobile App**
   ```bash
   npm start
   ```
   This will open the Expo development server

3. **Run on Device**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

## 📋 API Documentation

### Base URL
- **Development**: `http://localhost:8080`
- **Production**: Set via `EXPO_PUBLIC_API_BASE_URL`

### Endpoints

#### `GET /`
API information and status
```json
{
  "message": "CacaoTrack ML API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": ["/health", "/predict"],
  "model_loaded": true
}
```

#### `GET /health`
Health check endpoint
```json
{
  "status": "healthy",
  "timestamp": "2024-03-24T12:00:00.000Z",
  "model_loaded": true,
  "version": "1.0.0"
}
```

#### `POST /predict`
Main prediction endpoint
```json
Request:
{
  "image_url": "https://example.com/cacao-image.jpg"
}

Response:
{
  "prediction": {
    "day": "day3",
    "stage": "Aerobic",
    "confidence": 0.85,
    "method": "timestamp_fallback"
  },
  "image_url": "https://example.com/cacao-image.jpg",
  "timestamp": "2024-03-24T12:00:00.000Z",
  "api_version": "cloud_run_v1"
}
```

## 🧠 Fermentation Stages

| Day | Stage | Description |
|-----|-------|-------------|
| Day 0 | Fresh | Newly harvested cacao beans |
| Day 1 | Anaerobic | Initial fermentation without oxygen |
| Day 2 | Anaerobic/Alcoholic | Alcohol production begins |
| Day 3 | Aerobic | Oxygen introduction, acetic acid formation |
| Day 4 | Aerobic | Continued aerobic fermentation |
| Day 5 | Maturation | Flavor development intensifies |
| Day 6 | Drying Ready | Optimal fermentation completed |

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080

# Firebase Configuration (Optional)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
```

### Firebase Setup (Optional)

1. Create a new Firebase project
2. Enable Authentication and Firestore
3. Download configuration file
4. Update environment variables

## 📦 Building for Production

### Development Build
```bash
# Android
npm run build:dev:android

# iOS
npm run build:dev:ios

# Both platforms
npm run build:dev
```

### Preview Build
```bash
npm run build:preview
```

### Production Build
```bash
npm run build:production
```

### Backend Deployment

The backend is designed for Google Cloud Run:

```bash
# Deploy to Cloud Run
gcloud run deploy cacao-track-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🛠️ Development

### Project Structure

```
src/
├── screens/           # App screens
│   ├── OnboardingScreen.js
│   ├── TimelineScreen.js
│   ├── MonitoringScreen.js
│   └── ...
├── components/        # Reusable components
│   ├── Card.js
│   ├── LineChart.js
│   └── ...
├── context/          # React Context
│   └── ThemeContext.js
├── utils/            # Utility functions
│   ├── authUtils.js
│   ├── fermentationUtils.js
│   └── ...
└── models/           # ML models
    └── cacao_fermentation_model.h5
```

### Training the Model

```bash
# Prepare training data
python prepare_data.py

# Train the model
python train_model.py
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📱 Screenshots

![c0614d10-57ba-41be-91a1-a1fe104a92d2](https://github.com/user-attachments/assets/d6df3f67-0a2e-4341-b3dc-ac09487a0c43)
![350987ec-749d-49b2-ab74-1ac210125d51](https://github.com/user-attachments/assets/5d8c73ae-9f2a-4964-b31c-0e3ce3ea58f3)
![3e8bbc9d-8d56-4d97-a1e1-de90a2875f68](https://github.com/user-attachments/assets/32cca3f9-205b-47a6-bea9-f48181fe7160)
![47b3cfcd-12f5-4a12-a83f-8e41e5122b3b](https://github.com/user-attachments/assets/2b8ef18d-8efd-4b4f-bace-9aef1fe04965)
![0a6435b9-493e-4650-b7b2-cea9ba78bb55](https://github.com/user-attachments/assets/48fcef33-9bcb-4267-aad9-4e1f7e26b853)


## 🤝 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the troubleshooting guide

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- TensorFlow team for the ML framework
- Expo for the React Native platform
- Firebase for backend services
- The cacao farming community for inspiration

---

**Made with ❤️ for the cacao farming community**
