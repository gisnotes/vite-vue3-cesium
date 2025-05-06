<template>
  <CesiumMap @viewerCreated="viewerCreated" @leftClick="leftClick" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="auto">
      <el-form-item label="像素范围">
        <el-slider
          v-model="form.pixelRange"
          show-input
          :min="1"
          :max="200"
          :step="1"
          :show-input-controls="false"
          @input="handlePixelRangeInput" />
      </el-form-item>
      <el-form-item label="聚类的最小对象数量">
        <el-slider
          v-model="form.minimumClusterSize"
          show-input
          :min="2"
          :max="20"
          :step="1"
          :show-input-controls="false"
          @input="handleMinimumClusterSizeInput" />
      </el-form-item>
      <el-form-item label="启用聚类">
        <el-switch
          v-model="form.enabled"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="updateEnabled" />
      </el-form-item>
      <el-form-item label="自定义样式">
        <el-switch
          v-model="form.customStyling"
          inline-prompt
          active-text="是"
          inactive-text="否"
          @change="updatecustomStyling" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
/**
 * 本文用到的参数请参考以下官方文档查阅：
 * https://cesium.com/learn/cesiumjs/ref-doc/EntityCluster.html
 */

let viewer, dataSource, singleDigitPins, removeListener;

const initForm = {
  pixelRange: 15,
  minimumClusterSize: 3,
  enabled: true,
  customStyling: true,
};

const form = reactive({ ...initForm });

const pinBuilder = new Cesium.PinBuilder();
/**
 * fromText(text, color, size) → HTMLCanvasElement
 * toDataURL()方法参考：https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/toDataURL
 */
const pin50 = pinBuilder.fromText("50+", Cesium.Color.RED, 48).toDataURL();
const pin40 = pinBuilder.fromText("40+", Cesium.Color.ORANGE, 48).toDataURL();
const pin30 = pinBuilder.fromText("30+", Cesium.Color.YELLOW, 48).toDataURL();
const pin20 = pinBuilder.fromText("20+", Cesium.Color.GREEN, 48).toDataURL();
const pin10 = pinBuilder.fromText("10+", Cesium.Color.BLUE, 48).toDataURL();

async function viewerCreated(v) {
  viewer = v;
  const options = {
    camera: viewer.scene.camera,
    canvas: viewer.scene.canvas,
  };
  try {
    dataSource = await viewer.dataSources.add(
      Cesium.KmlDataSource.load(
        "./SampleData/kml/facilities/facilities.kml",
        options
      )
    );
    init();
  } catch (error) {
    ElMessage.error("加载KML数据出错:" + error);
    throw error;
  }
}

function init() {
  dataSource.clustering.enabled = initForm.enabled;
  dataSource.clustering.pixelRange = initForm.pixelRange;
  dataSource.clustering.minimumClusterSize = initForm.minimumClusterSize;

  singleDigitPins = new Array(8);
  for (let i = 0; i < singleDigitPins.length; ++i) {
    singleDigitPins[i] = pinBuilder
      .fromText(`${i + 2}`, Cesium.Color.VIOLET, 48)
      .toDataURL();
  }

  customStyle();
}

function customStyle() {
  if (Cesium.defined(removeListener)) {
    removeListener();
    removeListener = undefined;
  } else {
    /**
     * https://cesium.com/learn/cesiumjs/ref-doc/EntityCluster.html#.newClusterCallback
     */
    removeListener = dataSource.clustering.clusterEvent.addEventListener(
      (clusteredEntities, cluster) => {
        cluster.label.show = false;
        cluster.billboard.show = true;
        cluster.billboard.id = cluster.label.id;
        cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;

        if (clusteredEntities.length >= 50) {
          cluster.billboard.image = pin50;
        } else if (clusteredEntities.length >= 40) {
          cluster.billboard.image = pin40;
        } else if (clusteredEntities.length >= 30) {
          cluster.billboard.image = pin30;
        } else if (clusteredEntities.length >= 20) {
          cluster.billboard.image = pin20;
        } else if (clusteredEntities.length >= 10) {
          cluster.billboard.image = pin10;
        } else {
          cluster.billboard.image =
            singleDigitPins[clusteredEntities.length - 2];
        }
      }
    );
  }

  // 强制使用新样式重新聚类：重新设置像素范围
  const pixelRange = dataSource.clustering.pixelRange;
  dataSource.clustering.pixelRange = 0;
  dataSource.clustering.pixelRange = pixelRange;
}

function leftClick(movement) {
  const pickedLabel = viewer.scene.pick(movement.position);
  if (Cesium.defined(pickedLabel)) {
    const ids = pickedLabel.id;
    if (Array.isArray(ids)) {
      for (let i = 0; i < ids.length; ++i) {
        ids[i].billboard.color = Cesium.Color.RED;
      }
    }
  }
}

function handlePixelRangeInput(value) {
  dataSource.clustering.pixelRange = value;
}

function handleMinimumClusterSizeInput(value) {
  dataSource.clustering.minimumClusterSize = value;
}

function updateEnabled(checked) {
  dataSource.clustering.enabled = checked;
}

function updatecustomStyling(checked) {
  customStyle();
}

//#endregion
</script>

<style lang="scss" scoped>
.panel {
  position: absolute;
  width: 470px;
  top: 10px;
  right: 10px;
  background-color: white;
  border-radius: 4px;
  z-index: 2;
  padding: 10px 5px 10px 10px;
  opacity: 0.96;
  box-shadow: rgba(195, 191, 188, 0.7) 0px 1px 2px 0px,
    rgba(195, 191, 188, 0.85) 0px 2px 4px 2px;
}

//滑块右侧的输入框的长度
:deep(.el-input-number) {
  width: 75px;
  margin-right: 10px;
}

:deep(.el-slider__runway.show-input) {
  margin-right: 15px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: bold;
}

:deep(.el-form-item) {
  margin-bottom: 4px;
}
</style>
