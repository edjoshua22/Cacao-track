"""
Complete Training Script for Cacao Fermentation Stage Classification

This script trains a CNN model to classify cacao fermentation stages (day0-day6).
It includes data loading, preprocessing, augmentation, training, evaluation, and saving.

Usage:
    python train_model.py --data_dir /path/to/cacao_images --epochs 20 --batch_size 32
"""

import os
import sys
import argparse
import json
import pickle
from pathlib import Path
from datetime import datetime

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping, 
    ReduceLROnPlateau, 
    ModelCheckpoint,
    TensorBoard
)
import matplotlib.pyplot as plt

# Cacao fermentation stages
STAGES = ["day0", "day1", "day2", "day3", "day4", "day5", "day6"]
NUM_CLASSES = len(STAGES)
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 20

class CacaoModelTrainer:
    """Trainer class for cacao fermentation classification model"""
    
    def __init__(self, data_dir, img_size=IMG_SIZE, batch_size=BATCH_SIZE):
        """
        Initialize trainer
        
        Args:
            data_dir (str): Path to directory with stage subdirectories (day0/, day1/, etc.)
            img_size (int): Image size for resizing (img_size x img_size)
            batch_size (int): Batch size for training
        """
        self.data_dir = Path(data_dir)
        self.img_size = img_size
        self.batch_size = batch_size
        self.model = None
        self.history = None
        self.class_mapping = {i: stage for i, stage in enumerate(STAGES)}
        
        # Create output directories
        self.model_dir = Path("models")
        self.logs_dir = Path("logs")
        self.model_dir.mkdir(exist_ok=True)
        self.logs_dir.mkdir(exist_ok=True)
        
    def create_data_generators(self, train_split=0.8, val_split=0.1):
        """
        Create data generators for training and validation
        
        Args:
            train_split (float): Proportion of data for training
            val_split (float): Proportion of data for validation
            
        Returns:
            tuple: (train_data, val_data, test_data)
        """
        print("=" * 60)
        print("Creating Data Generators")
        print("=" * 60)
        
        # Data augmentation for training
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            vertical_flip=True,
            fill_mode='nearest'
        )
        
        # No augmentation for validation/test
        val_datagen = ImageDataGenerator(rescale=1./255)
        
        # Load training data
        try:
            train_data = train_datagen.flow_from_directory(
                self.data_dir,
                target_size=(self.img_size, self.img_size),
                batch_size=self.batch_size,
                class_mode='categorical',
                subset='training',
                seed=42
            )
            print(f"✓ Training data loaded: {train_data.samples} samples")
        except Exception as e:
            print(f"✗ Error loading training data: {e}")
            print(f"  Make sure directory structure is: {self.data_dir}/day0/, {self.data_dir}/day1/, etc.")
            sys.exit(1)
        
        # Load validation data
        try:
            val_data = val_datagen.flow_from_directory(
                self.data_dir,
                target_size=(self.img_size, self.img_size),
                batch_size=self.batch_size,
                class_mode='categorical',
                seed=42
            )
            print(f"✓ Validation data loaded: {val_data.samples} samples")
        except Exception as e:
            print(f"✗ Error loading validation data: {e}")
            val_data = None
        
        return train_data, val_data
    
    def build_model(self, use_transfer_learning=True):
        """
        Build CNN model for classification
        
        Args:
            use_transfer_learning (bool): If True, use MobileNetV2 base; else build from scratch
            
        Returns:
            keras.Model: Compiled model
        """
        print("\n" + "=" * 60)
        print("Building Model")
        print("=" * 60)
        
        if use_transfer_learning:
            print("Using Transfer Learning (MobileNetV2)...")
            # Pre-trained base model
            base_model = keras.applications.MobileNetV2(
                input_shape=(self.img_size, self.img_size, 3),
                include_top=False,
                weights='imagenet'
            )
            
            # Freeze base layers for faster training
            base_model.trainable = False
            
            # Build custom top layers
            model = models.Sequential([
                layers.Input(shape=(self.img_size, self.img_size, 3)),
                base_model,
                layers.GlobalAveragePooling2D(),
                layers.Dense(256, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                layers.Dense(128, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.3),
                layers.Dense(NUM_CLASSES, activation='softmax')
            ])
        else:
            print("Building Custom CNN from scratch...")
            model = models.Sequential([
                layers.Input(shape=(self.img_size, self.img_size, 3)),
                
                # Block 1
                layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Block 2
                layers.Conv2D(64, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.Conv2D(64, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Block 3
                layers.Conv2D(128, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.Conv2D(128, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Block 4
                layers.Conv2D(256, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.Conv2D(256, (3, 3), padding='same', activation='relu'),
                layers.BatchNormalization(),
                layers.MaxPooling2D((2, 2)),
                layers.Dropout(0.25),
                
                # Flatten and Dense layers
                layers.Flatten(),
                layers.Dense(512, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.5),
                layers.Dense(256, activation='relu'),
                layers.BatchNormalization(),
                layers.Dropout(0.3),
                layers.Dense(NUM_CLASSES, activation='softmax')
            ])
        
        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print(f"✓ Model built successfully")
        print(f"  Total parameters: {model.count_params():,}")
        
        self.model = model
        return model
    
    def train(self, train_data, val_data, epochs=EPOCHS, use_transfer_learning=True):
        """
        Train the model
        
        Args:
            train_data: Training data generator
            val_data: Validation data generator
            epochs (int): Number of epochs
            use_transfer_learning (bool): Whether to use transfer learning
            
        Returns:
            dict: Training history
        """
        print("\n" + "=" * 60)
        print("Training Model")
        print("=" * 60)
        
        # Build model if not already built
        if self.model is None:
            self.build_model(use_transfer_learning=use_transfer_learning)
        
        # Callbacks
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7,
                verbose=1
            ),
            ModelCheckpoint(
                str(self.model_dir / f"best_model_{timestamp}.h5"),
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            ),
            TensorBoard(
                log_dir=str(self.logs_dir / timestamp),
                histogram_freq=1
            )
        ]
        
        # Train
        self.history = self.model.fit(
            train_data,
            validation_data=val_data,
            epochs=epochs,
            callbacks=callbacks,
            verbose=1
        )
        
        print("✓ Training completed")
        return self.history
    
    def evaluate(self, test_data):
        """
        Evaluate model on test data
        
        Args:
            test_data: Test data generator
            
        Returns:
            tuple: (loss, accuracy)
        """
        print("\n" + "=" * 60)
        print("Evaluating Model")
        print("=" * 60)
        
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        loss, accuracy = self.model.evaluate(test_data, verbose=1)
        print(f"✓ Test Loss: {loss:.4f}")
        print(f"✓ Test Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
        
        return loss, accuracy
    
    def save_model(self, name="cacao_fermentation_model"):
        """
        Save trained model and metadata
        
        Args:
            name (str): Model name (without extension)
        """
        print("\n" + "=" * 60)
        print("Saving Model")
        print("=" * 60)
        
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Save model
        model_path = self.model_dir / f"{name}.h5"
        self.model.save(model_path)
        print(f"✓ Model saved to: {model_path}")
        
        # Save metadata
        metadata = {
            "model_name": name,
            "img_size": self.img_size,
            "classes": STAGES,
            "num_classes": NUM_CLASSES,
            "timestamp": datetime.now().isoformat()
        }
        
        metadata_path = self.model_dir / f"{name}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✓ Metadata saved to: {metadata_path}")
    
    def plot_training_history(self, save_path=None):
        """
        Plot training history
        
        Args:
            save_path (str): Path to save plot (optional)
        """
        if self.history is None:
            print("No training history available")
            return
        
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        
        # Accuracy
        axes[0].plot(self.history.history['accuracy'], label='Train')
        axes[0].plot(self.history.history['val_accuracy'], label='Validation')
        axes[0].set_title('Model Accuracy')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Accuracy')
        axes[0].legend()
        axes[0].grid(True)
        
        # Loss
        axes[1].plot(self.history.history['loss'], label='Train')
        axes[1].plot(self.history.history['val_loss'], label='Validation')
        axes[1].set_title('Model Loss')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Loss')
        axes[1].legend()
        axes[1].grid(True)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=100)
            print(f"✓ Plot saved to: {save_path}")
        
        plt.show()


def main():
    """Main training pipeline"""
    parser = argparse.ArgumentParser(
        description="Train cacao fermentation classification model"
    )
    parser.add_argument(
        '--data_dir',
        type=str,
        default='cacao_data',
        help='Path to data directory with day0/, day1/, ... subdirectories'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=EPOCHS,
        help='Number of epochs'
    )
    parser.add_argument(
        '--batch_size',
        type=int,
        default=BATCH_SIZE,
        help='Batch size'
    )
    parser.add_argument(
        '--img_size',
        type=int,
        default=IMG_SIZE,
        help='Image size (img_size x img_size)'
    )
    parser.add_argument(
        '--no_transfer_learning',
        action='store_true',
        help='Train from scratch instead of using transfer learning'
    )
    parser.add_argument(
        '--model_name',
        type=str,
        default='cacao_fermentation_model',
        help='Name for the saved model'
    )
    
    args = parser.parse_args()
    
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + " Cacao Fermentation Stage Classification Training ".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    # Initialize trainer
    trainer = CacaoModelTrainer(
        data_dir=args.data_dir,
        img_size=args.img_size,
        batch_size=args.batch_size
    )
    
    # Create data generators
    train_data, val_data = trainer.create_data_generators()
    
    # Build and train model
    trainer.build_model(use_transfer_learning=not args.no_transfer_learning)
    
    trainer.train(
        train_data,
        val_data,
        epochs=args.epochs,
        use_transfer_learning=not args.no_transfer_learning
    )
    
    # Evaluate
    if val_data:
        trainer.evaluate(val_data)
    
    # Save model
    trainer.save_model(name=args.model_name)
    
    # Plot results
    trainer.plot_training_history(
        save_path=f"logs/training_history_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    )
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print(f"Next steps:")
    print(f"1. Use the trained model in your API:")
    print(f"   - Update MODEL_PATH in python_api_example.py")
    print(f"2. Test the API locally:")
    print(f"   - python python_api_example.py")
    print(f"3. Update mobile app with API endpoint")
    print()


if __name__ == "__main__":
    main()
