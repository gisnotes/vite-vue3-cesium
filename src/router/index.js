import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      // name: "Cesium一张图-测试弹窗",
      // component: () => import("../views/OneMap.vue"),
      name: "可视化笛卡尔坐标系",
      component: () => import("../views/TestCartesian.vue"),
    },
  ],
});

export default router;
