const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

async function build() {
  const options = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
  };

  if (isWatch) {
    // Use context API for watch mode
    const context = await esbuild.context(options);
    await context.watch();
    console.log('Watching for changes...');
  } else {
    // One-time build
    await esbuild.build(options);
    console.log('Build succeeded');
  }
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});