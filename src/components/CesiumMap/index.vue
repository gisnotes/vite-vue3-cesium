<script setup>
import {
  Ion,
  Viewer,
  buildModuleUrl,
  TileMapServiceImageryProvider,
  ImageryLayer,
} from "cesium";
import "cesium/Build/CesiumUnminified/Widgets/widgets.css";

import useCSViewerStore from "@/stores/csViewer.js";

const csViewerStore = useCSViewerStore();

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

console.log(`模式: ${mode}, CESIUM_BASE_URL: ${cesiumBaseUrl}`);

let viewerDivRef = ref();
let viewerRef = shallowRef();

onMounted(() => {
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
    // baseLayer: false, //新版本api移除默认图层的方法
    baseLayer: ImageryLayer.fromProviderAsync(
      TileMapServiceImageryProvider.fromUrl(
        buildModuleUrl("Assets/Textures/NaturalEarthII")
      )
    ),
  });

  //隐藏版权信息
  viewerRef.value.cesiumWidget.creditContainer.style.display = "none";
  //添加帧速显示
  viewerRef.value.scene.debugShowFramesPerSecond = true;

  csViewerStore.viewer = viewerRef;

  console.log("child", "onMounted", csViewerStore.viewer);
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
