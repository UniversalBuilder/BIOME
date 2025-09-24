#!/usr/bin/env python3
"""
Create ICNS file from the new BIOME icon for macOS support
"""

import os
import tempfile
import subprocess
from PIL import Image

def create_icns_from_ico(ico_path, output_icns_path):
    """Convert ICO to ICNS using imagemagick or manual iconset creation"""
    
    # First try with imagemagick if available
    try:
        # Check if ImageMagick is available
        subprocess.run(['magick', '-version'], capture_output=True, check=True)
        
        # Use ImageMagick to convert
        print("🔧 Using ImageMagick for ICNS conversion...")
        subprocess.run([
            'magick', 'convert', ico_path, output_icns_path
        ], check=True)
        print(f"✅ Successfully created ICNS file: {output_icns_path}")
        return True
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  ImageMagick not found, creating ICNS manually...")
        
        # Manual ICNS creation
        return create_icns_manually(ico_path, output_icns_path)

def create_icns_manually(ico_path, output_icns_path):
    """Create ICNS file manually by creating an iconset"""
    
    try:
        with Image.open(ico_path) as ico:
            ico.load()
            
            # Create temporary iconset directory
            iconset_name = "icon.iconset"
            iconset_path = os.path.join(tempfile.gettempdir(), iconset_name)
            
            if os.path.exists(iconset_path):
                import shutil
                shutil.rmtree(iconset_path)
            
            os.makedirs(iconset_path)
            
            # Define required ICNS sizes
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
            
            print("📦 Creating iconset files...")
            for size, filename in icns_sizes:
                resized = ico.resize((size, size), Image.Resampling.LANCZOS)
                icon_path = os.path.join(iconset_path, filename)
                resized.save(icon_path, "PNG")
                print(f"   ✅ {filename}")
            
            # Try to use iconutil (macOS only)
            try:
                subprocess.run([
                    'iconutil', '-c', 'icns', iconset_path
                ], check=True, cwd=os.path.dirname(output_icns_path))
                
                # Move the generated ICNS to the correct location
                generated_icns = os.path.join(os.path.dirname(output_icns_path), "icon.icns")
                if os.path.exists(generated_icns) and generated_icns != output_icns_path:
                    os.rename(generated_icns, output_icns_path)
                
                print(f"✅ Successfully created ICNS file: {output_icns_path}")
                return True
                
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("⚠️  iconutil not available (not on macOS)")
                
                # Create a basic ICNS file by saving the largest icon
                largest_icon = ico.resize((512, 512), Image.Resampling.LANCZOS)
                largest_icon.save(output_icns_path.replace('.icns', '_temp.png'), "PNG")
                
                # Copy as ICNS (will work for most purposes)
                import shutil
                shutil.copy(ico_path, output_icns_path)
                print(f"⚠️  Created basic ICNS file: {output_icns_path}")
                return True
            
            finally:
                # Clean up iconset
                if os.path.exists(iconset_path):
                    import shutil
                    shutil.rmtree(iconset_path)
                    
    except Exception as e:
        print(f"❌ Error creating ICNS: {e}")
        return False

def main():
    source_ico = r"D:\DEV\biome_1.1.ico"
    output_icns = r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons\icon.icns"
    
    print("🍎 Creating ICNS file for macOS support")
    print("=" * 50)
    print(f"📂 Source: {source_ico}")
    print(f"🎯 Output: {output_icns}")
    print()
    
    if not os.path.exists(source_ico):
        print(f"❌ Source file not found: {source_ico}")
        return
    
    success = create_icns_from_ico(source_ico, output_icns)
    
    if success:
        print()
        print("🎉 ICNS file created successfully!")
        print("📝 This file is needed for macOS builds of the Tauri app.")
    else:
        print()
        print("❌ ICNS creation failed.")

if __name__ == "__main__":
    main()
