import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 500,
  fileServerFolder: import.meta.dirname,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
