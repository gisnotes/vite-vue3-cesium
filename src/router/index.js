import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      meta: {
        title: "聚类",
      },
      // #region 已完成
      // component: () => import("../views/OneMap.vue"),
      // component: () => import("../views/cartesian/TestCartesian.vue"),
      // component: () => import("../views/camera/TestCamera.vue"),
      // component: () => import("../views/camera/TestCamera2.vue"),
      // component: () => import("../views/pick/3DTilesFeaturePicking.vue"),
      // component: () => import("../views/pick/I3SFeaturePicking.vue"),
      // component: () => import("../views/pick/Picking.vue"),
      // component: () => import("../views/models/3DModels.vue"),
      // component: () => import("../views/models/3DModelsColoring.vue"),
      // component: () => import("../views/3dtiles/3DTilesAdjustHeight.vue"),
      // component: () => import("../views/3dtiles/3DTilesClippingPlanes.vue"),
      // component: () => import("../views/3dtiles/3DTilesBatchTableHierarchy.vue"),
      // component: () => import("../views/3dtiles/3DTilesCompare.vue"),
      // component: () => import("../views/3dtiles/3DTilesFeatureStyling.vue"),
      // component: () => import("../views/3dtiles/3DTilesInteractivity.vue"),
      // component: () => import("../views/3dtiles/3DTilesPointCloudStyling.vue"),
      // component: () => import("../views/3dtiles/3DTilesVerticalExaggeration.vue"),
      // component: () => import("../views/3dtiles/3DTilesInspector.vue"),
      // component: () => import("../views/3dtiles/3DTilesFormats.vue"),
      // component: () => import("../views/environment/Atmosphere.vue"),
      // component: () => import("../views/environment/Bathymetry.vue"),
      // component: () => import("../views/environment/Billboards.vue"),
      // component: () => import("../views/mapserver/BingMap.vue"),
      // component: () => import("../views/environment/BloomEffect.vue"),
      // component: () => import("../views/mapserver/BlueMarble.vue"),
      // component: () => import("../views/geometry/Box.vue"),
      // component: () => import("../views/czml/CZMLCustomProperties.vue"),
      // #endregion
      component: () => import("../views/other/Clustering.vue"),
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  } else {
    document.title = "Cesium一张图";
  }

  next();
});

export default router;
