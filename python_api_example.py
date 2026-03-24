"""
Cacao Fermentation Stage Classification API
Flask + TensorFlow/Keras example
Supports image URLs (Firebase) AND file uploads (mobile)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import numpy as np
import tensorflow as tf
import os
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile apps

# Path to your trained model
MODEL_PATH = 'models/cacao_fermentation_model.h5'
model = None

def load_model():
    """Load your trained TensorFlow/Keras model"""
    global model
    if os.path.exists(MODEL_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
    else:
        print(f"Warning: Model not found at {MODEL_PATH}")

# Load model on startup
load_model()

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

# -----------------------------
# Image preprocessing
# -----------------------------
def preprocess_image(image):
    """
    Preprocess PIL image for model input
    """
    try:
        # Resize to model input size
        image = image.resize((224, 224))
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        # Convert to array and normalize
        img_array = np.array(image) / 255.0
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

def load_image_from_file(file_stream):
    """Load image from uploaded file"""
    try:
        return Image.open(file_stream)
    except Exception as e:
        print(f"Error opening uploaded file: {e}")
        return None

def load_image_from_url(url):
    """Download image from URL"""
    try:
        response = requests.get(url, timeout=10)
        return Image.open(io.BytesIO(response.content))
    except Exception as e:
        print(f"Error downloading image from URL: {e}")
        return None

# -----------------------------
# Prediction
# -----------------------------
def predict_stage(image):
    """
    Predict fermentation stage from PIL image
    """
    if model is None:
        return {"error": "Model not loaded"}, 500

    processed_image = preprocess_image(image)
    if processed_image is None:
        return {"error": "Failed to process image"}, 400

    try:
        predictions = model.predict(processed_image, verbose=0)
        predicted_class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class_idx])
        day_key = STAGE_MAPPING.get(predicted_class_idx, "day0")

        return {
            "prediction": day_key,
            "class": day_key,
            "confidence": confidence,
            "all_predictions": {
                STAGE_MAPPING[i]: float(predictions[0][i])
                for i in range(len(STAGE_MAPPING))
            }
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"error": str(e)}, 500

# -----------------------------
# Routes
# -----------------------------

# Home
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Cacao Fermentation API is running!",
        "endpoints": {
            "/predict": "POST (send 'image_url' or file upload 'image')",
            "/health": "GET"
        }
    })

# Health
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    }), 200

# Predict
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1️⃣ Check if an image file is uploaded
        if 'image' in request.files:
            file = request.files['image']
            image = load_image_from_file(file)
            if image is None:
                return jsonify({"error": "Invalid image file"}), 400

        # 2️⃣ Otherwise, check if image_url is provided
        elif request.json and 'image_url' in request.json:
            url = request.json['image_url']
            image = load_image_from_url(url)
            if image is None:
                return jsonify({"error": "Failed to download image from URL"}), 400

        else:
            return jsonify({"error": "No image provided. Send 'image' file or 'image_url'."}), 400

        # Predict stage
        result = predict_stage(image)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# Run server
# -----------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
