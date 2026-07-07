import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { beforeEach, describe, expect, it } from 'vitest';

import { CompatibilityChecker } from './compatibility-checker.js';
import { SchemaValidator } from './schema-validator.js';

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, '..');
const schemaValidatorEntrypoint = path.join(packageRoot, 'validation', 'schema-validator.ts');
const compatibilityCheckerEntrypoint = path.join(
  packageRoot,
  'validation',
  'compatibility-checker.ts'
);

interface FailedCommandResult {
  code?: number | string;
  stdout?: string;
  stderr?: string;
}

async function runTsx(entrypoint: string, args: string[]) {
  return execFileAsync('pnpm', ['exec', 'tsx', entrypoint, ...args], {
    cwd: packageRoot,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      NO_COLOR: '1'
    }
  });
}

async function runExpectedFailure(
  entrypoint: string,
  args: string[]
): Promise<FailedCommandResult> {
  const result = await runTsx(entrypoint, args).then(
    (value) => ({ ok: true as const, value }),
    (error: Error & FailedCommandResult) => ({ ok: false as const, error })
  );

  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error('Expected command to fail');
  }

  return result.error;
}

describe('SchemaValidator', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  it('creates a validator instance', () => {
    expect(validator).toBeDefined();
    expect(validator.ajv).toBeDefined();
    expect(validator.validator).toBeDefined();
  });

  it('parses valid schema content', () => {
    const content = `---
id: test-schema
title: Test Schema
description: A test schema
schemaVersion: "3.0"
version: 1.0.0
kind: skill
category: technology
platforms:
  claude-code:
    components:
      main:
        type: claude-main
        location: CLAUDE.md
        enabled: true
---

# Test Schema
This is a test schema.`;

    const schema = validator.parseSchema(content);
    expect(schema.id).toBe('test-schema');
    expect(schema.title).toBe('Test Schema');
    expect(schema.version).toBe('1.0.0');
    expect(schema._content).toBe('# Test Schema\nThis is a test schema.');
  });

  it('accepts canonical retrieval metadata in the default validator schema', () => {
    const schema = validator.parseSchema(`---
id: canonical-workflow
title: Canonical Workflow
description: A blueprint with canonical retrieval metadata.
schemaVersion: "3.0"
version: 1.0.0
kind: workflow
specificityLayer: L2
equivalenceOutcome: unsupported
curation:
  status: curated
  source: core-library
category: technology
platforms:
  claude-code:
    components:
      main:
        type: claude-main
        location: CLAUDE.md
        enabled: true
---

# Canonical Workflow
Exercise retrieval metadata support.`);

    const result = validator.validateSchema(schema, 'canonical-workflow.md');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('throws for invalid YAML frontmatter', () => {
    const content = `---
invalid: yaml: content:
---

# Test Schema`;

    expect(() => validator.parseSchema(content)).toThrow();
  });

  it('throws for missing frontmatter', () => {
    expect(() => validator.parseSchema('Just markdown content without frontmatter')).toThrow(
      'Invalid format: YAML frontmatter not found'
    );
  });
});

describe('CompatibilityChecker', () => {
  it('creates a checker instance', () => {
    const checker = new CompatibilityChecker();

    expect(checker.validator).toBeInstanceOf(SchemaValidator);
    expect(checker.results.summary.schemas.total).toBe(0);
  });
});

describe('CLI help and exit codes', () => {
  it('prints schema validator help', async () => {
    const { stdout, stderr } = await runTsx(schemaValidatorEntrypoint, ['--help']);

    expect(stderr).toBe('');
    expect(stdout).toMatchInlineSnapshot(`
      "Usage: ai-context-schema <file-or-directory> [options]

      Options:
        --help       Show this help message
        --verbose    Show detailed output
        --json       Output results as JSON
        --warnings   Show warnings in addition to errors
      "
    `);
  });

  it('exits with code 1 when the schema validator target is missing', async () => {
    const failure = await runExpectedFailure(schemaValidatorEntrypoint, []);

    expect(failure.code).toBe(1);
    expect(failure.stderr).toBe('');
    expect(failure.stdout).toContain('Usage: ai-context-schema');
  });

  it('prints compatibility checker help', async () => {
    const { stdout, stderr } = await runTsx(compatibilityCheckerEntrypoint, ['--help']);

    expect(stderr).toBe('');
    expect(stdout).toMatchInlineSnapshot(`
      "Usage: compatibility-checker <schemas-directory> [options]

      Options:
        --help             Show this help message
        --json             Output results as JSON
        --platform=<name>  Check a specific platform only
        --verbose          Show detailed output
      "
    `);
  });

  it('exits with code 1 when the compatibility checker target is missing', async () => {
    const failure = await runExpectedFailure(compatibilityCheckerEntrypoint, []);

    expect(failure.code).toBe(1);
    expect(failure.stderr).toBe('');
    expect(failure.stdout).toContain('Usage: compatibility-checker');
  });
});
