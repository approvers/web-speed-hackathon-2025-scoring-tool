import { defineConfig } from "vite";
import UnoCSS from "unocss/vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/web-speed-hackathon-2025-scoring-tool",
  build: {
    minify: "terser",
    terserOptions: { compress: { passes: 5 } },
    target: ["esnext"],
    modulePreload: { polyfill: false },
  },
  plugins: [preact(), UnoCSS()],
});
