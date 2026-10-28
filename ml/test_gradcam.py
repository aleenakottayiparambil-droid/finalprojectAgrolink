
import base64
from pathlib import Path

import requests

# Find a sample leaf image in the dataset
dataset = Path("dataset/plantvillage dataset/color")

image_extensions = {".jpg", ".jpeg", ".png"}

image_path = next(
    (
        path
        for path in dataset.rglob("*")
        if path.is_file() and path.suffix.lower() in image_extensions
    ),
    None
)

if image_path is None:
    print("ERROR: No sample image found in the dataset.")
    raise SystemExit(1)

print("Testing with:", image_path)

# Send the image to the Flask API
try:
    with image_path.open("rb") as image_file:
        response = requests.post(
            "http://127.0.0.1:5001/predict",
            files={
                "image": (image_path.name, image_file)
            },
            timeout=120
        )

    print("HTTP status:", response.status_code)

    try:
        data = response.json()
    except ValueError:
        print("ERROR: Flask did not return JSON.")
        print("Response:", response.text[:1000])
        raise SystemExit(1)

    if response.status_code != 200:
        print("API error:", data)
        raise SystemExit(1)

    # Display prediction details
    print("Response keys:", list(data.keys()))
    print("Predicted disease:", data.get("predicted_class"))
    print("Confidence:", data.get("confidence"), "%")

    # Inspect the Grad-CAM field
    gradcam_data = data.get("gradcam_image", "")

    print("Grad-CAM field type:", type(gradcam_data).__name__)
    print("Grad-CAM field preview:", str(gradcam_data)[:100])

    # Decode and save the Grad-CAM overlay
    if not isinstance(gradcam_data, str) or not gradcam_data:
        print("ERROR: Grad-CAM image is missing from the API response.")
        raise SystemExit(1)

    if gradcam_data.startswith("data:image/png;base64,"):
        encoded = gradcam_data.split(",", 1)[1]
    else:
        encoded = gradcam_data

    try:
        image_bytes = base64.b64decode(encoded, validate=True)
    except Exception as error:
        print("ERROR: Grad-CAM data is not valid Base64:", error)
        raise SystemExit(1)

    output_path = Path("gradcam_preview.png")
    output_path.write_bytes(image_bytes)

    # Verify the saved file is a valid image
    from PIL import Image

    with Image.open(output_path) as preview:
        preview.verify()

    print("SUCCESS: Grad-CAM image saved to:")
    print(output_path.resolve())

except requests.RequestException as error:
    print("ERROR: Could not connect to the Flask API.")
    print("Check that app.py is running on port 5001.")
    print("Details:", error)
    raise SystemExit(1)
