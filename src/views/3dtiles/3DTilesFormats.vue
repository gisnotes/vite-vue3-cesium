<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="80px">
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
      <el-form-item label="启用阴影">
        <el-switch
          v-model="form.shadowsEnabled"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleShadowsChange" />
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
/**
 * 关于3dtiles涉及的瓦片数据类型请参考博客：
 */

//#region --------------------- 定义变量----------------
let viewer, scene, handler, tileset, inspectorViewModel;
const hiddenFeatures = ref([]);
const allProps = new Set();

let count = 0;

const form = reactive({
  model: "Tileset",
  shadowsEnabled: true,
});

const inspector = reactive({
  pickTilesetActive: false,
  pickActive: true,
  colorize: false,
  wireframe: false,
  boundingVolumes: false,
  contentVolumes: false,
  requestVolumes: false,
  pointCloudShading: false,
  geometricErrorScale: 1,
  maxAttenuation: 0,
  baseResolution: 0,
  eyeDomeLighting: true,
  edlStrength: 1,
  edlRadius: 1,
  freezeFrame: false,
  dynamicScreenSpaceError: true,
  maxScreenSpaceError: 16,
  screenSpaceErrorDensity: 0.0002,
  screenSpaceErrorFactor: 24,
});

/**
 * @type {Array} 要加载的模型列表
 */
const models = [
  { value: "Tileset", label: "Tileset的模型" },
  /**
   * Translucent：这是说模型具有透明或半透明效果的材质。
   */
  { value: "Translucent", label: "半透明样式的模型" },
  { value: "Translucent/Opaque", label: "半透明/不透明混合样式的模型" },
  { value: "Multi-color", label: "用多种颜色可视化模型" },
  { value: "Request Volume", label: "加载tileset时发起的HTTP请求数" },
  { value: "Batched", label: "Batched模型(.B3DM)" },
  /**
   * I3DM 是 3D Tiles 的一种格式，用于渲染多个实例化的对象，例如树木、路灯等。
   */
  { value: "Instanced", label: "Instanced模型(.I3DM)" },
  { value: "Instanced/Orientation", label: "不同朝向(方向)的实例模型" },
  /**
   * 在 Cesium 的 3D Tiles 规范中，Composite Tile 是一种特殊的瓦片格式（.cmpt 文件扩展名），
   * 允许将多个类型子瓦片（例如 B3DM 、 I3DM或者pnts即点云）打包到一个文件中，
   * 这种打包方式的主要目的是提高数据传输效率，减少浏览器需要发出的HTTP请求次数，从而加速大规模3D数据的加载和渲染。
   */
  { value: "Composite", label: "复合瓦片格式的模型" },
  { value: "PointCloud", label: "点云" },
  { value: "PointCloudConstantColor", label: "具有统一颜色的点云" },
  { value: "PointCloudNormals", label: "与点云中的点相关联的法线矢量" },
  /**
   * Batched：批处理是一种将多个数据项或操作组合在一起处理的技术，旨在提高效率。
   * 在计算机图形学中，批处理常用于减少CPU和GPU之间的通信开销，从而优化渲染或计算性能。
   * 例如，在3D渲染中，将多个小对象合并为一个批次，可以减少渲染调用的次数（draw calls），从而提升性能。
   */
  { value: "PointCloudBatched", label: "批量处理的点云" },
  /**
   * Draco 是由 Google 开发的一种开源压缩库，专门用于压缩和解压缩 3D 几何网格和点云数据。
   * 它的核心目标是通过减小 3D 数据的大小，优化数据传输和存储效率。
   */
  { value: "PointCloudDraco", label: "使用Draco压缩的点云数据" },
];

//#endregion

function viewerCreated(v) {
  viewer = v;
  initViewer();
  initEvents();
  handleChangeModel(form.model);
}

//#region --------------------- 方法区域----------------
function initViewer() {
  scene = viewer.scene;
  viewer.clock.currentTime = new Cesium.JulianDate(2457522.154792);
  viewer.shadows = true;
  /**
   * Cesium3DTilesInspector是一个小部件。
   * 这个小部件是一个交互式调试工具，专门用于检查和调试 3D Tiles 数据集。
   */
  viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
  inspectorViewModel = viewer.cesium3DTilesInspector.viewModel;
}

function initEvents() {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  handler.setInputAction(function (movement) {
    const feature = inspectorViewModel.feature;
    if (Cesium.defined(feature)) {
      const propertyIds = feature.getPropertyIds();
      const length = propertyIds.length;
      let propTbl = "";
      for (let i = 0; i < length; ++i) {
        const propertyId = propertyIds[i];
        propTbl += `<b>${propertyId}</b>: ${feature.getProperty(
          propertyId
        )}<br>`;
      }
      ElMessage({
        dangerouslyUseHTMLString: true,
        message: propTbl,
      });
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction(function (movement) {
    const feature = inspectorViewModel.feature;
    if (Cesium.defined(feature)) {
      feature.show = false;
      hiddenFeatures.value.push(feature);
    }
  }, Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
}

//切换模型
function handleChangeModel(value) {
  switch (value) {
    case "Tileset":
      loadTileset("./SampleData/Cesium3DTiles/Tilesets/Tileset/tileset.json");
      break;
    case "Translucent":
      loadTileset(
        "./SampleData/Cesium3DTiles/Batched/BatchedTranslucent/tileset.json"
      );
      break;
    case "Translucent/Opaque":
      loadTileset(
        "./SampleData/Cesium3DTiles/Batched/BatchedTranslucentOpaqueMix/tileset.json"
      );
      break;
    case "Multi-color":
      loadTileset(
        "./SampleData/Cesium3DTiles/Batched/BatchedColors/tileset.json"
      );
      break;
    case "Request Volume":
      loadTileset(
        "./SampleData/Cesium3DTiles/Tilesets/TilesetWithViewerRequestVolume/tileset.json"
      );
      break;
    case "Batched":
      loadTileset(
        "./SampleData/Cesium3DTiles/Batched/BatchedWithBatchTable/tileset.json"
      );
      break;
    case "Instanced":
      loadTileset(
        "./SampleData/Cesium3DTiles/Instanced/InstancedWithBatchTable/tileset.json"
      );
      break;
    case "Instanced/Orientation":
      loadTileset(
        "./SampleData/Cesium3DTiles/Instanced/InstancedOrientation/tileset.json"
      );
      break;
    case "Composite":
      loadTileset(
        "./SampleData/Cesium3DTiles/Composite/Composite/tileset.json"
      );
      break;
    case "PointCloud":
      loadTileset(
        "./SampleData/Cesium3DTiles/PointCloud/PointCloudRGB/tileset.json"
      );
      break;
    case "PointCloudConstantColor":
      loadTileset(
        "./SampleData/Cesium3DTiles/PointCloud/PointCloudConstantColor/tileset.json"
      );
      break;
    case "PointCloudNormals":
      loadTileset(
        "./SampleData/Cesium3DTiles/PointCloud/PointCloudNormals/tileset.json"
      );
      break;
    case "PointCloudBatched":
      loadTileset(
        "./SampleData/Cesium3DTiles/PointCloud/PointCloudBatched/tileset.json"
      );
      break;
    case "PointCloudDraco":
      loadTileset(
        "./SampleData/Cesium3DTiles/PointCloud/PointCloudDraco/tileset.json"
      );
      break;
    default:
      break;
  }
}

/**
 * Cesium3DTileset 的 enableDebugWireframe 属性是一个用于调试的布尔值属性。
 * 启用 enableDebugWireframe 后，图块集中的几何内容（如建筑模型或地形）将以线框形式显示，展示构成模型的三角形边缘。
 * 这一功能主要用于开发和调试过程中，例如有如下的一些用途：
 * 1. 检查模型的网格是否存在问题，例如错误的几何形状。
 * 2. 可视化不同细节层次（LOD）的几何变化。
 * 3. 排查渲染问题，如深度冲突（z-fighting）或剔除错误。
 */

async function loadTileset(resource) {
  reset();
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(resource, {
      //仅用于调试。此条件必须为真，以便在 WebGL1 中使 debugWireframe 生效。在创建瓦片集之后无法设置此条件。
      enableDebugWireframe: true,
    });
    viewer.scene.primitives.add(tileset);
    inspectorViewModel.tileset = tileset;

    tileset.tileLoad.addEventListener(function (tile) {
      processTile(tile);
    });

    tileset.allTilesLoaded.addEventListener(function () {
      console.log("所有的瓦片已加载完毕！");
      console.log("瓦片集合中包含的所有属性如下：", ...allProps);
    });

    viewer.zoomTo(
      tileset,
      new Cesium.HeadingPitchRange(
        0,
        -2.0,
        Math.max(100.0 - tileset.boundingSphere.radius, 0.0)
      )
    );
    const properties = tileset.properties;
    if (Cesium.defined(properties) && Cesium.defined(properties.Height)) {
      tileset.style = new Cesium.Cesium3DTileStyle({
        color: {
          conditions: [
            ["${Height} >= 83", "color('purple', 0.5)"],
            ["${Height} >= 80", "color('red')"],
            ["${Height} >= 70", "color('orange')"],
            ["${Height} >= 12", "color('yellow')"],
            ["${Height} >= 7", "color('lime')"],
            ["${Height} >= 1", "color('cyan')"],
            ["true", "color('blue')"],
          ],
        },
      });
    }
  } catch (error) {
    ElMessage.error(`tileset数据加载出错: ${error}`);
  }
}

function handleShadowsChange(checked) {
  viewer.shadows = checked;
}

function reset() {
  if (Cesium.defined(tileset)) {
    scene.primitives.remove(tileset);
    inspectorViewModel.tileset = undefined;
  }
  if (allProps.size) {
    allProps.clear();
  }
  hiddenFeatures.value = []; //清空数组
  console.clear();
}

function handleRecovery() {
  if (hiddenFeatures.value.length) {
    hiddenFeatures.value.forEach((f) => {
      f.show = true;
    });
    hiddenFeatures.value = []; //清空数组
  }
}

function processTile(tile) {
  const content = tile.content;
  if (content instanceof Cesium.Model3DTileContent) {
    if (Cesium.defined(content)) {
      const featuresLength = content.featuresLength;
      for (let i = 0; i < featuresLength; i++) {
        const feature = content.getFeature(i);
        const propertyNames = feature.getPropertyIds(); // 关键方法
        propertyNames.forEach((p) => {
          console.log(++count, "🚀 | p:", p);
          allProps.add(p);
        });
      }
    }
  }
  if (tile.children) {
    tile.children.forEach((child) => processTile(child));
  }
}
//#endregion
</script>

<style lang="scss" scoped>
.panel {
  position: absolute;
  width: 380px;
  left: 10px;
  top: 10px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  opacity: 0.96;

  :deep(.el-form-item) {
    margin-bottom: 5px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0px;
  }
}

:deep(.cesium-viewer-cesium3DTilesInspectorContainer) {
  top: 10px;
}

:deep(.cesium-3DTilesInspector) {
  width: 400px;
}
</style>
