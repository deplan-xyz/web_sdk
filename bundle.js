import esbuildPluginTsc from 'esbuild-plugin-tsc';
import * as esbuild from 'esbuild';

export function createBuildSettings(options) {
  return {
    entryPoints: ['src/index.ts'],
    outfile: 'dist/deplan-client.min.js',
    bundle: true,
    plugins: [
      esbuildPluginTsc({
        force: true
      }),
    ],
    ...options,
  };
}

const settings = createBuildSettings({ minify: false });

await esbuild.build(settings);