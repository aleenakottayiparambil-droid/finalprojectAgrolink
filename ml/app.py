
import base64
import io
from pathlib import Path

import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from PIL import Image

app = Flask(__name__)

# ==========================================
# 1. LOAD TRAINED MODEL AND CLASS NAMES
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

model = tf.keras.models.load_model(
    BASE_DIR / "crop_disease_cnn_improved.keras"
)

with open(BASE_DIR / "class_names_improved.txt", "r", encoding="utf-8") as file:
    class_names = file.read().splitlines()
# ==========================================
# 2. BUILD GRAD-CAM MODEL
# ==========================================

# The last convolutional layer identified
# from inspect_model.py is conv2d_2.

grad_input = tf.keras.Input(shape=(128, 128, 3))

x = grad_input
conv_outputs = None

for layer in model.layers:
    x = layer(x)

    if layer.name == "conv2d_2":
        conv_outputs = x

if conv_outputs is None:
    raise ValueError("Grad-CAM layer 'conv2d_2' was not found.")

grad_model = tf.keras.Model(
    inputs=grad_input,
    outputs=[conv_outputs, x]
)

print("CNN model loaded successfully.")
print("Grad-CAM target layer: conv2d_2")


# ==========================================
# 3. GENERATE GRAD-CAM OVERLAY
# ==========================================

def generate_gradcam(image_array, original_image):
    """
    Generate a Grad-CAM heatmap overlay for the
    class predicted by the trained CNN.
    """

    with tf.GradientTape() as tape:
        feature_maps, predictions = grad_model(
            tf.convert_to_tensor(image_array, dtype=tf.float32),
            training=False
        )

        class_index = tf.argmax(
            predictions[0],
            output_type=tf.int32
        )

        class_score = tf.gather(
            predictions[0],
            class_index
        )

    # Calculate gradients of the predicted class
    gradients = tape.gradient(class_score, feature_maps)

    if gradients is None:
        raise ValueError("Could not calculate Grad-CAM gradients.")

    # Average gradients across image height and width
    pooled_gradients = tf.reduce_mean(
        gradients,
        axis=(0, 1, 2)
    )

    # Extract feature maps for the uploaded image
    feature_maps = feature_maps[0]

    # Weight feature maps by gradient importance
    heatmap = tf.reduce_sum(
        feature_maps * pooled_gradients,
        axis=-1
    )

    # Retain positive contributions
    heatmap = tf.maximum(heatmap, 0)

    # Normalize heatmap safely
    max_value = tf.reduce_max(heatmap)

    heatmap = tf.cond(
        max_value > 0,
        lambda: heatmap / max_value,
        lambda: tf.zeros_like(heatmap)
    )

    heatmap_array = heatmap.numpy()

    # Resize heatmap to the input image dimensions
    heatmap_image = Image.fromarray(
        np.uint8(heatmap_array * 255)
    ).resize((128, 128), Image.Resampling.BILINEAR)

    heatmap_array = (
        np.asarray(heatmap_image, dtype=np.float32) / 255.0
    )

    # Convert intensity values into RGB heatmap colours
    red = np.clip(
        1.5 - np.abs(4 * heatmap_array - 3), 0, 1
    )
    green = np.clip(
        1.5 - np.abs(4 * heatmap_array - 2), 0, 1
    )
    blue = np.clip(
        1.5 - np.abs(4 * heatmap_array - 1), 0, 1
    )

    heatmap_rgb = np.stack(
        [red, green, blue],
        axis=-1
    )

    heatmap_rgb = np.uint8(heatmap_rgb * 255)

    # Blend the heatmap with the original leaf image
    original_array = np.asarray(
        original_image.resize((128, 128)),
        dtype=np.float32
    )

    overlay = (
        0.55 * original_array +
        0.45 * heatmap_rgb.astype(np.float32)
    )

    overlay = np.uint8(np.clip(overlay, 0, 255))
    overlay_image = Image.fromarray(overlay)

    # Encode the overlay as a PNG data URL
    output_buffer = io.BytesIO()
    overlay_image.save(output_buffer, format="PNG")

    encoded_image = base64.b64encode(
        output_buffer.getvalue()
    ).decode("utf-8")

    return "data:image/png;base64," + encoded_image

    
def generate_text_explanation(predicted_class, confidence, gradcam_image):
    """
    Generate a transparent, template-based explanation.
    This does not use RAG or an external language model.
    """

    disease_name = predicted_class.replace("___", " - ").replace("_", " ")

    if confidence >= 90:
        confidence_text = (
            "The model assigned a high prediction score to this class."
        )
    elif confidence >= 70:
        confidence_text = (
            "The model assigned a moderate-to-high prediction score "
            "to this class."
        )
    else:
        confidence_text = (
            "The model's prediction score is relatively low, so the "
            "result should be interpreted cautiously."
        )

    explanation = (
        f"The CNN predicted {disease_name}. "
        f"Its prediction score for this class is {confidence:.2f}%. "
        f"{confidence_text} "
        "The Grad-CAM heatmap highlights image regions that contributed "
        "to the model's prediction. These highlighted regions show where "
        "the model focused, but they do not by themselves identify the "
        "exact symptoms or prove that the disease is present. "
        "This explanation is generated from the CNN prediction and "
        "Grad-CAM output; no RAG or disease knowledge base is used."
    )

    return explanation



# ==========================================
# 4. HEALTH CHECK ENDPOINT
# ==========================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "AgroLink AI Disease Detection API is running"
    })


# ==========================================
# 5. DISEASE PREDICTION + EXPLANATION API
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({
            "status": "error",
            "error": "Upload an image using the 'image' field."
        }), 400

    uploaded_file = request.files["image"]

    if not uploaded_file.filename:
        return jsonify({
            "status": "error",
            "error": "Please select an image."
        }), 400

    try:
        # Read and validate uploaded image
        image_bytes = uploaded_file.read()

        if not image_bytes:
            return jsonify({
                "status": "error",
                "error": "The uploaded image is empty."
            }), 400

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        # Keep preprocessing consistent with the trained CNN
        resized_image = image.resize((128, 128))

        image_array = np.asarray(
            resized_image,
            dtype=np.float32
        )

        image_array = np.expand_dims(image_array, axis=0)

        # Predict disease
        predictions = model.predict(
            image_array,
            verbose=0
        )

        predicted_index = int(
            np.argmax(predictions[0])
        )

        predicted_class = class_names[predicted_index]

        confidence = float(
            predictions[0][predicted_index] * 100
        )

        # Generate explanation for the predicted class
        gradcam_image = generate_gradcam(
            image_array,
            resized_image
        )

        text_explanation = generate_text_explanation(
        predicted_class,
        confidence,
        gradcam_image
        )

        # Return prediction AND Grad-CAM image
        return jsonify({
        "status": "success",
        "predicted_class": predicted_class,
        "confidence": round(confidence, 2),
        "gradcam_image": gradcam_image,
        "explanation": text_explanation
        })

    except Exception:
        app.logger.exception(
            "Disease prediction or Grad-CAM generation failed"
        )

        return jsonify({
            "status": "error",
            "error": (
                "Could not process the image or generate "
                "the Grad-CAM explanation. Please try another image."
            )
        }), 500


# ==========================================
# 6. START FLASK SERVER
# ==========================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False
    )
