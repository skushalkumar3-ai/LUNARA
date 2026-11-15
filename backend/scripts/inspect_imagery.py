
import rasterio

files = [
    "data/raw/Site04_final_adj_5mpp_surf.tif",
    "data/raw/NAC_DTM_ESALL_SR12_NACMOS_1M.TIF",
]

for path in files:
    print("\n" + "=" * 55)
    print("FILE:", path)
    print("=" * 55)

    with rasterio.open(path) as ds:
        print("Width:", ds.width)
        print("Height:", ds.height)
        print("Bands:", ds.count)
        print("Data type:", ds.dtypes)
        print("CRS:", ds.crs)
        print("Bounds:", ds.bounds)
        print("Resolution:", ds.res)
        print("NoData:", ds.nodata)
        print("Transform:", ds.transform)
