<template>
  <CesiumMap @viewerCreated="viewerCreated" />
</template>

<script setup>
/**
 * 示例介绍：Blue Marble Next Generation在2004年7月的影像（来源：NASA）
 * 
 * 由于我将地图封装为一个子组件，这里我们将子组件的viewer的baseLayer属性设置为false，
 * 然后采用下面的方法来加载本文的地图数据，具体请参考官方文档：
 * https://cesium.com/learn/cesiumjs/ref-doc/ImageryLayer.html#.fromProviderAsync
 */

function viewerCreated(viewer) {
  const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(3845)
  );
  viewer.imageryLayers.add(imageryLayer);
}
//#endregion
</script>
