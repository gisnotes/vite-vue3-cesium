<template>
  <CesiumMap />
  <div class="control">
    <el-select
      class="select"
      v-model="value"
      placeholder="空"
      @change="handleSelectChange">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value" />
    </el-select>
    <el-button type="primary" @click="unlockCamera">
      解除相机锁定
      <el-icon class="el-icon--right"><i-ep-Unlock /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import useCSViewerStore from "@/stores/csViewer.js";

//#region --------------------- 定义变量----------------
const cvs = useCSViewerStore();
let viewer;

const value = ref("0");

const options = [
  {
    value: "0",
    label: "请选择要加载的模型",
  },
  {
    value: "1",
    label: "飞机",
  },
  {
    value: "2",
    label: "无人机",
  },
  {
    value: "3",
    label: "地面车辆",
  },
  {
    value: "4",
    label: "热气球",
  },
  {
    value: "5",
    label: "运奶开车",
  },
  {
    value: "6",
    label: "带有皮肤的角色",
  },
  {
    value: "7",
    label: "不发光的盒子",
  },
  {
    value: "8",
    /**
     * Draco 是一个用于压缩和解压缩 3D 几何网格和点云的库。它旨在改进 3D 图形的存储和传输。
     * 参考：https://codelabs.developers.google.com/codelabs/draco-3d?hl=zh-cn#0
     */
    label: "Draco压缩模型",
  },
  {
    value: "9",
    /**
     * KTX（Khronos Texture）是一种高效、轻量级的容器格式，用于可靠地将 GPU 纹理分发到各种平台和应用。
     * KTX 2.0 增加了对 Basis Universal 超级压缩 GPU 纹理的支持。
     * 参考：https://www.khronos.org/ktx/
     */
    label: "KTX 2.0纹理压缩气球",
  },
  {
    value: "10",
    label: "实例箱模型",
  },
];

//#endregion

onMounted(() => {
  viewer = cvs.viewer;
});

//#region --------------------- 方法区域----------------
function handleSelectChange(value) {
  switch (value) {
    case "1": {
      createModel("./SampleData/models/CesiumAir/Cesium_Air.glb", 5000.0);
      break;
    }
    case "2": {
      createModel("./SampleData/models/CesiumDrone/CesiumDrone.glb", 150.0);
      break;
    }
    case "3": {
      createModel("./SampleData/models/GroundVehicle/GroundVehicle.glb", 0);
      break;
    }
    case "4": {
      createModel(
        "./SampleData/models/CesiumBalloon/CesiumBalloon.glb",
        1000.0
      );
      break;
    }
    case "5": {
      createModel("./SampleData/models/CesiumMilkTruck/CesiumMilkTruck.glb", 0);
      break;
    }
    case "6": {
      createModel("./SampleData/models/CesiumMan/Cesium_Man.glb", 0);
      break;
    }
    case "7": {
      createModel("./SampleData/models/BoxUnlit/BoxUnlit.gltf", 10.0);
      break;
    }
    case "8": {
      createModel(
        "./SampleData/models/DracoCompressed/CesiumMilkTruck.gltf",
        0
      );
      break;
    }
    case "9": {
      if (!Cesium.FeatureDetection.supportsBasis(viewer.scene)) {
        ElMessage.warning("此浏览器不支持 Basis Universal 压缩纹理");
      } else {
        createModel(
          "../SampleData/models/CesiumBalloonKTX2/CesiumBalloonKTX2.glb",
          1000.0
        );
      }
      break;
    }
    case "10": {
      createModel("./SampleData/models/BoxInstanced/BoxInstanced.gltf", 15);
      break;
    }
    default: {
      break;
    }
  }
}

function createModel(url, height) {
  viewer.entities.removeAll();
  const position = Cesium.Cartesian3.fromDegrees(
    -123.0744619,
    44.0503706,
    height
  );
  const heading = Cesium.Math.toRadians(135);
  const pitch = 0;
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    hpr
  );
  const entity = viewer.entities.add({
    position: position,
    orientation: orientation,
    model: {
      uri: url,
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });
  viewer.trackedEntity = entity;
}

function unlockCamera() {
  viewer.trackedEntity = undefined;
}
//#endregion
</script>

<style lang="scss" scoped>
.control {
  position: absolute;
  top: 20px;
  right: 20px;
  .select {
    width: 200px;
    margin-right: 10px;
  }
}
</style>
