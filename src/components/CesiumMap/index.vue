<script setup>
import useCSViewerStore from "@/stores/csViewer.js";
import Tianditu from "./Tianditu.js";

const csViewerStore = useCSViewerStore();

let viewerDivRef = ref();
let viewerRef = shallowRef();

const tdt = new Tianditu();

//获取CESIUM_BASE_URL
const sysBaseUrl = import.meta.env.BASE_URL;
const mode = import.meta.env.MODE;
const sourceCesiumBaseUrl = import.meta.env.VITE_CESIUM_BASE_URL;
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwNThmOGZlYy0yMWRhLTQ1Y2QtOWEzYy1kZDc1OTdkMDFiZmUiLCJpZCI6ODg0MjQsImlhdCI6MTY2OTUxNjY0N30.EnNjIANE_y4A1mB2PjYdWQJ5iqGqgztwUdV7blYGcNo";
const cesiumBaseUrl =
  mode === "development"
    ? `${sysBaseUrl}${sourceCesiumBaseUrl}`
    : sourceCesiumBaseUrl;
window.CESIUM_BASE_URL = cesiumBaseUrl;

const emits = defineEmits(["leftClick"]);

//--------------------生命周期-----------------------
onMounted(() => {
  createViewer();
  // addMapLyr();
  initViewerParams();
  initEvt();
});

onBeforeUnmount(() => {
  viewerRef.value?.screenSpaceEventHandler?.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_CLICK
  );
});

//------------------------方法------------------------------
/**
 * 初始化Viewer对象
 */
function createViewer() {
  /**
   * 默认视图范围改为中国范围：
   * https://github.com/wandergis/coordtransform/blob/master/index.js#L144
   */
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
    73.66,
    3.86,
    135.05,
    53.55
  );
  viewerRef.value = new Cesium.Viewer(viewerDivRef.value, {
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
    // baseLayer: false,
  });
  csViewerStore.viewer = viewerRef;
}

/**
 * 添加天地图影像图层和注记图层
 */
function addMapLyr() {
  const imgService = tdt.createTiandituService("影像底图");
  viewerRef.value.imageryLayers.addImageryProvider(imgService, 0);
  const ciaService = tdt.createTiandituService("影像注记");
  viewerRef.value.imageryLayers.addImageryProvider(ciaService, 1);
}

function initViewerParams() {
  viewerRef.value.cesiumWidget.creditContainer.style.display = "none"; //隐藏版权信息
  viewerRef.value.scene.debugShowFramesPerSecond = true; //添加帧速显示
  //取消默认的双击事件
  viewerRef.value.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
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
}

function initEvt() {
  viewerRef.value.screenSpaceEventHandler.setInputAction((e) => {
    emits("leftClick", e);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
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
