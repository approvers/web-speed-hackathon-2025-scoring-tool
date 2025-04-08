import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  build: {
    minify: "terser",
    modulePreload: true,
    terserOptions: { compress: { passes: 5 } },
    target: ["chrome130"],
  },
  plugins: [preact()],
});
