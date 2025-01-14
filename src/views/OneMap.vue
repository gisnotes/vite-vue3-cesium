<script setup>
import useCSViewerStore from "@/stores/csViewer.js";

const cvs = useCSViewerStore();

let title = ref("弹窗标题");
let yOffset = ref(12);
let position = ref({});
let popupContent = ref("");

onMounted(() => {
  addEntities();
});

function addEntities() {
  const lngLat = [113.553696883309, 34.8244199026567];
  cvs.viewer.entities.add({
    name: "我是一个红色的长方体",
    position: Cesium.Cartesian3.fromDegrees(...lngLat),
    box: {
      dimensions: new Cesium.Cartesian3(100.0, 100.0, 1000.0),
      material: Cesium.Color.RED,
    },
    properties: {
      lngLat,
    },
  });
  cvs.viewer.zoomTo(cvs.viewer.entities);
}

function handleLeftClick(e) {
  const cartesianPos = cvs.viewer.scene.pickPosition(e.position);
  const obj = cvs.viewer.scene.pick(e.position);
  if (Cesium.defined(obj) && obj.id instanceof Cesium.Entity) {
    popupContent.value = `Entity所在坐标: ${obj.id.properties.lngLat.getValue()}`;
    title.value = obj.id.name;
    position.value = cartesianPos;
  } else {
    closePopup();
  }
}

function closePopup() {
  position.value = {};
}
</script>

<template>
  <CesiumMap @leftClick="handleLeftClick" />
  <!-- 弹窗 -->
  <Popup :title :yOffset :position @close="closePopup">
    {{ popupContent }}
  </Popup>
</template>
