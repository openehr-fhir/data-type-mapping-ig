/**
 * The bundle, and the local preview server.
 *
 * esbuild rather than a framework toolchain: one dependency, no plugins, and it
 * resolves this workspace's explicit `.ts` import specifiers literally, which is
 * exactly what the reference sources use. `tsc --noEmit` remains the type gate;
 * this only bundles.
 */

import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUTDIR = fileURLToPath(new URL('../dist/', import.meta.url));

const options: esbuild.BuildOptions = {
  absWorkingDir: ROOT,
  entryPoints: ['src/main.ts', 'src/styles.css'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outdir: 'dist',
  sourcemap: true,
  minify: true,
  logLevel: 'info',
};

function copyShell(): void {
  mkdirSync(OUTDIR, { recursive: true });
  copyFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), `${OUTDIR}index.html`);
}

if (process.argv.includes('--serve')) {
  copyShell();
  const context = await esbuild.context(options);
  await context.watch();
  const { hosts, port } = await context.serve({ servedir: 'dist' });
  process.stdout.write(`preview — http://${hosts[0] ?? 'localhost'}:${port}/\n`);
} else {
  await esbuild.build(options);
  copyShell();
  process.stdout.write('build — converter-site/dist/ written.\n');
}
