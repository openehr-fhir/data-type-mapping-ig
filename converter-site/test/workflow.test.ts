import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

/**
 * The drift gate on the deployment workflow.
 *
 * A workflow that invokes a script which no longer exists fails only on a push,
 * long after the change that broke it, and only for whoever happens to look at
 * the Actions tab. These assertions move that failure into the same test run as
 * the rename.
 */

const WORKFLOW = fileURLToPath(new URL('../../.github/workflows/converter-site.yml', import.meta.url));
const PACKAGE = fileURLToPath(new URL('../package.json', import.meta.url));

interface Step {
  readonly run?: string;
  readonly uses?: string;
  readonly with?: Record<string, unknown>;
}

interface Job {
  readonly needs?: string;
  readonly if?: string;
  readonly permissions?: Record<string, string>;
  readonly steps?: readonly Step[];
}

interface Workflow {
  readonly name?: string;
  readonly permissions?: Record<string, string>;
  readonly concurrency?: { group?: string };
  readonly jobs: Record<string, Job>;
}

function workflow(): Workflow {
  return parse(readFileSync(WORKFLOW, 'utf8')) as Workflow;
}

function scripts(): Record<string, string> {
  const manifest = JSON.parse(readFileSync(PACKAGE, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return manifest.scripts ?? {};
}

function runLines(job: Job | undefined): readonly string[] {
  return (job?.steps ?? []).flatMap((step) => (step.run === undefined ? [] : [step.run.trim()]));
}

function stepUsing(job: Job | undefined, action: string): Step | undefined {
  return (job?.steps ?? []).find((step) => (step.uses ?? '').startsWith(action));
}

/** npm sub-commands that are not scripts, so a script of that name is not implied. */
const NPM_COMMANDS = new Set(['ci', 'install', 'i', 'ls', 'audit']);

test('the workflow invokes only scripts that exist', () => {
  const available = scripts();
  const invoked = Object.values(workflow().jobs)
    .flatMap((job) => runLines(job))
    .flatMap((line) => {
      // Both forms matter: `npm ... run build` and the built-in `npm ... test`,
      // which is the shorthand the workflow actually uses.
      const match = /^npm --prefix converter-site (?:run )?([\w:-]+)$/.exec(line);
      const name = match?.[1];
      return name === undefined || NPM_COMMANDS.has(name) ? [] : [name];
    });
  assert.ok(invoked.length > 0, 'the workflow runs at least one npm script');
  for (const name of invoked) {
    assert.ok(name in available, `the workflow runs '${name}', which package.json does not define`);
  }
  assert.deepEqual(
    invoked,
    ['typecheck', 'test', 'build'],
    'the gate order: type-check, then test, then build',
  );
});

test('the workflow installs from the committed lockfile', () => {
  assert.ok(
    runLines(workflow().jobs['build']).includes('npm --prefix converter-site ci'),
    'npm ci, not npm install: the lockfile is the pin',
  );
  const setup = stepUsing(workflow().jobs['build'], 'actions/setup-node');
  assert.equal(
    setup?.with?.['cache-dependency-path'],
    'converter-site/package-lock.json',
    'the cache keys on this workspace\u2019s lockfile',
  );
});

test('the build job uploads the built directory', () => {
  const upload = stepUsing(workflow().jobs['build'], 'actions/upload-pages-artifact');
  assert.ok(upload !== undefined, 'the build job uploads a Pages artifact');
  assert.equal(upload.with?.['path'], 'converter-site/dist');
});

test('deployment is gated on main and asks for exactly the Pages permissions', () => {
  const parsed = workflow();
  const deploy = parsed.jobs['deploy'];
  assert.ok(deploy !== undefined, 'there is a deploy job');
  assert.equal(deploy.needs, 'build', 'nothing deploys that did not build');
  assert.equal(deploy.if, "github.ref == 'refs/heads/main'");
  assert.equal(deploy.permissions?.['pages'], 'write');
  assert.equal(deploy.permissions?.['id-token'], 'write');
  assert.ok(stepUsing(deploy, 'actions/deploy-pages') !== undefined, 'it deploys to Pages');

  // The default is read-only, so a job that needs more has to say so.
  assert.deepEqual(parsed.permissions, { contents: 'read' }, 'least privilege at the top level');
  assert.equal(parsed.jobs['build']?.permissions, undefined, 'build needs nothing extra');
});

test('the pinned Node version supports native TypeScript type stripping', () => {
  const setup = stepUsing(workflow().jobs['build'], 'actions/setup-node');
  const pinned = String(setup?.with?.['node-version'] ?? '');
  assert.match(pinned, /^\d+(\.\d+)*$/, `unexpected node-version '${pinned}'`);
  const [major = 0, minor = 0] = pinned.split('.').map(Number);
  // 22.18 is the floor at which type stripping is unflagged. Assert the floor
  // rather than the exact pin, so the pin can move without breaking this.
  assert.ok(
    major > 22 || (major === 22 && minor >= 18),
    `Node ${pinned} predates unflagged type stripping, which every script here needs`,
  );
});
