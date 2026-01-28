import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser, manifestVersion, mode, command }) => {
      return {
          manifest_version: 3,
          name: "TimeTracker",
          description: "Tracks Time",
          permissions: ["storage"],
      };
  },
});
