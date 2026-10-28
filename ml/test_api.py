
import requests
from pathlib import Path

dataset_path = Path("dataset") / "plantvillage dataset" / "color"

# Select a sample leaf image
images = list(dataset_path.glob("*/*.JPG"))

if not images:
    images = list(dataset_path.glob("*/*.jpg"))

if not images:
    print("No JPG image found in the dataset.")
    raise SystemExit

image_path = images[0]

# Send the image to the Flask API
with open(image_path, "rb") as image_file:
    response = requests.post(
        "http://127.0.0.1:5001/predict",
        files={"image": (image_path.name, image_file, "image/jpeg")}
    )

print("Image:", image_path.name)
print("HTTP status:", response.status_code)
print("API response:", response.json())
