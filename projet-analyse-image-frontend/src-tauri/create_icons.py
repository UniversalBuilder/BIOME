import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_gradient_background(size, colors):
    """Create a gradient background from cyan to purple to blue"""
    width, height = size
    # Create an image array
    image_array = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Define the gradient colors (RGB)
    color1 = np.array([0, 247, 255])    # #00F7FF - Cyan
    color2 = np.array([155, 107, 243])  # #9B6BF3 - Purple  
    color3 = np.array([77, 180, 255])   # #4DB4FF - Sky Blue
    
    # Create diagonal gradient
    for y in range(height):
        for x in range(width):
            # Calculate position in gradient (0.0 to 1.0)
            diagonal_pos = (x + y) / (width + height - 2)
            
            if diagonal_pos <= 0.5:
                # Blend from cyan to purple
                blend = diagonal_pos * 2
                color = color1 * (1 - blend) + color2 * blend
            else:
                # Blend from purple to blue
                blend = (diagonal_pos - 0.5) * 2
                color = color2 * (1 - blend) + color3 * blend
            
            image_array[y, x] = color.astype(np.uint8)
    
    return Image.fromarray(image_array, 'RGB')

def create_biome_icon(size):
    """Create BIOME icon with gradient background and white 'B' in lower right"""
    width, height = size
    
    # Create gradient background
    img = create_gradient_background(size, None)
    draw = ImageDraw.Draw(img)
    
    # Calculate 'B' position and size
    # Place 'B' in lower right corner, taking about 1/3 of the icon
    b_size = min(width, height) // 3
    b_x = width - b_size - (width // 10)  # Small margin from edge
    b_y = height - b_size - (height // 10)  # Small margin from edge
    
    try:
        # Try to use a bold font
        font_size = int(b_size * 0.8)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Draw white 'B' with some shadow for better visibility
    shadow_offset = max(1, width // 64)
    
    # Draw shadow
    draw.text((b_x + shadow_offset, b_y + shadow_offset), "B", 
              fill=(0, 0, 0, 128), font=font)
    
    # Draw white 'B'
    draw.text((b_x, b_y), "B", fill=(255, 255, 255, 255), font=font)
    
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
    icons_dir = "icons-new"
    os.makedirs(icons_dir, exist_ok=True)
    
    print("Creating BIOME icons with cyan gradient...")
    
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

if __name__ == "__main__":
    main()
