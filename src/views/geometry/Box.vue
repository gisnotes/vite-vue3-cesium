<template>
  <CesiumMap @viewerCreated="viewerCreated" />
</template>

<script setup>
let viewer;

function viewerCreated(v) {
  viewer = v;

  //这里绘制的3个box长宽高(dimensions属性)都相同.

  viewer.entities.add({
    name: "Blue box",
    position: Cesium.Cartesian3.fromDegrees(-114.0, 40.0, 300000.0),
    box: {
      dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
      material: Cesium.Color.BLUE,
    },
  });

  viewer.entities.add({
    name: "Red box with black outline",
    position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
    box: {
      dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.BLACK,
    },
  });

  viewer.entities.add({
    name: "Yellow box outline",
    position: Cesium.Cartesian3.fromDegrees(-100.0, 40.0, 300000.0),
    box: {
      dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
      fill: false,
      outline: true,
      outlineColor: Cesium.Color.YELLOW,
    },
  });

  viewer.zoomTo(viewer.entities);
}
//#endregion
</script>
