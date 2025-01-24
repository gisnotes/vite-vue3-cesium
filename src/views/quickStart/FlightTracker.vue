<template>
  <div class="container">
    <CesiumMap />
  </div>
</template>

<script setup>
import useCSViewerStore from "@/stores/csViewer.js";
import { fetchJsonData } from "@/utils/request";

//#region --------------------- 定义变量----------------
const cvs = useCSViewerStore();

let viewer, clock;

//#endregion

//#region --------------------- 生命周期----------------
onMounted(() => {
  viewer = cvs.viewer;
  clock = viewer.clock;
  viewer.scene.globe.depthTestAgainstTerrain = false;
  addTerrain();
  // addOsmBuildings();
  initViewerClock();
});
//#endregion

//#region --------------------- 方法区域----------------
/**
 * 添加地形数据
 */
async function addTerrain() {
  try {
    viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(
      1,
      {
        requestVertexNormals: true,
      }
    );
  } catch (err) {
    ElMessage.error(`世界地形数据加载出错: ${err}`);
  }
}

/**
 * 添加OSM建筑物数据
 */
async function addOsmBuildings() {
  try {
    const osmBuildings = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(osmBuildings);
  } catch (err) {
    ElMessage.error(`OSM建筑物数据加载出错: ${err}`);
  }
}

/**
 * 初始化Viewer时钟：
 * 假设雷达样本间隔 30 秒，并根据该假设计算整个飞行时间。获取航班的开始和结束日期时间，
 * 其中开始是已知的航班起飞时间【从 PST(Pacific Standard Time,太平洋标准时间) 转换为 UTC(Coordinated Universal Time,协调世界时】，
 * 结束是开始加上计算的持续时间。（请注意，Cesium 使用儒略日期，Julian dates，请参阅：https://simple.wikipedia.org/wiki/Julian_day。）
 * 通过将Viewer的开始和停止时间设置为我们刚刚计算的航班开始和停止时间，来初始化Viewer的时钟。
 * 此外，将Viewer的当前时间设置为开始时间，并将用户带到该时间。
 */
function initViewerClock() {
  const timeStepInSeconds = 50;

  fetchJsonData("./data/flightData.json").then((flightData) => {
    if (flightData) {
      const totalSeconds = timeStepInSeconds * (flightData.length - 1);
      //fromIso8601方法参数：国际标准ISO 8601，是国际标准化组织的日期和时间的表示方法；返回的是Ceisum的Julian dates(儒略日期)
      const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z");
      //结束时间是开始时间加上飞行持续时间
      const stop = Cesium.JulianDate.addSeconds(
        start,
        totalSeconds,
        new Cesium.JulianDate()
      );

      clock.startTime = start.clone();
      clock.stopTime = stop.clone();
      clock.currentTime = start.clone();
      //将Viewer设置为提供的时间，这里需要将Viewer的timeline属性设置为true，才能配置
      // viewer.timeline.zoomTo(start, stop);
      clock.multiplier = 50; //播放速度加快50倍
      // clock.shouldAnimate = true; //开始播放场景，指示 Clock#tick 是否应尝试提前时间。

      //SampledPositionProperty存储雷达样本系列中每个样本的位置和时间戳。
      const positionProperty = new Cesium.SampledPositionProperty();
      for (let i = 0; i < flightData.length; i++) {
        const dataPoint = flightData[i];
        const time = Cesium.JulianDate.addSeconds(
          start,
          i * timeStepInSeconds,
          new Cesium.JulianDate()
        );
        const position = Cesium.Cartesian3.fromDegrees(
          dataPoint.longitude,
          dataPoint.latitude,
          dataPoint.height
        );
        positionProperty.addSample(time, position);

        viewer.entities.add({
          description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
          position,
          point: { pixelSize: 10, color: Cesium.Color.RED },
        });
      }

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          flightData[0].longitude,
          flightData[0].latitude,
          500
        ),
        complete: () => {
          setTimeout(() => {
            const airplaneEntity = viewer.entities.add({
              availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({ start: start, stop: stop }),
              ]),
              position: positionProperty,
              model: {
                uri: "./data/Zv2eybVsGrYSwUFj_Cesium_Air.glb",
              },
              // 从位置自动计算方向。
              orientation: new Cesium.VelocityOrientationProperty(
                positionProperty
              ),
              path: new Cesium.PathGraphics({ width: 3 }),
            });
            viewer.trackedEntity = airplaneEntity;
          }, 4000);
        },
      });
    }
  });
}

/**
 * 这个地点位于美国的纽约：这个地点存在OSM建筑数据，可以用于检测数据加载是否成功。
 */
function testOsmBuildingResult() {
  viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-74.019, 40.6912, 750),
    orientation: {
      heading: Cesium.Math.toRadians(20),
      pitch: Cesium.Math.toRadians(-20),
    },
    duration: 0,
  });
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
