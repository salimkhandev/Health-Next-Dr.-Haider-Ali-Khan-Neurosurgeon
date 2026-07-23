import os
import sys
import subprocess

def install_pillow():
    try:
        from PIL import Image
    except ImportError:
        print("Pillow is not installed. Installing it now...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
        print("Pillow installed successfully.")

install_pillow()
from PIL import Image

def generate_icons():
    source_path = r"d:\IlmPath\public\eng-fav.jpg"
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return

    img = Image.open(source_path)

    # List of targets: (destination_path, size_tuple, is_ico_format)
    targets = [
        # Public directory icons
        (r"d:\IlmPath\public\favicon.ico", (32, 32), True),
        (r"d:\IlmPath\public\logo.png", (512, 512), False),
        (r"d:\IlmPath\public\icon-192x192.png", (192, 192), False),
        (r"d:\IlmPath\public\icon-512x512.png", (512, 512), False),
        (r"d:\IlmPath\public\icon-maskable-192x192.png", (192, 192), False),
        (r"d:\IlmPath\public\icon-maskable-512x512.png", (512, 512), False),
        
        # App directory icons
        (r"d:\IlmPath\app\favicon.ico", (32, 32), True),
        (r"d:\IlmPath\app\icon.png", (512, 512), False),
        (r"d:\IlmPath\app\apple-icon.png", (180, 180), False),
    ]

    for dest, size, is_ico in targets:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        # We preserve aspect ratio or just crop to square
        w, h = img.size
        min_dim = min(w, h)
        
        # Center crop to make it a square before resizing
        left = (w - min_dim) / 2
        top = (h - min_dim) / 2
        right = (w + min_dim) / 2
        bottom = (h + min_dim) / 2
        
        cropped_img = img.crop((left, top, right, bottom))
        resized_img = cropped_img.resize(size, Image.Resampling.LANCZOS)
        
        # Convert to RGBA to satisfy Turbopack/Next.js requirement
        rgba_img = resized_img.convert("RGBA")
        
        if is_ico:
            rgba_img.save(dest, format="ICO")
        else:
            rgba_img.save(dest, format="PNG")
        print(f"Generated: {dest} ({size[0]}x{size[1]})")

if __name__ == "__main__":
    generate_icons()
