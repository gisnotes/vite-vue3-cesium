<template>
  <CesiumMap />
  <div class="note">
    <ul>
      <li>单击 Cesium 画布开始。</li>
      <li>w键/s键 - 前进/后退</li>
      <li>a键/d键 - 向左移动/向右移动</li>
      <li>q键/e键 - 上升/下降</li>
      <li>鼠标左键按下加鼠标移动可更改查看方向</li>
    </ul>
  </div>
</template>

<script setup>
import useCSViewerStore from "@/stores/csViewer.js";
import {
  ScreenSpaceEventHandler,
  Cartesian3,
  ScreenSpaceEventType,
  defined,
} from "cesium";

const cvs = useCSViewerStore();
let viewer, scene, canvas, ellipsoid;
let handler;
let startMousePosition, mousePosition;
const flags = {
  looking: false,
  moveForward: false,
  moveBackward: false,
  moveUp: false,
  moveDown: false,
  moveLeft: false,
  moveRight: false,
};

onMounted(() => {
  initData();
  initEvt();
});

function initData() {
  viewer = cvs.viewer;
  canvas = viewer.canvas;
  canvas.setAttribute("tabindex", 0);

  scene = viewer.scene;
  ellipsoid = scene.globe.ellipsoid;
  //禁用默认事件处理程序
  scene.screenSpaceCameraController.enableRotate = false; //不允许旋转
  scene.screenSpaceCameraController.enableTranslate = false; //不允许移动地图，Camera将锁定在当前位置
  scene.screenSpaceCameraController.enableZoom = false; //不允许缩放，Camera锁定到与椭球体的当前距离
  scene.screenSpaceCameraController.enableTilt = false; //不允许Camera倾斜，Camera将锁定到当前航向
  scene.screenSpaceCameraController.enableLook = false; //如果为 true，则允许用户使用free-look。如果为 false，则只能通过平移或旋转来更改相机视图方向

  handler = new ScreenSpaceEventHandler(canvas);
}

let onTick;
function initEvt() {
  canvas.addEventListener("click", canvasListenerEvt);

  handler.setInputAction((movement) => {
    // console.log('movement: ', movement);
    flags.looking = true;
    mousePosition = startMousePosition = Cartesian3.clone(movement.position);
  }, ScreenSpaceEventType.LEFT_DOWN);
  handler.setInputAction((movement) => {
    // console.log('movement: ', movement);
    mousePosition = movement.endPosition;
  }, ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction((position) => {
    // console.log('position: ', position);
    flags.looking = false;
  }, ScreenSpaceEventType.LEFT_UP);

  document.addEventListener("keydown", keyDownEvt);
  document.addEventListener("keyup", keyUpEvt);

  //每当调用 Clock#tick 时触发的 Event。参考：https://cesium.com/learn/cesiumjs/ref-doc/Clock.html?classFilter=clock#tick
  onTick = viewer.clock.onTick.addEventListener(clockOntickEvt);
  console.log("onTick: ", onTick);
}

//------------------要注册的事件-----------------------------
function canvasListenerEvt(e) {
  // console.log("e: ", e);
  canvas.focus();
}

function keyDownEvt(e) {
  console.log("down", e.code);
  setEvtFlag(e, true);
}

function keyUpEvt(e) {
  console.log("up", e.code);
  setEvtFlag(e, false);
}

function setEvtFlag(e, flag) {
  const flagName = getFlagForKeyCode(e.code);
  if (typeof flagName !== "undefined") {
    flags[flagName] = flag;
  }
}

function getFlagForKeyCode(code) {
  switch (code) {
    case "KeyW":
      return "moveForward";
    case "KeyS":
      return "moveBackward";
    case "KeyQ":
      return "moveUp";
    case "KeyE":
      return "moveDown";
    case "KeyD":
      return "moveRight";
    case "KeyA":
      return "moveLeft";
    default:
      return undefined;
  }
}

function clockOntickEvt(clock) {
  // console.log("clock: ", clock);
  const camera = viewer.camera;
  if (flags.looking) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const x = (mousePosition.x - startMousePosition.x) / width;
    const y = -(mousePosition.y - startMousePosition.y) / height;

    const lookFactor = 0.05;
    camera.lookRight(x * lookFactor);
    camera.lookUp(y * lookFactor);
  }

  //根据摄像机到椭球体表面的距离更改移动速度。
  const cameraHeight = ellipsoid.cartesianToCartographic(
    camera.position
  ).height;
  const moveRate = cameraHeight / 100.0;

  if (flags.moveForward) {
    camera.moveForward(moveRate);
  }
  if (flags.moveBackward) {
    camera.moveBackward(moveRate);
  }
  if (flags.moveUp) {
    camera.moveUp(moveRate);
  }
  if (flags.moveDown) {
    camera.moveDown(moveRate);
  }
  if (flags.moveLeft) {
    camera.moveLeft(moveRate);
  }
  if (flags.moveRight) {
    camera.moveRight(moveRate);
  }
}

//-------------解绑所有事件监听器------------
onBeforeUnmount(() => {
  handler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
  handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
  handler.removeInputAction(ScreenSpaceEventType.LEFT_UP);

  document.removeEventListener("keydown", keyDownEvt);
  document.removeEventListener("keyup", keyUpEvt);
  canvas.removeEventListener("click", canvasListenerEvt);

  if (defined(onTick)) {
    //上面注册监听器的返回值为一个函数(Event.RemoveCallback)，该函数将在调用时删除此事件监听器。
    //具体可参考：https://cesium.com/learn/cesiumjs/ref-doc/Event.html#addEventListener
    onTick(); //这里执行返回值函数则会删除此监听器
    onTick = undefined;
  }
});
</script>

<style lang="scss" scoped>
.note {
  position: absolute;
  top: 10px;
  left: 120px;
  background-color: white;
  padding: 10px;
  border-radius: 4px;

  ul {
    list-style-position: inside;
  }
}
</style>
