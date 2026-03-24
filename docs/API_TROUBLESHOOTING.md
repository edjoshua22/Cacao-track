# API Server Troubleshooting

## Problem: "Network request failed" Error

### Cause
The React Native app cannot connect to the Flask API server for image classification.

### Solution Steps

#### 1. Start the API Server
```bash
# Option 1: Use the batch file (Windows)
start_api_server.bat

# Option 2: Manual start
venv\Scripts\activate
python python_api_example.py
```

The server should start and show:
```
Model loaded from models/cacao_fermentation_model.h5
* Running on http://127.0.0.1:8000
* Running on http://192.168.1.40:8000
```

#### 2. Verify API is Working
Open your browser or use curl:
```bash
curl http://192.168.1.40:8000/health
```
Should return: `{"status": "healthy", "model_loaded": true}`

#### 3. Check Network Configuration
- Make sure your mobile device/emulator is on the same network as your computer
- Verify the IP address in `config.js` matches your computer's local IP
- Update `API_BASE_URL` if needed: `export const API_BASE_URL = 'http://YOUR_IP:8000';`

#### 4. Firewall Issues
If you still get network errors:
- Check Windows Firewall settings
- Allow Python/Flask through firewall on port 8000
- Try temporarily disabling firewall for testing

#### 5. Common Error Messages
- **"Network request failed"**: API server not running or wrong IP
- **"Connection refused"**: Server not accessible from device
- **"Timeout"**: Network connectivity issues

### Debugging Tips
1. Check the console logs in your React Native app for detailed error messages
2. The improved `inferImage.js` now provides detailed logging with emojis
3. Look for health check logs: `🏥 API Health check: HEALTHY`

### Dependencies
Make sure you have the required Python packages:
```bash
pip install -r python_api_requirements.txt
```

Key packages:
- flask==3.0.0
- flask-cors==4.0.0
- tensorflow==2.15.0
- requests==2.31.0
- Pillow==10.1.0
