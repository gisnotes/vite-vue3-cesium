import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import "cesium/Build/CesiumUnminified/Widgets/widgets.css";
import "@/assets/index.css"; //自定义样式

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
