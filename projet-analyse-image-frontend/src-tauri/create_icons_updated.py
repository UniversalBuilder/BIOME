import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_gradient_background(size):
    """Create a gradient background matching BIOME title colors (cyan to blue)"""
    width, height = size
    # Create an image array
    image_array = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Define the gradient colors (RGB) - matching BIOME title gradient
    color1 = np.array([0, 247, 255])    # #00F7FF - Cyan (start)
    color2 = np.array([77, 180, 255])   # #4DB4FF - Sky Blue (end)
    
    # Create diagonal gradient from top-left to bottom-right
    for y in range(height):
        for x in range(width):
            # Calculate position in gradient (0.0 to 1.0) diagonally
            diagonal_pos = (x + y) / (width + height - 2)
            
            # Blend from cyan to blue
            color = color1 * (1 - diagonal_pos) + color2 * diagonal_pos
            image_array[y, x] = color.astype(np.uint8)
    
    return Image.fromarray(image_array, 'RGB')

def create_biome_icon(size):
    """Create BIOME icon with cyan gradient background and large white 'B' positioned bottom right"""
    width, height = size
    
    # Create gradient background
    img = create_gradient_background(size)
    draw = ImageDraw.Draw(img)
    
    # Calculate 'B' position and size - make it larger and position at bottom right
    # Make B much larger (90% of icon size)
    b_size = min(width, height) * 0.9
    
    # Position the B at bottom right, slightly off-center
    margin_x = width * 0.08   # Small margin from right edge
    margin_y = height * 0.08  # Small margin from bottom edge
    
    # Calculate position: bottom right with margins
    b_x = width - margin_x - (b_size * 0.6)    # Position from right edge
    b_y = height - margin_y - (b_size * 0.6)   # Position from bottom edge
    
    try:
        # Calculate font size to fit the larger B
        font_size = int(b_size * 0.9)  # Use more of the available space
        
        # Try to load a bold font
        font_paths = [
            "C:/Windows/Fonts/arialbd.ttf",  # Arial Bold
            "C:/Windows/Fonts/arial.ttf",    # Arial Regular
            "arial.ttf"
        ]
        
        font = None
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                continue
        
        if font is None:
            font = ImageFont.load_default()
            
    except:
        font = ImageFont.load_default()
    
    # Get text bounding box for precise positioning
    bbox = draw.textbbox((0, 0), "B", font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Position the text at the calculated bottom-right position
    final_x = b_x - (text_width // 2)
    final_y = b_y - (text_height // 2)
    
    # Draw white 'B' with no shadow (flat design)
    draw.text((final_x, final_y), "B", fill=(255, 255, 255, 255), font=font)
    
    return img

def main():
    # Icon sizes needed for Windows/Web
    sizes = [
        (16, 16),
        (32, 32),
        (64, 64),
        (128, 128),
        (256, 256),
        (512, 512)
    ]
    
    # Windows Store icon sizes
    store_sizes = [
        (30, 30),
        (44, 44),
        (71, 71),
        (89, 89),
        (107, 107),
        (142, 142),
        (150, 150),
        (284, 284),
        (310, 310)
    ]
    
    # Create the icons directory if it doesn't exist
    icons_dir = "icons-updated"
    os.makedirs(icons_dir, exist_ok=True)
    
    print("Creating BIOME icons with cyan-blue gradient (matching title)...")
    
    # Create standard sizes
    for width, height in sizes:
        print(f"Creating {width}x{height} icon...")
        icon = create_biome_icon((width, height))
        
        # Save PNG
        icon.save(f"{icons_dir}/{width}x{height}.png")
        
        # Save main icon sizes with specific names
        if width == 128:
            icon.save(f"{icons_dir}/icon.png")
            # Create @2x version
            icon_2x = create_biome_icon((256, 256))
            icon_2x.save(f"{icons_dir}/128x128@2x.png")
    
    # Create Windows Store icons
    for width, height in store_sizes:
        print(f"Creating {width}x{height} Store logo...")
        icon = create_biome_icon((width, height))
        icon.save(f"{icons_dir}/Square{width}x{height}Logo.png")
    
    # Create ICO file for Windows (multiple sizes in one file)
    print("Creating Windows ICO file...")
    ico_sizes = [(16,16), (32,32), (64,64), (128,128), (256,256)]
    ico_images = []
    for size in ico_sizes:
        ico_images.append(create_biome_icon(size))
    
    # Save ICO file
    ico_images[0].save(f"{icons_dir}/icon.ico", format='ICO', 
                       sizes=[(img.size[0], img.size[1]) for img in ico_images])
    
    # Create StoreLogo
    store_logo = create_biome_icon((50, 50))
    store_logo.save(f"{icons_dir}/StoreLogo.png")
    
    print(f"All icons created successfully in '{icons_dir}' directory!")
    print("Icons created:")
    print("- icon.png (main icon)")
    print("- icon.ico (Windows icon)")
    print("- Various PNG sizes for different uses")
    print("- Windows Store logos")
    print("Colors used: Cyan (#00F7FF) to Blue (#4DB4FF) gradient")
    print("Design: Large white 'B' positioned slightly right and down")

if __name__ == "__main__":
    main()
