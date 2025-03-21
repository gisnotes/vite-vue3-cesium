<template>
  <CesiumMap @viewerCreated="viewerCreated" />
</template>

<script setup>
import { addWorldTerrain, verifyTerrain } from "@/utils/utils.js";

//#region --------------------- 定义变量----------------
let viewer;
//#endregion

function viewerCreated(v) {
  viewer = v;
  addWorldTerrain(viewer);
  // verifyTerrain(viewer);
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
  // const inspectorViewModel = viewer.cesium3DTilesInspector.viewModel;
  addNYCBuildings();
}

//#region --------------------- 方法区域----------------
async function addNYCBuildings() {
  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(75343, {
      enableDebugWireframe: true,//调试时需配置该属性为true
    });
    viewer.scene.primitives.add(tileset);
    /**
     * debugColorizeTiles属性：
     * 该属性仅供调试使用，未经生产环境优化。当设为true时，会为每个瓦片分配随机颜色。
     * 此功能可用于可视化各要素所属的瓦片，尤其在采用叠加式细化策略（Additive Refinement）​时，
     * 父级瓦片中的要素可能与子级瓦片的要素交错显示，此时通过颜色区分尤为有效。
     */
    tileset.debugColorizeTiles = true;

    viewer.zoomTo(
      tileset,
      new Cesium.HeadingPitchRange(
        0.0,
        -0.5,
        tileset.boundingSphere.radius / 4.0
      )
    );
  } catch (err) {
    ElMessage.error(`数据加载出错: ${err}`);
  }
}
//#endregion
</script>

<style lang="scss" scoped>
:deep(.cesium-viewer-cesium3DTilesInspectorContainer) {
  top: 10px;
}
</style>
