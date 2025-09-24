#!/usr/bin/env python3
"""
Convert the new BIOME icon to all required formats and sizes.
"""

import os
from PIL import Image

def convert_ico_to_pngs(ico_path, output_dir):
    """Convert .ico file to various PNG sizes"""
    
    # Open the .ico file
    with Image.open(ico_path) as ico:
        # Get the largest size from the ico file
        ico.load()
        
        # Define the sizes we need for the app
        sizes = [
            (16, 16),
            (32, 32),
            (64, 64),
            (128, 128),
            (192, 192),
            (256, 256),
            (512, 512),
            # Windows store logos
            (30, 30),
            (44, 44),
            (71, 71),
            (89, 89),
            (107, 107),
            (142, 142),
            (150, 150),
            (284, 284),
            (310, 310),
        ]
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Convert to each size
        for width, height in sizes:
            # Resize the image
            resized = ico.resize((width, height), Image.Resampling.LANCZOS)
            
            # Save as PNG
            output_path = os.path.join(output_dir, f"{width}x{height}.png")
            resized.save(output_path, "PNG")
            print(f"Created: {output_path}")
            
            # Special cases for specific filenames
            if width == 128 and height == 128:
                # Create the @2x version (same size, different filename)
                resized.save(os.path.join(output_dir, "128x128@2x.png"), "PNG")
                print(f"Created: {os.path.join(output_dir, '128x128@2x.png')}")
                
            if width == 256 and height == 256:
                # Create generic icon.png
                resized.save(os.path.join(output_dir, "icon.png"), "PNG")
                print(f"Created: {os.path.join(output_dir, 'icon.png')}")
                
            if width == 192 and height == 192:
                # Create logo192.png for web manifest
                resized.save(os.path.join(output_dir, "logo192.png"), "PNG")
                print(f"Created: {os.path.join(output_dir, 'logo192.png')}")
                
            if width == 512 and height == 512:
                # Create logo512.png for web manifest
                resized.save(os.path.join(output_dir, "logo512.png"), "PNG")
                print(f"Created: {os.path.join(output_dir, 'logo512.png')}")
        
        # Create Windows Store Logo files with specific names
        store_logos = [
            (30, "Square30x30Logo.png"),
            (44, "Square44x44Logo.png"),
            (71, "Square71x71Logo.png"),
            (89, "Square89x89Logo.png"),
            (107, "Square107x107Logo.png"),
            (142, "Square142x142Logo.png"),
            (150, "Square150x150Logo.png"),
            (284, "Square284x284Logo.png"),
            (310, "Square310x310Logo.png"),
            (150, "StoreLogo.png"),  # Store logo is typically 150x150
        ]
        
        for size, filename in store_logos:
            resized = ico.resize((size, size), Image.Resampling.LANCZOS)
            output_path = os.path.join(output_dir, filename)
            resized.save(output_path, "PNG")
            print(f"Created: {output_path}")

if __name__ == "__main__":
    ico_path = r"D:\DEV\biome_1.1.ico"
    
    # Convert for Tauri icons
    tauri_output = r"d:\DEV\BIOME\projet-analyse-image-frontend\src-tauri\icons"
    print("Converting icons for Tauri...")
    convert_ico_to_pngs(ico_path, tauri_output)
    
    # Convert for public folder (web app)
    public_output = r"d:\DEV\BIOME\projet-analyse-image-frontend\public"
    print("\nConverting icons for web app...")
    convert_ico_to_pngs(ico_path, public_output)
    
    print("\n✅ Icon conversion completed!")
