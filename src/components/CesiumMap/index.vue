<script setup>
import {
  Ion,
  Viewer,
  DebugModelMatrixPrimitive,
  Cartesian3,
  ScreenSpaceEventType,
  Color,
  Entity,
  ArcType,
} from "cesium";

import useCSViewerStore from "@/stores/csViewer.js";

const csViewerStore = useCSViewerStore();

let viewerDivRef = ref();
let viewerRef = shallowRef();

//获取CESIUM_BASE_URL
const sysBaseUrl = import.meta.env.BASE_URL;
const mode = import.meta.env.MODE;
const sourceCesiumBaseUrl = import.meta.env.VITE_CESIUM_BASE_URL;
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwNThmOGZlYy0yMWRhLTQ1Y2QtOWEzYy1kZDc1OTdkMDFiZmUiLCJpZCI6ODg0MjQsImlhdCI6MTY2OTUxNjY0N30.EnNjIANE_y4A1mB2PjYdWQJ5iqGqgztwUdV7blYGcNo";
const cesiumBaseUrl =
  mode === "development"
    ? `${sysBaseUrl}${sourceCesiumBaseUrl}`
    : sourceCesiumBaseUrl;
window.CESIUM_BASE_URL = cesiumBaseUrl;

const emits = defineEmits(["viewerCreated"]);

onMounted(() => {
  initViewer();
  addThreeDimensionalCartesianCoordinateSystem(); //添加显示三维笛卡尔空间直角坐标系
});

/**
 * 初始化Viewer对象
 */
function initViewer() {
  viewerRef.value = new Viewer(viewerDivRef.value, {
    geocoder: false, //位置查找工具(右上角的查询按钮)
    homeButton: false, //(首页位置)按钮，点击后会跳转到默认的全球视角
    sceneModePicker: false, //视角模式切换
    baseLayerPicker: false, //图层选择工具
    navigationHelpButton: false, // 导航帮助
    navigationInstructionsInitiallyVisible: false, //初始化前不显示导航说明
    animation: false, //动画小控件，即左下角的仪表
    timeline: false, //时间轴
    fullscreenButton: false, //全屏按钮
    infoBox: false, //不创建默认的信息框(弹窗)
    selectionIndicator: false, //是否显示选取指示器
    skyBox: false, //skyBox、Sun or Moon都不会被添加
    shouldAnimate: true, //是否允许动画
    showRenderLoopErrors: false, //如果为true，则如果出现渲染循环错误，此小部件将自动向用户显示包含错误的HTML面板
  });
  csViewerStore.viewer = viewerRef;
  viewerRef.value.cesiumWidget.creditContainer.style.display = "none"; //隐藏版权信息
  viewerRef.value.scene.debugShowFramesPerSecond = true; //添加帧速显示
  viewerRef.value.camera.flyTo({
    destination: Cartesian3.fromDegrees(45.0, 20.0, 17850000),
  });
  //取消默认的双击事件
  viewerRef.value.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );
  viewerRef.value.scene.globe.depthTestAgainstTerrain = true; //开启深度测试
  // 抗锯齿
  viewerRef.value.scene.fxaa = true;
  viewerRef.value.scene.postProcessStages.fxaa.enabled = false;
  /**
   * 设置渲染分辨率的缩放因子，默认值为1，详细解释见官方api文档：https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html?classFilter=viewer#resolutionScale
   * devicePixelRatio表示：显示设备的物理像素分辨率与CSS像素分辨率之比
   */
  viewerRef.value.resolutionScale = window.devicePixelRatio;
  //开启地表透明
  viewerRef.value.scene.globe.translucency.enabled = true;
  viewerRef.value.scene.globe.translucency.frontFaceAlpha = 0.5;
  emits("viewerCreated");
}

function addThreeDimensionalCartesianCoordinateSystem() {
  //添加坐标轴
  const DEFAULT_AXIS_LENGTH = 10000000.0;
  viewerRef.value.scene.primitives.add(
    new DebugModelMatrixPrimitive({
      length: DEFAULT_AXIS_LENGTH, //坐标轴的长度，单位是米。默认值为10000000.0
      width: 10.0, //坐标轴的宽度，单位是像素，默认值为2.0
    })
  );
  const LabelHeight = DEFAULT_AXIS_LENGTH * 1.02;
  //添加原点文字
  // addCoordinateLabel(Cartesian3.ZERO, "原点");
  const ZERO_OFFSET = -0.03 * DEFAULT_AXIS_LENGTH;
  const zeroLabel = createLabel(
    new Cartesian3(ZERO_OFFSET, ZERO_OFFSET, ZERO_OFFSET),
    "原点"
  );
  viewerRef.value.entities.add(zeroLabel);
  //添加坐标轴x文字标签
  const xLabel = createLabel(new Cartesian3(LabelHeight, 0.0, 0.0), "x");
  viewerRef.value.entities.add(xLabel);
  //添加坐标轴y文字标签
  const yLabel = createLabel(new Cartesian3(0.0, LabelHeight, 0.0), "y");
  viewerRef.value.entities.add(yLabel);
  //添加坐标轴z文字标签
  const zLabel = createLabel(new Cartesian3(0.0, 0.0, LabelHeight), "z");
  viewerRef.value.entities.add(zLabel);
  //绘制赤道线，即0度纬线
  const equator = createParallel(0, Color.BLUE);
  viewerRef.value.entities.add(equator);
  //添加赤道线文字标签
  const equatorLabel = createLabel(
    Cartesian3.fromDegrees(45.0, 0.0, 300000.0),
    "赤道"
  );
  viewerRef.value.entities.add(equatorLabel);
  //绘制本初子午线，即0度经线
  const primeMeridian = createMeridian(0, Color.RED);
  viewerRef.value.entities.add(primeMeridian);
  //添加本初子午线文字标签
  const primeMeridianLabel = createLabel(
    Cartesian3.fromDegrees(0.0, 20.0, 300000.0),
    "本初子午线"
  );
  viewerRef.value.entities.add(primeMeridianLabel);
  //添加90度经线
  const meridian90 = createMeridian(90, Color.YELLOW);
  viewerRef.value.entities.add(meridian90);
  //添加90度经线
  const meridian90Label = createLabel(Cartesian3.fromDegrees(90.0, 20.0, 300000.0),
    "90度经线");
  viewerRef.value.entities.add(meridian90Label);
}

//添加坐标轴标签文字标签
function createLabel(position, text) {
  return {
    position,
    label: { text },
  };
}

/**
 * 绘制纬线圈
 * @param {number} latitude 维度
 * @param {Color} color 材质颜色
 * @returns {Entity} 返回实体对象
 */
function createParallel(latitude, color) {
  return {
    polyline: {
      positions: Cartesian3.fromDegreesArray([
        -180,
        latitude,
        -90,
        latitude,
        0,
        latitude,
        90,
        latitude,
        180,
        latitude,
      ]),
      width: 2,
      arcType: ArcType.RHUMB,
      material: color,
    },
  };
}

function createMeridian(longitude, color) {
  return {
    polyline: {
      positions: Cartesian3.fromDegreesArray([
        longitude,
        90,
        longitude,
        0,
        longitude,
        -90,
      ]),
      width: 2,
      arcType: ArcType.RHUMB,
      material: color,
    },
  };
}
</script>

<template>
  <div class="map" ref="viewerDivRef"></div>
</template>

<style lang="scss" scoped>
.map {
  position: relative;
  height: 100%;

  .select {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    width: 240px;
  }
}

//帧数组件位置
:deep(.cesium-performanceDisplay-defaultContainer) {
  top: 10px;
  left: 10px;
  right: auto;
}
</style>
