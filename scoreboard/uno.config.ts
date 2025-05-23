import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind4,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  presets: [presetWind4({ reset: true }), presetAttributify(), presetIcons()],
  transformers: [transformerDirectives()],
});
