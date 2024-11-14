<script setup>
import {
  Ion,
  Viewer,
  Terrain,
  Cesium3DTileset,
  Cartesian3,
  HeadingPitchRoll,
  CesiumTerrainProvider,
  createOsmBuildingsAsync,
  Math,
  Matrix4
} from "cesium";

import useCSViewerStore from "@/stores/csViewer.js";

const csViewerStore = useCSViewerStore();

let viewerDivRef = ref();
let viewerRef = shallowRef();

//获取CESIUM_BASE_URL
const sysBaseUrl = import.meta.env.BASE_URL;
const mode = import.meta.env.MODE;
const sourceCesiumBaseUrl = import.meta.env.VITE_CESIUM_BASE_URL;
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwNThmOGZlYy0yMWRhLTQ1Y2QtOWEzYy1kZDc1OTdkMDFiZmUiLCJpZCI6ODg0MjQsImlhdCI6MTY2OTUxNjY0N30.EnNjIANE_y4A1mB2PjYdWQJ5iqGqgztwUdV7blYGcNo";
const cesiumBaseUrl =
  mode === "development"
    ? `${sysBaseUrl}${sourceCesiumBaseUrl}`
    : sourceCesiumBaseUrl;
window.CESIUM_BASE_URL = cesiumBaseUrl;

const props = defineProps({
  mapType: {
    type: String,
    default: "tdtImg"
  }
});

const emits = defineEmits(["viewerCreated", "leftClick"]);

const loading = ref(true);
const value = ref("");

const options = [
  { value: "1", label: "旧金山渡轮大厦" },
  { value: "2", label: "39号码头" },
  { value: "3", label: "Skyline" },
  { value: "4", label: "伦巴底街" },
  { value: "5", label: "丹奈利峰" },
  { value: "6", label: "安克拉治" },
  { value: "7", label: "山峰(群峰)" },
  { value: "8", label: "河床" },
  { value: "9", label: "OSM建筑物数据" },
];

onMounted(() => {
  initViewer();
  add3DModelData();
});

/**
 * 初始化Viewer对象
 */
function initViewer() {
  viewerRef.value = new Viewer(viewerDivRef.value, {
    geocoder: false, //位置查找工具(右上角的查询按钮)
    homeButton: false, //(首页位置)按钮，点击后会跳转到默认的全球视角
    sceneModePicker: false, //视角模式切换
    baseLayerPicker: false, //图层选择工具
    navigationHelpButton: false, // 导航帮助
    navigationInstructionsInitiallyVisible: false, //初始化前不显示导航说明
    animation: false, //动画小控件，即左下角的仪表
    timeline: false, //时间轴
    fullscreenButton: false, //全屏按钮
    infoBox: false, //不创建默认的信息框(弹窗)
    selectionIndicator: false, //是否显示选取指示器
    skyBox: false, //skyBox、Sun or Moon都不会被添加
    shouldAnimate: true, //是否允许动画
    showRenderLoopErrors: false, //如果为true，则如果出现渲染循环错误，此小部件将自动向用户显示包含错误的HTML面板。
    terrain: Terrain.fromWorldTerrain()
  });
  csViewerStore.viewer = viewerRef;
  viewerRef.value.cesiumWidget.creditContainer.style.display = "none"; //隐藏版权信息
  viewerRef.value.scene.debugShowFramesPerSecond = true; //添加帧速显示
  emits("viewerCreated");
}

/**
 * 添加Cesium Ion中提供的三维模型数据
 */
function add3DModelData() {
  addAerometrexSanFrancisco3DModel();
  addArcticDEM();
  addOsmBuildings();
  if (loading.value) loading.value = false;
}

/**
 * Aerometrex（一家提供3D建模、航空影像和LiDAR等地理空间技术的服务的澳大利亚公司），
 * 这里加载的是旧金山高分辨率3D模型，带有街道增强的3D模型
 */
async function addAerometrexSanFrancisco3DModel() {
  try {
    const tileset = await Cesium3DTileset.fromIonAssetId(1415196, {
      maximumScreenSpaceError: 4
    });
    viewerRef.value.scene.primitives.add(tileset);
  } catch (error) {
    ElMessage.error(`Error creating tileset: ${error}`);
    if (loading.value) loading.value = false;
  }
}

/**
 * 来自Arctic DEM项目（Release 4）的高分辨率北极地形
 * (https://www.pgc.umn.edu/data/arcticdem/)
 */
async function addArcticDEM() {
  try {
    viewerRef.value.scene.terrainProvider =
      await CesiumTerrainProvider.fromIonAssetId(3956);
  } catch (error) {
    ElMessage.error(`Failed to load terrain. ${error}`);
    if (loading.value) loading.value = false;
  }
}

/**
 * OSM Buildings
 */
async function addOsmBuildings() {
  try {
    const osmBuildingsTileset = await createOsmBuildingsAsync();
    viewerRef.value.scene.primitives.add(osmBuildingsTileset);
  } catch (error) {
    ElMessage.error(`Error creating tileset: ${error}`);
    if (loading.value) loading.value = false;
  }
}

/**
 * 更换模型地点
 */
function handleChange(val) {
    let dest, ori;
    if (val === "1") {
      //Ferry Building（旧金山渡轮大厦，旧金山市中心的一座历史建筑）：街道级增强网格，每像素分辨率为6毫米
      dest = [-2703541.419456986, -4261164.971874713, 3887416.257562123];
      ori = [5.959123393581913, -0.03131876941215883, 0.0000033030489428043097];
    } else if (val === "2") {
      //Pier 39（39号码头，旧金山渔人码头的旅游景点和购物中心）：每像素分辨率为2cm
      dest = [-2704263.584923937, -4259336.981155519, 3888978.5732662966];
      ori = [
        2.4287691459386607, -0.49459905591668996, 0.0000029701571779838787
      ];
    } else if (val === "3") {
      //Skyline:（建筑物或群山在天空映衬下的）轮廓线：每像素分辨率为2cm
      dest = [-2702979.5635104137, -4261981.190435306, 3887092.144148863];
      ori = [4.534265054628527, -0.08846186652294352, 0.0000075141499165098935];
    } else if (val === "4") {
      //Lombard Street（旧金山的伦巴底街）:：每像素分辨率为2cm
      dest = [-2705631.6783492276, -4259449.36938678, 3887903.89229016];
      ori = [5.999439616451804, -0.20513082834763674, 4.7213266807233367e-7];
    } else if (val === "5") {
      //Denali：丹奈利峰（阿拉斯加州的山）
      dest = Cartesian3.fromRadians(
        -2.6399828792482234,
        1.0993550795541742,
        5795
      );
      ori = [3.8455, -0.4535, 0.0];
    } else if (val === "6") {
      //Anchorage Area：安克拉治是美国阿拉斯加州最大城市
      dest = Cartesian3.fromRadians(
        -2.610708034601548,
        1.0671172431736584,
        1900
      );
      ori = [4.6, -0.341, 0.0];
    } else if (val === "7") {
      //Peaks：山峰(群峰)
      dest = Cartesian3.fromRadians(
        -2.6928866820212813,
        1.072394255273859,
        3700
      );
      ori = [1.6308222948889464, -0.6473480165020193, 0.0];
    } else if (val === "8") {
      //Riverbed：河床
      dest = Cartesian3.fromRadians(
        -2.6395623497608596,
        1.0976443174490356,
        2070
      );
      ori = [6.068794108659519, -0.08514161789475816, 0.0];
    } else if (val === "9") {
      //OSM Buildings
      dest = Cartesian3.fromDegrees(-74.019, 40.6912, 750);
      ori = [Math.toRadians(20), Math.toRadians(-20), 0.0];
    }
    flyToSomewhere(dest, ori);
}

function flyToSomewhere(dest, ori) {
  viewerRef.value.scene.camera.flyTo({
    destination: dest instanceof Cartesian3 ? dest : new Cartesian3(...dest),
    orientation: new HeadingPitchRoll(...ori),
    duration: 1
  });
}
</script>

<template>
  <div
    class="map"
    ref="viewerDivRef"
    v-loading="loading"
    element-loading-text="三维模型加载中..."
    element-loading-background="rgba(122, 122, 122, 0.8)">
    <el-select
      class="select"
      v-model="value"
      placeholder="请选择模型"
      size="default"
      @change="handleChange">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value" />
    </el-select>
  </div>
</template>

<style lang="scss" scoped>
.map {
  position: relative;
  height: 100%;

  .select {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    width: 240px;
  }
}

//帧数组件位置
:deep(.cesium-performanceDisplay-defaultContainer) {
  top: 10px;
  left: 10px;
  right: auto;
}
</style>
