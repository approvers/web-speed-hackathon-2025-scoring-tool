import {
  defineConfig,
  presetWind4,
  transformerDirectives,
  presetAttributify,
} from "unocss";

export default defineConfig({
  presets: [presetWind4({ reset: true }), presetAttributify()],
  transformers: [transformerDirectives()],
});
