"""
Data Preparation Helper for Cacao Fermentation Training

This script helps organize and prepare your image data for training.
It can split data into train/val/test sets and verify directory structure.

Usage:
    python prepare_data.py --input_dir /path/to/raw/images --output_dir ./cacao_data
"""

import os
import argparse
import shutil
from pathlib import Path
from collections import defaultdict

STAGES = ["day0", "day1", "day2", "day3", "day4", "day5", "day6"]


def create_directory_structure(output_dir):
    """Create the expected directory structure"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    for stage in STAGES:
        stage_dir = output_path / stage
        stage_dir.mkdir(exist_ok=True)
        print(f"✓ Created directory: {stage_dir}")
    
    return output_path


def organize_images_by_stage(input_dir, output_dir):
    """
    Organize images into stage directories
    Assumes input has subdirectories named day0/, day1/, etc.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    if not input_path.exists():
        print(f"✗ Input directory not found: {input_path}")
        return False
    
    # Create output structure
    create_directory_structure(output_dir)
    
    # Copy images
    total_copied = 0
    for stage in STAGES:
        stage_input = input_path / stage
        
        if not stage_input.exists():
            print(f"⚠ Stage directory not found: {stage_input}")
            continue
        
        # Find all image files
        image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp')
        images = [f for f in stage_input.iterdir() 
                 if f.is_file() and f.suffix.lower() in image_extensions]
        
        # Copy to output
        stage_output = output_path / stage
        for img in images:
            dest = stage_output / img.name
            shutil.copy2(img, dest)
            total_copied += 1
        
        print(f"✓ {stage}: {len(images)} images")
    
    print(f"\n✓ Total images organized: {total_copied}")
    return True


def verify_data_structure(data_dir):
    """Verify the data directory structure and report statistics"""
    data_path = Path(data_dir)
    
    if not data_path.exists():
        print(f"✗ Data directory not found: {data_path}")
        return False
    
    print("\n" + "=" * 60)
    print("Data Structure Verification")
    print("=" * 60)
    
    stats = defaultdict(int)
    total_images = 0
    
    for stage in STAGES:
        stage_dir = data_path / stage
        
        if not stage_dir.exists():
            print(f"✗ Missing: {stage_dir}")
            continue
        
        # Count images
        image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp')
        images = [f for f in stage_dir.iterdir() 
                 if f.is_file() and f.suffix.lower() in image_extensions]
        
        count = len(images)
        stats[stage] = count
        total_images += count
        
        status = "✓" if count > 0 else "⚠"
        print(f"{status} {stage}: {count:4d} images")
    
    print("-" * 60)
    print(f"Total: {total_images} images")
    
    # Check for class imbalance
    if stats:
        min_count = min(stats.values())
        max_count = max(stats.values())
        if max_count > 0 and min_count > 0:
            ratio = max_count / min_count
            if ratio > 2:
                print(f"\n⚠ Warning: Class imbalance detected (ratio: {ratio:.1f})")
                print("  Consider using class weights during training.")
    
    return True


def split_data(data_dir, train_split=0.7, val_split=0.15, test_split=0.15):
    """
    Split data into train/val/test sets
    
    Args:
        data_dir: Directory with stage subdirectories
        train_split: Proportion for training
        val_split: Proportion for validation
        test_split: Proportion for testing
    """
    import random
    
    data_path = Path(data_dir)
    
    # Create split directories
    for split_name in ['train', 'val', 'test']:
        split_dir = data_path / split_name
        split_dir.mkdir(exist_ok=True)
        for stage in STAGES:
            (split_dir / stage).mkdir(exist_ok=True)
    
    print("\n" + "=" * 60)
    print("Splitting Data")
    print("=" * 60)
    
    for stage in STAGES:
        stage_dir = data_path / stage
        
        if not stage_dir.exists():
            continue
        
        # Get all images
        image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp')
        images = [f for f in stage_dir.iterdir() 
                 if f.is_file() and f.suffix.lower() in image_extensions]
        
        # Shuffle
        random.shuffle(images)
        
        # Calculate split indices
        n = len(images)
        train_idx = int(n * train_split)
        val_idx = train_idx + int(n * val_split)
        
        # Split
        train_images = images[:train_idx]
        val_images = images[train_idx:val_idx]
        test_images = images[val_idx:]
        
        # Copy files
        for img in train_images:
            shutil.copy2(img, data_path / 'train' / stage / img.name)
        for img in val_images:
            shutil.copy2(img, data_path / 'val' / stage / img.name)
        for img in test_images:
            shutil.copy2(img, data_path / 'test' / stage / img.name)
        
        print(f"{stage}: {len(train_images)} train, "
              f"{len(val_images)} val, {len(test_images)} test")
    
    print("✓ Data split complete")


def main():
    parser = argparse.ArgumentParser(
        description="Prepare data for cacao model training"
    )
    parser.add_argument(
        '--input_dir',
        type=str,
        help='Input directory with day0/, day1/, ... subdirectories'
    )
    parser.add_argument(
        '--output_dir',
        type=str,
        default='cacao_data',
        help='Output directory for organized data'
    )
    parser.add_argument(
        '--verify_only',
        action='store_true',
        help='Only verify existing data structure'
    )
    parser.add_argument(
        '--split',
        action='store_true',
        help='Split data into train/val/test'
    )
    
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("Cacao Data Preparation Tool")
    print("=" * 60 + "\n")
    
    # Organize images if input_dir provided
    if args.input_dir and not args.verify_only:
        print("Organizing images...")
        organize_images_by_stage(args.input_dir, args.output_dir)
    
    # Verify structure
    verify_data_structure(args.output_dir)
    
    # Split if requested
    if args.split:
        split_data(args.output_dir)
    
    print("\n" + "=" * 60)
    print("Data preparation complete!")
    print("=" * 60)
    print(f"\nNext step: Train your model")
    print(f"  python train_model.py --data_dir {args.output_dir}")
    print()


if __name__ == "__main__":
    main()
