<script setup>
/**
 * 示例介绍：
 * 门把手、门、屋顶和墙壁可通过批处理表层次结构（batch table hierarchy）设置样式。
 * 由于建筑物和区域没有对应的几何体作为支撑，因此无法直接设置其样式。
 * 不过，在编写样式时，可以考虑到建筑物和区域的属性。
 *
 * batch table(批处理表)的一些示例属性包括建筑物高度、地理坐标和数据库主键。
 * 关于batch table，请参考：https://github.com/CesiumGS/3d-tiles/blob/main/specification/TileFormats/BatchTable/README.adoc#tileformats-batchtable-batch-table
 */

/**
 * 层级结构布局（门把手作为门的子级对象）:

  zone0
    building0
      roof0
      roof0
      wall0
      // 短横线"-"表示门与门把手的附属关系
      door0 - doorknob0  门把手0
      door1 - doorknob1  门把手1
      door2 - doorknob2  ...
      door3 - doorknob3  ...
    building1
      roof1
      wall1
      door4 - doorknob4
      door5 - doorknob5
      door6 - doorknob6
      door7 - doorknob7
    building2
      roof2
      wall2
      door8 - doorknob8
      door9 - doorknob9
      door10 - doorknob10
      door11 - doorknob11

类属性定义（保留原始属性命名规范）:

  zone:
    * zone_building  // 区域所属建筑组
    * zone_name      // 区域命名标识
  building:
    * building_area  // 建筑面积(m²)
    * building_name  // 建筑命名标识
  wall:
    * wall_paint     // 墙面涂料类型
    * wall_windows   // 窗户配置参数
    * wall_name      // 墙面命名标识
  roof:
    * roof_paint     // 屋顶材料类型
    * roof_name      // 屋顶命名标识
  door:
    * door_mass      // 门体质量(kg)
    * door_width     // 门幅尺寸(cm)
    * door_name      // 门体命名标识
  doorknob:
    * doorknob_size  // 把手规格(mm)
    * doorknob_name  // 把手命名标识
 */

/**
 * 关于下述样式采用的是3D Tiles Styling language来书写的，具体参考：
 * 1. https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileStyle.html?classFilter=Cesium3DTileStyle
 * 2. https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling
 */

//#region --------------------- 定义变量----------------
let viewer, tileset, handler;
const hiddenFeatures = ref([]);

const style = ref("No style");

//属性弹窗
let title = ref("弹窗标题");
let yOffset = ref(12);
let position = ref({});
const popupType = ref("");

const roof = reactive({});
const wall = reactive({});
const door = reactive({});
const doorknob = reactive({});

/**
 * @type {Array} 要加载的模型列表
 */
const styles = [
  { value: "No style", label: "无样式" },
  { value: "Color all doors", label: "给所有门涂色" },
  {
    value: "Color all features derived from door",
    label: "给所有门及与门相关的(门把手)要素涂色",
  },
  { value: "Color by building", label: "按建筑物的名称指定整个建筑物颜色" },
  {
    value: "Color features by class name",
    label: "按class名称来为要素指定颜色",
  },
  { value: "Style by height", label: "按高度指定样式" },
];

//#endregion

function viewerCreated(v) {
  viewer = v;
  viewer.clock.currentTime = new Cesium.JulianDate(2457522.154792);
  addTilesets();
  initEvents();
}

onBeforeUnmount(() => {
  //移除监听器
  if (handler) {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    handler = handler.destroy();
  }
});

//#region --------------------- 方法区域----------------

async function addTilesets() {
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(
      "./SampleData/Cesium3DTiles/Hierarchy/BatchTableHierarchy/tileset.json"
    );

    viewer.scene.primitives.add(tileset);
    viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.0, -0.3, 100.0));
    tileset.style = new Cesium.Cesium3DTileStyle({}); //默认无样式
  } catch (error) {
    ElMessage.error(`tileset数据加载出错: ${error}`);
  }
}

function initEvents() {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  //用鼠标中键单击要素则隐藏要素
  handler.setInputAction(function (movement) {
    const feature = viewer.scene.pick(movement.position);
    if (!Cesium.defined(feature)) {
      return;
    }
    feature.show = false;
    hiddenFeatures.value.push(feature);
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  //用鼠标左键单击弹窗展示要素信息
  handler.setInputAction(function (movement) {
    const feature = viewer.scene.pick(movement.position);
    if (!Cesium.defined(feature)) {
      return;
    }
    updatePopup(feature, movement);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

/**
 * 处理拾取的要素属性
 *
 * @param {Cesium.Cesium3DTileFeature} feature 拾取的要素
 * @param {Cesium.ScreenSpaceEventHandler.PositionedEvent} e 在屏幕上的单个位置发生的事件，它的属性position是一个Cartesian2对象
 */
function updatePopup(feature, e) {
  const cartesianPos = viewer.scene.pickPosition(e.position);
  if (feature instanceof Cesium.Cesium3DTileFeature) {
    const propertyIds = feature.getPropertyIds();
    // console.log("propertyIds: ", propertyIds);
    if (propertyIds.includes("roof_name")) {
      popupType.value = "roof";
      roof.roofName = feature.getProperty("roof_name");
      title.value = "屋顶-" + roof.roofName;
      roof.roofPaint = feature.getProperty("roof_paint");
      roof.height = feature.getProperty("height");
      roof.area = feature.getProperty("area");
    } else if (propertyIds.includes("wall_name")) {
      popupType.value = "wall";
      wall.wallName = feature.getProperty("wall_name");
      title.value = "墙-" + wall.wallName;
      wall.wallPaint = feature.getProperty("wall_paint");
      wall.wallWindows = feature.getProperty("wall_windows");
      wall.height = feature.getProperty("height");
      wall.area = feature.getProperty("area");
    } else if (
      //门的属性里没有doorknob_name属性
      propertyIds.includes("door_name") &&
      !propertyIds.includes("doorknob_name")
    ) {
      popupType.value = "door";
      door.doorName = feature.getProperty("door_name");
      title.value = "门-" + door.doorName;
      door.doorWidth = feature.getProperty("door_width");
      door.doorMass = feature.getProperty("door_mass");
      door.height = feature.getProperty("height");
      door.area = feature.getProperty("area");
    } else if (
      //门把手的属性里既有door_name又有doorknob_name属性
      propertyIds.includes("door_name") &&
      propertyIds.includes("doorknob_name")
    ) {
      popupType.value = "doorknob";
      doorknob.doorknobName = feature.getProperty("doorknob_name");
      title.value = "门把手-" + doorknob.doorknobName;
      doorknob.doorknobSize = feature.getProperty("doorknob_size");
      doorknob.height = feature.getProperty("height");
      doorknob.area = feature.getProperty("area");
    }
    position.value = cartesianPos;
  }
}

function handleRecovery() {
  if (hiddenFeatures.value.length) {
    hiddenFeatures.value.forEach((f) => {
      f.show = true;
    });
    hiddenFeatures.value = []; //清空数组
  }
}

function handleChangeStyle(value) {
  let style;
  switch (value) {
    case "No style":
      style = {};
      break;
    case "Color all doors":
      /**
       * isExactClass：它是Cesium提供的一个内置函数，
       * 专门用来检查3D Tiles数据中某个要素的分类（class）是否精确匹配某个字符串。
       */
      style = {
        color: {
          conditions: [
            ["isExactClass('door')", "color('orange')"], //如果类别是“door”，涂成橙色
            ["true", "color('white')"], //如果不是“door”，就涂成白色
          ],
        },
      };
      break;
    case "Color all features derived from door":
      style = {
        color: {
          conditions: [
            ["isClass('door')", "color('orange')"],
            ["true", "color('white')"],
          ],
        },
      };
      break;
    case "Color by building":
      style = {
        color: {
          conditions: [
            ["${building_name} === 'building0'", "color('purple')"],
            ["${building_name} === 'building1'", "color('red')"],
            ["${building_name} === 'building2'", "color('orange')"],
            ["true", "color('blue')"],
          ],
        },
      };
      break;
    case "Color features by class name":
      //suffix后缀的意思。
      style = {
        defines: {
          suffix: "regExp('door(.*)').exec(getExactClassName())",
        },
        color: {
          conditions: [
            ["${suffix} === 'knob'", "color('yellow')"],
            ["${suffix} === ''", "color('lime')"],
            ["${suffix} === null", "color('gray')"],
            ["true", "color('blue')"],
          ],
        },
      };
      break;
    case "Style by height":
      style = {
        color: {
          conditions: [
            ["${height} >= 10", "color('purple')"],
            ["${height} >= 6", "color('red')"],
            ["${height} >= 5", "color('orange')"],
            ["true", "color('blue')"],
          ],
        },
      };
      break;
    default:
      style = {};
      break;
  }
  if (!Cesium.defined(tileset)) {
    return;
  }

  tileset.style = new Cesium.Cesium3DTileStyle(style);
}

function closePopup() {
  position.value = {};
}
//#endregion
</script>

<template>
  <div class="container">
    <CesiumMap @viewerCreated="viewerCreated" />
    <!-- 参数调整面板 -->
    <div class="panel">
      <el-form label-suffix=":" label-width="auto">
        <el-form-item label="模型样式">
          <el-select
            v-model="style"
            placeholder="请选择样式"
            @change="handleChangeStyle">
            <el-option
              v-for="item in styles"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        <div style="text-align: right">
          <el-button
            size="small"
            type="primary"
            @click="handleRecovery"
            :disabled="!hiddenFeatures.length">
            恢复显示隐藏要素
          </el-button>
        </div>
      </el-form>
    </div>
    <!-- 属性弹窗 -->
    <Popup :title :yOffset :position @close="closePopup">
      <el-descriptions class="margin-top" :column="1" :size="'small'" border>
        <template v-if="popupType === 'roof'">
          <el-descriptions-item label="屋顶涂料">
            {{ roof.roofPaint }}
          </el-descriptions-item>
          <el-descriptions-item label="高度">
            {{ roof.height }}
          </el-descriptions-item>
          <el-descriptions-item label="面积">
            {{ roof.area }}
          </el-descriptions-item>
        </template>
        <template v-if="popupType === 'wall'">
          <el-descriptions-item label="墙壁涂料">
            {{ wall.wallPaint }}
          </el-descriptions-item>
          <el-descriptions-item label="窗户数量">
            {{ wall.wallWindows }}
          </el-descriptions-item>
          <el-descriptions-item label="高度">
            {{ wall.height }}
          </el-descriptions-item>
          <el-descriptions-item label="面积">
            {{ wall.area }}
          </el-descriptions-item>
        </template>
        <template v-if="popupType === 'door'">
          <el-descriptions-item label="门的宽度">
            {{ door.doorWidth }}
          </el-descriptions-item>
          <el-descriptions-item label="门的质量">
            {{ door.doorMass }}
          </el-descriptions-item>
          <el-descriptions-item label="门的高度">
            {{ door.height }}
          </el-descriptions-item>
          <el-descriptions-item label="门的面积">
            {{ door.area }}
          </el-descriptions-item>
        </template>
        <template v-if="popupType === 'doorknob'">
          <el-descriptions-item label="门把手大小">
            {{ doorknob.doorknobSize }}
          </el-descriptions-item>
          <el-descriptions-item label="门把手高度">
            {{ doorknob.height }}
          </el-descriptions-item>
          <el-descriptions-item label="门把手面积">
            {{ doorknob.area }}
          </el-descriptions-item>
        </template>
      </el-descriptions>
    </Popup>
  </div>
</template>

<style lang="scss" scoped>
.container {
  position: relative;
  height: 100%;
  overflow: hidden;

  .panel {
    position: absolute;
    width: 420px;
    top: 10px;
    right: 10px;
    background-color: white;
    border-radius: 4px;
    z-index: 2;
    padding: 10px;
    opacity: 0.96;
    box-shadow: rgba(195, 191, 188, 0.7) 0px 1px 2px 0px,
      rgba(195, 191, 188, 0.85) 0px 2px 4px 2px;
  }
}

:deep(.el-descriptions__table.is-bordered .el-descriptions__cell) {
  width: 90px;
}

:deep(.cs-popup) {
  width: 300px;
}

:deep(.cs-popup-content) {
  width: 100%;
}
</style>
