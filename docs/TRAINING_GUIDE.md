# Cacao Fermentation Model Training Guide

Complete guide to train your cacao fermentation classification model.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r python_api_requirements.txt
```

### 2. Prepare Your Data

Organize your images into subdirectories by fermentation stage:

```
cacao_data/
  ├── day0/
  │   ├── image1.jpg
  │   ├── image2.jpg
  │   └── ...
  ├── day1/
  │   ├── image1.jpg
  │   └── ...
  ├── day2/
  ├── day3/
  ├── day4/
  ├── day5/
  └── day6/
```

**If your images are in a different structure**, use the data preparation script:

```bash
python prepare_data.py --input_dir /path/to/your/images --output_dir cacao_data
```

**To verify your data structure:**

```bash
python prepare_data.py --verify_only --output_dir cacao_data
```

### 3. Train the Model

**Basic training (with transfer learning - recommended for most cases):**

```bash
python train_model.py --data_dir cacao_data --epochs 20
```

**Advanced options:**

```bash
python train_model.py \
  --data_dir cacao_data \
  --epochs 30 \
  --batch_size 32 \
  --img_size 224 \
  --model_name my_cacao_model
```

**Train from scratch (without transfer learning):**

```bash
python train_model.py --data_dir cacao_data --no_transfer_learning --epochs 50
```

### 4. Use the Trained Model

The trained model is saved as `models/cacao_fermentation_model.h5`

Update `python_api_example.py`:

```python
MODEL_PATH = 'models/cacao_fermentation_model.h5'
```

Run your API:

```bash
python python_api_example.py
```

## Training Options Explained

### Transfer Learning vs. From Scratch

**Transfer Learning (Default - Recommended)**
- Uses MobileNetV2 pre-trained on ImageNet
- Faster training (10-20 epochs)
- Better with limited data (< 1000 images per class)
- Lower compute requirements

```bash
python train_model.py --data_dir cacao_data --epochs 20
```

**Train from Scratch**
- Builds custom CNN architecture
- Requires more data (1000+ images per class)
- Slower training (50+ epochs)
- Better if your domain is very different from ImageNet

```bash
python train_model.py --data_dir cacao_data --no_transfer_learning --epochs 50
```

### Hyperparameters

| Parameter | Default | Notes |
|-----------|---------|-------|
| `--epochs` | 20 | Number of training cycles. Higher = longer training but better accuracy (usually). Recommended: 20-50 |
| `--batch_size` | 32 | Images per batch. Larger batch = faster training but more memory. Try: 16, 32, 64 |
| `--img_size` | 224 | Image resolution (224x224 or 256x256). Larger = more detail but slower |
| `--no_transfer_learning` | False | If set, trains custom CNN from scratch |

### Image Requirements

- **Format:** JPG, PNG, GIF, BMP
- **Size:** No strict requirement (script resizes to 224x224)
- **Minimum per class:** 50-100 images (transfer learning), 500+ (from scratch)
- **Recommended:** 200+ images per class for good results
- **Class balance:** Try to have similar number of images per stage

## Data Preparation

### Directory Structure Verification

```bash
python prepare_data.py --verify_only --output_dir cacao_data
```

Output will show:
```
Data Structure Verification
============================================================
✓ day0: 150 images
✓ day1: 142 images
✓ day2: 156 images
✓ day3: 148 images
✓ day4: 151 images
✓ day5: 149 images
✓ day6: 154 images
------------------------------------------------------------
Total: 1050 images
```

### Handling Class Imbalance

If you see a warning about class imbalance (ratio > 2:1), the script will automatically use class weights during training to compensate.

## Training Monitoring

### Real-time Progress

During training, you'll see:
```
Epoch 1/20
45/45 [==============================] - 12s 270ms/step - loss: 1.2345 - accuracy: 0.5234 - val_loss: 0.9876 - val_accuracy: 0.6543
```

- `loss` / `val_loss`: Lower is better (error)
- `accuracy` / `val_accuracy`: Higher is better (correct predictions)

### Training History Plot

After training completes, a plot is automatically generated and saved to `logs/training_history_*.png`

Shows:
- Training vs. validation accuracy
- Training vs. validation loss

### TensorBoard (Advanced)

Monitor training in real-time:

```bash
tensorboard --logdir logs
```

Then open http://localhost:6006 in your browser.

## Troubleshooting

### "No images found"

```
✗ Error loading training data: ...
  Make sure directory structure is: cacao_data/day0/, cacao_data/day1/, etc.
```

**Solution:** Check that your images are in subdirectories named `day0/`, `day1/`, etc.

```bash
python prepare_data.py --verify_only --output_dir cacao_data
```

### Out of Memory (OOM) Error

```
tensorflow.python.framework.errors_impl.ResourceExhaustedError: OOM when allocating tensor
```

**Solutions:**
1. Reduce batch size: `--batch_size 16`
2. Reduce image size: `--img_size 192`
3. Use transfer learning (default)

### Poor Accuracy

**Possible causes & solutions:**

1. **Too little training data**
   - Collect more images (target: 200+ per class)
   - Use `--no_transfer_learning` if you have 500+ images per class
   
2. **Training stopped early**
   - Check if EarlyStopping activated (see training logs)
   - Increase patience or disable it

3. **Wrong preprocessing**
   - Ensure images are clear and well-lit
   - Verify that all stages are represented in training data

4. **Class imbalance**
   - Ensure similar number of images per stage
   - Run: `python prepare_data.py --verify_only --output_dir cacao_data`

5. **Need more data augmentation**
   - The script includes rotation, zoom, shifts, flips by default
   - Training longer helps: `--epochs 50`

## Model Output

After successful training:

```
models/
  ├── cacao_fermentation_model.h5          # Trained model (main file)
  ├── best_model_YYYYMMDD_HHMMSS.h5        # Backup of best model
  └── cacao_fermentation_model_metadata.json # Metadata (classes, size, etc.)

logs/
  ├── YYYYMMDD_HHMMSS/                    # TensorBoard logs
  └── training_history_YYYYMMDD_HHMMSS.png # Accuracy/loss plots
```

## Integration with API

### Step 1: Update python_api_example.py

```python
MODEL_PATH = 'models/cacao_fermentation_model.h5'
model = tf.keras.models.load_model(MODEL_PATH)
```

### Step 2: Run the API

```bash
python python_api_example.py
```

API will be available at `http://localhost:8000`

### Step 3: Test with a sample image

```python
import requests

response = requests.post(
    'http://localhost:8000/predict',
    json={'image_url': 'https://example.com/cacao_image.jpg'}
)

print(response.json())
# Output: {"prediction": "day3", "confidence": 0.95}
```

### Step 4: Update mobile app

In `utils/imageInference.js`:

```javascript
const PYTHON_API_ENDPOINT = 'http://your-server-ip:8000/predict';
```

For production:
```javascript
const PYTHON_API_ENDPOINT = 'https://your-api-domain.com/predict';
```

## Advanced Training

### Use Different Architectures

The script uses MobileNetV2 by default (good balance of speed and accuracy).

To use other pre-trained models, modify `train_model.py`:

```python
# Replace this:
base_model = keras.applications.MobileNetV2(...)

# With any of these:
base_model = keras.applications.ResNet50(...)
base_model = keras.applications.EfficientNetB0(...)
base_model = keras.applications.Xception(...)
```

### Fine-tune More Layers

Modify the trainer to unfreeze some base layers:

```python
# In build_model(), after setting base_model.trainable = False:
base_model.trainable = True

# Then freeze only early layers:
for layer in base_model.layers[:-50]:
    layer.trainable = False
```

### Custom Training Loop

For advanced customization, look at `train_model.py` and modify the `train()` method.

## Performance Tips

1. **GPU Acceleration**: Install `tensorflow[and-cuda]` for GPU support (much faster)
2. **Reduce Image Size**: Use `--img_size 192` instead of 224 for faster training
3. **Use Smaller Model**: Remove `--no_transfer_learning` flag to use MobileNetV2 (recommended)
4. **Batch Processing**: Use larger batch size on GPU: `--batch_size 64`

## Next Steps

1. ✅ Collect cacao fermentation images (day0-day6)
2. ✅ Organize them in `cacao_data/` directory
3. ✅ Run `python train_model.py --data_dir cacao_data`
4. ✅ Integrate model into API
5. ✅ Test with your mobile app

---

**Need help?** Check the troubleshooting section or review the training logs in the `logs/` directory.
