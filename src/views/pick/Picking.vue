<template>
  <div class="container">
    <CesiumMap />
    <div class="handle">
      <el-button @click="showRealTimeLngLat">
        鼠标悬停时(实时)显示地图的(经纬度)位置
      </el-button>
      <br />
      <el-button @click="pickEntity">拾取Entity</el-button>
      <br />
      <el-button @click="drillDownPick">
        Drill-Down(逐层) Picking(拾取)
      </el-button>
      <br />
      <el-button @click="pickGlbModel">拾取(模型)位置(经纬度及高度)</el-button>
    </div>
  </div>
</template>

<script setup>
import useCSViewerStore from "@/stores/csViewer.js";
import { toFixed } from "@/utils/math";
import CESIUM_LOGO_PNG from "@/assets/images/Cesium_Logo_overlay.png";

//#region --------------------- 定义变量----------------
const cvs = useCSViewerStore();

let viewer, scene, handler;
//#endregion

onMounted(() => {
  viewer = cvs.viewer;
  scene = viewer.scene;
  scene.globe.depthTestAgainstTerrain = false; //关闭深度测试
  if (scene.pickPositionSupported) {
    ElMessage.success('当前浏览器支持鼠标拾取位置')
  } else {
    ElMessage.warning('当前浏览器不支持鼠标拾取位置')
  }
});

onBeforeUnmount(() => {
  reset();
});

//#region --------------------- 方法区域----------------
/**
 * 显示实时经纬度
 */
function showRealTimeLngLat() {
  reset();
  const entity = viewer.entities.add({
    label: {
      show: false,
      showBackground: true,
      font: "14px monospace",
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(15, 0),
    },
  });

  handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction(function (movement) {
    /**
     * 如果选取了椭球体或地图，则返回世界坐标中椭球体或地图表面上的点。如果未选择椭球体或地图，则返回未定义。
     * https://cesium.com/learn/cesiumjs/ref-doc/Camera.html#pickEllipsoid
     */
    const cartesian = viewer.camera.pickEllipsoid(
      movement.endPosition,
      scene.globe.ellipsoid
    );
    if (cartesian) {
      //将笛卡尔坐标系转为经纬度，此时单位为弧度，下面还需要转换为度
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const longitudeString = cartographic.longitude
        ? toFixed(Cesium.Math.toDegrees(cartographic.longitude), 2)
        : "";
      const latitudeString = cartographic.latitude
        ? toFixed(Cesium.Math.toDegrees(cartographic.latitude), 2)
        : "";
      entity.position = cartesian;
      entity.label.show = true;
      entity.label.text =
        `经度: ${longitudeString}\u00B0` + `\n纬度: ${latitudeString}\u00B0`;
    } else {
      entity.label.show = false;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

/**
 * 拾取billboard实体
 */
function pickEntity() {
  reset();
  const entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.2, 35.13),
    billboard: {
      image: CESIUM_LOGO_PNG,
    },
  });

  // 如果鼠标在广告牌上，则更改其大小和颜色
  handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction(function (movement) {
    const pickedObject = scene.pick(movement.endPosition);
    if (Cesium.defined(pickedObject) && pickedObject.id === entity) {
      entity.billboard.scale = 2.0;
      entity.billboard.color = Cesium.Color.YELLOW;
    } else {
      entity.billboard.scale = 1.0;
      entity.billboard.color = Cesium.Color.WHITE;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

//创建一个存储拾取实体的集合
const pickedEntities = new Cesium.EntityCollection();
//拾取实体的颜色为半透明黄色
const pickColor = Cesium.Color.YELLOW.withAlpha(0.5);
/**
 * 逐层拾取，返回所有被点击位置的对象（按从顶层到底层的顺序）
 */
function drillDownPick() {
  reset();

  const redEntity = viewer.entities.add({
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        104.2, 35.13, 114.2, 35.13, 114.2, 45.13, 104.2, 45.13,
      ]),
      height: 0,
    },
  });

  makeProperty(redEntity, Cesium.Color.RED.withAlpha(0.5));

  const blueEntity = viewer.entities.add({
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        99.2, 39.13, 111.2, 39.13, 111.2, 45.13, 99.2, 45.13,
      ]),
      height: 0,
    },
  });
  makeProperty(blueEntity, Cesium.Color.BLUE.withAlpha(0.5));

  const greenEntity = viewer.entities.add({
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray([
        107.2, 41.13, 119.2, 41.13, 119.2, 35.13, 107.2, 35.13,
      ]),
      height: 0,
    },
  });
  makeProperty(greenEntity, Cesium.Color.GREEN.withAlpha(0.5));
  //将鼠标所在的基元移动到顶部
  handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction(function (movement) {
    // 获取鼠标位置上所有基元（primitives）的数组
    const pickedObjects = scene.drillPick(movement.endPosition);
    if (Cesium.defined(pickedObjects)) {
      pickedEntities.removeAll();
      for (let i = 0; i < pickedObjects.length; ++i) {
        const entity = pickedObjects[i].id;
        pickedEntities.add(entity);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

function makeProperty(entity, color) {
  /**
   * https://cesium.com/learn/cesiumjs/ref-doc/CallbackProperty.html?classFilter=call#.Callback
   * time(JulianDate类型)：检索值的时间。如果省略，则使用当前系统时间。
   * result(object类型)：要将值存储到的对象。如果省略，则函数必须创建并返回一个新实例。
   */
  const colorProperty = new Cesium.CallbackProperty((time, result) => {
    if (pickedEntities.contains(entity)) {
      return pickColor.clone(result);
    }
    return color.clone(result);
  }, false);
  entity.polygon.material = new Cesium.ColorMaterialProperty(colorProperty);
}

/**
 * 拾取glb模型，并可以测量模型的高度
 */
function pickGlbModel() {
  reset();
  const modelEntity = viewer.entities.add({
    name: "牛奶卡车",
    position: Cesium.Cartesian3.fromDegrees(104.2, 35.13),
    model: {
      uri: "./data/CesiumMilkTruck/CesiumMilkTruck.glb",
    },
  });
  viewer.zoomTo(modelEntity);

  const labelEntity = viewer.entities.add({
    label: {
      show: false,
      showBackground: true,
      font: "14px monospace",
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(15, 0),
    },
  });

  handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  handler.setInputAction(function (movement) {
    let foundPosition = false;

    const scene = viewer.scene;
    // console.log("scene.mode", scene.mode);
    /**
     * 当当前的场景模式不是转换模式，则可以去拾取位置。
     * SceneMode的值如下：
     * 0: MORPHING，这里翻译为变形中（这里范围为过渡中更好理解），如2d模式到3d模式或3d模式到2d模式的过渡状态
     * 1: COLUMBUS_VIEW，直译为哥伦布视图，类似于2.5d的视角，结合了2d地图直观性和3d场景的深度感，用户可以再地球表面上方倾斜视角，观察地形、建筑物，但不能完全自由旋转。
     * 2: SCENE2D，2维模式
     * 3: SCENE3D，3维模式
     * 参考：https://cesium.com/learn/cesiumjs/ref-doc/global.html#SceneMode
     */
    if (scene.mode !== Cesium.SceneMode.MORPHING) {
      if (scene.pickPositionSupported) {
        const cartesian = viewer.scene.pickPosition(movement.endPosition);

        if (Cesium.defined(cartesian)) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

          const longitudeString = cartographic.longitude
            ? toFixed(Cesium.Math.toDegrees(cartographic.longitude), 2)
            : "";
          const latitudeString = cartographic.latitude
            ? toFixed(Cesium.Math.toDegrees(cartographic.latitude), 2)
            : "";
          const heightString = cartographic.height
            ? toFixed(cartographic.height, 2)
            : "";

          labelEntity.position = cartesian;
          labelEntity.label.show = true;
          labelEntity.label.text =
            `经度: ${longitudeString}\u00B0` +
            `\n纬度: ${latitudeString}\u00B0` +
            `\n海拔: ${heightString}m`;

          //指定眼睛偏移的Cartesian3属性
          labelEntity.label.eyeOffset = new Cesium.Cartesian3(
            0.0,
            0.0,
            -cartographic.height *
              (scene.mode === Cesium.SceneMode.SCENE2D ? 1.5 : 1.0)
          );

          foundPosition = true;
        }
      }
    }

    if (!foundPosition) {
      labelEntity.label.show = false;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

function reset() {
  viewer.camera.flyHome(0);
  viewer.entities.removeAll();
  //destroy()：删除此对象持有的侦听器。
  handler = handler && handler.destroy();
}

//#endregion
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  height: 100%;
  overflow: hidden;

  .handle {
    position: absolute;
    right: 10px;
    top: 10px;
    text-align: right;

    .el-button {
      margin-right: 0;
      margin-bottom: 12px;
    }
  }
}
</style>
