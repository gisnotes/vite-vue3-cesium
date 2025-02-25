<script setup>
/**
 * 示例介绍：使用 3D Tiles 样式设置，根据材质分配颜色或找出所有办公楼。
 * 关于下述样式采用的是3D Tiles Styling language来书写的，具体参考：
 * 1. https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileStyle.html?classFilter=Cesium3DTileStyle
 * 2. https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling
 * 
 * 示例改造：左键单击建筑物弹窗，右键单击建筑物选择中心点位置
 */

//#region --------------------- 定义变量----------------
let viewer, handler, osmBuildingsTileset;

const style = ref("Color By Building Material");

//属性弹窗
const title = ref("弹窗标题");
const yOffset = 12;
const position = ref({});

const building = reactive({});

/**
 * @type {Array} 要加载的模型列表
 */
const styles = [
  { value: "Color By Building Material", label: "按建筑物材质着色" },
  {
    value: "Color By Distance To Selected Location",
    label: "按到选中位置的距离着色",
  },
  {
    value: "Highlight Residential Buildings",
    label: "高亮住宅建筑",
  },
  { value: "Show Office Buildings Only", label: "仅显示办公楼" },
  {
    value: "Show Apartment Buildings Only",
    label: "仅显示公寓楼",
  },
];

//#endregion

async function viewerCreated(v) {
  viewer = v;
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  initData();
  initCamera();
  initEvt();
}

onBeforeUnmount(() => {
  //移除监听器
  if (handler) {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    handler.destroy();
    handler = null;
  }
});

//#region --------------------- 方法区域----------------
async function initData() {
  try {
    //添加WorldTerrain
    const terrainProviderPromise =
      await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
        requestVertexNormals: true,
      });
    //参考：https://cesium.com/learn/cesiumjs/ref-doc/CesiumTerrainProvider.html#.fromIonAssetId
    viewer.terrainProvider = terrainProviderPromise;
    //添加osm buildings数据
    osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(osmBuildingsTileset);
    //执行下拉框默认选项
    handleChangeStyle(style.value);
  } catch (err) {
    ElMessage.error(`数据加载出错: ${err}`);
  }
}

function initCamera() {
  /**
   * 目的地是位于华盛顿州西雅图的安妮女王社区的太空针塔。
   */
  viewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-122.3472, 47.598, 370),
    orientation: {
      heading: Cesium.Math.toRadians(10),
      pitch: Cesium.Math.toRadians(-10),
    },
  });
}

function initEvt() {
  handler.setInputAction(function (movement) {
    const pickedBuilding = viewer.scene.pick(movement.position);
    if (!Cesium.defined(pickedBuilding)) {
      return;
    }
    updatePopup(pickedBuilding, movement);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

/**
 * 处理拾取的要素属性
 *
 * @param {Cesium.Cesium3DTileFeature} feature 拾取的要素
 * @param {Cesium.ScreenSpaceEventHandler.PositionedEvent} e 在屏幕上的单个位置发生的事件，它的属性position是一个Cartesian2对象
 */
function updatePopup(feature, e) {
  const cartesianPos = viewer.scene.pickPosition(e.position);
  if (feature instanceof Cesium.Cesium3DTileFeature) {
    building.name = feature.getProperty("name");
    building.buildingType = feature.getProperty("building");
    building.startDate = feature.getProperty("start_date");
    building.estimatedHeight = feature.getProperty("cesium#estimatedHeight");
    building.buildingLeves = feature.getProperty("building:levels");
    title.value = building.name;
    position.value = cartesianPos;
  }
}

function handleChangeStyle(value) {
  switch (value) {
    case "Color By Building Material":
      reset();
      colorByMaterial();
      break;
    case "Color By Distance To Selected Location":
      //默认以位于华盛顿州西雅图的安妮女王社区的太空针塔为中心
      colorByDistanceToCoordinate(-122.34931, 47.62051);
      handler.setInputAction(function (movement) {
        viewer.selectedEntity = undefined;
        closePopup();
        const pickedBuilding = viewer.scene.pick(movement.position);
        if (pickedBuilding) {
          const pickedLatitude = pickedBuilding.getProperty("cesium#latitude");
          const pickedLongitude =
            pickedBuilding.getProperty("cesium#longitude");
          colorByDistanceToCoordinate(pickedLongitude, pickedLatitude);
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      break;
    case "Highlight Residential Buildings":
      reset();
      highlightAllResidentialBuildings();
      break;
    case "Show Office Buildings Only":
      reset();
      showByBuildingType("office");
      break;
    case "Show Apartment Buildings Only":
      reset();
      showByBuildingType("apartments");
      break;
    default:
      break;
  }
}

function colorByMaterial() {
  osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
    defines: {
      material: "${feature['building:material']}",
    },
    color: {
      conditions: [
        ["${material} === null", "color('white')"],
        ["${material} === 'glass'", "color('skyblue', 0.5)"],
        ["${material} === 'concrete'", "color('grey')"],
        ["${material} === 'brick'", "color('indianred')"],
        ["${material} === 'stone'", "color('lightslategrey')"],
        ["${material} === 'metal'", "color('lightgrey')"],
        ["${material} === 'steel'", "color('lightsteelblue')"],
        ["true", "color('white')"], // This is the else case
      ],
    },
  });
}

/**
 * 根据与选定中心位置的距离为建筑物着色
 * @param {number} pickedLongitude 选定中心的经度
 * @param {number} pickedLatitude 选定中心的纬度
 */
function colorByDistanceToCoordinate(pickedLongitude, pickedLatitude) {
  osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
    defines: {
      distance: `distance(vec2(\${feature['cesium#longitude']}, \${feature['cesium#latitude']}), vec2(${pickedLongitude},${pickedLatitude}))`,
    },
    color: {
      conditions: [
        ["${distance} > 0.014", "color('blue')"],
        ["${distance} > 0.010", "color('green')"],
        ["${distance} > 0.006", "color('yellow')"],
        ["${distance} > 0.0001", "color('red')"],
        ["true", "color('white')"],
      ],
    },
  });
}

function highlightAllResidentialBuildings() {
  osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        [
          "${feature['building']} === 'apartments' || ${feature['building']} === 'residential'",
          "color('cyan', 0.9)",
        ],
        [true, "color('white')"],
      ],
    },
  });
}

function showByBuildingType(buildingType) {
  switch (buildingType) {
    case "office":
      osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
        show: "${feature['building']} === 'office'",
      });
      break;
    case "apartments":
      osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
        show: "${feature['building']} === 'apartments'",
      });
      break;
    default:
      break;
  }
}

function reset() {
  closePopup();
  if (handler) {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }
}

function closePopup() {
  position.value = {};
}
//#endregion
</script>

<template>
  <div class="container">
    <CesiumMap @viewerCreated="viewerCreated" />
    <!-- 参数调整面板 -->
    <div class="panel">
      <el-form label-suffix=":" label-width="auto">
        <el-form-item label="样式">
          <el-select
            v-model="style"
            placeholder="请选择样式"
            @change="handleChangeStyle">
            <el-option
              v-for="item in styles"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <el-tag
      type="success"
      size="small"
      class="tip"
      v-show="style === 'Color By Distance To Selected Location'">
      提示：右键点击某栋建筑来选择中心位置
    </el-tag>
    <!-- 属性弹窗 -->
    <Popup :title :yOffset :position @close="closePopup">
      <el-descriptions class="margin-top" :column="1" :size="'small'" border>
        <el-descriptions-item label="建筑类型">
          {{ building.buildingType }}
        </el-descriptions-item>
        <el-descriptions-item label="竣工日期">
          {{ building.startDate }}
        </el-descriptions-item>
        <el-descriptions-item label="建筑高度">
          {{ building.estimatedHeight }}
        </el-descriptions-item>
        <el-descriptions-item label="建筑层数">
          {{ building.buildingLeves }}
        </el-descriptions-item>
      </el-descriptions>
    </Popup>
  </div>
</template>

<style lang="scss" scoped>
.container {
  position: relative;
  height: 100%;
  overflow: hidden;

  .panel {
    position: absolute;
    width: 290px;
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

  .tip {
    position: absolute;
    top: 70px;
    right: 10px;
    opacity: 0.96;
    padding: 12px 8px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
