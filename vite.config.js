import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteExternalsPlugin } from "vite-plugin-externals";
import { insertHtml, h } from "vite-plugin-insert-html";
import { viteStaticCopy } from "vite-plugin-static-copy";
import compress from "vite-plugin-compression";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";

import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = "env"; //环境变量文件的文件夹，相对于项目的路径，也可以用 nodejs 函数拼接绝对路径
  const isProd = mode === "production";

  const env = loadEnv(mode, envDir);
  const cesiumBaseUrl = env["VITE_CESIUM_BASE_URL"];
  const base = "/";

  const plugins = [
    vue(),
    viteExternalsPlugin({
      cesium: "Cesium", // 外部化 cesium 依赖，之后全局访问形式是 window['Cesium']
    }),
    insertHtml({
      head: [
        // 生产模式使用 CDN 或已部署的 CesiumJS 在线库链接，开发模式用拷贝的库文件，根据 VITE_CESIUM_BASE_URL 自动拼接
        h("script", {
          // 因为涉及前端路径访问，所以开发模式最好显式拼接 base 路径，适配不同 base 路径的情况
          src: isProd
            ? `${cesiumBaseUrl}Cesium.js`
            : `${base}${cesiumBaseUrl}Cesium.js`,
        }),
      ],
    }),
    AutoImport({
      imports: ["vue", "pinia", "vue-router"],
      resolvers: [
        // Element按需加载
        ElementPlusResolver(),
        // 自动导入图标组件
        IconsResolver({
          prefix: "Icon",
        }),
      ],
    }),
    Components({
      deep: true, // 搜索子目录
      dirs: ["src/components"], // 按需加载的文件夹
      resolvers: [
        // 自动注册图标组件
        IconsResolver({
          enabledCollections: ["ep"],
        }),
        // 自动导入 Element Plus 组件
        ElementPlusResolver(),
      ],
    }),
    Icons({
      autoInstall: true,
    }),
    compress({
      threshold: 10 * 1024, // 10KB 以下不压缩
    }),
  ];
  if (!isProd) {
    // 开发模式，复制 node_modules 下的 cesium 依赖
    const cesiumLibraryRoot = "node_modules/cesium/Build/CesiumUnminified/";
    const cesiumLibraryCopyToRootPath = "libs/cesium/"; // 相对于打包后的路径
    const cesiumStaticSourceCopyOptions = [
      "Assets",
      "ThirdParty",
      "Workers",
      "Widgets",
    ].map((dirName) => {
      return {
        src: `${cesiumLibraryRoot}${dirName}/*`, // 注意后面的 * 字符，文件夹全量复制
        dest: `${cesiumLibraryCopyToRootPath}${dirName}`,
      };
    });
    plugins.push(
      viteStaticCopy({
        targets: [
          // 主库文件，开发时选用非压缩版的 IIFE 格式主库文件
          {
            src: `${cesiumLibraryRoot}Cesium.js`,
            dest: cesiumLibraryCopyToRootPath,
          },
          // 四大静态文件夹
          ...cesiumStaticSourceCopyOptions,
        ],
      })
    );
  }

  const server = {
    host: true,
    port: 8089,
    open: true,
  };

  const resolve = {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  };

  //修复控制台弃用警告：Deprecation Warning: The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0
  const css = {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler", // or "modern"
      },
    },
  };

  return {
    base,
    envDir,
    mode,
    plugins,
    server,
    resolve,
    css,
  };
});
