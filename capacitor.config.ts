import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.unimuenster.ifgi.astrobunny',
  appName: 'Astro Bunny',
  webDir: 'capacitor-www',
  server: {
    url: 'https://astrobunnygame.netlify.app/',
    cleartext: false
  }
};

export default config;
