import type { Config } from "tailwindcss";
import villaPreset from "@villa-platform/design-system/tailwind.preset";

const config: Config = {
  presets: [villaPreset as Config],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/!(node_modules)/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
};
export default config;
