<template>
  <CesiumMap />
  <div class="control">
    <el-select
      class="select"
      v-model="value"
      placeholder="空"
      @change="handleSelectChange">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value" />
    </el-select>
    <el-button class="complete" @click="completeFlight">完成飞行</el-button>
    <el-button class="cancel" @click="cancelFlight">取消飞行</el-button>
    <el-button class="cancel" @click="resetFlight">重置</el-button>
  </div>
  <div class="handle">
    <el-button @click="drawChinaExtent">绘制中国四至范围</el-button>
    <el-button @click="visualCameraFrustum">可视化视锥体</el-button>
    <el-button @click="flyHome">回到初始位置</el-button>
    <el-button @click="zoomIn">放大</el-button>
    <el-button @click="zoomOut">缩小</el-button>
    <br />
    <el-button @click="moveUp">向上</el-button>
    <el-button @click="moveDown">向下</el-button>
    <el-button @click="moveLeft">向左</el-button>
    <el-button @click="moveRight">向右</el-button>
  </div>
</template>

<script setup>
import useCSViewerStore from "@/stores/csViewer.js";

const cvs = useCSViewerStore();

let viewer, scene, clock, camera;
let referenceFramePrimitive;
let chinaExtentEntity, cameraPrimitive;

//资源位置参考代码：https://github.com/CesiumGS/cesium/blob/1.125/packages/engine/Source/Core/PinBuilder.js#L88
//buildModuleUrl(`Assets/Textures/maki/${encodeURIComponent(id)}.png`)
const pinBuilder = new Cesium.PinBuilder(); //一个实用程序类，用于将自定义地图图钉生成为 canvas 元素

onMounted(() => {
  viewer = cvs.viewer;
  scene = viewer.scene;
  clock = viewer.clock;
  camera = viewer.camera;
});

onBeforeUnmount(() => {});

const value = ref("0");

const options = [
  {
    value: "0",
    label: "请选择演示Camera的选项",
  },
  {
    value: "1",
    label: "在一个城市中飞行",
  },
  {
    value: "2",
    label: "飞往圣地亚哥",
  },
  {
    value: "3",
    label: "飞往某个位置(with heading,pitch和roll)",
  },
  {
    value: "4",
    label: "飞往我的位置",
  },
  {
    value: "5",
    label: "飞往一个矩形区域",
  },
  {
    value: "6",
    label: "查看一个矩形",
  },
  {
    value: "7",
    label: "设置参考系",
  },
  {
    value: "8",
    label: "设置相机的heading,pitch,roll",
  },
  {
    value: "9",
    label: "实现ICRF视角的动态更新",
  },
  {
    value: "10",
    label: "Camera移动事件",
  },
  {
    value: "11",
    label: "Camera的changed事件",
  },
  {
    value: "12",
    label: "从洛杉矶途径欧洲飞往东京",
  },
  {
    value: "13",
    label: "从洛杉矶途径欧洲飞往东京——带有俯仰角",
  },
];

function handleSelectChange(value) {
  reset();
  switch (value) {
    case "1":
      flyInACity();
      break;
    case "2":
      flyToSanDiego();
      break;
    case "3":
      flyToHeadingPitchRoll();
      break;
    case "4":
      flyToMyLocation();
      break;
    case "5":
      flyToRectangle();
      break;
    case "6":
      viewRectangle();
      break;
    case "7":
      setReferenceFrame();
      break;
    case "8":
      setHeadingPitchRoll();
      break;
    case "9":
      viewInICRF();
      break;
    case "10":
      cameraMoveEvents();
      break;
    case "11":
      cameraChanges();
      break;
    case "12":
      flyOverLongitude();
      break;
    case "13":
      //带有俯仰角使得相机在超过某个高度值时，调整俯仰角向下看，使得视图范围能一直看到地球。
      flyOverLongitudeWithPitch();
      break;
    default:
      break;
  }
}

function flyInACity() {
  camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      -73.98580932617188,
      40.74843406689482,
      363.34038727246224
    ),
    complete: () => {
      setTimeout(() => {
        camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            -73.98585975679403,
            40.75759944127251,
            186.50838555841779
          ),
          orientation: {
            heading: Cesium.Math.toRadians(200.0),
            pitch: Cesium.Math.toRadians(-50.0),
          },
          easingFunction: Cesium.EasingFunction.LINEAR_NONE,
        });
      }, 1000);
    },
  });
}

function flyToSanDiego() {
  camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0),
  });
}

function flyToHeadingPitchRoll() {
  camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-122.22, 46.12, 5000.0),
    orientation: {
      heading: Cesium.Math.toRadians(20.0),
      pitch: Cesium.Math.toRadians(-35.0),
      roll: 0.0,
    },
  });
}

function flyToMyLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      //绘制一个定位图标
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          pos.coords.longitude,
          pos.coords.latitude,
          0.0
        ),
        billboard: {
          image: pinBuilder.fromMakiIconId("hospital", Cesium.Color.RED, 48),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 图标对齐方式
        },
      });
      camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          pos.coords.longitude,
          pos.coords.latitude,
          1000.0
        ),
      });
    },
    (err) => {
      ElMessage.error("错误(" + err.code + "): " + err.message);
    },
    {
      enableHighAccuracy: true,
    }
  );
}

function flyToRectangle() {
  const west = -90.0;
  const south = 38.0;
  const east = -87.0;
  const north = 40.0;
  const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

  camera.flyTo({
    destination: rectangle,
  });

  //这里是为了展示方便，所以绘制了一个矩形
  viewer.entities.add({
    rectangle: {
      coordinates: rectangle,
      material: Cesium.Color.RED.withAlpha(0.5),
    },
  });
}

function viewRectangle() {
  const west = -77.0;
  const south = 38.0;
  const east = -72.0;
  const north = 42.0;

  const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
  camera.setView({
    destination: rectangle,
  });

  viewer.entities.add({
    rectangle: {
      coordinates: rectangle,
      material: Cesium.Color.YELLOW.withAlpha(0.5),
    },
  });
}

function setReferenceFrame() {
  //局部坐标系（ENU）原点的坐标
  const center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
  /**
   * 计算从ENU坐标系转换为全球通用坐标系的转换矩阵
   * ENU，全称为：East north up coordinate，即东北天坐标系，参考：
   * https://en.wikipedia.org/wiki/Local_tangent_plane_coordinates#Local_east,_north,_up_(ENU)_coordinates
   */
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);

  camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
  //使用目标和变换矩阵设置摄像机位置和方向
  camera.lookAtTransform(
    transform,
    new Cesium.Cartesian3(-120000.0, -120000.0, 120000.0)
  );

  referenceFramePrimitive = scene.primitives.add(
    new Cesium.DebugModelMatrixPrimitive({
      modelMatrix: transform,
      length: 100000.0,
    })
  );

  //计算当前局部坐标系的原点转为世界坐标系坐标
  const enuOrigin = Cesium.Matrix4.multiplyByPoint(
    transform,
    new Cesium.Cartesian3(0, 0, 0),
    new Cesium.Cartesian3()
  );
  viewer.entities.add({
    position: enuOrigin,
    billboard: {
      image: pinBuilder.fromMakiIconId("hospital", Cesium.Color.RED, 48),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 图标对齐方式
    },
  });
}

function setHeadingPitchRoll() {
  camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-75.5847, 40.0397, 1000.0),
    orientation: {
      heading: -Cesium.Math.PI_OVER_TWO,
      pitch: -Cesium.Math.PI_OVER_FOUR,
      roll: 0.0,
    },
  });
}

let removePostUpdate;
function viewInICRF() {
  //摄像机飞往默认的主视图（即Camera#.DEFAULT_VIEW_RECTANGLE），参数为持续时间，这里设置为0秒
  camera.flyHome(0);
  //multiplier默认值为1.0，获取或设置调用 Clock#tick 时前进的时间量，由于单位为秒，因此这里设置每次时间的前进时长为3小时
  clock.multiplier = 3 * 60 * 60;
  //添加在更新场景后和渲染场景之前执行的事件监听器。
  //事件的订阅者接收 Scene 实例作为第一个参数，将当前时间作为第二个参数。
  removePostUpdate = scene.postUpdate.addEventListener((scene, time) => {
    console.log("time参数类型为JulianDate： ", time instanceof Cesium.JulianDate);
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
      return;
    }

    //计算旋转矩阵，以在给定时间将点或矢量从国际天体参考系 （GCRF/ICRF） 惯性系轴变换为地球固定系轴 （ITRF）。如果尚未加载执行转换所需的数据，则此函数可能会返回 undefined。
    const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
    if (Cesium.defined(icrfToFixed)) {
      const offset = Cesium.Cartesian3.clone(camera.position);
      //从表示旋转的 Matrix3 和表示平移的 Cartesian3 计算 Matrix4 实例。这里只指定了第一个旋转参数，第二个平移参数默认值为：Cartesian3.ZERO
      const transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
      //使用目标和变换矩阵设置摄像机位置和方向。
      camera.lookAtTransform(transform, offset);
    }
  });
}

let removeStart;
let removeEnd;

function cameraMoveEvents() {
  removeStart = camera.moveStart.addEventListener(() => {
    ElMessage({
      message: "Camera开始移动",
      duration: 500,
    });
  });
  removeEnd = camera.moveStart.addEventListener(() => {
    ElMessage({
      message: "Camera停止移动",
      duration: 500,
    });
  });
}

let removeChanged;
function cameraChanges() {
  /**
    percentage表示的是相机变换过程中的一个进度值，这个值通常介于0和1之间，具体含义如下：
    当percentage为0时，表示相机变换的开始；当percentage为1时，表示相机变换的结束；如果percentage在0和1之间，则表示相机变换当前所处的进度阶段。
    这个百分比参数可以用来做以下事情：
      1. 动画进度反馈：可以用来显示相机动画的当前进度，为用户提供视觉反馈。
      2. 任务调度：在相机变换过程中，可以根据进度来调度一些任务，例如在变换到一半时开始加载新的数据。
      3. 条件判断：可以用来判断相机变换是否已经完成，或者是否达到了某个特定的进度点，以执行某些特定的操作。
   */
  removeChanged = camera.changed.addEventListener((percentage) => {
    console.log("Camera变换进度值：", percentage);
  });
}

function flyOverLongitude() {
  losAngelesToTokyo();
}

function flyOverLongitudeWithPitch() {
  losAngelesToTokyo(true);
}

function losAngelesToTokyo(adjustPitch) {
  const tokyoOptions = {
    destination: Cesium.Cartesian3.fromDegrees(139.8148, 35.7142, 20000.0),
    orientation: {
      heading: Cesium.Math.toRadians(15.0),
      pitch: Cesium.Math.toRadians(-60),
      roll: 0.0,
    },
    duration: 20,
    //地球上的两点之间总是存在两条路径。此选项强制相​​机选择飞行方向以飞越该经度。
    flyOverLongitude: Cesium.Math.toRadians(60.0),
  };

  const laOptions = {
    destination: Cesium.Cartesian3.fromDegrees(-117.729, 34.457, 10000.0),
    duration: 5,
    orientation: {
      heading: Cesium.Math.toRadians(-15.0),
      pitch: -Cesium.Math.PI_OVER_FOUR,
      roll: 0.0,
    },
    complete: () => {
      setTimeout(() => {
        camera.flyTo(tokyoOptions);
      }, 1000);
    },
  };

  if (adjustPitch) {
    //pitchAdjustHeight属性表示:如果相机飞得比该值高，在飞行过程中调整俯仰角向下看，使得视图范围能一直看到地球。
    tokyoOptions.pitchAdjustHeight = 1000;
    laOptions.pitchAdjustHeight = 1000;
  }

  camera.flyTo(laOptions);
}

function reset() {
  //立即完成当前动作(活动)的过渡
  scene.completeMorph();
  viewer.entities.removeAll();
  scene.primitives.remove(referenceFramePrimitive);
  // flyTo方法会将生成的补间动画添加至scene.tweens集合中
  //参考源码：https://github.com/CesiumGS/cesium/blob/1.124/packages/engine/Source/Scene/Camera.js#L3453
  scene.tweens.removeAll(); //停止所有(正在进行的)补间动画

  if (Cesium.defined(removeStart)) {
    removeStart(); //这里执行返回值函数则会删除此监听器，下同
    removeEnd();

    removeStart = undefined;
    removeEnd = undefined;
  }

  if (Cesium.defined(removeChanged)) {
    removeChanged();
    removeChanged = undefined;
  }

  if (Cesium.defined(removePostUpdate)) {
    removePostUpdate();
    removePostUpdate = undefined;
  }

  /**
   * 上述lookAtTransform或lookAt方法都会锁定目标，即不能通过鼠标来平移场景(Scene)，若要解除则需执行lookAtTransform(Matrix4.IDENTITY)，
   * 然后Camera变为自由模式，即默认状态，这个默认状态的意思如下：
   * > 1. 在默认状态下，摄像机的运动、旋转和缩放是基于世界坐标系的。
   * > 2. 调用 lookAtTransform(Matrix4.IDENTITY) 后，摄像机将以地球为中心，自由地观察或飞行。
   */
  camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

  clock.multiplier = 1.0; //设置Clock.tick()方法为前进多少时间，单位是秒，这里设置为默认值1.0
}

/**
 * 完成当前相机飞行，并立即将相机移动至目的地。
 * 如果没有正在进行的飞行，则此函数不执行任何操作。
 */
function completeFlight() {
  camera.completeFlight();
}

/**
 * 取消当前相机飞行，并将相机保留在其当前位置。
 * 如果没有正在进行的飞行，则此函数不执行任何操作。
 */
function cancelFlight() {
  camera.cancelFlight();
}

function resetFlight() {
  reset();
  camera.flyHome();
}

/**
 * 绘制出中国范围四至，范围可参考下面两个库的定义：
 * https://github.com/wandergis/coordtransform/blob/master/index.js#L144
 */
function drawChinaExtent() {
  if (chinaExtentEntity) {
    viewer.entities.remove(chinaExtentEntity);
  }
  viewer.entities.add({
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(73.66, 3.86, 135.05, 53.55),
      fill: false,
      outline: true,
      outlineColor: Cesium.Color.RED,
    },
  });
}

function visualCameraFrustum() {
  //开启地表透明
  scene.globe.translucency.enabled = true;
  scene.globe.translucency.frontFaceAlpha = 0.5;

  //绘制是椎体
  camera.frustum.near = 200000.0;
  cameraPrimitive = scene.primitives.add(
    new Cesium.DebugCameraPrimitive({
      camera,
      updateOnChange: false,
    })
  );
}

function zoomIn() {
  camera.moveForward(getMoveRate());
}

function zoomOut() {
  camera.moveBackward(getMoveRate());
}

function moveUp() {
  camera.moveUp(getMoveRate());
}

function moveDown() {
  camera.moveDown(getMoveRate());
}

function moveLeft() {
  camera.moveLeft(getMoveRate());
}

function moveRight() {
  camera.moveRight(getMoveRate());
}

function flyHome() {
  camera.flyHome();
}

function getMoveRate() {
  const cameraHeight = scene.globe.ellipsoid.cartesianToCartographic(
    camera.position
  ).height;
  return cameraHeight / 100.0;
}
</script>

<style lang="scss" scoped>
.control {
  position: absolute;
  top: 20px;
  left: 120px;
  .select {
    width: 240px;
    margin-right: 10px;
  }
}

.handle {
  position: absolute;
  bottom: 10px;
  left: 50%;
  width: 600px;
  transform: translateX(-50%);
  z-index: 2;
  text-align: center;

  .el-button {
    margin-bottom: 10px;
  }
}
</style>
