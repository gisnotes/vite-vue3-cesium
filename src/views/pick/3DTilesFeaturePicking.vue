<!-- 3D Tiles数据要素拾取 -->
<template>
  <div class="container">
    <CesiumMap />
    <!-- 悬停窗口 -->
    <div class="hover" ref="hoverRef">
      <div class="title">建筑物ID-{{ bin }}</div>
      <el-divider />
      <div class="content">
        <div>经度：{{ longitude }}</div>
        <div>纬度：{{ latitude }}</div>
      </div>
    </div>
    <!-- 属性弹窗 -->
    <Popup :title :yOffset :position @close="closePopup">
      <el-descriptions class="margin-top" :column="1" :size="'small'" border>
        <el-descriptions-item label="建筑物ID">
          {{ bin }}
        </el-descriptions-item>
        <el-descriptions-item label="信息技术和电信部ID">
          {{ doittId }}
        </el-descriptions-item>
        <el-descriptions-item label="经度">
          {{ longitude }}
        </el-descriptions-item>
        <el-descriptions-item label="纬度">
          {{ latitude }}
        </el-descriptions-item>
        <el-descriptions-item label="建筑物离地面高度">
          {{ height }}
        </el-descriptions-item>
        <el-descriptions-item label="地面高程">
          {{ terrainHeight }}
        </el-descriptions-item>
        <el-descriptions-item label="建筑物年份">
          {{ year }}
        </el-descriptions-item>
        <el-descriptions-item label="所有者类型">
          {{ majorityOwnershipType }}
        </el-descriptions-item>
      </el-descriptions>
    </Popup>
  </div>
</template>

<script setup>
/**
 * 本示例说明：在加载的 3D Tiles 数据中，通过鼠标悬停或选择来拾取要素的简单演示。
 * 建筑数据由 NYC（NewYork City） OpenData 门户提供：http://www1.nyc.gov/site/doitt/initiatives/3d-building.page
 */

import useCSViewerStore from "@/stores/csViewer.js";

//#region --------------------- 定义变量----------------
const cvs = useCSViewerStore();

let viewer, clickHandler;
const hoverRef = ref();
//要素属性
const bin = ref("");
const doittId = ref("");
const longitude = ref("");
const latitude = ref("");
const height = ref("");
const terrainHeight = ref("");
const year = ref("");
const majorityOwnershipType = ref("");

//属性弹窗
let title = ref("弹窗标题");
let yOffset = ref(12);
let position = ref({});

//当前所选要素的信息（定义悬停选择的要素）
const selected = {
  feature: undefined,
  originalColor: new Cesium.Color(),
};

//一个实体对象，它将保存有关当前所选要素的信息，以便显示属性弹窗
const selectedEntity = new Cesium.Entity();

//#endregion

onMounted(() => {
  viewer = cvs.viewer;
  addTerrain();
  // verifyTerrain();//该方法验证完可以注释掉
  setInitViewPos();
  addTilesetData();
  init();
});

//#region --------------------- 方法区域----------------
async function addTerrain() {
  //参考api文档给出的示例
  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(
    3956,
    {
      requestVertexNormals: true,
    }
  );
}

/**
 * 定位至下面这个地点验证加载的地形
 */
function verifyTerrain() {
  const center = Cesium.Cartesian3.fromRadians(
    2.4213211833389243,
    0.6171926869414084,
    3626.0426275055174
  );
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  viewer.scene.camera.lookAtTransform(
    transform,
    new Cesium.HeadingPitchRange(0, -Math.PI / 4, 2900)
  );
  //解除相机锁定
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}

function setInitViewPos() {
  viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      -74.01881302800248,
      40.69114333714821,
      753
    ),
    orientation: new Cesium.HeadingPitchRoll.fromDegrees(
      21.27879878293835,
      -21.34390550872461,
      0.0716951918898415
    ),
    endTransform: Cesium.Matrix4.IDENTITY,
  });
}

/**
 * 加载建筑物 3D tiles 数据
 */
async function addTilesetData() {
  try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(75343);
    viewer.scene.primitives.add(tileset);
  } catch (err) {
    ElMessage.error(`tileset数据加载出错: ${err}`);
  }
}

function init() {
  clickHandler = viewer.screenSpaceEventHandler.getInputAction(
    Cesium.ScreenSpaceEventType.LEFT_CLICK
  );

  /**
   * 检查当前场景是否支持轮廓（silhouette）效果
   * 若支持，鼠标悬停于要素上方时，轮廓显示为蓝色，鼠标单击要素时，轮廓显示为绿色；
   * 否则，鼠标悬停于要素上方时，轮廓显示为黄色，鼠标单击要素时，轮廓显示为绿色。
   */
  if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewer.scene)) {
    ElMessage({
      message: "当前场景支持轮廓效果",
      type: "success",
    });
    //创建一个检测轮廓的后处理阶段
    const silhouetteBlue =
      Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouetteBlue.uniforms.color = Cesium.Color.BLUE; //高亮轮廓显示的颜色，默认值为Color.Black
    silhouetteBlue.uniforms.length = 0.01; //边缘的长度（以像素为单位）。默认值为 0.5
    silhouetteBlue.selected = [];

    const silhouetteGreen =
      Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouetteGreen.uniforms.color = Cesium.Color.LIME; //酸橙绿色
    silhouetteGreen.uniforms.length = 0.01;
    silhouetteGreen.selected = [];

    //创建一个应用轮廓效果的后处理阶段(复合的后处理阶段)
    const postProcessStageComposite =
      Cesium.PostProcessStageLibrary.createSilhouetteStage([
        silhouetteBlue,
        silhouetteGreen,
      ]);
    //将后期处理阶段添加到集合中
    viewer.scene.postProcessStages.add(postProcessStageComposite);

    //在鼠标悬停于要素上时将其轮廓颜色设置为蓝色
    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      //若当前要素之前被高亮了，取消其高亮显示
      silhouetteBlue.selected = [];

      const pickedFeature = viewer.scene.pick(movement.endPosition);

      if (!Cesium.defined(pickedFeature)) {
        hoverRef.value.style.left = "-400px";
        hoverRef.value.style.bottom = "-200px";
        return;
      }

      //TODO:更新悬浮窗信息
      // updateHoverWindow(pickedFeature, movement.endPosition);

      if (pickedFeature !== selected.feature) {
        silhouetteBlue.selected = [pickedFeature];
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    //在鼠标点击要素时将其轮廓颜色设置为绿色
    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      silhouetteGreen.selected = [];
      const pickedFeature = viewer.scene.pick(movement.position);
      if (!Cesium.defined(pickedFeature)) {
        clickHandler(movement);
        return;
      }
      //TODO:更新弹窗位置和信息
      updatePopup(pickedFeature, movement);
      //若单击选择的对象已被选择了，则直接返回
      if (silhouetteGreen.selected[0] === pickedFeature) {
        return;
      }
      //我们先获取悬停高亮的要素
      const highlightedFeature = silhouetteBlue.selected[0];
      if (pickedFeature === highlightedFeature) {
        silhouetteBlue.selected = []; //若点击的要素和悬停的要素相同，则取消悬停高亮的效果
      }
      //添加点击高亮的效果
      silhouetteGreen.selected = [pickedFeature];
      //设置要显示选择指示器的对象实例，这里我们不用选择指示器的话可以省略这行代码
      // viewer.selectedEntity = selectedEntity;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  } else {
    ElMessage({
      message: "当前场景不支持轮廓效果",
      type: "warning",
    });
    //若不支持上述轮廓效果，则直接更改要素颜色
    const highlighted = {
      feature: undefined,
      originalColor: new Cesium.Color(),
    };

    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      if (Cesium.defined(highlighted.feature)) {
        highlighted.feature.color = highlighted.originalColor;
        highlighted.feature = undefined;
      }
      const pickedFeature = viewer.scene.pick(movement.endPosition);
      if (!Cesium.defined(pickedFeature)) {
        return;
      }
      //TODO:更新悬浮窗信息
      // updateHoverWindow(pickedFeature, movement.endPosition);

      if (pickedFeature !== selected.feature) {
        highlighted.feature = pickedFeature;
        //将选择的要素本身的颜色存储在高亮要素的originalColor，以便鼠标不在该要素悬停时恢复原有的颜色
        Cesium.Color.clone(pickedFeature.color, highlighted.originalColor);
        pickedFeature.color = Cesium.Color.YELLOW; //将要素颜色改为黄色
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      if (Cesium.defined(selected.feature)) {
        selected.feature.color = selected.originalColor;
        selected.feature = undefined;
      }

      const pickedFeature = viewer.scene.pick(movement.position);
      if (!Cesium.defined(pickedFeature)) {
        clickHandler(movement);
        return;
      }

      //TODO:更新属性弹窗
      updatePopup(pickedFeature, movement);

      if (selected.feature === pickedFeature) {
        return;
      }

      selected.feature = pickedFeature;
      if (pickedFeature === highlighted.feature) {
        Cesium.Color.clone(highlighted.originalColor, selected.originalColor);
        highlighted.feature = undefined;
      } else {
        Cesium.Color.clone(pickedFeature.color, selected.originalColor);
      }
      pickedFeature.color = Cesium.Color.LIME;
      //设置要显示选择指示器的对象实例，这里我们不用选择指示器的话可以省略这行代码
      // viewer.selectedEntity = selectedEntity;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }
}

function updateHoverWindow(pickedFeature, position) {
  if (!Cesium.defined(pickedFeature)) {
    return;
  }
  // console.log("pickedFeature: ", pickedFeature);
  /**
   * 可以通过Cesium3DTileFeature类的getProperty和setProperty方法获取或修改属性值。
   * 参考Cesium Ion中的数据属性说明：
   *    - BIN：NYC（纽约市） DoB (Department of Buildings) ID
   *    - DOITT_ID： 纽约市 DoITT（Department of Information Technology and Telecommunications，信息技术和电信部）ID
   *    - Longitude：经度
   *    - Latitude：纬度
   *    - Height：建筑物离地面高度
   *    - TerrainHeight：建筑物底部相对于椭球体的高程，就是地面高程
   *    - Year：建筑建造的年份
   *    - Majority_Ownership_Type：所有者类型
   */
  if (pickedFeature instanceof Cesium.Cesium3DTileFeature) {
    // const propertyIds = pickedFeature.getPropertyIds();
    // const length = propertyIds.length;
    // for (let i = 0; i < length; ++i) {
    //   const propertyId = propertyIds[i];
    //   console.log(`${propertyId}: ${pickedFeature.getProperty(propertyId)}`);
    // }

    bin.value = pickedFeature.getProperty("BIN");
    longitude.value = pickedFeature.getProperty("Longitude");
    latitude.value = pickedFeature.getProperty("Latitude");
    hoverRef.value.style.bottom = `${
      viewer.canvas.clientHeight - position.y
    }px`;
    hoverRef.value.style.left = `${position.x}px`;
  }
}

function updatePopup(pickedFeature, e) {
  const cartesianPos = viewer.scene.pickPosition(e.position);
  if (pickedFeature instanceof Cesium.Cesium3DTileFeature) {
    bin.value = pickedFeature.getProperty("BIN");
    doittId.value = pickedFeature.getProperty("DOITT_ID");
    longitude.value = pickedFeature.getProperty("Longitude");
    latitude.value = pickedFeature.getProperty("Latitude");
    height.value = pickedFeature.getProperty("Height");
    terrainHeight.value = pickedFeature.getProperty("TerrainHeight");
    year.value = pickedFeature.getProperty("Year");
    majorityOwnershipType.value = pickedFeature.getProperty(
      "Majority_Ownership_Type"
    );
    title.value = "建筑物ID-" + bin.value;
    position.value = cartesianPos;
  }
}

function closePopup() {
  position.value = {};
}
//#endregion
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  height: 100%;
  overflow: hidden;

  .hover {
    position: absolute;
    left: -400px;
    bottom: -200px;
    background-color: black;
    padding: 4px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 3;
    display: flex;
    flex-direction: column;
    color: white;
    width: 300px;

    .title {
      font-size: 16px;
      font-weight: bold;
    }

    .el-divider--horizontal {
      margin: 10px 0;
    }

    .content {
      padding: 5px;
    }
  }
}
</style>
