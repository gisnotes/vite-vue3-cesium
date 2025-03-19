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
 * 为点云数据配置各种不同的样式
 * 关于下述样式采用的是3D Tiles Styling language来书写的，具体参考：
 * 1. https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileStyle.html?classFilter=Cesium3DTileStyle
 * 2. https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling
 *
 * 举例：如下color()函数相当于调用了color('#FFFFFF')，移步至：https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling#color
 * 其他函数参考上述提供的github链接学习即可。
 */

//#region --------------------- 定义变量----------------
let viewer, scene, tileset, style;

const styleVal = ref("Step Red/Blue");

/**
 * @type {Array} 样式列表
 */
const styles = [
  { value: "Step Red/Blue", label: "红蓝阈值分段" },
  { value: "Interpolate Red/Blue", label: "红蓝线性渐变" },
  { value: "Red", label: "纯红色" },
  { value: "Color Gradient", label: "动态颜色渐变" },
  { value: "Color Ramp", label: "多级色阶分段" },
  { value: "Transparency", label: "透明度动态控制" },
  { value: "Hide Low Temperature", label: "低温隐藏" },
  { value: "Show Subsections", label: "ID区间筛选显示" },
  { value: "Mod", label: "奇偶ID筛选" },
  { value: "Abs", label: "绝对值着色" },
  { value: "Trigonometric Functions", label: "三角函数混合着色" },
  { value: "Arc Trigonometric Functions", label: "反三角函数混合着色" },
  { value: "Sqrt", label: "平方根动态着色" },
  { value: "Sign", label: "坐标符号映射" },
  { value: "Rounding Functions", label: "坐标取整着色" },
  { value: "Exp and Log Functions", label: "颜色通道做指数/对数运算" },
  { value: "Fractional Part", label: "截取小数部分着色" },
  { value: "Pow", label: "幂函数(三次方)着色" },
  { value: "Min and Max", label: "坐标极值组成颜色通道" },
  { value: "Clamp and Mix", label: "温度值的约束(clamp)" },
  { value: "Secondary Color", label: "辅助色分级控制" },
  { value: "Use point colors", label: "点颜色灰度混合" },
  { value: "Use point positions", label: "坐标阈值筛选" },
  { value: "Color based on position", label: "依据坐标着色" },
  { value: "Style point size", label: "依据温度来设置点尺寸" },
  { value: "Multiple defines", label: "多个属性形成的复合样式" },
  { value: "No Style", label: "无样式" },
];
//#endregion

function viewerCreated(v) {
  viewer = v;
  scene = viewer.scene;
  viewer.clock.currentTime = new Cesium.JulianDate(2457522.154792);
  addPointCloudData();
}

//#region --------------------- 方法区域----------------
async function addPointCloudData() {
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(
      "./SampleData/Cesium3DTiles/PointCloud/PointCloudWithPerPointProperties/tileset.json"
    );
    //我们最好在加载tileset之后再设置样式
    handleStyleChange(styleVal.value);
    viewer.scene.primitives.add(tileset);
    viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(1.0, -1.0, 15.0));
  } catch (error) {
    ElMessage.error(`加载点云数据加载出错: ${error}`);
  }
}

function handleStyleChange(value) {
  switch (value) {
    case "Step Red/Blue":
      style = {
        color: "${temperature} > 0.5 ? color('red') : color('blue')",
      };
      break;
    case "Interpolate Red/Blue":
      style = {
        color:
          "color('red') * ${temperature} + color('blue') * (1.0 - ${temperature})",
      };
      break;
    case "Red":
      style = {
        color: "color('#ff0000')",
      };
      break;
    case "Color Gradient":
      style = {
        color: "color() * ${temperature}",
      };
      break;
    case "Color Ramp":
      style = {
        color: {
          conditions: [
            ["${temperature} < 0.1", "color('#000099')"],
            ["${temperature} < 0.2", "color('#00cc99', 1.0)"],
            ["${temperature} < 0.3", "color('#66ff33', 0.5)"],
            ["${temperature} < 0.4", "rgba(255, 255, 0, 0.1)"],
            ["${temperature} < 0.5", "rgb(255, 128, 0)"],
            ["${temperature} < 0.6", "color('red')"],
            ["${temperature} < 0.7", "color('rgb(255, 102, 102)')"],
            ["${temperature} < 0.8", "hsl(0.875, 1.0, 0.6)"],
            ["${temperature} < 0.9", "hsla(0.83, 1.0, 0.5, 0.1)"],
            ["true", "color('#FFFFFF', 1.0)"],
          ],
        },
      };
      break;
    case "Transparency":
      style = {
        color: "rgba(0, 255, 0, ${temperature})",
      };
      break;
    case "Hide Low Temperature":
      style = {
        color: "rgb(${temperature}*255, 0, 0)",
        show: "${temperature} > 0.3",
      };
      break;
    case "Show Subsections":
      style = {
        show: "${id} === 1 || ${id} > 250 && ${id} < 300",
      };
      break;
    case "Mod":
      style = {
        show: "${id} % 2 === 0",
      };
      break;
    case "Abs":
      style = {
        color: "color() * abs(${temperature} - 0.5)",
      };
      break;
    case "Trigonometric Functions":
      style = {
        color:
          "color() * radians(cos(${temperature})) + color() * sin(${temperature}) + color() * tan(${temperature})",
      };
      break;
    case "Arc Trigonometric Functions":
      style = {
        color:
          "color() * acos(degrees(${temperature})) + color() * asin(${temperature}) + color() * atan(${temperature}) + color() * atan2(${POSITION}[0],${temperature})",
      };
      break;
    case "Sqrt":
      style = {
        color: "color() * sqrt(${temperature})",
      };
      break;
    case "Sign":
      style = {
        color:
          "rgb(sign(${POSITION}[0]) * 255, sign(${POSITION}[1]) * 255, sign(${POSITION}[2]) * 255)",
      };
      break;
    case "Rounding Functions":
      style = {
        color:
          "rgb(floor(${POSITION}[0]) * 255, ceil(${POSITION}[1]) * 255, round(${POSITION}[2]) * 255)",
      };
      break;
    case "Exp and Log Functions":
      style = {
        color:
          "rgb(log(${POSITION}[0]) * 255, log2(${POSITION}[1]) * 255 + exp2(${POSITION}[1]) * 255, exp(${POSITION}[2]) * 255)",
      };
      break;
    case "Fractional Part":
      style = {
        color:
          "rgb(fract(${POSITION}[0]) * 255, fract(${POSITION}[1]) * 255, fract(${POSITION}[2]) * 255)",
      };
      break;
    case "Pow":
      style = {
        color: "color() * pow(${temperature}, 3)",
      };
      break;
    case "Min and Max":
      style = {
        color:
          "rgb(min(${POSITION}.x, 0.75) * 255, max(${POSITION}.z, 0.25) * 255, 255)",
      };
      break;
    case "Clamp and Mix":
      style = {
        color: "color() * clamp(${temperature}, 0.1, 0.2)",
      };
      break;
    case "Secondary Color":
      style = {
        color: {
          conditions: [
            ["${id} < 250", "vec4(${secondaryColor}, 1.0)"],
            ["${id} < 500", "vec4(${secondaryColor} * ${secondaryColor}, 1.0)"],
            ["${id} < 750", "vec4(${secondaryColor} / 5.0, 1.0)"],
            [
              "${id} < 1000",
              "rgb(0, 0, Number(${secondaryColor}.x < 0.5) * 255)",
            ],
          ],
        },
      };
      break;
    case "Use point colors":
      style = {
        color: "${COLOR} * ${temperature} + rgb(128,128,128)",
      };
      break;
    case "Use point positions":
      style = {
        show: "${POSITION}[0] > 0.5 || ${POSITION}[1] > 0.5 || ${POSITION}[2] > 0.5",
      };
      break;
    case "Color based on position":
      style = {
        color: "vec4(${POSITION}, 1.0)",
      };
      break;
    case "Style point size":
      style = {
        color: "color('red')",
        pointSize: "${temperature} * 10",
      };
      break;
    case "Multiple defines":
      style = {
        defines: {
          length: "length(${POSITION})",
          time: "${tiles3d_tileset_time} * 3.0",
        },
        color: {
          conditions: [
            ["${length} < 0.5", "${length} * color('red')"],
            [
              "${length} < 1.0",
              "vec4(vec3(${temperature} * fract(${time})), 1.0)",
            ],
            ["true", "${COLOR}"],
          ],
        },
        pointSize: "5.0 - ${length} * 2.0",
        show: "${length} < 2.0",
      };
      break;
    case "No Style":
      style = {};
      break;
    default:
      style = {};
      break;
  }
  // defaultValue(a, b):如果不是 undefined，则返回第一个参数，否则返回第二个参数。用于设置参数的默认值。
  style.pointSize = Cesium.defaultValue(style.pointSize, 5.0);
  if (!Cesium.defined(tileset)) {
    return;
  }
  tileset.style = new Cesium.Cesium3DTileStyle(style);
}
//#endregion
</script>

<style lang="scss" scoped>
.select {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 240px;
}
</style>
