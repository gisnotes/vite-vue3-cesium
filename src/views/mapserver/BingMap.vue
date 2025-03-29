<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <div class="slider" ref="sliderDivRef"></div>
  <el-checkbox
    class="showLabel"
    v-model="showBingMapLabelsOnly"
    label="显示必应地图注记层"
    size="large"
    @change="handleShowChange" />
</template>

<script setup>
/**
 * 示例介绍：
 * 这个示例展示了在无注记的影像上叠加注记的能力。(这里的label个人觉得应该翻译为注记)
 * 1. 左侧是带有注记的Bing地图航拍图+无注记的高分辨率华盛顿特区影像。注记被特区影像遮挡，无法独立开启或关闭。
 * 2. 右侧是Bing地图航拍图+无注记的高分辨率华盛顿特区影像+Bing地图的纯注记图层。
 * 注记现在位于场景中所有影像之上，并能根据应用配置和/或相机缩放级别独立显示或隐藏。
 *
 * 对于此演示，首先禁用所有图像。新版本的api中只要将baseLayer属性设置为false即可。
 */

//#region --------------------- 定义变量----------------
let viewer, handler, layers, bingMapsLabelsOnly;

const showBingMapLabelsOnly = ref(true);

const sliderDivRef = ref();

let moveActive = false;

//#endregion

function viewerCreated(v) {
  viewer = v;
  layers = viewer.imageryLayers;
  addBingMapServer();

  //等到dom渲染完毕后再去拿dom元素
  nextTick(() => {
    viewer.scene.splitPosition =
      sliderDivRef.value.offsetLeft /
      sliderDivRef.value.parentElement.offsetWidth;
    handler = new Cesium.ScreenSpaceEventHandler(sliderDivRef.value);
    initEvents();
  });
}

//#region --------------------- 方法区域----------------
function addBingMapServer() {
  //将带注记的Bing地图航拍图添加到左侧区域
  const bingMapsAerialWithLabels = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(3)
  );
  bingMapsAerialWithLabels.splitDirection = Cesium.SplitDirection.LEFT;
  layers.add(bingMapsAerialWithLabels);

  //将无注记的Bing地图航拍图添加到右侧区域
  const bingMapsAerial = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(2)
  );
  bingMapsAerial.splitDirection = Cesium.SplitDirection.RIGHT;
  layers.add(bingMapsAerial);

  //添加高分辨率的华盛顿特区图像（两侧都显示）。
  const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(3827)
  );
  viewer.imageryLayers.add(imageryLayer);

  //将Bing地图的纯注记图层添加至右侧区域
  bingMapsLabelsOnly = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(2411391)
  );
  bingMapsLabelsOnly.splitDirection = Cesium.SplitDirection.RIGHT;
  layers.add(bingMapsLabelsOnly);

  viewer.zoomTo(imageryLayer);
}

function handleShowChange(checked) {
  bingMapsLabelsOnly.show = checked;
}

function initEvents() {
  handler.setInputAction(function () {
    moveActive = true;
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

  handler.setInputAction(function () {
    moveActive = true;
  }, Cesium.ScreenSpaceEventType.PINCH_START);

  handler.setInputAction(move, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(move, Cesium.ScreenSpaceEventType.PINCH_MOVE);

  handler.setInputAction(function () {
    moveActive = false;
  }, Cesium.ScreenSpaceEventType.LEFT_UP);

  handler.setInputAction(function () {
    moveActive = false;
  }, Cesium.ScreenSpaceEventType.PINCH_END);
}

function move(movement) {
  if (!moveActive) {
    return;
  }

  const relativeOffset = movement.endPosition.x;
  const splitPosition =
    (sliderDivRef.value.offsetLeft + relativeOffset) /
    sliderDivRef.value.parentElement.offsetWidth;
  sliderDivRef.value.style.left = `${100.0 * splitPosition}%`;
  viewer.scene.splitPosition = splitPosition;
}
//#endregion
</script>

<style lang="scss" scoped>
.slider {
  position: absolute;
  left: 50%;
  top: 0px;
  background-color: #d3d3d3;
  width: 5px;
  height: 100%;
  z-index: 9999;

  &:hover {
    cursor: ew-resize;
  }
}

.showLabel {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: white;
  padding: 0 15px;
  border-radius: 4px;
  opacity: 0.9;
}
</style>
