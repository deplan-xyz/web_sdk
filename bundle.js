const esbuildPluginTsc = require('esbuild-plugin-tsc');
const esbuild = require('esbuild');

function createBuildSettings(options) {
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

const settings = createBuildSettings({ minify: true });

(async () => {
  await esbuild.build(settings);
})();