<script setup>
import { SceneTransforms, defined } from "cesium";

import useCSViewerStore from "@/stores/csViewer.js";

const csViewerStore = useCSViewerStore();

let popupDivRef = ref();
const show = ref(false);

const props = defineProps({
  title: {
    type: String,
    default: "标题",
  },
  position: {
    type: Object,
    default: () => {},
  },
  yOffset: {
    type: Number,
    default: 10,
  },
});

const emits = defineEmits(["close"]);

watch(
  () => props.position,
  (val) => {
    setPosition(val);
  },
  { deep: true }
);

onBeforeUnmount(() => {
  setPopupUndefined();
});

function setPosition(val) {
  if (Object.keys(val).length) {
    setPopupPositon();
  } else {
    setPopupUndefined();
  }
}

function setPopupPositon() {
  csViewerStore.viewer.scene.preRender.addEventListener(setPositionListener);
}

function setPositionListener() {
  const canvasPosition = getCanvasPos(props.position);
  if (defined(canvasPosition)) {
    if (!show.value) show.value = true;
    setPopupDiv(canvasPosition.x, canvasPosition.y - props.yOffset);
  }
}

function getCanvasPos(cartesian3Pos) {
  return Object.keys(cartesian3Pos).length > 0
    ? SceneTransforms.worldToWindowCoordinates(
        csViewerStore.viewer.scene,
        cartesian3Pos
      )
    : undefined;
}

function setPopupUndefined() {
  if (show.value) show.value = false;
  csViewerStore.viewer.scene.preRender.removeEventListener(setPositionListener);
}

function setPopupDiv(left, top) {
  popupDivRef.value.style.left = left + "px";
  popupDivRef.value.style.top = top + "px";
}

function close() {
  emits("close");
}
</script>

<template>
  <div class="cs-popup" ref="popupDivRef" v-show="show">
    <div class="cs-popup-header">
      <div class="cs-popup-title">
        {{ title }}
      </div>
      <div class="cs-popup-close">
        <i-ep-Close @click="close" />
      </div>
    </div>
    <div class="cs-popup-content">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cs-popup {
  position: absolute;
  width: 400px;
  padding-bottom: 10px;
  background-color: white;
  box-shadow: 0 2px 4px 0 rgba(100, 100, 100, 0.12),
    0 0 6px 0 rgba(100, 100, 100, 0.6);
  transform: translate(-50%, -100%);
  border-radius: 4px;

  &:after,
  &:before {
    top: 100%;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    left: 50%;
  }

  &:after {
    border-top-color: #fff;
    border-width: 10px;
    margin-left: -10px;
  }

  &:before {
    border-top-color: #fff;
    border-width: 10px;
    margin-left: -10px;
  }

  &-header {
    display: flex;
    align-items: center;
    line-height: 35px;
    color: #000;
    user-select: none;
  }

  &-title {
    flex: 1;
    padding-left: 10px;
    font-size: 15px;
    user-select: none;
  }

  &-close {
    width: 35px;
    height: 35px;
    border-radius: 0 4px 0 0;
    font-size: 21px;
    text-align: center;
    border: transparent;
    cursor: pointer;
    &:hover {
      color: #409eff;
    }
  }

  &-content {
    max-height: 300px;
    font-size: 13px;
    max-height: 300px;
    overflow-y: auto;
    padding: 10px 20px 10px 20px;

    // 滚动条
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: none;
    }

    &::-webkit-scrollbar-thumb {
      background: #eaeaea;
      border-radius: 10px;
    }
  }
}
</style>
