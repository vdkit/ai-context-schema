import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  blueprintSource,
  platformConfig,
  runCli,
  usefulBody,
  type CliResult
} from '../tests/helpers.js';
import { cleanupTempDir, createTempDir, createTestFile } from '../tests/setup.js';
import { CompatibilityChecker } from './compatibility-checker.js';
import {
  getComponentManifests,
  getPlatformComponents,
  isPlatformEnabled,
  SchemaValidator,
  type ParsedSchema,
  type PlatformConfig
} from './schema-validator.js';

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(import.meta.dirname, '..');
const schemaValidatorEntrypoint = path.join(packageRoot, 'validation', 'schema-validator.ts');
const compatibilityCheckerEntrypoint = path.join(
  packageRoot,
  'validation',
  'compatibility-checker.ts'
);
const examplesDir = path.join(packageRoot, 'schemas', 'v3.0.0', 'examples');
const exampleFiles = [
  'api-example.yaml',
  'react-example.yaml',
  'security-example.yaml',
  'testing-example.yaml'
].map((name) => path.join(examplesDir, name));
const reactExample = path.join(examplesDir, 'react-example.yaml');
const parser = new SchemaValidator();

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

function parseBlueprint(overrides: Record<string, unknown> = {}, body?: string): ParsedSchema {
  return parser.parseSchema(blueprintSource(overrides, body));
}

function runSchemaValidatorCli(args: string[]): Promise<CliResult> {
  return runCli(schemaValidatorEntrypoint, () => import('./schema-validator.js'), args);
}

/**
 * Writes one valid blueprint, one ignored file and three invalid blueprints (a bad version, a
 * file without frontmatter, a frontmatter with almost nothing in it) under `root`.
 */
async function writeMixedTree(root: string): Promise<void> {
  const untitled = `---\nkind: skill\n---\n\n${usefulBody}\n`;
  const badVersion = blueprintSource({ id: 'bad-version', version: 'one' }, 'Too short');

  await mkdir(path.join(root, 'nested'));
  await createTestFile(root, 'valid.md', blueprintSource({ id: 'valid-blueprint' }));
  await createTestFile(root, 'notes.txt', 'Not a schema file');
  await createTestFile(root, path.join('nested', 'bad-version.yaml'), badVersion);
  await createTestFile(root, path.join('nested', 'broken.mdc'), 'No frontmatter here');
  await createTestFile(root, path.join('nested', 'untitled.yml'), untitled);
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

describe('platform helpers', () => {
  it('treats a platform as enabled unless it opts out', () => {
    expect(isPlatformEnabled({ enabled: true })).toBe(true);
    expect(isPlatformEnabled({ components: {} })).toBe(true);
    expect(isPlatformEnabled({ enabled: false, components: {} })).toBe(false);
    expect(isPlatformEnabled({})).toBe(false);
  });

  it('ignores components and manifests that are not objects', () => {
    const schema = parseBlueprint({
      platforms: {
        zed: {
          components: {
            settings: { type: 'zed-settings', manifests: [{ name: 'kept' }, 'stray'] },
            broken: 'not-a-component'
          }
        }
      }
    });
    const components = getPlatformComponents(platformConfig(schema, 'zed'));
    const manifests = components.flatMap((component) => getComponentManifests(component));

    expect(components.map((component) => component.type)).toEqual(['zed-settings']);
    expect(manifests).toEqual([{ name: 'kept' }]);
  });

  it('returns nothing when components or manifests are absent', () => {
    expect(getPlatformComponents({ enabled: true })).toEqual([]);
    expect(getComponentManifests({ type: 'claude-main' })).toEqual([]);
  });
});

describe('SchemaValidator schema rules', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  it('accepts a complete blueprint without errors or warnings', () => {
    const result = validator.validateSchema(parseBlueprint(), 'example.md');

    expect(result.valid).toBe(true);
    expect(result.filePath).toBe('example.md');
    expect(result.schema?.id).toBe('example-blueprint');
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('rejects frontmatter that is not a mapping', () => {
    expect(() => validator.parseSchema('---\n- one\n- two\n---\n\n# Body')).toThrow(
      'Invalid YAML frontmatter: expected an object'
    );
  });

  it('reports enum violations together with the allowed values', () => {
    const result = validator.validateSchema(parseBlueprint({ category: 'nonsense' }), 'enum.md');

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      {
        type: 'schema_validation',
        severity: 'error',
        path: '/category',
        message: '/category must be equal to one of the allowed values',
        data: 'nonsense',
        allowedValues: expect.arrayContaining(['core', 'technology'])
      }
    ]);
  });

  it('reports missing required fields against the schema path', () => {
    const result = validator.validateSchema({ _content: usefulBody }, 'empty.md');
    const messages = result.errors.map((error) => error.message);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(7);
    expect(result.errors.every((error) => error.type === 'schema_validation')).toBe(true);
    expect(result.errors.every((error) => error.path === '#/required')).toBe(true);
    expect(messages).toContain("must have required property 'id'");
    expect(messages).toContain("must have required property 'platforms'");
  });

  it('validates against a custom schema definition when one is given', () => {
    const custom = new SchemaValidator({ type: 'object', required: ['owner'] });
    const result = custom.validateSchema({ _content: usefulBody }, 'custom.md');

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.message)).toEqual([
      "must have required property 'owner'"
    ]);
  });

  it('rejects ids that are not kebab-case', () => {
    const result = validator.validateSchema(parseBlueprint({ id: 'Not_Kebab' }), 'id.md');

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.type)).toEqual(['schema_validation', 'invalid_id']);
    expect(result.errors).toContainEqual({
      type: 'invalid_id',
      severity: 'error',
      path: 'id',
      message: 'ID must be kebab-case (lowercase letters, numbers, and hyphens only)'
    });
  });

  it('rejects versions that are not semantic versions', () => {
    const result = validator.validateSchema(parseBlueprint({ version: '1.0' }), 'version.md');

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.type)).toEqual([
      'schema_validation',
      'invalid_version'
    ]);
    expect(result.errors).toContainEqual({
      type: 'invalid_version',
      severity: 'error',
      path: 'version',
      message: 'Version must follow semantic versioning format (e.g., 1.0.0)'
    });
  });

  it('accepts pre-release and build suffixes in versions', () => {
    const schema = parseBlueprint({ version: '2.1.0-beta+build-7' });

    expect(validator.validateSchema(schema, 'prerelease.md').valid).toBe(true);
  });

  it('warns about thin content without failing validation', () => {
    const result = validator.validateSchema(parseBlueprint({}, 'Too short'), 'thin.md');

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map((warning) => warning.type)).toEqual([
      'insufficient_content',
      'missing_headers',
      'missing_examples'
    ]);
    expect(result.warnings.every((warning) => warning.path === 'content')).toBe(true);
  });

  it('estimates the deployed size from the body, title and description', () => {
    const schema: ParsedSchema = { title: 'abcd', description: 'ef', _content: 'x'.repeat(10) };

    expect(validator.estimateContentChars(schema)).toBe(216);
    expect(validator.estimateContentChars({ _content: '' })).toBe(200);
  });

  it('warns when the content exceeds a declared component limit', () => {
    const schema = parseBlueprint({
      platforms: {
        'github-copilot': {
          components: {
            'repo-level': { type: 'copilot-repo', constraints: { maxChars: 100 } }
          }
        }
      }
    });
    const estimate = validator.estimateContentChars(schema);
    const result = validator.validateSchema(schema, 'copilot.md');

    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([
      {
        type: 'character_limit_exceeded',
        severity: 'warning',
        path: 'platforms.github-copilot.components',
        message: `Content (estimated ${estimate} chars) exceeds the declared component limit (100)`
      }
    ]);
  });

  it('checks every component limit and leaves roomy ones alone', () => {
    const config: PlatformConfig = {
      components: {
        rules: { constraints: { maxChars: 100000 } },
        workflows: { constraints: { maxChars: 10 } }
      }
    };
    const schema: ParsedSchema = { _content: 'x'.repeat(50) };
    const issues = validator.validatePlatformConfig('windsurf', config, schema);

    expect(issues).toEqual([
      {
        type: 'character_limit_exceeded',
        severity: 'warning',
        path: 'platforms.windsurf.components',
        message: 'Content (estimated 250 chars) exceeds the declared component limit (10)'
      }
    ]);
  });

  it('skips the checks of a platform that is disabled', () => {
    const schema = parseBlueprint({
      platforms: {
        'github-copilot': {
          enabled: false,
          components: {
            'repo-level': { type: 'copilot-repo', constraints: { maxChars: 100 } }
          }
        }
      }
    });
    const result = validator.validateSchema(schema, 'disabled.md');

    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('requires globs on auto-attached Cursor rules', () => {
    const schema = parseBlueprint({
      platforms: {
        cursor: {
          components: {
            main: { type: 'cursor-main' },
            rules: {
              type: 'cursor-rule',
              manifests: [
                { name: 'scoped', file: 'a.mdc', activation: 'auto-attached', globs: ['*.ts'] },
                { name: 'unscoped', file: 'b.mdc', activation: 'auto-attached' },
                { name: 'manual', file: 'c.mdc', activation: 'manual' }
              ]
            }
          }
        }
      }
    });
    const result = validator.validateSchema(schema, 'cursor.md');

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      {
        type: 'missing_globs',
        severity: 'error',
        path: 'platforms.cursor.components',
        message: 'Globs required for auto-attached activation (manifest: unscoped)'
      }
    ]);
  });

  it('only applies the glob rule to cursor-rule components', () => {
    const config: PlatformConfig = {
      components: {
        notes: { type: 'cursor-main', manifests: [{ activation: 'auto-attached' }] },
        rules: { type: 'cursor-rule', manifests: [{ activation: 'auto-attached' }] }
      }
    };
    const issues = validator.validatePlatformConfig('cursor', config, { _content: '' });

    expect(issues.map((issue) => issue.message)).toEqual([
      'Globs required for auto-attached activation (manifest: unnamed)'
    ]);
  });

  it('formats a missing Ajv error list as no issues', () => {
    expect(validator.formatAjvErrors(null)).toEqual([]);
    expect(validator.formatAjvErrors(undefined)).toEqual([]);
  });
});

describe('SchemaValidator relationships', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  it('detects a cycle across schemas checked by the same validator', () => {
    const first: ParsedSchema = { id: 'first', requires: ['second'], _content: '' };
    const second: ParsedSchema = { id: 'second', requires: [{ id: 'first' }], _content: '' };

    expect(validator.hasCyclicDependencies(first)).toBe(false);
    expect(validator.hasCyclicDependencies(second)).toBe(true);
  });

  it('reports a schema that requires itself', () => {
    const schema = parseBlueprint({ id: 'loop', requires: ['loop'] });
    const result = validator.validateSchema(schema, 'loop.md');

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      {
        type: 'cyclic_dependency',
        severity: 'error',
        path: 'requires',
        message: 'Cyclic dependency detected in requires field'
      }
    ]);
  });

  it('does not mistake a shared dependency for a cycle', () => {
    const shared: ParsedSchema = { id: 'shared', _content: '' };
    const left: ParsedSchema = { id: 'left', requires: ['shared'], _content: '' };
    const right: ParsedSchema = { id: 'right', requires: [{ id: 'shared' }], _content: '' };
    const top: ParsedSchema = {
      id: 'top',
      requires: ['left', 'right', { version: '1.0.0' }],
      _content: ''
    };

    expect(validator.hasCyclicDependencies(shared)).toBe(false);
    expect(validator.hasCyclicDependencies(left)).toBe(false);
    expect(validator.hasCyclicDependencies(right)).toBe(false);
    expect(validator.hasCyclicDependencies(top)).toBe(false);
  });

  it('cannot find a cycle for a schema without an id', () => {
    expect(validator.hasCyclicDependencies({ requires: ['left'], _content: '' })).toBe(false);
  });

  it('rejects a schema that both requires and conflicts with another', () => {
    const schema: ParsedSchema = {
      requires: ['base', { id: 'legacy' }, { version: '2.0.0' }],
      conflicts: ['legacy', 'other'],
      _content: ''
    };

    expect(validator.findRelationshipConflicts(schema)).toEqual([
      {
        type: 'conflicting_relationships',
        severity: 'error',
        path: 'requires/conflicts',
        message: 'Schemas cannot be both required and conflicted: legacy'
      }
    ]);
    expect(validator.findRelationshipConflicts({ _content: '' })).toEqual([]);
  });

  it('reports references to schemas that are not in the registry', () => {
    const registry = new Map([
      ['base', { filePath: 'base.md', schema: parseBlueprint({ id: 'base' }) }]
    ]);
    const schema: ParsedSchema = {
      requires: ['base', { id: 'gone' }, { version: '1.0.0' }],
      suggests: ['base', 'nice-to-have'],
      supersedes: ['base', 'old-one'],
      _content: ''
    };
    const issues = validator.validateRelationships(schema, registry);

    expect(issues.map((issue) => [issue.type, issue.severity, issue.message])).toEqual([
      ['missing_dependency', 'error', 'Required schema not found: gone'],
      ['missing_suggestion', 'warning', 'Suggested schema not found: nice-to-have'],
      ['missing_superseded', 'warning', 'Superseded schema not found: old-one']
    ]);
    expect(validator.validateRelationships({ _content: '' }, registry)).toEqual([]);
  });
});

describe('SchemaValidator files', () => {
  let validator: SchemaValidator;
  let tempDir: string;

  beforeEach(async () => {
    validator = new SchemaValidator();
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('validates a real example file', async () => {
    const result = await validator.validateFile(reactExample);

    expect(result.valid).toBe(true);
    expect(result.schema?.id).toBe('react-component-patterns');
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      {
        type: 'character_limit_exceeded',
        severity: 'warning',
        path: 'platforms.github-copilot.components',
        message: 'Content (estimated 6217 chars) exceeds the declared component limit (3000)'
      }
    ]);
  });

  it('reports a file that cannot be read as a parse error', async () => {
    const filePath = path.join(tempDir, 'missing.md');
    const result = await validator.validateFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.filePath).toBe(filePath);
    expect(result.schema).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([
      {
        type: 'parse_error',
        severity: 'error',
        path: null,
        message: expect.stringContaining('Failed to parse file: ENOENT')
      }
    ]);
  });

  it('reports a file without frontmatter as a parse error', async () => {
    const filePath = await createTestFile(tempDir, 'broken.md', 'No frontmatter here');
    const result = await validator.validateFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.message)).toEqual([
      'Failed to parse file: Invalid format: YAML frontmatter not found'
    ]);
  });

  it('summarises the real examples', async () => {
    const { results, summary } = await validator.validateFiles(exampleFiles);

    expect(results.map((result) => result.valid)).toEqual([true, true, true, true]);
    expect(summary).toEqual({
      total: 4,
      valid: 4,
      invalid: 0,
      errors: 0,
      warnings: 4,
      errorTypes: {},
      warningTypes: { character_limit_exceeded: 4 }
    });
  });

  it('checks relationships between the files of one run', async () => {
    const dependent = blueprintSource({
      id: 'dependent',
      requires: ['base', 'missing-dependency'],
      suggests: ['base', 'missing-suggestion'],
      supersedes: ['base', 'missing-predecessor']
    });
    const filePaths = [
      await createTestFile(tempDir, 'base.md', blueprintSource({ id: 'base' })),
      await createTestFile(tempDir, 'dependent.md', dependent),
      await createTestFile(tempDir, 'broken.md', 'No frontmatter here')
    ];
    const { results, summary } = await validator.validateFiles(filePaths);

    expect(results.map((result) => [path.basename(result.filePath), result.valid])).toEqual([
      ['base.md', true],
      ['dependent.md', false],
      ['broken.md', false]
    ]);
    expect(summary).toEqual({
      total: 3,
      valid: 1,
      invalid: 2,
      errors: 2,
      warnings: 2,
      errorTypes: { missing_dependency: 1, parse_error: 1 },
      warningTypes: { missing_suggestion: 1, missing_superseded: 1 }
    });
  });
});

describe('schema validator CLI run in-process', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('prints usage and succeeds for --help', async () => {
    const result = await runSchemaValidatorCli(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage: ai-context-schema <file-or-directory> [options]\n');
    expect(result.stdout).toContain('--warnings   Show warnings in addition to errors\n');
  });

  it('prints usage and fails without a target', async () => {
    const result = await runSchemaValidatorCli([]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage: ai-context-schema <file-or-directory> [options]\n');
  });

  it('prints only the summary when every file is valid', async () => {
    const result = await runSchemaValidatorCli([examplesDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.split('\n')).toEqual([
      'Validating 4 schema file(s)...',
      '',
      '=== Validation Summary ===',
      'Total files: 4',
      'Valid: 4',
      'Invalid: 0',
      'Errors: 0',
      'Warnings: 4',
      ''
    ]);
  });

  it('lists valid files and their warnings with --verbose --warnings', async () => {
    const result = await runSchemaValidatorCli([examplesDir, '--verbose', '--warnings']);
    const warning = 'Content (estimated 6217 chars) exceeds the declared component limit (3000)';

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('\n=== Detailed Results ===\n');
    expect(result.stdout).toContain(`\n📄 ${reactExample}\nStatus: ✅ Valid\n`);
    expect(result.stdout).toContain(
      'ID: react-component-patterns\nTitle: React Component Development\nVersion: 1.2.0\n'
    );
    expect(result.stdout).toContain(
      `character_limit_exceeded: ${warning}\n     Path: platforms.github-copilot.components\n`
    );
    expect(result.stdout).toContain('\n=== Warning Types ===\ncharacter_limit_exceeded: 4\n');
    expect(result.stdout).not.toContain('=== Error Types ===');
  });

  it('validates a single file target', async () => {
    const result = await runSchemaValidatorCli([reactExample]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.split('\n')).toEqual([
      'Validating 1 schema file(s)...',
      '',
      '=== Validation Summary ===',
      'Total files: 1',
      'Valid: 1',
      'Invalid: 0',
      'Errors: 0',
      'Warnings: 1',
      ''
    ]);
  });

  it('fails and details the invalid files of a directory tree', async () => {
    await writeMixedTree(tempDir);
    const brokenPath = path.join(tempDir, 'nested', 'broken.mdc');
    const versionMessage = 'Version must follow semantic versioning format (e.g., 1.0.0)';
    const parseMessage = 'Failed to parse file: Invalid format: YAML frontmatter not found';

    const result = await runSchemaValidatorCli([tempDir]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Validating 4 schema file(s)...\n');
    expect(result.stdout).toContain(
      'Total files: 4\nValid: 1\nInvalid: 3\nErrors: 9\nWarnings: 3\n'
    );
    expect(result.stdout).toContain('ID: bad-version\nTitle: Example Blueprint\nVersion: one\n');
    expect(result.stdout).toContain(`invalid_version: ${versionMessage}\n     Path: version\n`);
    expect(result.stdout).toContain(`📄 ${brokenPath}\nStatus: ❌ Invalid\n\nErrors:\n`);
    expect(result.stdout).toContain(`parse_error: ${parseMessage}\n\n`);
    expect(result.stdout).toContain('ID: \nTitle: \nVersion: \n');
    expect(result.stdout).toContain('\n=== Error Types ===\n');
    expect(result.stdout).toContain('schema_validation: 7\n');
    expect(result.stdout).toContain('invalid_version: 1\n');
    expect(result.stdout).toContain('parse_error: 1\n');
    expect(result.stdout).not.toContain(path.join(tempDir, 'valid.md'));
    expect(result.stdout).not.toContain('Warnings:\n');
    expect(result.stdout).not.toContain('=== Warning Types ===');
  });

  it('adds valid files and warnings to the details when asked', async () => {
    await writeMixedTree(tempDir);

    const result = await runSchemaValidatorCli([tempDir, '--warnings', '--verbose']);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain(
      `📄 ${path.join(tempDir, 'valid.md')}\nStatus: ✅ Valid\nID: valid-blueprint\n`
    );
    expect(result.stdout).toContain(
      'insufficient_content: Content appears too short to be useful\n     Path: content\n'
    );
    expect(result.stdout).toContain('\n=== Warning Types ===\n');
    expect(result.stdout).toContain('insufficient_content: 1\n');
    expect(result.stdout).toContain('missing_headers: 1\n');
    expect(result.stdout).toContain('missing_examples: 1\n');
  });

  it('fails when a directory holds no schema files', async () => {
    await createTestFile(tempDir, 'notes.txt', 'Not a schema file');

    const result = await runSchemaValidatorCli([tempDir]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('No schema files found\n');
  });

  it('reports a target that does not exist on stderr', async () => {
    const result = await runSchemaValidatorCli([path.join(tempDir, 'missing')]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Validation failed: ENOENT');
  });

  it('prints the results as JSON after the status line with --json', async () => {
    const result = await runSchemaValidatorCli([examplesDir, '--json']);
    // The status line is written to stdout ahead of the JSON document.
    const [statusLine, ...jsonLines] = result.stdout.split('\n');
    const payload: unknown = JSON.parse(jsonLines.join('\n'));

    expect(result.exitCode).toBe(0);
    expect(statusLine).toBe('Validating 4 schema file(s)...');
    expect(payload).toMatchObject({
      summary: {
        total: 4,
        valid: 4,
        invalid: 0,
        warningTypes: { character_limit_exceeded: 4 }
      }
    });
  });
});
