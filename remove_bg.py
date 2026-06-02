from PIL import Image

def remove_background(input_path, output_path, tolerance=25):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # Check if the pixel is near white
        # White is (255, 255, 255)
        if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
            # Change to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_background("frontend/public/owllogo.png", "frontend/public/owllogo-transparent.png")
    print("Background removed successfully")
