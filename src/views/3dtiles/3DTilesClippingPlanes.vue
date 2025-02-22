<script setup>
/**
 * 示例说明：
 * 添加一个裁剪平面，生成一个平面几何体以可视化该裁剪平面的位置，
 * 同时允许用户通过鼠标交互来动态调整裁剪平面与模型的距离。
 */

//#region --------------------- 定义变量----------------
let viewer, scene, tileset;

let targetY = 0.0;

/**
 * @type {Array<Cesium.Entity>} 裁剪平面实体数组集合
 */
let planeEntities = [];

/**
 * @type {Cesium.ClippingPlane} 选中的裁剪平面
 */
let selectedPlane;
/**
 * @type {Cesium.ClippingPlaneCollection} 裁剪平面集合
 */
let clippingPlanes;

const debugBoundingVolumesDisabled = ref(false);

const form = reactive({
  model: "Instanced",
  debugBoundingVolumesEnabled: false,
  edgeStylingEnabled: true,
});

/**
 * @type {Array} 要加载的模型列表
 */
const models = [
  { value: "Instanced", label: "几何体" },
  { value: "Airplane", label: "飞机" },
];
//#endregion

function viewerCreated(v) {
  viewer = v;
  scene = viewer.scene;
  initInputActions();
  handleChangeModel(form.model);
}

onBeforeUnmount(() => {
  //移除监听器
  if (downHandler) {
    downHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    downHandler = null;
  }
  if (moveHandler) {
    moveHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    moveHandler = null;
  }
  if (upHandler) {
    upHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    upHandler = null;
  }

  reset();
});

//#region --------------------- 方法区域----------------

function initInputActions() {
  //当鼠标按下时选择裁剪平面
  const downHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  downHandler.setInputAction(function (movement) {
    const pickedObject = scene.pick(movement.position);
    if (
      Cesium.defined(pickedObject) &&
      Cesium.defined(pickedObject.id) &&
      Cesium.defined(pickedObject.id.plane)
    ) {
      selectedPlane = pickedObject.id.plane;
      selectedPlane.material = Cesium.Color.WHITE.withAlpha(0.05);
      selectedPlane.outlineColor = Cesium.Color.WHITE;
      scene.screenSpaceCameraController.enableInputs = false;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

  //当鼠标按着移动时更新裁剪平面的位置
  const moveHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  moveHandler.setInputAction(function (movement) {
    if (Cesium.defined(selectedPlane)) {
      const deltaY = movement.startPosition.y - movement.endPosition.y;
      targetY += deltaY;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  //当鼠标抬起时释放裁剪平面
  const upHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  upHandler.setInputAction(function () {
    if (Cesium.defined(selectedPlane)) {
      selectedPlane.material = Cesium.Color.WHITE.withAlpha(0.15);
      selectedPlane.outlineColor = Cesium.Color.WHITE;
      selectedPlane = undefined;
    }

    scene.screenSpaceCameraController.enableInputs = true;
  }, Cesium.ScreenSpaceEventType.LEFT_UP);
}

function handleChangeModel(val) {
  reset();
  switch (val) {
    case "Instanced":
      debugBoundingVolumesDisabled.value = false;
      loadTileset(
        "./SampleData/Cesium3DTiles/Instanced/InstancedOrientation/tileset.json",
        Cesium.Matrix4.fromTranslation(
          new Cesium.Cartesian3(15.0, -58.6, 50.825)
        )
      );
      break;
    case "Airplane":
      debugBoundingVolumesDisabled.value = true;
      loadModel("./SampleData/models/CesiumAir/Cesium_Air.glb");
      break;
    default:
      break;
  }
}

function loadModel(url) {
  clippingPlanes = new Cesium.ClippingPlaneCollection({
    planes: [
      /**
       * Cesium.ClippingPlane(normal,distance)
       * 参数1含义：平面的法线（已归一化）
       * 参数2含义：distance-从原点到平面的最短距离。距离的符号决定了原点位于平面的哪一侧：如果距离为正，则原点在法线方向指向的半空间中；如果距离为负，则原点在法线反方向的半空间中；如果距离为零，则平面通过原点。
       */
      new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 0.0, -1.0), 0.0),
    ],
    //edgeWidth:应用于裁剪对象边缘的高亮宽度（以像素为单位）
    edgeWidth: form.edgeStylingEnabled ? 1.0 : 0.0,
  });

  const position = Cesium.Cartesian3.fromDegrees(
    -123.0744619,
    44.0503706,
    300.0
  );
  const heading = Cesium.Math.toRadians(135.0);
  const pitch = 0.0;
  const roll = 0.0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    hpr
  );
  const entity = viewer.entities.add({
    name: url,
    position,
    orientation,
    model: {
      uri: url,
      scale: 8, //缩放比例，默认值为1.0
      minimumPixelSize: 100.0,
      clippingPlanes, //clippingPlanes属性-指定用于选择性地裁剪模型的裁剪平面集合
    },
  });

  viewer.trackedEntity = entity;

  //根据裁剪平面集合分别添加对应的实体entity
  for (let i = 0; i < clippingPlanes.length; ++i) {
    const plane = clippingPlanes.get(i);
    const planeEntity = viewer.entities.add({
      position,
      plane: {
        dimensions: new Cesium.Cartesian2(300.0, 300.0), //设置平面的宽高
        material: Cesium.Color.WHITE.withAlpha(0.15),
        /**
         * 这里的plane属性作用：获取或设置指定平面法线和距离的平面属性。
         * 第二个参数设置为false，则Cesium需要每帧调用回调函数获取最新值，会增加性能开销，因为 Cesium 需要频繁调用回调函数。
         * 如果属性实际上不常变化，设为 true 会更高效。
         */
        plane: new Cesium.CallbackProperty(
          createPlaneUpdateFunction(plane),
          false
        ),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
      },
    });

    planeEntities.push(planeEntity);
  }
}

/**
 * 动态更新裁剪平面的位置
 * @param {Cesium.ClippingPlane} plane 裁剪平面
 */
function createPlaneUpdateFunction(plane) {
  return function () {
    plane.distance = targetY;
    return plane;
  };
}

async function loadTileset(resource, modelMatrix) {
  clippingPlanes = new Cesium.ClippingPlaneCollection({
    planes: [
      new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 0.0, -1.0), 0.0),
    ],
    edgeWidth: form.edgeStylingEnabled ? 1.0 : 0.0,
  });

  try {
    const url = await Promise.resolve(resource);
    tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
      clippingPlanes: clippingPlanes,
    });

    if (Cesium.defined(modelMatrix)) {
      tileset.modelMatrix = modelMatrix;
    }

    scene.primitives.add(tileset);

    /**
     * Cesium3DTileset.debugShowBoundingVolume-该属性的官方解释如下：
     * 此属性仅用于调试;它未针对生产使用进行优化。
     * 当该属性设置为 true 时，会渲染每个可见瓦片的包围体。
     * 如果瓦片具有内容包围体或为空，则包围体显示为白色；否则，包围体显示为红色。
     * 对于尚未满足屏幕空间误差要求且仍在细化到其子瓦片的瓦片，包围体显示为黄色。
     */
    tileset.debugShowBoundingVolume = form.debugBoundingVolumesEnabled;
    const boundingSphere = tileset.boundingSphere;
    const radius = boundingSphere.radius;

    /**
     * Cesium.HeadingPitchRange:
     * 定义了一个局部坐标系中的航向角（heading angle）、俯仰角（pitch angle）和距离（range）。
     * - 航向角是从局部东方向的旋转，正角度表示向南增加。
     * - 俯仰角是从局部 xy 平面的旋转，正俯仰角表示在平面之上，负俯仰角表示在平面之下。
     * - 距离是从坐标系中心的距离。
     */
    viewer.zoomTo(
      tileset,
      new Cesium.HeadingPitchRange(0.5, -0.2, radius * 4.0)
    );

    /**
     * Cesium.Matrix4.IDENTITY:初始化为单位矩阵的不可变 Matrix4 实例。
     * 这个矩阵是4×4的单位矩阵，而单位矩阵是一个方阵，其主对角线上的元素为 1，其他元素均为 0。
     */
    if (
      !Cesium.Matrix4.equals(tileset.root.transform, Cesium.Matrix4.IDENTITY)
    ) {
      /**
       * 裁剪平面最初被放置在瓦片集的根变换（root transform）位置。
       * 通过应用一个额外的变换矩阵，将裁剪平面的位置调整到以 3D 模型边界球体（bounding sphere）的中心为基准。
       */
      const transformCenter = Cesium.Matrix4.getTranslation(
        tileset.root.transform,
        new Cesium.Cartesian3()
      );
      const transformCartographic =
        Cesium.Cartographic.fromCartesian(transformCenter);
      const boundingSphereCartographic = Cesium.Cartographic.fromCartesian(
        tileset.boundingSphere.center
      );
      const height =
        boundingSphereCartographic.height - transformCartographic.height;
      clippingPlanes.modelMatrix = Cesium.Matrix4.fromTranslation(
        new Cesium.Cartesian3(0.0, 0.0, height)
      );
    }

    for (let i = 0; i < clippingPlanes.length; ++i) {
      const plane = clippingPlanes.get(i);
      const planeEntity = viewer.entities.add({
        position: boundingSphere.center,
        plane: {
          dimensions: new Cesium.Cartesian2(radius * 2.5, radius * 2.5),
          material: Cesium.Color.WHITE.withAlpha(0.15),
          plane: new Cesium.CallbackProperty(
            createPlaneUpdateFunction(plane),
            false
          ),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
        },
      });

      planeEntities.push(planeEntity);
    }
    return tileset;
  } catch (err) {
    ElMessage.error(`tileset数据加载出错: ${err}`);
  }
}

function handleShowBoundingVolue(value) {
  if (Cesium.defined(tileset)) {
    tileset.debugShowBoundingVolume = value;
  }
}

function handleEnabledEdgeStyling(value) {
  const edgeWidth = value ? 1.0 : 0.0;
  clippingPlanes.edgeWidth = edgeWidth;
}

function reset() {
  viewer.entities.removeAll();
  if (Cesium.defined(tileset)) {
    scene.primitives.remove(tileset);
  }

  planeEntities = [];
  targetY = 0.0;
  tileset = undefined;
}
//#endregion
</script>

<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="auto">
      <el-form-item label="模型">
        <el-select
          v-model="form.model"
          placeholder="请选择模型"
          @change="handleChangeModel">
          <el-option
            v-for="item in models"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <div>
        <span style="margin-left: 42px"></span>
        <el-checkbox
          v-model="form.debugBoundingVolumesEnabled"
          label="显示包围体"
          size="large"
          :disabled="debugBoundingVolumesDisabled"
          @change="handleShowBoundingVolue" />
        <el-checkbox
          v-model="form.edgeStylingEnabled"
          label="启用边缘样式"
          size="large"
          @change="handleEnabledEdgeStyling" />
      </div>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.panel {
  position: absolute;
  width: 300px;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  padding: 10px;
  opacity: 0.96;
  box-shadow: rgba(195, 191, 188, 0.7) 0px 1px 2px 0px,
    rgba(195, 191, 188, 0.85) 0px 2px 4px 2px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
