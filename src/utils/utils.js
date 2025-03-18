// import * as Cesium from "cesium";

export async function addWorldTerrain(viewer) {
  try {
    //添加WorldTerrain
    const terrainProviderPromise =
      await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
        requestVertexNormals: true,
      });
    viewer.terrainProvider = terrainProviderPromise;
  } catch (err) {
    ElMessage.error(`世界地形数据加载出错: ${err}`);
  }
}

/**
 * 定位至下面这个地点验证加载的地形
 */
export function verifyTerrain(viewer) {
  const center = Cesium.Cartesian3.fromRadians(
    2.4213211833389243,
    0.6171926869414084,
    3626.0426275055174
  );
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  viewer.scene.camera.lookAtTransform(
    transform,
    new Cesium.HeadingPitchRange(0, -Math.PI / 4, 2900)
  );
  //解除相机锁定
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}
