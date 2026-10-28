
import tensorflow as tf
from pathlib import Path
import json

# ================================
# CONFIGURATION
# ================================

DATASET_PATH = Path("dataset") / "plantvillage dataset" / "color"

IMAGE_SIZE = (128, 128)
BATCH_SIZE = 32
SEED = 42
EPOCHS = 5

# Save the improved model separately so the working API model is safe.
MODEL_PATH = Path("crop_disease_cnn_improved.keras")
CLASS_NAMES_PATH = Path("class_names_improved.txt")
HISTORY_PATH = Path("training_history.json")

tf.keras.utils.set_random_seed(SEED)

print("Loading PlantVillage dataset...")

# ================================
# LOAD TRAINING DATA
# ================================

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_PATH,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="int",
    shuffle=True
)

# ================================
# LOAD VALIDATION DATA
# ================================

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_PATH,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="int",
    shuffle=False
)

class_names = train_ds.class_names
num_classes = len(class_names)

print("\nNumber of classes:", num_classes)
print("Training images:", len(train_ds.file_paths))
print("Validation images:", len(val_ds.file_paths))

# Improve data pipeline performance.
# Cache the resized image datasets in memory, then prefetch.
AUTOTUNE = tf.data.AUTOTUNE

train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

# ================================
# BUILD CNN MODEL
# ================================

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(128, 128, 3)),

    # Dataset images are scaled from 0-255 to 0-1.
    tf.keras.layers.Rescaling(1.0 / 255),

    tf.keras.layers.Conv2D(
        32, (3, 3), activation="relu", padding="same"
    ),
    tf.keras.layers.MaxPooling2D(),

    tf.keras.layers.Conv2D(
        64, (3, 3), activation="relu", padding="same"
    ),
    tf.keras.layers.MaxPooling2D(),

    tf.keras.layers.Conv2D(
        128, (3, 3), activation="relu", padding="same"
    ),
    tf.keras.layers.MaxPooling2D(),

    tf.keras.layers.GlobalAveragePooling2D(),

    tf.keras.layers.Dense(128, activation="relu"),
    tf.keras.layers.Dropout(0.4),

    tf.keras.layers.Dense(num_classes, activation="softmax")
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ================================
# CALLBACKS
# ================================

callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),

    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=2,
        min_lr=0.00001,
        verbose=1
    ),

    tf.keras.callbacks.ModelCheckpoint(
        filepath=str(MODEL_PATH),
        monitor="val_loss",
        save_best_only=True,
        verbose=1
    )
]

# ================================
# TRAIN ON THE COMPLETE DATASET
# ================================

print("\nStarting improved CNN training...")

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=callbacks
)

# Load the best checkpoint selected by validation loss.
best_model = tf.keras.models.load_model(MODEL_PATH)

# Save the class labels in the matching order.
with open(CLASS_NAMES_PATH, "w", encoding="utf-8") as file:
    file.write("\n".join(class_names))

# Save history so we can plot and inspect learning curves later.
with open(HISTORY_PATH, "w", encoding="utf-8") as file:
    json.dump(history.history, file, indent=2)

# Evaluate the full validation dataset.
val_loss, val_accuracy = best_model.evaluate(val_ds, verbose=1)

print("\nTraining finished.")
print(f"Best-checkpoint validation loss: {val_loss:.4f}")
print(f"Best-checkpoint validation accuracy: {val_accuracy * 100:.2f}%")
print("Improved model saved to:", MODEL_PATH.resolve())
print("Class labels saved to:", CLASS_NAMES_PATH.resolve())
print("Training history saved to:", HISTORY_PATH.resolve())
