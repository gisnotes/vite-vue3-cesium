<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-tabs v-model="activeName" type="card" class="demo-tabs">
      <el-tab-pane label="地面大气" name="ground"></el-tab-pane>
      <el-tab-pane label="天空大气" name="sky"></el-tab-pane>
    </el-tabs>
    <div class="form">
      <el-form :model="form" label-suffix=":" label-width="auto">
        <div v-if="activeName === 'ground'">
          <el-divider content-position="left">雾设置项</el-divider>
          <el-form-item label="启用雾">
            <el-switch
              v-model="form.showFog"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handleShowFog" />
          </el-form-item>
          <el-form-item label="雾的最小亮度">
            <el-slider
              v-model="form.minimumBrightness"
              :disabled="!form.showFog"
              show-input
              :max="1"
              :step="0.01"
              :show-input-controls="false"
              @input="handleMinBrightnessInput" />
          </el-form-item>
          <el-form-item label="雾的密度">
            <el-slider
              v-model="form.density"
              :disabled="!form.showFog"
              show-input
              :min="0.5"
              :max="2"
              :step="0.1"
              :show-input-controls="false"
              @input="handleDensityInput" />
          </el-form-item>
          <el-divider content-position="left">地面大气设置项</el-divider>
          <el-form-item label="开启地形">
            <el-switch
              v-model="form.enableTerrain"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handleEnableTerrain" />
          </el-form-item>
          <el-form-item label="开启地面大气">
            <el-switch
              v-model="form.showGroundAtmosphere"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handleShowGroundAtmosphere" />
          </el-form-item>
          <el-form-item label="光照强度">
            <el-slider
              v-model="form.groundAtmosphereLightIntensity"
              show-input
              :show-input-controls="false"
              @input="handleGroundAtmosphereLightIntensityInput" />
          </el-form-item>
          <el-form-item label="瑞丽散射系数:红光通道">
            <el-slider
              v-model="form.groundAtmosphereRayleighCoefficientR"
              show-input
              :step="0.1"
              :show-input-controls="false"
              @input="handleGroundAtmosphereRayleighCoefficientRInput" />
          </el-form-item>
          <el-form-item label="瑞丽散射系数:绿光通道">
            <el-slider
              v-model="form.groundAtmosphereRayleighCoefficientG"
              show-input
              :step="0.1"
              :show-input-controls="false"
              @input="handleGroundAtmosphereRayleighCoefficientGInput" />
          </el-form-item>
          <el-form-item label="瑞丽散射系数:蓝光通道">
            <el-slider
              v-model="form.groundAtmosphereRayleighCoefficientB"
              show-input
              :step="0.1"
              :show-input-controls="false"
              @input="handleGroundAtmosphereRayleighCoefficientBInput" />
          </el-form-item>
          <el-form-item label="瑞丽标度高度">
            <el-slider
              v-model="form.groundAtmosphereRayleighScaleHeight"
              show-input
              :max="20000"
              :show-input-controls="false"
              @input="handleGroundAtmosphereRayleighScaleHeightInput" />
          </el-form-item>
          <el-form-item label="米氏散射系数">
            <el-slider
              v-model="form.groundAtmosphereMieCoefficient"
              show-input
              :show-input-controls="false"
              @input="handleGroundAtmosphereMieCoefficientInput" />
          </el-form-item>
          <el-form-item label="米氏标度高度">
            <el-slider
              v-model="form.groundAtmosphereMieScaleHeight"
              show-input
              :max="10000"
              :show-input-controls="false"
              @input="handleGroundAtmosphereMieScaleHeightInput" />
          </el-form-item>
          <el-form-item label="米氏各向异性因子">
            <el-slider
              v-model="form.groundAtmosphereMieAnisotropy"
              show-input
              :min="-1"
              :max="1"
              :step="0.1"
              :show-input-controls="false"
              @input="handleGroundAtmosphereMieAnisotropyInput" />
          </el-form-item>
          <el-form-item label="色调偏移">
            <el-slider
              v-model="form.groundHueShift"
              show-input
              :min="-1"
              :max="1"
              :step="0.01"
              :show-input-controls="false"
              @input="handleGroundHueShiftInput" />
          </el-form-item>
          <el-form-item label="饱和度偏移">
            <el-slider
              v-model="form.groundSaturationShift"
              show-input
              :min="-1"
              :max="1"
              :step="0.01"
              :show-input-controls="false"
              @input="handleGroundSaturationShiftInput" />
          </el-form-item>
          <el-form-item label="亮度偏移">
            <el-slider
              v-model="form.groundBrightnessShift"
              show-input
              :min="-1"
              :max="1"
              :step="0.01"
              :show-input-controls="false"
              @input="handleGroundBrightnessShiftInput" />
          </el-form-item>
          <el-form-item label="启用地球照明">
            <el-switch
              v-model="form.enableLighting"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handleEnableLighting" />
          </el-form-item>
          <el-form-item label="照明淡出距离">
            <el-slider
              v-model="form.lightingFadeOutDistance"
              show-input
              :min="1e6"
              :max="1e8"
              :show-input-controls="false"
              @input="handleLightingFadeOutDistanceInput" />
          </el-form-item>
          <el-form-item label="照明淡入距离">
            <el-slider
              v-model="form.lightingFadeInDistance"
              show-input
              :min="1e6"
              :max="1e8"
              :show-input-controls="false"
              @input="handleLightingFadeInDistanceInput" />
          </el-form-item>
          <el-form-item label="夜色淡出距离">
            <el-slider
              v-model="form.nightFadeOutDistance"
              show-input
              :min="1e6"
              :max="1e8"
              :show-input-controls="false"
              @input="handleNightFadeOutDistanceInput" />
          </el-form-item>
          <el-form-item label="夜色淡入距离">
            <el-slider
              v-model="form.nightFadeInDistance"
              show-input
              :min="1e6"
              :max="1e8"
              :show-input-controls="false"
              @input="handleNightFadeInDistanceInput" />
          </el-form-item>
          <el-form-item label="启用动态光照">
            <el-switch
              v-model="form.dynamicLighting"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handleDynamicLightingChange" />
          </el-form-item>
          <el-form-item label="动态光照是否来自太阳">
            <el-switch
              v-model="form.dynamicLightingFromSun"
              inline-prompt
              active-text="是"
              inactive-text="否"
              @change="handleDynamicLightingFromSunChange" />
          </el-form-item>
          <el-form-item label="启用地面半透明">
            <el-switch
              v-model="form.groundTranslucency"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handleGroundTranslucencyChange" />
          </el-form-item>
        </div>
        <div v-if="activeName === 'sky'">
          <el-divider content-position="left">天空大气设置项</el-divider>
          <el-form-item label="启用天空大气">
            <el-switch
              v-model="form.showSkyAtmosphere"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handleShowSkyAtmosphereChange" />
          </el-form-item>
          <el-form-item label="光照强度">
            <el-slider
              v-model="form.skyAtmosphereLightIntensity"
              show-input
              :show-input-controls="false"
              @input="handleSkyAtmosphereLightIntensityInput" />
          </el-form-item>
          <el-form-item label="瑞丽散射系数:红光通道">
            <el-slider
              v-model="form.skyAtmosphereRayleighCoefficientR"
              show-input
              :step="0.1"
              :show-input-controls="false"
              @input="handleSkyAtmosphereRayleighCoefficientRInput" />
          </el-form-item>
          <el-form-item label="瑞丽散射系数:绿光通道">
            <el-slider
              v-model="form.skyAtmosphereRayleighCoefficientG"
              show-input
              :step="0.1"
              :show-input-controls="false"
              @input="handleSkyAtmosphereRayleighCoefficientGInput" />
          </el-form-item>
          <el-form-item label="瑞丽散射系数:蓝光通道">
            <el-slider
              v-model="form.skyAtmosphereRayleighCoefficientB"
              show-input
              :step="0.1"
              :show-input-controls="false"
              @input="handleSkyAtmosphereRayleighCoefficientBInput" />
          </el-form-item>
          <el-form-item label="瑞丽标度高度">
            <el-slider
              v-model="form.skyAtmosphereRayleighScaleHeight"
              show-input
              :max="20000"
              :show-input-controls="false"
              @input="handleSkyAtmosphereRayleighScaleHeightInput" />
          </el-form-item>
          <el-form-item label="米氏散射系数">
            <el-slider
              v-model="form.skyAtmosphereMieCoefficient"
              show-input
              :show-input-controls="false"
              @input="handleSkyAtmosphereMieCoefficientInput" />
          </el-form-item>
          <el-form-item label="米氏标度高度">
            <el-slider
              v-model="form.skyAtmosphereMieScaleHeight"
              show-input
              :max="10000"
              :show-input-controls="false"
              @input="handleSkyAtmosphereMieScaleHeightInput" />
          </el-form-item>
          <el-form-item label="米氏各向异性因子">
            <el-slider
              v-model="form.skyAtmosphereMieAnisotropy"
              show-input
              :min="-1"
              :max="1"
              :step="0.1"
              :show-input-controls="false"
              @input="handleSkyAtmosphereMieAnisotropyInput" />
          </el-form-item>
          <el-form-item label="色调偏移">
            <el-slider
              v-model="form.skyHueShift"
              show-input
              :min="-1"
              :max="1"
              :step="0.01"
              :show-input-controls="false"
              @input="handleSkyHueShiftInput" />
          </el-form-item>
          <el-form-item label="饱和度偏移">
            <el-slider
              v-model="form.skySaturationShift"
              show-input
              :min="-1"
              :max="1"
              :step="0.01"
              :show-input-controls="false"
              @input="handleSkySaturationShiftInput" />
          </el-form-item>
          <el-form-item label="亮度偏移">
            <el-slider
              v-model="form.skyBrightnessShift"
              show-input
              :min="-1"
              :max="1"
              :step="0.01"
              :show-input-controls="false"
              @input="handleSkyBrightnessShiftInput" />
          </el-form-item>
          <el-form-item label="启用逐片元大气渲染">
            <el-switch
              v-model="form.perFragmentAtmosphere"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="handlePerFragmentAtmosphereChange" />
          </el-form-item>
        </div>
        <el-form-item label="启用HDR">
          <el-switch
            v-model="form.hdr"
            inline-prompt
            active-text="开"
            inactive-text="关"
            @change="handleHDRChange" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";

/**
 * 示例介绍：修改大气散射参数.
 */

//#region --------------------- 定义变量----------------
let viewer, scene, globe, skyAtmosphere, canvas;

/**
 * - Rayleigh Coefficient:瑞丽(散射)系数。
 * - globe.atmosphereLightIntensity: 默认值为10.0。
 * - Globe.atmosphereRayleighCoefficient: 瑞丽散射系数通常定义为三维向量，对应红、绿、蓝通道的散射强度。
 * 默认值为：Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
 * - 地面大气中用于大气散射方程的瑞丽（Rayleigh）标度高度，默认值为10000.0，单位为米。
 * - atmosphereMieCoefficient:米氏散射系数通常定义为三维向量，默认值为：Cartesian3(21e-6, 21e-6, 21e-6)
 * - atmosphereMieScaleHeight:地面大气的大气散射方程中使用的米氏标度高度，默认值为3200.0，以米为单位。
 * - Mie Anisotropy：米氏各项异性因子，米氏散射模型中控制散射方向性的关键参数
 * - atmosphereHueShift：应用于大气的色调偏移。默认为 0.0（无偏移）
 */

const form = reactive({
  //雾设置
  showFog: true, //fog.enabeld默认值为true
  minimumBrightness: 0.03, //fog.minimumBrightness默认值为0.03
  density: 1.0, //density默认值为：0.0006，这里设置的值为 1.0*0.0002

  //全局设置
  enableTerrain: false, //需手动配置
  enableLighting: true,
  groundTranslucency: false,

  //地面大气设置
  showGroundAtmosphere: true, //showGroundAtmosphere：默认值为true
  groundAtmosphereLightIntensity: 20,
  groundAtmosphereRayleighCoefficientR: 5.5,
  groundAtmosphereRayleighCoefficientG: 13.0,
  groundAtmosphereRayleighCoefficientB: 28.4,
  groundAtmosphereRayleighScaleHeight: 10000.0,
  groundAtmosphereMieCoefficient: 21.0,
  groundAtmosphereMieScaleHeight: 3200.0,
  groundAtmosphereMieAnisotropy: 0.9,
  groundHueShift: 0.0,
  groundSaturationShift: 0.0,
  groundBrightnessShift: 0.0,
  lightingFadeOutDistance: 9985163.185561286,
  lightingFadeInDistance: 19970326.371122573,
  nightFadeOutDistance: 9985163.185561286,
  nightFadeInDistance: 49925815.92780643,

  //天空大气设置
  showSkyAtmosphere: true,
  skyAtmosphereLightIntensity: 50.0,
  skyAtmosphereRayleighCoefficientR: 5.5,
  skyAtmosphereRayleighCoefficientG: 13.0,
  skyAtmosphereRayleighCoefficientB: 28.4,
  skyAtmosphereRayleighScaleHeight: 10000.0,
  skyAtmosphereMieCoefficient: 21.0,
  skyAtmosphereMieScaleHeight: 3200.0,
  skyAtmosphereMieAnisotropy: 0.9,
  skyHueShift: 0.0,
  skySaturationShift: 0.0,
  skyBrightnessShift: 0.0,
  perFragmentAtmosphere: false,
  dynamicLighting: true,
  dynamicLightingFromSun: false,

  //场景设置
  hdr: true,
});

const activeName = ref("ground");
//#endregion

//#region --------------------- 方法区域----------------
//入口函数
function viewerCreated(viewerObj) {
  initConfig(viewerObj);
  exeInitConfig();
}

function initConfig(viewerObj) {
  viewer = viewerObj;

  scene = viewer.scene;
  scene.highDynamicRange = true;

  globe = scene.globe;
  skyAtmosphere = scene.skyAtmosphere;
  globe.enableLighting = true; //enableLighting默认值为false
  globe.atmosphereLightIntensity = 20.0;

  canvas = viewer.canvas;
  canvas.setAttribute("tabindex", "0"); // 需要将焦点放在画布上
  canvas.onclick = function () {
    canvas.focus();
  };

  viewer.cesiumWidget.creditContainer.style.display = "none"; //隐藏版权信息
  viewer.scene.debugShowFramesPerSecond = true; //添加帧速显示
  viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(
    "2022-03-23T11:31:42.34200000000419095Z"
  );
}

//执行部分默认的表单项
function exeInitConfig() {
  handleDensityInput(form.density);
  handleEnableTerrain(form.enableTerrain);
}
//#endregion

//#region --------------------- 监听方法----------------
function handleShowFog(checked) {
  scene.fog.enabled = checked;
}

function handleMinBrightnessInput(value) {
  viewer.scene.fog.minimumBrightness = value;
}

function handleDensityInput(value) {
  viewer.scene.fog.density = 2.0e-4 * value;
}

function handleEnableTerrain(checked) {
  if (checked) {
    scene.setTerrain(Cesium.Terrain.fromWorldTerrain());
  } else {
    scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }
}

function handleShowGroundAtmosphere(checked) {
  globe.showGroundAtmosphere = checked;
}

function handleGroundAtmosphereLightIntensityInput(value) {
  globe.atmosphereLightIntensity = parseFloat(value);
}

function handleGroundAtmosphereRayleighCoefficientRInput(value) {
  globe.atmosphereRayleighCoefficient.x = parseFloat(value) * 1e-6;
}

function handleGroundAtmosphereRayleighCoefficientGInput(value) {
  globe.atmosphereRayleighCoefficient.y = parseFloat(value) * 1e-6;
}

function handleGroundAtmosphereRayleighCoefficientBInput(value) {
  globe.atmosphereRayleighCoefficient.z = parseFloat(value) * 1e-6;
}

function handleGroundAtmosphereRayleighScaleHeightInput(value) {
  globe.atmosphereRayleighScaleHeight = parseFloat(value);
}

function handleGroundAtmosphereMieCoefficientInput(value) {
  const v = parseFloat(value) * 1e-6;
  globe.atmosphereMieCoefficient = new Cesium.Cartesian3(v, v, v);
}

function handleGroundAtmosphereMieScaleHeightInput(value) {
  globe.atmosphereMieScaleHeight = parseFloat(value);
}

function handleGroundAtmosphereMieAnisotropyInput(value) {
  globe.atmosphereMieAnisotropy = parseFloat(value);
}

function handleGroundHueShiftInput(value) {
  globe.atmosphereHueShift = parseFloat(value);
}

function handleGroundSaturationShiftInput(value) {
  globe.atmosphereSaturationShift = parseFloat(value);
}

function handleGroundBrightnessShiftInput(value) {
  globe.atmosphereBrightnessShift = parseFloat(value);
}

function handleEnableLighting(checked) {
  globe.enableLighting = checked;
}

function handleLightingFadeOutDistanceInput(value) {
  globe.lightingFadeOutDistance = parseFloat(value);
}

function handleLightingFadeInDistanceInput(value) {
  globe.lightingFadeInDistance = parseFloat(value);
}

function handleNightFadeOutDistanceInput(value) {
  globe.nightFadeOutDistance = parseFloat(value);
}

function handleNightFadeInDistanceInput(value) {
  globe.nightFadeInDistance = parseFloat(value);
}

function handleDynamicLightingChange(checked) {
  globe.dynamicAtmosphereLighting = checked;
}

function handleDynamicLightingFromSunChange(checked) {
  globe.dynamicAtmosphereLightingFromSun = checked;
}

function handleGroundTranslucencyChange(checked) {
  globe.translucency.enabled = checked;
  globe.translucency.frontFaceAlpha = 0.1;
  globe.translucency.backFaceAlpha = 0.1;
}

function handleHDRChange(checked) {
  scene.highDynamicRange = checked;
}

function handleShowSkyAtmosphereChange(checked) {
  skyAtmosphere.show = checked;
}

function handleSkyAtmosphereLightIntensityInput(value) {
  skyAtmosphere.atmosphereLightIntensity = parseFloat(value);
}

function handleSkyAtmosphereRayleighCoefficientRInput(value) {
  skyAtmosphere.atmosphereRayleighCoefficient.x = parseFloat(value) * 1e-6;
}

function handleSkyAtmosphereRayleighCoefficientGInput(value) {
  skyAtmosphere.atmosphereRayleighCoefficient.y = parseFloat(value) * 1e-6;
}

function handleSkyAtmosphereRayleighCoefficientBInput(value) {
  skyAtmosphere.atmosphereRayleighCoefficient.z = parseFloat(value) * 1e-6;
}

function handleSkyAtmosphereRayleighScaleHeightInput(value) {
  skyAtmosphere.atmosphereRayleighScaleHeight = parseFloat(value);
}

function handleSkyAtmosphereMieCoefficientInput(value) {
  const v = parseFloat(value) * 1e-6;
  skyAtmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(v, v, v);
}

function handleSkyAtmosphereMieScaleHeightInput(value) {
  skyAtmosphere.atmosphereMieScaleHeight = parseFloat(value);
}

function handleSkyAtmosphereMieAnisotropyInput(value) {
  skyAtmosphere.atmosphereMieAnisotropy = parseFloat(value);
}

function handleSkyHueShiftInput(value) {
  skyAtmosphere.hueShift = parseFloat(value);
}

function handleSkySaturationShiftInput(value) {
  skyAtmosphere.saturationShift = parseFloat(value);
}

function handleSkyBrightnessShiftInput(value) {
  skyAtmosphere.brightnessShift = parseFloat(value);
}

/**
 * perFragmentAtmosphere为true时表示计算每个片元的大气，而不是每个顶点的大气。这会产生更好看的气氛，但性能会略有下降。
 */
function handlePerFragmentAtmosphereChange(checked) {
  scene.skyAtmosphere.perFragmentAtmosphere = checked;
}
//#endregion
</script>

<style lang="scss" scoped>
.panel {
  position: absolute;
  width: 500px;
  height: 80%;
  max-height: 635px;
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

//自定义分割线上边距
:deep(.el-divider--horizontal) {
  margin-top: 15px;
}

//分割线上的文字样式
:deep(.el-divider__text) {
  font-size: 15px;
  font-weight: bold;
  color: #409eff;
}

//滑块右侧的输入框的长度
:deep(.el-input-number) {
  width: 120px;
}

//滑块右侧输入框
:deep(.el-slider__runway.show-input) {
  margin-right: 13px;
  margin-left: 5px;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-form-item) {
  margin-bottom: 6px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
}

:deep(.el-input-number .el-input__inner){
  font-size: 13px;
}
</style>
