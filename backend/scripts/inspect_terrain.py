
import rasterio
import numpy as np
from pathlib import Path

file_path = Path(__file__).parent.parent / "data" / "raw" / "Site04_final_adj_5mpp_surf.tif"

with rasterio.open(file_path) as dataset:
    print("\n========== LUNARA TERRAIN INSPECTION ==========\n")

    print("File:", file_path.name)
    print("Width:", dataset.width, "pixels")
    print("Height:", dataset.height, "pixels")
    print("Coordinate System:", dataset.crs)
    print("Resolution:", dataset.res)
    print("Data Type:", dataset.dtypes)
    print("No Data Value:", dataset.nodata)
    print("Geographic Bounds:", dataset.bounds)
    print("Transform:", dataset.transform)

    elevation = dataset.read(1, masked=True)
    valid = elevation.compressed()

    print("\n========== ELEVATION INFORMATION ==========\n")

    if valid.size:
        print("Minimum Elevation:", float(np.min(valid)), "metres")
        print("Maximum Elevation:", float(np.max(valid)), "metres")
        print("Mean Elevation:", float(np.mean(valid)), "metres")
        print("1st Percentile:", float(np.percentile(valid, 1)))
        print("5th Percentile:", float(np.percentile(valid, 5)))
        print("25th Percentile:", float(np.percentile(valid, 25)))
        print("50th Percentile:", float(np.percentile(valid, 50)))
        print("75th Percentile:", float(np.percentile(valid, 75)))
        print("95th Percentile:", float(np.percentile(valid, 95)))
        print("99th Percentile:", float(np.percentile(valid, 99)))
        print("Valid Pixels:", valid.size)
    else:
        print("No valid elevation pixels found.")

    print("\n========== INSPECTION COMPLETE ==========\n")
