# Terrain source

NASA GSFC Planetary Geodesy Data Archive (PGDA) — "High-Resolution LOLA Topography for Lunar South Pole Sites", Site01 (Connecting Ridge), 5 m/pixel surface height GeoTIFF:
https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site01/Site01_final_adj_5mpp_surf.tif
Product page: https://pgda.gsfc.nasa.gov/products/78

Citation: Barker, M.K., et al. (2021). Improved LOLA elevation maps for south pole landing sites: Error estimates and their impact on illumination conditions. Planetary and Space Science, 203, 105119. doi:10.1016/j.pss.2020.105119

Processing (scripts/build-heightmap.mjs): 3 km × 3 km crop centred on lat -89.45°, lon 222.7°E, rotated so +z = local north and +x = local east, resampled to 513×513, squeezed into a 1.5 km game world. Heights scaled by the same 0.5 factor so slopes stay real. Mean elevation (1837 m) subtracted.

Runtime asset: `heightmap-f32-v1.bin`, gzip-compressed original Float32 little-endian bytes. Compression is lossless, with no resampling, quantization or height changes. Decode gzip before reading Float32 values; `.bin` avoids automatic HTTP gzip decoding.
