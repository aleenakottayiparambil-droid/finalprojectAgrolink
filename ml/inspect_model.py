
import tensorflow as tf

model = tf.keras.models.load_model("crop_disease_cnn.keras")

print("\nMODEL SUMMARY\n")
model.summary()

print("\nCONVOLUTIONAL LAYERS\n")

for layer in model.layers:
    if "conv" in layer.name.lower():
        print(layer.name, layer.output.shape)
