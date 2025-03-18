<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="auto">
      <el-form-item label="右键点击行为">
        <el-radio-group v-model="form.rightClickAction">
          <el-radio value="annotate">注释</el-radio>
          <el-radio value="printMetadata">打印元数据</el-radio>
          <el-radio value="zoomToFeature">缩放至要素</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="中键点击行为">
        <el-radio-group v-model="form.middleClickAction">
          <el-radio value="hideFeature">隐藏要素</el-radio>
        </el-radio-group>
      </el-form-item>
      <div style="text-align: right">
        <el-button
          size="small"
          type="primary"
          @click="handleRecovery"
          :disabled="!hiddenFeatures.length">
          恢复显示隐藏要素
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { addWorldTerrain, verifyTerrain } from "@/utils/utils.js";
import { toFixed } from "@/utils/math.js";

//#region --------------------- 定义变量----------------
let viewer, scene, annotations, handler, tileset;

let style = new Cesium.Cesium3DTileStyle({
  meta: {
    description: "'建筑物 ${BIN} 高度为 ${Height}。'",
  },
});

const initialPosition = Cesium.Cartesian3.fromDegrees(
  -74.01881302800248,
  40.69114333714821,
  753
);
const initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
  21.27879878293835,
  -21.34390550872461,
  0.0716951918898415
);

const form = reactive({
  rightClickAction: "annotate",
  middleClickAction: "hideFeature",
});

const hiddenFeatures = ref([]);
//#endregion

function viewerCreated(v) {
  viewer = v;
  handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  scene = viewer.scene;
  scene.globe.depthTestAgainstTerrain = true;
  /**
   * LabelCellection：可渲染的标签集合。每个标签可以有不同的字体、颜色、比例等。
   */
  annotations = scene.primitives.add(new Cesium.LabelCollection());
  if (!scene.pickPositionSupported) {
    ElMessage.error("此浏览器不支持pickPosition。");
  }
  addWorldTerrain(viewer);
  // verifyTerrain(viewer);

  scene.camera.setView({
    destination: initialPosition,
    orientation: initialOrientation,
    endTransform: Cesium.Matrix4.IDENTITY,
  });

  addNYCBuildings();
  initEvents();
}

//#region --------------------- 方法区域----------------
/**
 * 加载纽约市中心建筑物瓦片集
 */
async function addNYCBuildings() {
  try {
    tileset = await Cesium.Cesium3DTileset.fromIonAssetId(75343);
    scene.primitives.add(tileset);
    tileset.style = style;
  } catch (error) {
    ElMessage.error(`NYC建筑物数据加载出错: ${err}`);
  }
}

function initEvents() {
  //鼠标右键
  handler.setInputAction(function (movement) {
    const feature = scene.pick(movement.position);
    if (!Cesium.defined(feature)) {
      return;
    }

    const action = form.rightClickAction;
    if (action === "annotate") {
      annotate(movement, feature);
    } else if (action === "printMetadata") {
      printProperties(movement, feature);
    } else if (action === "zoomToFeature") {
      zoom(movement, feature);
    }
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  //鼠标中键
  handler.setInputAction(function (movement) {
    const feature = scene.pick(movement.position);
    if (!Cesium.defined(feature)) {
      return;
    }
    if (form.middleClickAction === "hideFeature") {
      feature.show = false;
      hiddenFeatures.value.push(feature);
    }
  }, Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
}

function handleRecovery() {
  if (hiddenFeatures.value.length) {
    hiddenFeatures.value.forEach((f) => (f.show = true));
    hiddenFeatures.value = []; //清空数组
  }
}

/**
 *
 * 显示建筑物高度信息
 */
function annotate(movement, feature) {
  if (scene.pickPositionSupported) {
    const cartesian = scene.pickPosition(movement.position);
    if (Cesium.defined(cartesian)) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const height = `${toFixed(cartographic.height, 2)} m`;

      annotations.add({
        position: cartesian,
        text: height,
        showBackground: true,
        font: "14px monospace",
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    }
  }
}

/**
 * 打印点击要素的元数据信息
 */
function printProperties(movement, feature) {
  let str = "Properties:";
  const propertyIds = feature.getPropertyIds();
  const length = propertyIds.length;
  for (let i = 0; i < length; ++i) {
    const propertyId = propertyIds[i];
    str += ` ${propertyId}: ${feature.getProperty(propertyId)}`;
  }
  str += `Description : ${style.meta.description.evaluate(feature)}`;
  ElMessage.success(str);
}

/**
 * 缩放至点击要素
 */
function zoom(movement, feature) {
  //1.从要素中获取经纬度和高度
  const longitude = Cesium.Math.toRadians(feature.getProperty("Longitude"));
  const latitude = Cesium.Math.toRadians(feature.getProperty("Latitude"));
  const height = feature.getProperty("Height");

  /**
   * 创建一个Cartographic对象，使用经度、纬度，高度乘以0.5作为高度参数
   * 即测绘当中的大地坐标：大地经度L、大地纬度B和大地高H为此坐标系的3个坐标分量
   */
  const positionCartographic = new Cesium.Cartographic(
    longitude,
    latitude,
    height * 0.5
  );
  //2.将上述大地坐标转为笛卡尔坐标（空间直角坐标系）
  const position =
    scene.globe.ellipsoid.cartographicToCartesian(positionCartographic);
  //3.获取相机的heading(方位角)和pitch（俯仰角）
  const camera = scene.camera;
  const heading = camera.heading;
  const pitch = camera.pitch;

  //4.根据当前视角的方向计算出一个偏移量，以便相机移动到合适的位置来观察目标点
  const offset = offsetFromHeadingPitchRange(heading, pitch, height * 2.0);

  /**
   * 5.坐标系转换：创建一个变换矩阵transform，计算从ENU坐标系转换为全球通用坐标系的转换矩阵
   * ENU，全称为：East north up coordinate，即东北天坐标系，参考：
   * https://en.wikipedia.org/wiki/Local_tangent_plane_coordinates#Local_east,_north,_up_(ENU)_coordinates
   * 
   * 这里是在当前建筑物高度一半的位置建立一个东北天局部坐标系
   */
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  //计算矩阵与 Cartesian3 的乘积,得到最终的position坐标(即一个Cartesian3)
  Cesium.Matrix4.multiplyByPoint(transform, offset, position);

  // 6.执行飞行动画
  camera.flyTo({
    destination: position,
    orientation: {
      heading: heading,
      pitch: pitch,
    },
    //缓动函数即用来产生动画效果
    easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
  });
}

function offsetFromHeadingPitchRange(heading, pitch, range) {
  /**
   * Math.clamp(value, min, max):将一个值约束在两个值之间
   * 5-1.这里将俯仰角约束在-π/2和π/2之间，确保俯仰角不超过垂直方向
   */
  pitch = Cesium.Math.clamp(
    pitch,
    -Cesium.Math.PI_OVER_TWO,
    Cesium.Math.PI_OVER_TWO
  );
  /**
   * Math.zeroToTwoPi(angle):生成一个在 0 <= 角度 <= 2π范围内的角度，该角度与提供的角度等价。
   * 5-2.然后将heading调整为零到2π的范围，并减去π/2，heading减去π/2是为了对齐东方向，与Cesium本地坐标系一致。
   * 因为在Cesium中，heading的定义是相对于北方向顺时针的角度
   */
  heading = Cesium.Math.zeroToTwoPi(heading) - Cesium.Math.PI_OVER_TWO;

  /**
   * Quaternion.fromAxisAngle(axis, angle, result):
   *  - axis:旋转轴
   *  - angle:旋转的弧度角
   *  - result:存储结果的对象（可选参数）
   * 5-3.如下绕y轴选装-pitch
   * 注释：Quaternion是一个四元数向量（四维坐标），形式为：(x, y, z, w)
   * 在数学上，四元数的形式为：q=w+xi+yj+zk，其中：w 是实部（标量部分），
   * x,y,z 是虚部（矢量部分），对应三维空间的三个轴。
   */
  const pitchQuat = Cesium.Quaternion.fromAxisAngle(
    Cesium.Cartesian3.UNIT_Y,
    -pitch
  );

  /**
   * 5-4.绕z轴旋转-heading
   */
  const headingQuat = Cesium.Quaternion.fromAxisAngle(
    Cesium.Cartesian3.UNIT_Z,
    -heading
  );

  /**
   * Quaternion.multiply(left, right, result)
   * 5-5.计算两个四元数的乘积，即合并旋转
   */
  const rotQuat = Cesium.Quaternion.multiply(
    headingQuat,
    pitchQuat,
    headingQuat
  );
  /**
   * Matrix3.fromQuaternion(quaternion, result):
   * 5-6.计算从提供的四元数得到的 3x3 旋转矩阵
   */
  const rotMatrix = Cesium.Matrix3.fromQuaternion(rotQuat);

  //5-7将单位向量UNIT_X（东方向）应用旋转矩阵
  const offset = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_X);
  /**
   * Matrix3.multiplyByVector(matrix, cartesian, result)
   * 计算矩阵和列向量的乘积
   */
  Cesium.Matrix3.multiplyByVector(rotMatrix, offset, offset);
  //5-8.取反是要远离目标点，并乘以range生成最终的偏移向量
  Cesium.Cartesian3.negate(offset, offset);
  /**
   * Cartesian3.multiplyByScalar(cartesian, scalar, result):将提供的笛卡尔分量与提供的标量相乘
   * - cartesian:待缩放的笛卡尔坐标
   * - scalar：要与之相乘的标量，即缩放比例
   * - result:存储结果的对象。
   */
  Cesium.Cartesian3.multiplyByScalar(offset, range, offset);
  return offset;
}
//#endregion
</script>

<style lang="scss" scoped>
.panel {
  width: 220px;
  padding: 10px;
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  opacity: 0.96;
  overflow: hidden auto;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
