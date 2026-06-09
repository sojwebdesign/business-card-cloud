import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  base: "/business-card",
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  })
});
