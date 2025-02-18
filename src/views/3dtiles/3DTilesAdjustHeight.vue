<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form label-suffix=":" label-width="auto">
      <el-form-item label="模型高度">
        <el-slider
          v-model="height"
          show-input
          :min="-20"
          :max="100"
          :show-input-controls="false"
          @change="handleHeightChange" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
//#region --------------------- 定义变量----------------
let viewer, tileset;

const height = ref(0);

//#endregion

function viewerCreated(v) {
  viewer = v;
  //启用阴影
  viewer.shadows = true;
  //开启深度测试
  viewer.scene.globe.depthTestAgainstTerrain = true;
  add3DTilesData();
}

onBeforeUnmount(() => {
  viewer.scene.primitives.remove(tileset);
  viewer.destroy();
});

//#region --------------------- 方法区域----------------
async function add3DTilesData() {
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(
      "./SampleData/Cesium3DTiles/Tilesets/Tileset/tileset.json"
    );
    viewer.scene.primitives.add(tileset);
    await nextTick();
    viewer.zoomTo(
      tileset,
      new Cesium.HeadingPitchRange(
        0.0,
        -0.5,
        /**
         * BoundingSphere:具有中心和半径的边界球体。
         */
        tileset.boundingSphere.radius * 2.0
      )
    );
  } catch (err) {
    ElMessage.error(`tileset数据加载出错: ${err}`);
  }
}

function handleHeightChange(val) {
  if (isNaN(Number(val)) || !Cesium.defined(tileset)) {
    return;
  }

  //获取模型的中心点坐标
  const cartographic = Cesium.Cartographic.fromCartesian(
    tileset.boundingSphere.center
  );
  //地表面的点三维笛卡尔坐标
  const surface = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    0.0
  );

  //当前模型在初始高度下的三维笛卡尔坐标
  const offset = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    Number(val)
  );
  //当前坐标减去地表坐标得到平移的向量
  const translation = Cesium.Cartesian3.subtract(
    offset,
    surface,
    new Cesium.Cartesian3()
  );
  //平移模型
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}
//#endregion
</script>

<style lang="scss" scoped>
.panel {
  position: absolute;
  width: 360px;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  padding: 10px;
  opacity: 0.96;
  box-shadow: rgba(195, 191, 188, 0.7) 0px 1px 2px 0px,
    rgba(195, 191, 188, 0.85) 0px 2px 4px 2px;

  .el-form-item {
    margin-bottom: 0;
  }
}

//滑块右侧的输入框的长度
:deep(.el-input-number) {
  width: 75px;
}

//滑块右侧输入框
:deep(.el-slider__runway.show-input) {
  margin-right: 13px;
  margin-left: 5px;
}
</style>
