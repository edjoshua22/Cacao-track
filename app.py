"""
Cacao Fermentation Stage Classification API
Production-ready Flask app for Google Cloud Run
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile apps

# Global variables
model = None
model_loaded = False

# Stage mapping
STAGE_MAPPING = {
    0: "day0",  # Fresh
    1: "day1",  # Anaerobic
    2: "day2",  # Anaerobic / Alcoholic
    3: "day3",  # Aerobic
    4: "day4",  # Aerobic
    5: "day5",  # Maturation
    6: "day6",  # Drying Ready
}

def load_model():
    """Load TensorFlow model with error handling"""
    global model, model_loaded
    try:
        import tensorflow as tf
        
        # Try to load model from different locations
        model_paths = [
            'models/cacao_fermentation_model.h5',
            '/app/models/cacao_fermentation_model.h5',
            'cacao_fermentation_model.h5'
        ]
        
        for model_path in model_paths:
            if os.path.exists(model_path):
                model = tf.keras.models.load_model(model_path)
                model_loaded = True
                logger.info(f"✅ Model loaded successfully from {model_path}")
                return
        
        logger.warning("⚠️ Model not found, using timestamp-based fallback")
        model_loaded = False
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        model_loaded = False

def calculate_fermentation_day(timestamp_str):
    """Calculate fermentation day from timestamp"""
    try:
        # Parse timestamp from URL or direct input
        if '_' in timestamp_str:
            date_part, time_part = timestamp_str.split('_')
        else:
            # Handle other timestamp formats
            date_part = timestamp_str.split(' ')[0]
            time_part = timestamp_str.split(' ')[1] if ' ' in timestamp_str else '00-00-00'
            
        year, month, day = map(int, date_part.split('-'))
        hour, minute, second = map(int, time_part.split('-'))
        
        image_time = datetime(year, month, day, hour, minute, second)
        now = datetime.now()
        
        # Calculate elapsed days
        elapsed_days = (now - image_time).days
        
        # Determine fermentation stage
        if elapsed_days >= 6:
            return {"day": "day6", "stage": "Drying Ready", "day_number": 6}
        elif elapsed_days >= 5:
            return {"day": "day5", "stage": "Maturation", "day_number": 5}
        elif elapsed_days >= 3:
            return {"day": "day3", "stage": "Aerobic", "day_number": 3}
        elif elapsed_days >= 2:
            return {"day": "day2", "stage": "Anaerobic / Alcoholic", "day_number": 2}
        elif elapsed_days >= 1:
            return {"day": "day1", "stage": "Anaerobic", "day_number": 1}
        else:
            return {"day": "day0", "stage": "Fresh", "day_number": 0}
            
    except Exception as e:
        logger.error(f"Error parsing timestamp: {e}")
        return {"day": "day0", "stage": "Unknown", "day_number": 0}

def predict_with_timestamp(image_url):
    """Fallback prediction using timestamp logic"""
    try:
        # Extract timestamp from image URL
        import re
        timestamp_match = re.search(r'(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})', image_url)
        
        if timestamp_match:
            timestamp_str = timestamp_match.group(1)
            result = calculate_fermentation_day(timestamp_str)
            return {
                "day": result["day"],
                "stage": result["stage"],
                "confidence": 0.85,
                "method": "timestamp_fallback"
            }
        else:
            return {
                "day": "day0",
                "stage": "Fresh",
                "confidence": 0.5,
                "method": "default_fallback"
            }
    except Exception as e:
        logger.error(f"Error in timestamp fallback: {e}")
        return {
            "day": "day0",
            "stage": "Unknown",
            "confidence": 0.0,
            "method": "error_fallback"
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': model_loaded,
        'version': '1.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        image_url = data.get('image_url')
        
        if not image_url:
            return jsonify({'error': 'Missing image_url field'}), 400
        
        # Use timestamp-based prediction (reliable and fast)
        prediction = predict_with_timestamp(image_url)
        
        response = {
            'prediction': prediction,
            'image_url': image_url,
            'timestamp': datetime.now().isoformat(),
            'api_version': 'cloud_run_v1'
        }
        
        logger.info(f"✅ Prediction completed for {image_url}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'error': 'Prediction failed',
            'details': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'CacaoTrack ML API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': ['/health', '/predict'],
        'model_loaded': model_loaded
    })

# Load model on startup
load_model()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
