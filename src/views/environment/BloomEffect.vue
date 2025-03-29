<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="auto">
      <el-form-item label="开启泛光(效果)">
        <el-switch
          v-model="form.showBloom"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleShowBloomChange" />
      </el-form-item>
      <el-form-item label="仅保留泛光(效果)">
        <el-switch
          v-model="form.glowOnly"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleGlowOnlyChange" />
      </el-form-item>
      <el-form-item label="对比度">
        <el-slider
          v-model="form.contrast"
          show-input
          :min="-255.0"
          :max="255.0"
          :step="0.01"
          :show-input-controls="false"
          @input="handleContrastInput" />
      </el-form-item>
      <el-form-item label="亮度">
        <el-slider
          v-model="form.brightness"
          show-input
          :min="-1.0"
          :max="1.0"
          :step="0.01"
          :show-input-controls="false"
          @input="handleBrightnessInput" />
      </el-form-item>
      <el-form-item label="泛光阈值">
        <el-slider
          v-model="form.delta"
          show-input
          :min="1.0"
          :max="5.0"
          :step="0.01"
          :show-input-controls="false"
          @input="handleDeltaInput" />
      </el-form-item>
      <el-form-item label="模糊强度">
        <el-slider
          v-model="form.sigma"
          show-input
          :min="1.0"
          :max="10.0"
          :step="0.01"
          :show-input-controls="false"
          @input="handleSigmaInput" />
      </el-form-item>
      <el-form-item label="采样步长">
        <el-slider
          v-model="form.stepSize"
          show-input
          :min="0"
          :max="7.0"
          :step="0.01"
          :show-input-controls="false"
          @input="handleStepSizeInput" />
      </el-form-item>
      <div style="text-align: right; margin: 10px 10px 0 0">
        <el-button type="primary" @click="reset">重置</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
/**
 * 示例介绍：在场景中添加泛光(或者翻译为光辉、光晕)效果。
 * bloom 是一种计算机图形效果，用于视频游戏 、 演示和高动态范围渲染 （HDRR），
 * 用于再现真实摄像机的成像伪影。该效果会产生从图像中明亮区域的边界延伸的光条纹（或羽化），
 * 从而产生极亮的光线压倒相机或眼睛捕捉场景的错觉。
 */

//#region --------------------- 定义变量----------------
let viewer;

/**
 * bloom:泛光，是一种着色器的效果，又叫shader effect。
 * glowOnly:仅保留泛光效果，不叠加原始颜色。用于独立控制泛光层的可见性。
 * contrast:控制高亮区域与非高亮区域的对比度。值越大，泛光边缘与背景的区分越明显。
 * brightness:调整泛光效果的亮度强度。值越大，泛光区域越明亮。
 * delta:控制触发泛光的亮度阈值。高于此值的像素会生成泛光效果，例如 delta=1.0 表示仅亮度超过1.0的像素参与泛光计算。
 * sigma:高斯模糊的标准差（σ），控制泛光的模糊扩散范围。值越大，光晕范围越广且越柔和。
 * stepSize:控制模糊计算的采样间隔。值越小，模糊效果越平滑，但计算成本越高。
 */
const initForm = {
  showBloom: true,
  glowOnly: false,
  contrast: 128,
  brightness: -0.3,
  delta: 1.0,
  sigma: 3.78,
  stepSize: 5.0,
};

const form = reactive({ ...initForm });

//设摆放一些列气球位置所设置的参数
const numberOfBalloons = 13; //气球数量
const lonIncrement = 0.00025; //经度的增长幅度
const initialLon = -122.99875; //初始经度
const lat = 44.0503706; //纬度
const height = 100.0; //模型高度
const url = "./SampleData/models/CesiumBalloon/CesiumBalloon.glb";

const target = Cesium.Cartesian3.fromDegrees(
  initialLon + lonIncrement,
  lat,
  height + 7.5
);
const offset = new Cesium.Cartesian3(
  -37.048378684557974,
  -24.852967044804245,
  4.352023653686047
);
//#endregion

function viewerCreated(v) {
  viewer = v;
  addBalloons();
  updatePostProcess();
  setCamraInitView();
}

//#region --------------------- 方法区域----------------
function addBalloons() {
  for (let i = 0; i < numberOfBalloons; ++i) {
    const lon = initialLon + i * lonIncrement;
    createModel(url, lon, lat, height);
  }
}

function updatePostProcess() {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.enabled = form.showBloom;
  bloom.uniforms.glowOnly = form.glowOnly;
  bloom.uniforms.contrast = form.contrast;
  bloom.uniforms.brightness = form.brightness;
  bloom.uniforms.delta = form.delta;
  bloom.uniforms.sigma = form.sigma;
  bloom.uniforms.stepSize = form.stepSize;
}

function reset() {
  Object.assign(form, { ...initForm });
  updatePostProcess();
}

//------------表单方法---------------------------
function setCamraInitView() {
  viewer.scene.camera.lookAt(target, offset);
}

function handleShowBloomChange(checked) {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.enabled = checked;
}

function handleGlowOnlyChange(checked) {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.uniforms.glowOnly = checked;
}

function handleContrastInput(value) {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.uniforms.contrast = value;
}

function handleBrightnessInput(value) {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.uniforms.brightness = value;
}

function handleDeltaInput(value) {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.uniforms.delta = value;
}

function handleSigmaInput(value) {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.uniforms.sigma = value;
}

function handleStepSizeInput(value) {
  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.uniforms.stepSize = value;
}

/**
 * 创建模型的方法
 */
function createModel(url, x, y, height) {
  const position = Cesium.Cartesian3.fromDegrees(x, y, height);
  viewer.entities.add({
    name: url,
    position: position,
    model: {
      uri: url,
    },
  });
}
//#endregion
</script>

<style lang="scss" scoped>
.panel {
  position: absolute;
  width: 400px;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  padding: 10px 5px 10px 10px;
  opacity: 0.82;
  box-shadow: rgba(195, 191, 188, 0.7) 0px 1px 2px 0px,
    rgba(195, 191, 188, 0.85) 0px 2px 4px 2px;

  .form {
    max-height: calc(100% - 40px);
    overflow: hidden auto;
    padding-right: 5px;
  }
}

//滑块右侧的输入框的长度
:deep(.el-input-number) {
  width: 90px;
}

//滑块右侧输入框
:deep(.el-slider__runway.show-input) {
  margin-right: 13px;
  margin-left: 5px;
}

:deep(.el-form-item) {
  margin-bottom: 6px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
}

:deep(.el-input-number .el-input__inner) {
  font-size: 13px;
}
</style>
