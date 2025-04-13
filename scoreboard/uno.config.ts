import {
  defineConfig,
  presetWind4,
  transformerDirectives,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [presetWind4({ reset: true }), presetAttributify(), presetIcons()],
  transformers: [transformerDirectives()],
});
