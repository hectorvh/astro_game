import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.unimuenster.ifgi.astrobunny',
  appName: 'Astro Bunny',
  webDir: 'capacitor-www',
  server: {
    // Canonical HTTPS host (custom domain). Never use http:// or cleartext.
    url: 'https://astrogame.hectorvh.com/',
    cleartext: false,
  },
};

export default config;
