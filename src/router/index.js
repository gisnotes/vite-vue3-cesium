import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      meta: {
        title: "3d模型加载",
      },
      // component: () => import("../views/OneMap.vue"),
      // component: () => import("../views/cartesian/TestCartesian.vue"),
      // component: () => import("../views/camera/TestCamera.vue"),
      // component: () => import("../views/camera/TestCamera2.vue"),
      // component: () => import("../views/pick/3DTilesFeaturePicking.vue"),
      // component: () => import("../views/pick/I3SFeaturePicking.vue"),
      // component: () => import("../views/pick/Picking.vue"),
      component: () => import("../views/models/3DModels.vue"),
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
