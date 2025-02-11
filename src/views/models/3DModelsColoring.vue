<!-- 官方示例：https://sandcastle.cesium.com/?src=3D%20Models%20Coloring.html&label=All -->
<template>
  <CesiumMap />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="auto">
      <el-divider content-position="left">模型</el-divider>
      <el-form-item label="模型">
        <el-select
          v-model="form.model"
          placeholder="请选择模型"
          @change="handleChangeModel">
          <el-option
            v-for="item in models"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="阴影">
        <el-switch
          v-model="form.shadows"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleShadowsChange" />
        <el-popover
          placement="right"
          :width="100"
          trigger="hover"
          content="Viewer对象的shadows，是个布尔值，即确定阴影是否由光源投射。">
          <template #reference>
            <el-button size="small" circle style="margin-left: 10px">
              <i-ep-InfoFilled />
            </el-button>
          </template>
        </el-popover>
      </el-form-item>
      <el-divider content-position="left">模型颜色</el-divider>
      <el-form-item label="混合模式">
        <el-select
          v-model="form.colorBlendMode"
          placeholder="请选择模式"
          @change="handleColorBlendModeChange">
          <el-option
            v-for="item in colorBlendModes"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="混合颜色">
        <el-select
          v-model="form.color"
          placeholder="请选择颜色"
          @change="handleColorChange">
          <el-option
            v-for="item in colors"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="透明度">
        <el-slider
          v-model="form.alpha"
          show-input
          :max="1"
          :step="0.01"
          :show-input-controls="false"
          @change="handleAlphaChange" />
      </el-form-item>
      <el-form-item label="混合比例">
        <el-slider
          v-model="form.colorBlendAmount"
          :disabled="form.colorBlendMode !== 'Mix'"
          show-input
          :max="1"
          :step="0.01"
          :show-input-controls="false"
          @change="handleColorBlendAmountChange" />
      </el-form-item>
      <el-divider content-position="left">模型轮廓</el-divider>
      <el-form-item label="轮廓颜色">
        <el-select
          v-model="form.silhouetteColor"
          placeholder="请选择颜色"
          @change="handleSilhouetteColorChange">
          <el-option
            v-for="item in silhouetteColors"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="轮廓透明度">
        <el-slider
          v-model="form.silhouetteAlpha"
          show-input
          :max="1"
          :step="0.01"
          :show-input-controls="false"
          @change="handleSilhouetteAlphaChange" />
      </el-form-item>
      <el-form-item label="轮廓尺寸">
        <el-slider
          v-model="form.silhouetteSize"
          show-input
          :max="10"
          :step="0.01"
          :show-input-controls="false"
          @change="handleSilhouetteSizeChange" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import useCSViewerStore from "@/stores/csViewer.js";

//#region --------------------- 定义变量----------------
const cvs = useCSViewerStore();
let viewer, entity;

const form = reactive({
  model: "Ground Vehicle",
  shadows: true,
  colorBlendMode: "Highlight",
  color: "Red",
  alpha: 1.0,
  colorBlendAmount: 0.5,
  silhouetteColor: "Red",
  silhouetteAlpha: 1.0,
  silhouetteSize: 2.0,
});

/**
 * @type {Array} 要加载的模型列表
 */
const models = [
  { value: "Ground Vehicle", label: "地面车辆" },
  { value: "Aircraft", label: "飞机" },
  { value: "Hot Air Balloon", label: "热气球" },
  { value: "Milk Truck", label: "运奶卡车" },
  { value: "Skinned Character", label: "带有皮肤的角色" },
];

/**
 * @type {Array} 颜色混合模式
 */
const colorBlendModes = [
  { value: "Highlight", label: "高亮" },
  { value: "Replace", label: "替换" },
  { value: "Mix", label: "混合" },
];

/**
 * @type {Array} 模型的颜色值列表
 */
const colors = [
  { value: "White", label: "白色" },
  { value: "Red", label: "红色" },
  { value: "Green", label: "绿色" },
  { value: "Blue", label: "蓝色" },
  { value: "Yellow", label: "黄色" },
  { value: "Gray", label: "灰色" },
];

/**
 * @type {Array} 轮廓的颜色值列表
 */
const silhouetteColors = colors.slice(1);
//#endregion

onMounted(() => {
  viewer = cvs.viewer;
  init();
});

//#region --------------------- 方法区域----------------
function init() {
  handleChangeModel(form.model);
  handleShadowsChange(form.shadows);
}

function handleChangeModel(val) {
  switch (val) {
    case "Aircraft":
      createModel("./SampleData/models/CesiumAir/Cesium_Air.glb", 5000.0);
      break;
    case "Ground Vehicle":
      createModel("./SampleData/models/GroundVehicle/GroundVehicle.glb", 0);
      break;
    case "Hot Air Balloon":
      createModel(
        "./SampleData/models/CesiumBalloon/CesiumBalloon.glb",
        1000.0
      );
      break;
    case "Milk Truck":
      createModel("./SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb", 0);
      break;
    case "Skinned Character":
      createModel("./SampleData/models/CesiumMan/Cesium_Man.glb", 0);
      break;
    default:
      break;
  }
}

function createModel(url, height) {
  viewer.entities.removeAll();

  const position = Cesium.Cartesian3.fromDegrees(
    -77.0744619,
    44.0503706,
    height
  );
  const heading = Cesium.Math.toRadians(135);
  const pitch = 0;
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    hpr
  );

  entity = viewer.entities.add({
    name: url,
    position: position,
    orientation: orientation,
    model: {
      uri: url,
      minimumPixelSize: 128,
      maximumScale: 20000,
      color: getColor(form.color, form.alpha),
      colorBlendMode: getColorBlendMode(form.colorBlendMode),
      colorBlendAmount: parseFloat(form.colorBlendAmount),
      silhouetteColor: getColor(form.silhouetteColor, form.silhouetteAlpha),
      silhouetteSize: parseFloat(form.silhouetteSize),
    },
  });
  viewer.trackedEntity = entity;
}

function handleShadowsChange(checked) {
  viewer.shadows = checked;
}

function handleColorBlendModeChange(val) {
  const colorBlendMode = getColorBlendMode(val);
  entity.model.colorBlendMode = colorBlendMode;
}

function handleColorChange(val) {
  entity.model.color = getColor(val, form.alpha);
}

function handleAlphaChange(val) {
  entity.model.color = getColor(form.color, val);
}

/**
 * model的colorBlendAmount默认值为0.5
 * @param val
 * 当 colorBlendMode 为 MIX 时，用于确定颜色强度的值。
 * - 值为 0.0 时，将产生模型的渲染颜色；
 * - 而值为 1.0 时，将产生纯色；
 * - 介于两者之间的任何值都会导致两者混合。
 */
function handleColorBlendAmountChange(val) {
  entity.model.colorBlendAmount = parseFloat(val);
}

function handleSilhouetteColorChange(val) {
  entity.model.silhouetteColor = getColor(newValue, form.silhouetteAlpha);
}

function handleSilhouetteAlphaChange(val) {
  entity.model.silhouetteColor = getColor(form.silhouetteColor, val);
}

function handleSilhouetteSizeChange(val) {
  entity.model.silhouetteSize = parseFloat(val);
}
//-------------------通用方法--------------------

/**
 * 通过颜色名称和透明度获取Cesium颜色值
 * @param colorName 颜色名称
 * @param alpha 透明度
 */
function getColor(colorName, alpha) {
  const color = Cesium.Color[colorName.toUpperCase()];
  return Cesium.Color.fromAlpha(color, parseFloat(alpha));
}

/**
 * 获取颜色混合模式
 * @param colorBlendMode 颜色混合模式，定义目标颜色和基元(primitive)的源颜色之间的混合模式。
 * HIGHLIGHT：其值为0，将源颜色乘以目标颜色
 * REPLACE：其值为1，将源颜色替换为目标颜色
 * MIX：其值为2，将源颜色和目标颜色混合在一起
 */
function getColorBlendMode(colorBlendMode) {
  return Cesium.ColorBlendMode[colorBlendMode.toUpperCase()];
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
  width: 75px;
}

//滑块右侧输入框
:deep(.el-slider__runway.show-input) {
  margin-right: 13px;
  margin-left: 5px;
}
</style>
