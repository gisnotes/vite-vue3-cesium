<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <el-select
    class="select"
    v-model="styleVal"
    placeholder="空"
    @change="handleStyleChange">
    <el-option
      v-for="item in styles"
      :key="item.value"
      :label="item.label"
      :value="item.value" />
  </el-select>
</template>

<script setup>
/**
 * 示例介绍：在场景中添加图片或标记形式的广告牌(Billboards)
 */

//#region --------------------- 定义变量----------------
let viewer, scene;

const styleVal = ref("Add billboard");

/**
 * @type {Array} 样式列表
 */
const styles = [
  { value: "Add billboard", label: "添加广告牌" },
  {
    value: "Set billboard properties at creation",
    label: "在创建广告牌时设置其属性",
  },
  { value: "Change billboard properties", label: "更改广告牌属性" },
  { value: "Size billboard in meters", label: "广告牌尺寸(以米为单位)" },
  { value: "Add multiple billboards", label: "添加多个广告牌" },
  { value: "Scale by viewer distance", label: "根据viewer距离缩放" },
  { value: "Fade by viewer distance", label: "根据viewer距离淡出" },
  { value: "Offset by viewer distance", label: "根据viewer距离偏移" },
  { value: "Add marker billboards", label: "添加标记广告牌" },
  {
    value: "Disable the depth test when clamped to ground",
    label: "当贴地时禁用深度测试",
  },
];
//#endregion

function viewerCreated(v) {
  viewer = v;
  scene = viewer.scene;
  handleStyleChange(styleVal.value);
}

//#region --------------------- 方法区域----------------

function handleStyleChange(value) {
  reset();
  switch (value) {
    case "Add billboard":
      addBillboard();
      break;
    case "Set billboard properties at creation":
      setBillboardProperties();
      break;
    case "Change billboard properties":
      changeBillboardProperties();
      break;
    case "Size billboard in meters":
      sizeBillboardInMeters();
      break;
    case "Add multiple billboards":
      addMultipleBillboards();
      break;
    case "Scale by viewer distance":
      scaleByDistance();
      break;
    case "Fade by viewer distance":
      fadeByDistance();
      break;
    case "Offset by viewer distance":
      offsetByDistance();
      break;
    case "Add marker billboards":
      addMarkerBillboards();
      break;
    case "Disable the depth test when clamped to ground":
      disableDepthTest();
      break;
    default:
      break;
  }
}

function addBillboard() {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
    billboard: {
      image: "../images/Cesium_Logo_overlay.png",
    },
  });
}

function setBillboardProperties() {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
    billboard: {
      image: "../images/Cesium_Logo_overlay.png", // default: undefined
      show: true, // default
      pixelOffset: new Cesium.Cartesian2(0, -50), // default: (0, 0)
      eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // default: CENTER
      scale: 2.0, // default: 1.0
      color: Cesium.Color.LIME, // default: WHITE
      rotation: Cesium.Math.PI_OVER_FOUR, // default: 0.0，这里是逆时针旋转45度
      alignedAxis: Cesium.Cartesian3.ZERO, // default
      width: 100, // default: undefined，宽度，单位为pixel
      height: 25, // default: undefined，高度，单位为pixel
    },
  });
}

function changeBillboardProperties() {
  const entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705, 300000.0),
    billboard: {
      image: "../images/Cesium_Logo_overlay.png",
    },
  });

  const billboard = entity.billboard;
  billboard.scale = 3.0;
  billboard.color = Cesium.Color.WHITE.withAlpha(0.25);
}

function sizeBillboardInMeters() {
  const entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
    billboard: {
      image: "../images/Cesium_Logo_overlay.png",
      sizeInMeters: true,
    },
  });

  viewer.zoomTo(entity);
}

function addMultipleBillboards() {
  const logoUrl = "../images/Cesium_Logo_overlay.png";
  const facilityUrl = "../images/facility.gif";

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
    billboard: {
      image: logoUrl,
    },
  });
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(99.5, 35.14),
    billboard: {
      image: facilityUrl,
    },
  });
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(109.12, 25.46),
    billboard: {
      image: facilityUrl,
    },
  });
}

function scaleByDistance() {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
    billboard: {
      image: "../images/facility.gif",
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
    },
  });
}

function fadeByDistance() {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
    billboard: {
      image: "../images/Cesium_Logo_overlay.png",
      //Cesium.NearFarScalar(near, nearValue, far, farValue)
      translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
    },
  });
}

function offsetByDistance() {
  Promise.all([
    Cesium.Resource.fetchImage("../images/Cesium_Logo_overlay.png"),
    Cesium.Resource.fetchImage("../images/facility.gif"),
  ]).then(function (images) {
    // 当viewer放大接近设施广告牌时，将 CesiumLogo 广告牌的 pixelOffset 增加至该高度
    const facilityHeight = images[1].height;

    // 并置(合并)广告牌，随着viewer靠近而分开
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
      billboard: {
        image: images[1],
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      },
    });
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
      billboard: {
        image: images[0],
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0.0, -facilityHeight),
        pixelOffsetScaleByDistance: new Cesium.NearFarScalar(
          1.0e3,
          1.0,
          1.5e6,
          0.0
        ),
        translucencyByDistance: new Cesium.NearFarScalar(
          1.0e3,
          1.0,
          1.5e6,
          0.1
        ),
      },
    });
  });
}

function addMarkerBillboards() {
  // 基于图集中的上述图像添加多个广告牌。
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(104.355, 28.705),
    billboard: {
      image: "../images/whiteShapes.png",
      imageSubRegion: new Cesium.BoundingRectangle(49, 43, 18, 18),
      color: Cesium.Color.LIME,
    },
  });
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(108.0, 39.0),
    billboard: {
      image: "../images/whiteShapes.png",
      imageSubRegion: new Cesium.BoundingRectangle(61, 23, 18, 18),
      color: new Cesium.Color(0, 0.5, 1.0, 1.0),
    },
  });
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(100.0, 41.0),
    billboard: {
      image: "../images/whiteShapes.png",
      imageSubRegion: new Cesium.BoundingRectangle(67, 80, 14, 14),
      color: new Cesium.Color(0.5, 0.9, 1.0, 1.0),
    },
  });
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(93.0, 37.0),
    billboard: {
      image: "../images/whiteShapes.png",
      imageSubRegion: new Cesium.BoundingRectangle(27, 103, 22, 22),
      color: Cesium.Color.RED,
    },
  });
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(107.0, 35.0),
    billboard: {
      image: "../images/whiteShapes.png",
      imageSubRegion: new Cesium.BoundingRectangle(105, 105, 18, 18),
      color: Cesium.Color.YELLOW,
    },
  });
}

async function disableDepthTest() {
  viewer.scene.globe.depthTestAgainstTerrain = true;

  try {
    const worldTerrainProvider = await Cesium.createWorldTerrainAsync();

    // 若在此期间已选择其他选项，则提前返回
    if (!viewer.scene.globe.depthTestAgainstTerrain) {
      return;
    }

    viewer.terrainProvider = worldTerrainProvider;
  } catch (error) {
    window.alert(`Failed to load terrain. ${error}`);
  }

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(-122.1958, 46.1915),
    billboard: {
      image: "../images/facility.gif",
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      /**
       * 属性值设置为：Number.POSITIVE_INFINITY，即无限大，也就是不使用深度测试的意思。
       */
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
  viewer.scene.camera.setView({
    destination: new Cesium.Cartesian3(
      -2357576.243142461,
      -3744417.5604860787,
      4581807.855903771
    ),
    orientation: new Cesium.HeadingPitchRoll(
      5.9920811504170475,
      -0.6032820429886212,
      6.28201303164098
    ),
  });
}

async function reset() {
  viewer.camera.flyHome(0);
  viewer.entities.removeAll();
  viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  viewer.scene.globe.depthTestAgainstTerrain = false;
}
//#endregion
</script>

<style lang="scss" scoped>
.select {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
}
</style>
