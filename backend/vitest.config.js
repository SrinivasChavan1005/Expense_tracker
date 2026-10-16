import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: { NODE_ENV: "test" }, // loads backend/.env.test
    // All test files share one test database, so run them one at a time.
    fileParallelism: false,
    include: ["tests/**/*.test.js"],
  },
});
