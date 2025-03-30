<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <el-select
    class="select"
    v-model="type"
    placeholder="空"
    @change="handleTypeChange">
    <el-option
      v-for="item in types"
      :key="item.value"
      :label="item.label"
      :value="item.value" />
  </el-select>
</template>

<script setup>
/**
 * 示例介绍：
 * 该场景最终呈现科罗拉多州区域随着时间推进（1970-2010年），
 * 根据不同人口数据模式（离散区间/连续采样）产生对应的高度变化效果，
 * 数据可视化比例经过适配处理以优化显示效果。
 */

//#region --------------------- 定义变量----------------
let viewer;

const type = ref("Use interval data");

const types = reactive([
  { value: "Use interval data", label: "使用区间数据" },
  { value: "Use sampled data", label: "使用采样数据" },
]);

const czml = [
  {
    id: "document",
    name: "CZML Custom Properties",
    version: "1.0",
    clock: {
      interval: "1970/2010",//时间轴为1970年到2010年
      currentTime: "1970",//起始年份为1970年
      multiplier: 500000000, //以5亿倍速播放
    },
  },
  {
    id: "custom_property_object",
    name: "An object with custom properties",
    properties: {
      constant_property: true,
      //按年代区间划分的离散数据
      population_intervals: [
        {
          interval: "1970/1980",
          number: 2209600,
        },
        {
          interval: "1980/2090",
          number: 2889700,
        },
        {
          interval: "1990/2000",
          number: 3307600,
        },
        {
          interval: "2000/2010",
          number: 4326900,
        },
      ],
      //时间-数值对的连续采样数据
      population_sampled: {
        number: [
          "1970",
          2209600,
          "1980",
          2889700,
          "1990",
          3307600,
          "2000",
          4326900,
          "2010",
          5049100,
        ],
      },
    },
  },
  {
    id: "colorado",
    name: "科罗拉多州",
    polygon: {
      positions: {
        //定义了矩形的四个点经纬度和高程
        cartographicDegrees: [
          -109.03, 41, 0, 
          -102.03, 41, 0, 
          -102.03, 37, 0, 
          -109.03, 37, 0,
        ],
      },
      material: {
        //半透明绿色填充
        solidColor: {
          color: {
            rgba: [0, 255, 0, 150],
          },
        },
      },
      height: 0,
      extrudedHeight: 0,
    },
  },
];

const dataSource = new Cesium.CzmlDataSource();
const loadedPromise = dataSource.load(czml);

//#endregion

function viewerCreated(v) {
  viewer = v;
  viewer.dataSources.add(dataSource);
  viewer.zoomTo(dataSource);
  handleTypeChange(type.value);
}

//#region --------------------- 方法区域----------------
function handleTypeChange(value) {
  switch (value) {
    case "Use interval data":
      setExtrudedHeight("population_intervals");
      break;
    case "Use sampled data":
      setExtrudedHeight("population_sampled");
      break;
    default:
      break;
  }
}

function setExtrudedHeight(propertyName) {
  loadedPromise.then(function () {
    const customPropertyObject = dataSource.entities.getById(
      "custom_property_object"
    );
    const property = customPropertyObject.properties[propertyName];
    const colorado = dataSource.entities.getById("colorado");

    /**
     * 由于人口数值很大，我们将其缩小 50 倍以便在屏幕上显示。
     * 如果我们不需要缩放，我们可以直接将属性分配给 extrudedHeight。
     * 这里我们缩小了50倍colorado.polygon.extrudedHeight = scaleProperty(property, 1 / 50.0);
     */
    colorado.polygon.extrudedHeight = scaleProperty(property, 1 / 50.0);
  });
}

/**
 * 创建动态属性转换器，通过回调函数实时缩放原始数据
 * 通过CallbackProperty实现实时数值计算
 */
function scaleProperty(property, scalingFactor) {
  /**
   * 返回按常数因子缩放另外一个属性的 CallbackProperty
   * Cesium.CallbackProperty: 返回一个 Property类型，其值由回调函数延迟计算。
   */

  return new Cesium.CallbackProperty(function (time, result) {
    result = property.getValue(time, result);
    result = result * scalingFactor;
    return result;
  }, property.isConstant);
}
//#endregion
</script>

<style lang="scss" scoped>
.select {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 180px;
}
</style>
