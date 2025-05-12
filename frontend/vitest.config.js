import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.js",
    include: ["src/__tests__/**/*.test.{js,jsx}"],
    deps: {
      inline: [/lodash/, /@testing-library\/react/],
    },
  },
});
