<script setup>
import {
  Ion,
  Viewer,
  FeatureDetection,
  ScreenSpaceEventType,
} from "cesium";
import "cesium/Build/CesiumUnminified/Widgets/widgets.css";

import useCSViewerStore from "@/stores/csViewer.js";
import Tianditu from "./Tianditu.js";

const csViewerStore = useCSViewerStore();

let viewerDivRef = ref();
let viewerRef = shallowRef();

const tdt = new Tianditu();
let imgImageryLyr;

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

const props = defineProps({
  mapType: {
    type: String,
    default: "tdtImg",
  },
});

const emits = defineEmits(["viewerCreated", "leftClick"]);

onMounted(() => {
  initViewer();
  addMapLyr();
  initEvt();
});

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
    showRenderLoopErrors: false, //如果为true，则如果出现渲染循环错误，此小部件将自动向用户显示包含错误的HTML面板。
    baseLayer: false, //新版本api移除默认图层的方法
  });
  csViewerStore.viewer = viewerRef;
  emits("viewerCreated");
  viewerRef.value.cesiumWidget.creditContainer.style.display = "none"; //隐藏版权信息
  viewerRef.value.scene.debugShowFramesPerSecond = true; //添加帧速显示
  viewerRef.value.scene.globe.depthTestAgainstTerrain = true; //开启地形检测
  //判断是否支持图像渲染像素化处理以便启用抗锯齿
  if (FeatureDetection.supportsImageRenderingPixelated()) {
    viewerRef.value.resolutionScale = window.devicePixelRatio;
  }

}

function addMapLyr() {
  //添加天地图影像图层
  const imgService = tdt.createTiandituService("影像底图");
  imgImageryLyr = viewerRef.value.imageryLayers.addImageryProvider(
    imgService,
    0
  );
  const ciaService = tdt.createTiandituService("影像注记");
  const ciaImageryLyr = viewerRef.value.imageryLayers.addImageryProvider(
    ciaService,
    1
  );
  imgImageryLyr.show = ciaImageryLyr.show = props.mapType === "tdtImg";
}

function initEvt() {
  viewerRef.value.screenSpaceEventHandler.setInputAction((e) => {
    emits("leftClick", e);
  }, ScreenSpaceEventType.LEFT_CLICK);
}

onBeforeUnmount(() => {
  viewerRef.value.screenSpaceEventHandler.removeInputAction(
    ScreenSpaceEventType.LEFT_CLICK
  );
});
</script>

<template>
  <div class="map" ref="viewerDivRef"></div>
</template>

<style lang="scss" scoped>
.map {
  position: relative;
  height: 100%;
}

//帧数组件位置
:deep(.cesium-performanceDisplay-defaultContainer) {
  top: 10px;
  left: 10px;
  right: auto;
}
</style>
