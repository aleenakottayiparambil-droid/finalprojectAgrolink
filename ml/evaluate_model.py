
import tensorflow as tf
import numpy as np
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix

# --------------------------------------------------
# 1. CONFIGURATION
# --------------------------------------------------

DATASET_PATH = Path("dataset") / "plantvillage dataset" / "color"
MODEL_PATH = Path("crop_disease_cnn_improved.keras")
CLASS_NAMES_PATH = Path("class_names_improved.txt")

IMAGE_SIZE = (128, 128)
BATCH_SIZE = 32
SEED = 42

# --------------------------------------------------
# 2. LOAD TRAINED MODEL
# --------------------------------------------------

print("Loading improved CNN model...")

model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
    class_names = [line.strip() for line in file if line.strip()]

print("Number of model classes:", len(class_names))

if len(class_names) != model.output_shape[-1]:
    raise ValueError(
        "Mismatch between saved class names and model output classes."
    )

# --------------------------------------------------
# 3. LOAD VALIDATION DATASET
# --------------------------------------------------

print("\nLoading validation dataset...")

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_PATH,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="int",
    shuffle=True,
    class_names=class_names
)

print("Validation images:", len(val_ds.file_paths))

# Confirm that every class has validation samples.
class_counts = np.bincount(
    np.array(val_ds.file_paths).size * [0],
    minlength=len(class_names)
)

# Re-create the labels in the same deterministic order
# as the dataset so we can inspect class distribution.
validation_labels = []

for _, labels in val_ds:
    validation_labels.extend(labels.numpy())

validation_labels = np.asarray(validation_labels)

class_counts = np.bincount(
    validation_labels,
    minlength=len(class_names)
)

print("\nValidation samples per class:")
for name, count in zip(class_names, class_counts):
    print(f"{name}: {count}")

missing_classes = [
    class_names[i]
    for i, count in enumerate(class_counts)
    if count == 0
]

if missing_classes:
    raise ValueError(
        "Some classes have no validation samples: "
        + ", ".join(missing_classes)
        + ". Check the dataset split and class mapping."
    )

# --------------------------------------------------
# 4. EVALUATE MODEL
# --------------------------------------------------

print("\nEvaluating the full validation dataset...")

loss, accuracy = model.evaluate(val_ds, verbose=1)

print(f"\nValidation loss: {loss:.4f}")
print(f"Validation accuracy: {accuracy * 100:.2f}%")

# --------------------------------------------------
# 5. GENERATE PREDICTIONS
# --------------------------------------------------

print("\nGenerating predictions...")

y_true = []
y_pred = []

for images, labels in val_ds:
    probabilities = model.predict(images, verbose=0)
    predictions = np.argmax(probabilities, axis=1)

    y_true.extend(labels.numpy())
    y_pred.extend(predictions)

y_true = np.asarray(y_true)
y_pred = np.asarray(y_pred)

# --------------------------------------------------
# 6. CLASSIFICATION REPORT
# --------------------------------------------------

print("\nCLASSIFICATION REPORT")

print(
    classification_report(
        y_true,
        y_pred,
        labels=list(range(len(class_names))),
        target_names=class_names,
        digits=4,
        zero_division=0
    )
)

# --------------------------------------------------
# 7. CONFUSION MATRIX
# --------------------------------------------------

cm = confusion_matrix(
    y_true,
    y_pred,
    labels=list(range(len(class_names)))
)

output_path = Path("confusion_matrix.csv")
np.savetxt(output_path, cm, delimiter=",", fmt="%d")

print(f"\nConfusion matrix saved to: {output_path.resolve()}")
print("\nValidation evaluation completed.")
