
import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "raw"
    / "Site04_final_adj_5mpp_surf.tif"
)

OUTPUT_DIR = BASE_DIR / "data" / "processed"

FRONTEND_DIR = (
    BASE_DIR.parent
    / "frontend"
    / "public"
    / "terrain"
)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FRONTEND_DIR.mkdir(parents=True, exist_ok=True)

# Higher-resolution terrain
SIZE = 1025

print("Processing NASA Shackleton Rim terrain...")

with rasterio.open(INPUT_FILE) as dataset:

    heightmap = dataset.read(
        1,
        out_shape=(SIZE, SIZE),
        resampling=Resampling.bilinear,
        masked=True
    )

    heightmap = np.asarray(
        heightmap.filled(np.nan),
        dtype="<f4"
    )

    if not np.isfinite(heightmap).any():
        raise ValueError("No valid elevation data found.")

    bounds = dataset.bounds

    metadata = {
        "site": "Site04 - Shackleton Rim",
        "source": "NASA LOLA 5mpp LDEM",
        "width": SIZE,
        "height": SIZE,
        "terrainWidthMeters": bounds.right - bounds.left,
        "terrainHeightMeters": bounds.top - bounds.bottom,
        "boundsMeters": {
            "left": bounds.left,
            "right": bounds.right,
            "top": bounds.top,
            "bottom": bounds.bottom
        },
        "sourceResolutionMeters": 5,
        "outputPixelSpacingMeters": (
            (bounds.right - bounds.left) / (SIZE - 1)
        ),
        "elevationUnits": "meters",
        "dataType": "float32",
        "byteOrder": "little-endian",
        "minElevation": float(np.nanmin(heightmap)),
        "maxElevation": float(np.nanmax(heightmap)),
        "meanElevation": float(np.nanmean(heightmap))
    }

    # Save processed files
    binary_name = "site04_heightmap.bin"
    metadata_name = "site04_metadata.json"

    for output_dir in [OUTPUT_DIR, FRONTEND_DIR]:

        binary_path = output_dir / binary_name
        metadata_path = output_dir / metadata_name

        heightmap.tofile(binary_path)

        with open(metadata_path, "w", encoding="utf-8") as file:
            json.dump(metadata, file, indent=4)

    print("\nTerrain processing completed!")
    print("Resolution:", SIZE, "x", SIZE)
    print("Minimum elevation:", metadata["minElevation"])
    print("Maximum elevation:", metadata["maxElevation"])
    print("Mean elevation:", metadata["meanElevation"])
    print(
        "Output pixel spacing:",
        round(metadata["outputPixelSpacingMeters"], 2),
        "meters"
    )
    print(
        "Binary size:",
        round(heightmap.nbytes / 1024 / 1024, 2),
        "MB"
    )
    print("Frontend terrain files updated successfully!")
