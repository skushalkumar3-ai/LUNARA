
import rasterio
import numpy as np

from rasterio.warp import reproject, Resampling
from rasterio.transform import from_bounds
from PIL import Image

HEIGHT_PATH = "data/raw/Site04_final_adj_5mpp_surf.tif"
IMAGE_PATH = "data/raw/NAC_DTM_ESALL_SR12_NACMOS_1M.TIF"

OUTPUT_PATH = "../frontend/public/terrain/site04_texture.png"

SIZE = 513

LUNAR_CRS = (
    "+proj=stere +lat_0=-90 +lon_0=0 "
    "+k=1 +R=1737400 +units=m +no_defs"
)

with rasterio.open(HEIGHT_PATH) as height_ds:

    bounds = height_ds.bounds

    target_transform = from_bounds(
        bounds.left,
        bounds.bottom,
        bounds.right,
        bounds.top,
        SIZE,
        SIZE
    )

    print("Site04 bounds:", bounds)

    with rasterio.open(IMAGE_PATH) as image_ds:

        print("NAC bounds:", image_ds.bounds)

        source_image = image_ds.read(1)
        source_mask = image_ds.dataset_mask()

        texture = np.zeros(
            (SIZE, SIZE),
            dtype=np.uint8
        )

        # Reproject the actual lunar image.
        reproject(
            source=source_image,
            destination=texture,
            src_transform=image_ds.transform,
            src_crs=LUNAR_CRS,
            src_nodata=0,
            dst_transform=target_transform,
            dst_crs=LUNAR_CRS,
            dst_nodata=0,
            resampling=Resampling.bilinear
        )

        # Reproject the validity mask separately.
        mask_float = source_mask.astype(np.float32) / 255.0

        alpha_float = np.zeros(
            (SIZE, SIZE),
            dtype=np.float32
        )

        reproject(
            source=mask_float,
            destination=alpha_float,
            src_transform=image_ds.transform,
            src_crs=LUNAR_CRS,
            dst_transform=target_transform,
            dst_crs=LUNAR_CRS,
            resampling=Resampling.average
        )

        alpha = np.clip(
            alpha_float * 255,
            0,
            255
        ).astype(np.uint8)

        # Build RGBA texture.
        rgba = np.stack(
            [texture, texture, texture, alpha],
            axis=-1
        )

        Image.fromarray(rgba, "RGBA").save(OUTPUT_PATH)

        covered = np.count_nonzero(alpha)

        print("\nTexture alignment completed!")
        print("Output:", OUTPUT_PATH)
        print("Resolution:", SIZE, "x", SIZE)
        print("Covered pixels:", covered)
        print(
            "Coverage:",
            round(covered / alpha.size * 100, 2),
            "%"
        )
