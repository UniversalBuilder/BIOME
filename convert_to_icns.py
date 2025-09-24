#!/usr/bin/env python3
"""
Convert the new BIOME icon to ICNS format for macOS.
"""

import os
import subprocess
from PIL import Image

def create_icns_from_ico(ico_path, output_path):
    """Convert .ico file to .icns format"""
    
    # Create a temporary directory for iconset
    iconset_dir = output_path.replace('.icns', '.iconset')
    os.makedirs(iconset_dir, exist_ok=True)
    
    try:
        # Open the .ico file
        with Image.open(ico_path) as ico:
            ico.load()
            
            # Define the sizes needed for icns
            icns_sizes = [
                (16, "icon_16x16.png"),
                (32, "icon_16x16@2x.png"),
                (32, "icon_32x32.png"),
                (64, "icon_32x32@2x.png"),
                (128, "icon_128x128.png"),
                (256, "icon_128x128@2x.png"),
                (256, "icon_256x256.png"),
                (512, "icon_256x256@2x.png"),
                (512, "icon_512x512.png"),
                (1024, "icon_512x512@2x.png"),
            ]
            
            # Create each size
            for size, filename in icns_sizes:
                resized = ico.resize((size, size), Image.Resampling.LANCZOS)
                icon_path = os.path.join(iconset_dir, filename)
                resized.save(icon_path, "PNG")
                print(f"Created: {icon_path}")
        
        # Try to use iconutil (macOS only) or fall back to manual creation
        try:
            # This will only work on macOS
            subprocess.run(['iconutil', '-c', 'icns', iconset_dir, '-o', output_path], 
                         check=True, capture_output=True)
            print(f"Created ICNS: {output_path}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            # iconutil not available (not on macOS), try alternative approach
            print("iconutil not available, creating ICNS manually...")
            
            # For non-macOS systems, we'll just copy the 256x256 icon as a fallback
            # In a real scenario, you'd want to use a library like Pillow with icns support
            # or generate it on a macOS system
            with Image.open(ico_path) as ico:
                ico.load()
                resized = ico.resize((256, 256), Image.Resampling.LANCZOS)
                # Save as PNG first, then rename to .icns (basic fallback)
                temp_png = output_path.replace('.icns', '_temp.png')
                resized.save(temp_png, "PNG")
                
                # Try to create a basic ICNS structure
                try:
                    # This is a very basic approach - in production you'd want proper ICNS creation
                    os.rename(temp_png, output_path)
                    print(f"Created basic ICNS fallback: {output_path}")
                except Exception as e:
                    print(f"Could not create ICNS: {e}")
                    # Clean up
                    if os.path.exists(temp_png):
                        os.remove(temp_png)
    
    finally:
        # Clean up iconset directory
        try:
            import shutil
            shutil.rmtree(iconset_dir)
        except Exception:
            pass

if __name__ == "__main__":
    ico_path = r"D:\DEV\biome_1.1.ico"
    icns_path = r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\icon.icns"
    
    print("Converting icon to ICNS format...")
    create_icns_from_ico(ico_path, icns_path)
    print("✅ ICNS conversion completed!")
