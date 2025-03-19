<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="auto">
      <el-form-item label="垂直拉伸倍数">
        <el-slider
          v-model="form.exaggeration"
          show-input
          :min="1"
          :max="5"
          :step="0.01"
          :show-input-controls="false"
          @input="handleExaggerationChange" />
      </el-form-item>
      <el-form-item label="垂直拉伸参考高度">
        <el-slider
          v-model="form.relativeHeight"
          show-input
          :min="-1000"
          :max="9000"
          :show-input-controls="false"
          @input="handleRelativeHeightChange" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { addWorldTerrain } from "@/utils/utils.js";

//#region --------------------- 定义变量----------------
let viewer, scene, camera;

const form = reactive({
  exaggeration: 3,
  relativeHeight: 0,
});
//#endregion

//#region --------------------- 方法区域----------------
function viewerCreated(v) {
  viewer = v;
  initConfig();
  //官方提供的方法无法个人项目无法加载，这里用Cesium World Terrain数据替代
  // addGooglePhotorealistic3DTileset();
  addWorldTerrain(viewer);
}

function initConfig() {
  scene = viewer.scene;
  scene.verticalExaggeration = 3.0; //场景的垂直拉伸，默认值为1.0，表示不拉伸。
  // 启用渲染天空
  scene.skyAtmosphere.show = true;

  camera = viewer.camera;
  camera.setView({
    destination: new Cesium.Cartesian3(
      -2710292.813384663,
      -4360657.061518585,
      3793571.786860543
    ),
    orientation: new Cesium.HeadingPitchRoll(
      5.794062761901799,
      -0.30293409742984756,
      0.0009187098191985044
    ),
  });
}

function handleExaggerationChange(exaggeration) {
  scene.verticalExaggeration = Number(exaggeration);
}

function handleRelativeHeightChange(height) {
  scene.verticalExaggerationRelativeHeight = Number(height);
}
//#endregion
</script>

<style lang="scss" scoped>
.panel {
  width: 450px;
  padding: 10px;
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  opacity: 0.96;
  overflow: hidden auto;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
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
