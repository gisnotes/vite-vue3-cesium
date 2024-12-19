<template>
  <CesiumMap @viewerCreated="viewerCreated" />
</template>

<script setup>
import {
  DebugModelMatrixPrimitive,
  Cartesian3,
  Color,
  Entity,
  ArcType,
} from "cesium";
import useCSViewerStore from "@/stores/csViewer.js";

const cvs = useCSViewerStore();

function viewerCreated() {
  setViewerParams();
  addThreeDimensionalCartesianCoordinateSystem();
}

function setViewerParams() {
  //开启地表透明：方便可视化笛卡尔坐标系
  cvs.viewer.scene.globe.translucency.enabled = true;
  cvs.viewer.scene.globe.translucency.frontFaceAlpha = 0.5;

  //设置Camera的视角
  cvs.viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(45.0, 20.0, 17850000),
  });
}

function addThreeDimensionalCartesianCoordinateSystem() {
  //添加坐标轴
  const DEFAULT_AXIS_LENGTH = 10000000.0;
  cvs.viewer.scene.primitives.add(
    new DebugModelMatrixPrimitive({
      length: DEFAULT_AXIS_LENGTH, //坐标轴的长度，单位是米。默认值为10000000.0
      width: 10.0, //坐标轴的宽度，单位是像素，默认值为2.0
    })
  );
  const LabelHeight = DEFAULT_AXIS_LENGTH * 1.02;
  //添加原点文字
  // addCoordinateLabel(Cartesian3.ZERO, "原点");
  const ZERO_OFFSET = -0.03 * DEFAULT_AXIS_LENGTH;
  const zeroLabel = createLabel(
    new Cartesian3(ZERO_OFFSET, ZERO_OFFSET, ZERO_OFFSET),
    "原点"
  );
  cvs.viewer.entities.add(zeroLabel);
  //添加坐标轴x文字标签
  const xLabel = createLabel(new Cartesian3(LabelHeight, 0.0, 0.0), "x");
  cvs.viewer.entities.add(xLabel);
  //添加坐标轴y文字标签
  const yLabel = createLabel(new Cartesian3(0.0, LabelHeight, 0.0), "y");
  cvs.viewer.entities.add(yLabel);
  //添加坐标轴z文字标签
  const zLabel = createLabel(new Cartesian3(0.0, 0.0, LabelHeight), "z");
  cvs.viewer.entities.add(zLabel);
  //绘制赤道线，即0度纬线
  const equator = createParallel(0, Color.BLUE);
  cvs.viewer.entities.add(equator);
  //添加赤道线文字标签
  const equatorLabel = createLabel(
    Cartesian3.fromDegrees(45.0, 0.0, 300000.0),
    "赤道"
  );
  cvs.viewer.entities.add(equatorLabel);
  //绘制本初子午线，即0度经线
  const primeMeridian = createMeridian(0, Color.RED);
  cvs.viewer.entities.add(primeMeridian);
  //添加本初子午线文字标签
  const primeMeridianLabel = createLabel(
    Cartesian3.fromDegrees(0.0, 20.0, 300000.0),
    "本初子午线"
  );
  cvs.viewer.entities.add(primeMeridianLabel);
  //添加90度经线
  const meridian90 = createMeridian(90, Color.YELLOW);
  cvs.viewer.entities.add(meridian90);
  //添加90度经线
  const meridian90Label = createLabel(
    Cartesian3.fromDegrees(90.0, 20.0, 300000.0),
    "90度经线"
  );
  cvs.viewer.entities.add(meridian90Label);
}

//添加坐标轴标签文字标签
function createLabel(position, text) {
  return {
    position,
    label: { text },
  };
}

/**
 * 绘制纬线圈
 * @param {number} latitude 维度
 * @param {Color} color 材质颜色
 * @returns {Entity} 返回实体对象
 */
function createParallel(latitude, color) {
  return {
    polyline: {
      positions: Cartesian3.fromDegreesArray([
        -180,
        latitude,
        -90,
        latitude,
        0,
        latitude,
        90,
        latitude,
        180,
        latitude,
      ]),
      width: 2,
      arcType: ArcType.RHUMB,
      material: color,
    },
  };
}

function createMeridian(longitude, color) {
  return {
    polyline: {
      positions: Cartesian3.fromDegreesArray([
        longitude,
        90,
        longitude,
        0,
        longitude,
        -90,
      ]),
      width: 2,
      arcType: ArcType.RHUMB,
      material: color,
    },
  };
}
</script>
