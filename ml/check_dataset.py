
from pathlib import Path

dataset_path = Path("dataset") / "plantvillage dataset" / "color"

print("Checking PlantVillage color dataset...")
print("Dataset path:", dataset_path.resolve())

if not dataset_path.exists():
    print("ERROR: Dataset folder not found!")
else:
    class_folders = [
        folder for folder in dataset_path.iterdir()
        if folder.is_dir()
    ]

    print("Number of disease classes:", len(class_folders))

    total_images = 0

    for folder in class_folders:
        image_count = sum(
            1 for file in folder.iterdir()
            if file.suffix.lower() in [".jpg", ".jpeg", ".png"]
        )
        total_images += image_count

    print("Total images:", total_images)
    print("\nFirst 10 classes:")

    for folder in class_folders[:10]:
        print("-", folder.name)
