#!/usr/bin/env python3
"""
Update all BIOME app icons with the new biome_1.1.ico file
"""

import os
import shutil
from PIL import Image

def convert_ico_to_various_formats(ico_path, output_configs):
    """Convert .ico file to various formats and sizes for different locations"""
    
    if not os.path.exists(ico_path):
        print(f"❌ Error: Source icon file not found: {ico_path}")
        return False
    
    try:
        with Image.open(ico_path) as ico:
            ico.load()
            print(f"✅ Successfully loaded source icon: {ico_path}")
            print(f"📏 Original size: {ico.size}")
            
            for config in output_configs:
                output_path = config['path']
                size = config['size']
                
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                # Resize and save
                if size:
                    resized = ico.resize(size, Image.Resampling.LANCZOS)
                    resized.save(output_path)
                    print(f"✅ Created: {output_path} ({size[0]}x{size[1]})")
                else:
                    # Copy original size
                    ico.save(output_path)
                    print(f"✅ Created: {output_path} (original size)")
            
            return True
            
    except Exception as e:
        print(f"❌ Error processing icon: {e}")
        return False

def main():
    # Source icon path
    source_ico = r"D:\DEV\biome_1.1.ico"
    
    # Define all the places where icons need to be updated
    icon_configs = [
        # Tauri desktop app icons
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\icon.ico", "size": None},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\icon.png", "size": (128, 128)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\32x32.png", "size": (32, 32)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\128x128.png", "size": (128, 128)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\128x128@2x.png", "size": (256, 256)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\logo192.png", "size": (192, 192)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\logo512.png", "size": (512, 512)},
        
        # Web app icons (public folder)
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\public\favicon.ico", "size": None},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\public\icon.png", "size": (256, 256)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\public\logo.png", "size": (256, 256)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\public\logo192.png", "size": (192, 192)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\public\logo512.png", "size": (512, 512)},
        
        # Windows Store icons (if needed)
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square30x30Logo.png", "size": (30, 30)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square44x44Logo.png", "size": (44, 44)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square71x71Logo.png", "size": (71, 71)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square89x89Logo.png", "size": (89, 89)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square107x107Logo.png", "size": (107, 107)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square142x142Logo.png", "size": (142, 142)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square150x150Logo.png", "size": (150, 150)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square284x284Logo.png", "size": (284, 284)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\Square310x310Logo.png", "size": (310, 310)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\StoreLogo.png", "size": (50, 50)},
        
        # Additional standard sizes
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\16x16.png", "size": (16, 16)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\64x64.png", "size": (64, 64)},
        {"path": r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\256x256.png", "size": (256, 256)},
    ]
    
    print("🔄 BIOME Icon Update Script")
    print("=" * 50)
    print(f"📂 Source: {source_ico}")
    print(f"🎯 Total locations to update: {len(icon_configs)}")
    print()
    
    success = convert_ico_to_various_formats(source_ico, icon_configs)
    
    if success:
        print()
        print("🎉 Icon update completed successfully!")
        print("📝 Summary:")
        print("   ✅ Tauri desktop app icons updated")
        print("   ✅ Web app icons updated")
        print("   ✅ Windows Store icons updated")
        print("   ✅ All standard sizes generated")
        print()
        print("🔧 Next steps:")
        print("   1. Rebuild the Tauri app: npm run tauri build")
        print("   2. Rebuild the web app: npm run build")
        print("   3. Clear browser cache to see new favicon")
    else:
        print()
        print("❌ Icon update failed. Check the error messages above.")

if __name__ == "__main__":
    main()
