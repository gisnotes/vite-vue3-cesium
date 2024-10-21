<script setup>
import useCSViewerStore from "@/stores/csViewer.js";

const csViewerStore = useCSViewerStore();

onMounted(() => {
  console.log("parent", "onMounted", csViewerStore.viewer);
});
</script>

<template>
  <CesiumMap />
</template>
