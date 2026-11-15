
import json
import shutil
from pathlib import Path

import numpy as np
import rasterio
from rasterio.fill import fillnodata
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data" / "processed"
HEIGHTMAP = DATA_DIR / "site04_heightmap.bin"
METADATA = DATA_DIR / "site04_metadata.json"

OUTPUT = DATA_DIR / "site04_hillshade.png"

FRONTEND_OUTPUT = (
    BASE_DIR.parent
    / "frontend"
    / "public"
    / "terrain"
    / "site04_hillshade.png"
)

OUTPUT_SIZE = 2048

print("Generating enhanced NASA lunar hillshade...")

with open(METADATA, "r", encoding="utf-8") as file:
    metadata = json.load(file)

width = metadata["width"]
height = metadata["height"]

elevation = np.fromfile(HEIGHTMAP, dtype="<f4")
elevation = elevation.reshape((height, width))

valid = np.isfinite(elevation)

if not np.any(valid):
    raise ValueError("No valid elevation data found.")

# Fill missing pixels for gradient calculations.
filled = fillnodata(
    elevation.astype(np.float32),
    mask=valid.astype(np.uint8),
    max_search_distance=100,
    smoothing_iterations=2
)

# Calculate pixel spacing in metres.
pixel_size_x = (
    metadata["terrainWidthMeters"] / (width - 1)
)

pixel_size_y = (
    metadata["terrainHeightMeters"] / (height - 1)
)

# Calculate terrain gradients.
dy, dx = np.gradient(
    filled,
    pixel_size_y,
    pixel_size_x
)

# Moderate vertical exaggeration for visible terrain details.
VERTICAL_EXAGGERATION = 2.0

dx *= VERTICAL_EXAGGERATION
dy *= VERTICAL_EXAGGERATION

slope = np.arctan(np.sqrt(dx**2 + dy**2))
aspect = np.arctan2(-dx, dy)

# Multiple illumination directions.
altitude = np.radians(40)

azimuths = [
    np.radians(225),
    np.radians(315),
    np.radians(45),
    np.radians(135),
]

shades = []

for azimuth in azimuths:

    illumination = (
        np.sin(altitude) * np.cos(slope)
        + np.cos(altitude)
        * np.sin(slope)
        * np.cos(azimuth - aspect)
    )

    shades.append(np.clip(illumination, 0, 1))

# Combine the four lighting directions.
hillshade = np.mean(shades, axis=0)

# Add subtle relief contrast.
hillshade = np.power(hillshade, 0.8)

# Stretch contrast using valid terrain pixels only.
valid_values = hillshade[valid]

low = np.percentile(valid_values, 2)
high = np.percentile(valid_values, 98)

if high <= low:
    raise ValueError("Hillshade contrast range is invalid.")

hillshade = np.clip(
    (hillshade - low) / (high - low),
    0,
    1
)

# Convert to a natural lunar grayscale texture.
gray = (hillshade * 255).astype(np.uint8)

rgb = np.stack(
    [
        gray,
        gray,
        gray
    ],
    axis=-1
)

# Preserve missing areas as neutral grey.
rgb[~valid] = [115, 115, 115]

image = Image.fromarray(rgb, mode="RGB")

image = image.resize(
    (OUTPUT_SIZE, OUTPUT_SIZE),
    Image.Resampling.LANCZOS
)

# Save processed and frontend copies.
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
FRONTEND_OUTPUT.parent.mkdir(parents=True, exist_ok=True)

image.save(OUTPUT)
shutil.copy2(OUTPUT, FRONTEND_OUTPUT)

print("\nEnhanced hillshade generated successfully!")
print("Resolution:", OUTPUT_SIZE, "x", OUTPUT_SIZE)
print("Output:", OUTPUT)
print("Frontend copy:", FRONTEND_OUTPUT)
print("Lighting directions:", len(azimuths))
print("Vertical exaggeration:", VERTICAL_EXAGGERATION)
