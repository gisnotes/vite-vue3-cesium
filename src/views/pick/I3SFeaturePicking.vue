<template>
  <div class="container">
    <CesiumMap />
    <!-- 属性弹窗 -->
    <Popup :title :yOffset :position @close="closePopup">
      <el-descriptions class="margin-top" :column="1" :size="'small'" border>
        <el-descriptions-item label="建筑物ID">
          {{ bin }}
        </el-descriptions-item>
        <el-descriptions-item label="信息技术和电信部ID" width="50px">
          {{ doittId }}
        </el-descriptions-item>
        <el-descriptions-item label="地块编号">
          {{ bbl }}
        </el-descriptions-item>
        <el-descriptions-item label="建造年份">
          {{ constructionYear }}
        </el-descriptions-item>
        <el-descriptions-item label="修改日期">
          {{ lastModifiedDate }}
        </el-descriptions-item>
        <el-descriptions-item label="状态类型">
          {{ lastStatusType }}
        </el-descriptions-item>
        <el-descriptions-item label="房屋总高度">
          {{ heightRoof }}
        </el-descriptions-item>
        <el-descriptions-item label="要素代码">
          {{ featureCode }}
        </el-descriptions-item>
        <el-descriptions-item label="子要素代码">
          {{ subFeatureCode }}
        </el-descriptions-item>
        <el-descriptions-item label="地面高程">
          {{ groundElevation }}
        </el-descriptions-item>
        <el-descriptions-item label="楼层总数">
          {{ numFloors }}
        </el-descriptions-item>
      </el-descriptions>
    </Popup>
  </div>
</template>

<script setup>
import useCSViewerStore from "@/stores/csViewer.js";

//#region --------------------- 定义变量----------------
const cvs = useCSViewerStore();

let viewer;

const bin = ref("");
const doittId = ref("");
const name = ref("");
const bbl = ref("");
const constructionYear = ref("");
const lastModifiedDate = ref("");
const lastStatusType = ref("");
const heightRoof = ref("");
const featureCode = ref("");
const subFeatureCode = ref("");
const groundElevation = ref("");
const numFloors = ref("");

//属性弹窗
let title = ref("弹窗标题");
let yOffset = ref(12);
let position = ref({});
//#endregion

onMounted(() => {
  viewer = cvs.viewer;
  addTerrain();
  addI3SData();
  init();
});

//#region --------------------- 方法区域----------------
async function addTerrain() {
  try {
    const terrainProviderPromise =
      await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
        requestVertexNormals: true,
      });
    //方式1：参考：https://cesium.com/learn/cesiumjs/ref-doc/CesiumTerrainProvider.html#.fromIonAssetId
    viewer.terrainProvider = terrainProviderPromise;
    //方式2：参考：https://cesium.com/learn/cesiumjs/ref-doc/Scene.html?classFilter=scene#setTerrain
    // const terrain = new Cesium.Terrain(terrainProviderPromise);
    // viewer.scene.setTerrain(terrain);
  } catch (err) {
    ElMessage.error(`世界地形数据加载出错: ${err}`);
  }
}

async function addI3SData() {
  try {
    /**
     * 初始化terrain provider(添加大地水准面切片地形数据)，该provider提供了重力相关（通常是 I3S 数据集）和基于椭球体的高度系统（Cesium World Terrain）之间的大地水准面（geoid）转换。
     * 如果未指定，或者 URL 无效，则不会应用大地水准面转换。
     * 此转码服务中使用的源数据是从 https://earth-info.nga.mil/#tab_wgs84-data 编译的，基于 EGM2008 重力模型。
     *
     * 关于I3S（Index 3D Scene）请参考文章：https://cesium.com/blog/2023/02/06/cesiumjs-adds-support-for-indexed-3d-scene-layers-i3s/
     */
    const geoidTiledTerrainProvider =
      await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
        "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/EGM2008/ImageServer"
      );
    const i3sProvider = await Cesium.I3SDataProvider.fromUrl(
      "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/NYC_Attributed_v17/SceneServer",
      {
        geoidTiledTerrainProvider,
      }
    );

    viewer.scene.primitives.add(i3sProvider);
    const center = Cesium.Rectangle.center(i3sProvider.extent);
    center.height = 50.0;
    viewer.camera.setView({
      destination: Cesium.Ellipsoid.WGS84.cartographicToCartesian(center),
      orientation: {
        heading: Cesium.Math.toRadians(200.0),
        pitch: Cesium.Math.toRadians(-50.0),
      },
    });
  } catch (err) {
    ElMessage.error(`I3S数据加载出错: ${err}`);
  }
}

function init() {
  viewer.screenSpaceEventHandler.setInputAction((movement) => {
    const pickedFeature = viewer.scene.pick(movement.position);
    if (!Cesium.defined(pickedFeature)) {
      return;
    }
    console.log('pickedFeature: ', pickedFeature);
    const pickedPosition = viewer.scene.pickPosition(movement.position);
    //获取该瓦片的i3s节点
    const i3sNode = pickedFeature?.content?.tile?.i3sNode;
    if (Cesium.defined(i3sNode)) {
      if (pickedPosition) {
        i3sNode.loadFields().then(() => {
          const fields = i3sNode.getFieldsForPickedPosition(pickedPosition);
          // console.table(fields);
          /**
           * BIN:建筑物编号
           * DOITT_ID:（Department of Information Technology and Telecommunications，信息技术和电信部）ID
           * FID:要素ID，FID字段包含OBJECTID，具体参考：https://support.esri.com/zh-cn/knowledge-base/what-are-the-differences-in-the-behavior-of-the-objecti-000010834
           * NAME:名称
           * BBL:这里可翻译为地块编号，它代表 Borough, Block, and Lot，即区、地块和地段。它是纽约市地籍数据库中每个地块的唯一标识符，广泛用于土地、建筑和税务等记录。
           * CNSTRCT_YR:Construction Year，即建造年份
           * LSTMODDATE:Last Modified Date，即最后修改日期
           * LSTSTATYPE:Last Status Type，即最后状态类型
           * HEIGHTROOF:通常表示建筑物从地面到屋顶的总高度，单位通常是英尺（feet）。
           * FTRCODE:Feature Code,要素代码
           * SUBFTRCODE:是对上面的FTRCODE的进一步细化分类，子要素代码
           * GROUNDELEV:Ground Elevation，即地面海拔高度
           * NUM_FLOORS:建筑物的楼层总数，我看属性值是字符E,有可能是Estimated或Exception，即该值为预估或异常值
           */
          // TODO:更新属性弹窗内容
          updatePopup(fields, movement);
        });
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function updatePopup(fields, e) {
  const cartesianPos = viewer.scene.pickPosition(e.position);
  bin.value = fields["BIN"];
  doittId.value = fields["DOITT_ID"];
  name.value = fields["NAME"];
  bbl.value = fields["BBL"];
  constructionYear.value = fields["CNSTRCT_YR"];
  lastModifiedDate.value = fields["LSTMODDATE"];
  lastStatusType.value = fields["LSTSTATYPE"];
  heightRoof.value = fields["HEIGHTROOF"];
  featureCode.value = fields["FTRCODE"];
  subFeatureCode.value = fields["SUBFTRCODE"];
  groundElevation.value = fields["GROUNDELEV"];
  numFloors.value = fields["NUM_FLOORS"];
  title.value = "建筑物ID-" + bin.value;
  position.value = cartesianPos;
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
}
</style>
