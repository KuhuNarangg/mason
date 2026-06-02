import sys
from rembg.bg import remove

def main():
    if len(sys.argv) < 3:
        print("Usage: python remove_bg3.py input.png output.png")
        return
        
    with open(sys.argv[1], "rb") as f:
        input_data = f.read()
        
    output_data = remove(input_data)
    
    with open(sys.argv[2], "wb") as f:
        f.write(output_data)
        
    print("AI background removal complete!")

if __name__ == "__main__":
    main()
