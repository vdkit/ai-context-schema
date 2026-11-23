import { vi } from 'vitest';

import type { ParsedSchema, PlatformConfig } from '../validation/schema-validator.js';

/** Markdown body that satisfies every content check (length, a header, a code example). */
export const usefulBody = [
  '# Example Blueprint',
  '',
  'Guidance that is long enough for the content checks to treat it as useful.',
  '',
  '```ts',
  'export const answer = 42;',
  '```'
].join('\n');

const baseFrontmatter = {
  id: 'example-blueprint',
  title: 'Example Blueprint',
  description: 'A blueprint used by the validation tests.',
  schemaVersion: '3.0',
  version: '1.0.0',
  kind: 'skill',
  category: 'technology',
  platforms: {
    'claude-code': {
      components: {
        main: {
          type: 'claude-main',
          location: 'CLAUDE.md',
          enabled: true
        }
      }
    }
  }
};

/**
 * Builds a blueprint document (frontmatter + markdown body) that is valid by default.
 * Top-level frontmatter keys in `overrides` replace the defaults, so a test states only the
 * part it is about. The frontmatter is written as JSON, which is valid YAML.
 */
export function blueprintSource(
  overrides: Record<string, unknown> = {},
  body: string = usefulBody
): string {
  const frontmatter = JSON.stringify({ ...baseFrontmatter, ...overrides }, null, 2);
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

export function platformConfig(schema: ParsedSchema, platform: string): PlatformConfig {
  const config = schema.platforms?.[platform];
  if (!config) {
    throw new Error(`Fixture does not configure the ${platform} platform`);
  }

  return config;
}

export interface CliResult {
  exitCode: typeof process.exitCode;
  stdout: string;
  stderr: string;
}

interface CapturedStream {
  text: () => string;
  restore: () => void;
}

function captureWrites(stream: NodeJS.WriteStream): CapturedStream {
  const chunks: string[] = [];
  const spy = vi.spyOn(stream, 'write').mockImplementation((chunk) => {
    chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  });

  return {
    text: () => chunks.join(''),
    restore: () => {
      spy.mockRestore();
    }
  };
}

/**
 * Runs a CLI entrypoint inside the test process, so that v8 coverage sees `main()` and the
 * print helpers (a child process is invisible to it).
 *
 * The entrypoints start `main()` only when `process.argv[1]` is their own path and do not
 * export it, so this points argv at the file and has `load` evaluate a fresh copy of the
 * module. Every path through `main()`, including its rejection handler, ends by setting
 * `process.exitCode`, which is the signal that the run has finished.
 *
 * @param entrypoint Absolute path of the CLI source file.
 * @param load Dynamic import of that same file, e.g. `() => import('./schema-validator.js')`.
 * @param args Command line arguments after the script path.
 */
export async function runCli(
  entrypoint: string,
  load: () => Promise<unknown>,
  args: string[]
): Promise<CliResult> {
  const stdout = captureWrites(process.stdout);
  const stderr = captureWrites(process.stderr);
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;

  process.argv = [process.execPath, entrypoint, ...args];
  process.exitCode = undefined;

  try {
    vi.resetModules();
    await load();
    await vi.waitFor(
      () => {
        if (process.exitCode === undefined) {
          throw new Error(`${entrypoint} has not finished`);
        }
      },
      { timeout: 5000, interval: 10 }
    );

    return { exitCode: process.exitCode, stdout: stdout.text(), stderr: stderr.text() };
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    stdout.restore();
    stderr.restore();
  }
}
