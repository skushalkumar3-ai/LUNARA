
import rasterio
from pyproj import CRS, Transformer

path = "data/raw/Site04_final_adj_5mpp_surf.tif"

# Lunar spherical polar stereographic projection
lunar_crs = CRS.from_proj4(
    "+proj=stere +lat_0=-90 +lon_0=0 "
    "+k=1 +R=1737400 +units=m +no_defs"
)

lunar_geographic = CRS.from_proj4(
    "+proj=longlat +R=1737400 +no_defs"
)

transformer = Transformer.from_crs(
    lunar_crs,
    lunar_geographic,
    always_xy=True
)

with rasterio.open(path) as ds:
    b = ds.bounds

    corners = {
        "Top-left": (b.left, b.top),
        "Top-right": (b.right, b.top),
        "Bottom-left": (b.left, b.bottom),
        "Bottom-right": (b.right, b.bottom),
        "Center": ((b.left + b.right) / 2, (b.top + b.bottom) / 2)
    }

    print("\n===== SITE04 LUNAR COORDINATES =====\n")

    for name, (x, y) in corners.items():
        lon, lat = transformer.transform(x, y)

        print(
            f"{name}: "
            f"Latitude {lat:.5f}°, "
            f"Longitude {lon:.5f}°"
        )
