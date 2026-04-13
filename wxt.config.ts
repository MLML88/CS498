import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser, manifestVersion, mode, command }) => {
      return {
          manifest_version: 3,
          name: "TimeTracker",
          description: "Tracks Time",
          permissions: ["storage", "tabs", "notifications"],
          web_accessible_resources: [
            {
              resources: ["16.png", "32.png", "48.png", "128.png", "alarm.png", "assets/alarm.png"],
                matches: ["<all_urls>"]
            }
          ],
      };
  },
});
