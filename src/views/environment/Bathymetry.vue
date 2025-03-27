<template>
  <CesiumMap @viewerCreated="viewerCreated" />
  <!-- 参数调整面板 -->
  <div class="panel">
    <el-form :model="form" label-suffix=":" label-width="auto">
      <el-divider content-position="left">海拔</el-divider>
      <el-form-item label="图例">
        <div class="legend">
          <div class="min">-10000 m</div>
          <div class="ramp">
            <canvas ref="rampDivRef"></canvas>
          </div>
          <div class="max">2000 m</div>
        </div>
      </el-form-item>
      <el-divider content-position="left">选项</el-divider>
      <el-form-item label="垂直拉伸">
        <el-slider
          v-model="form.exaggeration"
          show-input
          :min="1"
          :max="5"
          :step="0.1"
          :show-input-controls="false"
          @input="handleExaggerationInput" />
      </el-form-item>
      <el-form-item label="启用光照">
        <el-switch
          v-model="form.enableLighting"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleEnableLightingChange" />
      </el-form-item>
      <el-form-item label="启用雾">
        <el-switch
          v-model="form.enableFog"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="handleEnableFogChange" />
      </el-form-item>
      <el-form-item label="启用色带">
        <el-switch
          v-model="form.showElevationColorRamp"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="updateGlobeMaterial" />
      </el-form-item>
      <el-form-item label="启用等高线">
        <el-switch
          v-model="form.showContourLines"
          inline-prompt
          active-text="开"
          inactive-text="关"
          @change="updateGlobeMaterial" />
      </el-form-item>
      <el-form-item label="反转等高线颜色">
        <el-switch
          v-model="form.invertContourLines"
          inline-prompt
          active-text="是"
          inactive-text="否"
          @change="updateGlobeMaterial" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
/**
 * 示例介绍：可视化全球高分辨率海底地形
 */
//#region --------------------- 定义变量----------------
let viewer, scene, globe, camera, cameraMaxHeight;

// 地球材质
const minHeight = -10000.0;
// const seaLevel = 0.0;
const maxHeight = 2000.0;
const contourLineSpacing = 500.0;

const range = maxHeight - minHeight;
/**
 * @description 将高程值归一化，即将高程映射到0~1的范围
 *
 * @param height {number} 高程值
 * @return {number} 归一化后的高程
 */
const normalizeHeight = (height) => (height - minHeight) / range;

/**
 * @type {Cesium.Cartesian3} 临时法线
 */
const scratchNormal = new Cesium.Cartesian3();

const form = reactive({
  exaggeration: 1.0,
  enableLighting: true,
  enableFog: true,
  showElevationColorRamp: true,
  showContourLines: true,
  invertContourLines: false,
});

const rampDivRef = ref();

//#endregion

onMounted(() => {
  createColorRamp();
});

function viewerCreated(viewerObj) {
  initDataConfig(viewerObj);
  initEvents();
  addBathymetryData();
  updateGlobeMaterial();
  setCameraInitView();
}

//#region --------------------- 方法区域----------------
/**
 * 创建色带
 * 参考文档：https://matplotlib.org/cmocean/#deep
 */
function createColorRamp() {
  rampDivRef.value.width = 200;
  rampDivRef.value.height = 30;
  const ctx = rampDivRef.value.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, 200, 0);

  grd.addColorStop(normalizeHeight(maxHeight), "#B79E6C");
  grd.addColorStop(normalizeHeight(100.0), "#FBFFEE");
  grd.addColorStop(normalizeHeight(0.0), "#F9FCCA");
  grd.addColorStop(normalizeHeight(-500.0), "#BDE7AD");
  grd.addColorStop(normalizeHeight(-1000.0), "#81D2A3");
  grd.addColorStop(normalizeHeight(-1500.0), "#5AB7A4");
  grd.addColorStop(normalizeHeight(-2000.0), "#4C9AA0");
  grd.addColorStop(normalizeHeight(-2500.0), "#437D9A");
  grd.addColorStop(normalizeHeight(-4000.0), "#3E6194");
  grd.addColorStop(normalizeHeight(-5000.0), "#424380");
  grd.addColorStop(normalizeHeight(-8000.0), "#392D52");
  grd.addColorStop(normalizeHeight(minHeight), "#291C2F");

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, rampDivRef.value.width, rampDivRef.value.height);

  return rampDivRef.value;
}

function initDataConfig(viewerObj) {
  viewer = viewerObj;
  scene = viewer.scene;
  /**
   * 使用如下示例类似的山体阴影效果照亮场景：
   * https://pro.arcgis.com/en/pro-app/latest/tool-reference/3d-analyst/how-hillshade-works.htm
   */
  scene.light = new Cesium.DirectionalLight({
    direction: new Cesium.Cartesian3(1, 0, 0), // 更新每一帧
  });
  globe = scene.globe;
  camera = scene.camera;
  //防止用户倾斜超过椭球体表面
  scene.screenSpaceCameraController.maximumTiltAngle = Math.PI / 2.0;
  globe.enableLighting = true;
  globe.maximumScreenSpaceError = 1.0; // 加载更高分辨率的瓦片以获得更好的海底阴影
  cameraMaxHeight = globe.ellipsoid.maximumRadius * 2;
}

function initEvents() {
  scene.preRender.addEventListener(function (scene, time) {
    const surfaceNormal = globe.ellipsoid.geodeticSurfaceNormal(
      camera.positionWC,
      scratchNormal
    );
    const negativeNormal = Cesium.Cartesian3.negate(
      surfaceNormal,
      surfaceNormal
    );
    scene.light.direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.add(negativeNormal, camera.rightWC, surfaceNormal),
      scene.light.direction
    );

    const zoomMagnitude =
      Cesium.Cartesian3.magnitude(camera.positionWC) / cameraMaxHeight;

    updateGlobeMaterialUniforms(zoomMagnitude);
  });
}

async function addBathymetryData() {
  try {
    viewer.terrainProvider = await Cesium.createWorldBathymetryAsync({
      requestVertexNormals: true,
    });
  } catch (err) {
    ElMessage.error(`WorldBathymetry数据加载出错: ${err}`);
  }
}

function updateGlobeMaterial() {
  let material;
  if (form.showContourLines) {
    if (form.showElevationColorRamp) {
      material = getElevationContourMaterial();
      let shadingUniforms = material.materials.elevationRampMaterial.uniforms;
      shadingUniforms.image = createColorRamp();
      shadingUniforms.minimumHeight = minHeight * scene.verticalExaggeration;
      shadingUniforms.maximumHeight = maxHeight * scene.verticalExaggeration;
      shadingUniforms = material.materials.contourMaterial.uniforms;
      shadingUniforms.width = 1.0;
      shadingUniforms.spacing = contourLineSpacing * scene.verticalExaggeration;
      shadingUniforms.color = form.invertContourLines
        ? Cesium.Color.WHITE.withAlpha(0.5)
        : Cesium.Color.BLACK.withAlpha(0.5);
      globe.material = material;
      return;
    }

    material = Cesium.Material.fromType("ElevationContour");
    const shadingUniforms = material.uniforms;
    shadingUniforms.width = 1.0;
    shadingUniforms.spacing = contourLineSpacing * scene.verticalExaggeration;
    shadingUniforms.color = form.invertContourLines
      ? Cesium.Color.WHITE
      : Cesium.Color.BLACK;
    globe.material = material;
    return;
  }

  if (form.showElevationColorRamp) {
    material = Cesium.Material.fromType("ElevationRamp");
    const shadingUniforms = material.uniforms;
    shadingUniforms.image = createColorRamp();
    shadingUniforms.minimumHeight = minHeight * scene.verticalExaggeration;
    shadingUniforms.maximumHeight = maxHeight * scene.verticalExaggeration;
    globe.material = material;
    return;
  }

  globe.material = material;
}

/**
 * 设置相机初始视角
 */
function setCameraInitView() {
  scene.camera.setView({
    destination: new Cesium.Cartesian3(
      -3877002.181627189,
      5147948.256341475,
      864384.3423478723
    ),
    orientation: new Cesium.HeadingPitchRoll(
      5.914830423853524,
      -0.7139104486007932,
      0.00017507632714419685
    ),
  });
}

function handleExaggerationInput(value) {
  scene.verticalExaggeration = Number(value);
}

function handleEnableLightingChange(checked) {
  globe.enableLighting = checked;
}

function handleEnableFogChange(checked) {
  scene.fog.enabled = checked;
  globe.showGroundAtmosphere = checked;
}

function updateGlobeMaterialUniforms(zoomMagnitude) {
  const material = globe.material;
  if (!Cesium.defined(material)) {
    return;
  }

  const spacing = 5.0 * Math.pow(10, Math.floor(4 * zoomMagnitude));
  if (form.showContourLines) {
    const uniforms = form.showElevationColorRamp
      ? material.materials.contourMaterial.uniforms
      : material.uniforms;

    uniforms.spacing = spacing * scene.verticalExaggeration;
  }

  if (form.showElevationColorRamp) {
    const uniforms = form.showContourLines
      ? material.materials.elevationRampMaterial.uniforms
      : material.uniforms;
    uniforms.spacing = spacing * scene.verticalExaggeration;
    uniforms.minimumHeight = minHeight * scene.verticalExaggeration;
    uniforms.maximumHeight = maxHeight * scene.verticalExaggeration;
  }
}

/**
 * 创建一种同时具有高程阴影和等高线的复合材料
 */
function getElevationContourMaterial() {
  return new Cesium.Material({
    fabric: {
      type: "ElevationColorContour",
      materials: {
        contourMaterial: {
          type: "ElevationContour",
        },
        elevationRampMaterial: {
          type: "ElevationRamp",
        },
      },
      components: {
        diffuse:
          "(1.0 - contourMaterial.alpha) * elevationRampMaterial.diffuse + contourMaterial.alpha * contourMaterial.diffuse",
        alpha: "max(contourMaterial.alpha, elevationRampMaterial.alpha)",
      },
    },
    translucent: false,
  });
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

  .legend {
    display: flex;
    align-items: center;

    .min,
    .max {
      font-size: 13px;
    }

    .ramp {
      flex: 1;
      margin: 0 5px;
      height: 30px;
      line-height: 30px;
    }

    .max {
      margin-right: 5px;
    }
  }
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
