from PIL import Image

def flood_fill_transparency(image_path, output_path, tolerance=30):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    bg_color = pixels[0, 0]
    
    visited = set()
    # Initialize queue with pixels along the entire border to ensure we catch all background
    queue = []
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height-1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width-1, y))
        
    def color_diff(c1, c2):
        return sum(abs(c1[i] - c2[i]) for i in range(3))
        
    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        current_color = pixels[x, y]
        # Ignore already transparent pixels
        if current_color[3] == 0:
            continue
            
        if color_diff(current_color, bg_color) <= tolerance * 3:
            pixels[x, y] = (255, 255, 255, 0)
            if x > 0 and (x-1, y) not in visited: queue.append((x-1, y))
            if x < width - 1 and (x+1, y) not in visited: queue.append((x+1, y))
            if y > 0 and (x, y-1) not in visited: queue.append((x, y-1))
            if y < height - 1 and (x, y+1) not in visited: queue.append((x, y+1))

    img.save(output_path, "PNG")

if __name__ == "__main__":
    # Remove background with higher tolerance (70)
    flood_fill_transparency("frontend/public/owllogo.png", "frontend/public/owllogo-transparent.png", tolerance=70)
    print("Flood fill done")
