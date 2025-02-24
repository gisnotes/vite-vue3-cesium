<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <div class="slider" ref="sliderDivRef"></div>
</template>

<script setup>
//#region --------------------- 定义变量----------------
let viewer, leftTileset, rightTileset, handler;
let moveActive = false;

const sliderDivRef = ref();

//#endregion

function viewerCreated(v) {
  viewer = v;
  initData();
  initEvents();
}

//#region --------------------- 方法区域----------------
async function initData() {
  try {
    leftTileset = await Cesium.Cesium3DTileset.fromIonAssetId(69380);
    viewer.scene.primitives.add(leftTileset);
    // https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html#splitDirection
    // https://cesium.com/learn/cesiumjs/ref-doc/global.html#SplitDirection
    leftTileset.splitDirection = Cesium.SplitDirection.LEFT;

    viewer.zoomTo(leftTileset);

    rightTileset = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(rightTileset);
    rightTileset.splitDirection = Cesium.SplitDirection.RIGHT;

    await nextTick();

    /**
     * https://cesium.com/learn/cesiumjs/ref-doc/Scene.html#splitPosition
     * Scene.splitPosition 是 Cesium 中控制场景分屏位置的属性，有效值的范围在 0.0 到 1.0 之间，决定了分割线在画布中的相对位置。
     */
    viewer.scene.splitPosition =
      sliderDivRef.value.offsetLeft /
      sliderDivRef.value.parentElement.offsetWidth;
  } catch (error) {
    ElMessage.error(`tileset数据加载出错: ${error}`);
  }
}

function initEvents() {
  // new Cesium.ScreenSpaceEventHandler(element):处理用户输入事件。可以添加自定义函数，以便在用户输入时执行。
  handler = new Cesium.ScreenSpaceEventHandler(sliderDivRef.value);

  // 鼠标按下---> 开始拖动分割条---> 鼠标移动与拖动分割条--->抬起鼠标--->停止拖动分割条
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
</style>
