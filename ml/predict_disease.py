
import tensorflow as tf
import numpy as np
from pathlib import Path

# Load the trained CNN
model = tf.keras.models.load_model("crop_disease_cnn.keras")

# Load class labels
with open("class_names.txt", "r", encoding="utf-8") as file:
    class_names = file.read().splitlines()

# Use one image from the dataset for this first test
dataset_path = Path("dataset") / "plantvillage dataset" / "color"

image_paths = list(dataset_path.glob("*/*.JPG"))
if not image_paths:
    image_paths = list(dataset_path.glob("*/*.jpg"))

if not image_paths:
    image_paths = list(dataset_path.glob("*/*.png"))

if not image_paths:
    raise FileNotFoundError("No leaf images found in the dataset.")

image_path = image_paths[0]

# Load and resize image
image = tf.keras.utils.load_img(
    image_path,
    target_size=(128, 128)
)

image_array = tf.keras.utils.img_to_array(image)
image_array = np.expand_dims(image_array, axis=0)

# Predict
predictions = model.predict(image_array, verbose=0)
predicted_index = int(np.argmax(predictions[0]))
confidence = float(predictions[0][predicted_index]) * 100

print("Image:", image_path.name)
print("Actual class:", image_path.parent.name)
print("Predicted class:", class_names[predicted_index])
print(f"Model confidence: {confidence:.2f}%")
