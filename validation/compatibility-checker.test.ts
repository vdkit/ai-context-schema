import { mkdir } from 'node:fs/promises';
import path from 'node:path';
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
import { SchemaValidator, type ParsedSchema, type PlatformConfig } from './schema-validator.js';

const packageRoot = path.resolve(import.meta.dirname, '..');
const entrypoint = path.join(packageRoot, 'validation', 'compatibility-checker.ts');
const examplesDir = path.join(packageRoot, 'schemas', 'v3.0.0', 'examples');
const parser = new SchemaValidator();

function parseBlueprint(overrides: Record<string, unknown> = {}, body?: string): ParsedSchema {
  return parser.parseSchema(blueprintSource(overrides, body));
}

function schemaWith(id: string, platforms: Record<string, PlatformConfig>): ParsedSchema {
  return { id, platforms, _content: '' };
}

function runCompatibilityCli(args: string[]): Promise<CliResult> {
  return runCli(entrypoint, () => import('./compatibility-checker.js'), args);
}

/**
 * Writes three valid blueprints that score 100%, 50% and 33%, plus files the checker must leave
 * out: a blueprint that fails validation, a file without frontmatter and a markdown blueprint.
 * Between them the valid ones raise one info, one warning and one error.
 */
async function writeScoredTree(root: string): Promise<void> {
  const high = blueprintSource({
    id: 'high-score',
    platforms: {
      'claude-code': { components: { main: { type: 'claude-main' } } },
      'generic-ai': { enabled: true }
    }
  });
  const medium = blueprintSource({
    id: 'medium-score',
    platforms: {
      'claude-code': { enabled: true },
      zed: { enabled: false }
    }
  });
  const low = blueprintSource({
    id: 'low-score',
    platforms: {
      cursor: {
        components: {
          rules: {
            type: 'cursor-rule',
            manifests: [{ name: 'empty-glob', file: 'empty-glob.mdc', globs: [''] }]
          }
        }
      },
      zed: { enabled: false },
      jetbrains: { enabled: false }
    }
  });

  await mkdir(path.join(root, 'nested'));
  await createTestFile(root, 'high.yaml', high);
  await createTestFile(root, 'medium.yml', medium);
  await createTestFile(root, path.join('nested', 'low.yaml'), low);
  await createTestFile(root, 'invalid.yaml', blueprintSource({ id: 'Invalid_Id' }));
  await createTestFile(root, 'broken.yaml', 'No frontmatter here');
  await createTestFile(root, 'notes.md', blueprintSource({ id: 'markdown-only' }));
}

describe('CompatibilityChecker platform rules', () => {
  let checker: CompatibilityChecker;

  beforeEach(() => {
    checker = new CompatibilityChecker();
  });

  it('warns when Claude Code is enabled without components', () => {
    const schema = schemaWith('claude-empty', {});
    const issues = checker.validatePlatformFeatures('claude-code', { enabled: true }, schema);

    expect(issues).toEqual([
      {
        type: 'missing_feature',
        severity: 'warning',
        message: 'Claude Code platform enabled but no components configured',
        schema: 'claude-empty'
      }
    ]);
  });

  it('accepts Claude Code with components, or switched off', () => {
    const schema = schemaWith('claude-ok', {});
    const configured: PlatformConfig = { components: { main: { type: 'claude-main' } } };

    expect(checker.validatePlatformFeatures('claude-code', configured, schema)).toEqual([]);
    expect(checker.validateClaudeFeatures({ enabled: false }, schema)).toEqual([]);
  });

  it('checks the globs of Cursor rule manifests', () => {
    const config: PlatformConfig = {
      components: {
        main: { type: 'cursor-main', manifests: [{ name: 'main', activation: 'auto-attached' }] },
        rules: {
          type: 'cursor-rule',
          manifests: [
            { name: 'unscoped', activation: 'auto-attached' },
            { activation: 'auto-attached' },
            { name: 'scoped', activation: 'auto-attached', globs: ['**/*.ts', ''] },
            { name: 'manual', activation: 'manual' }
          ]
        }
      }
    };
    const schema = schemaWith('cursor-rules', {});
    const issues = checker.validatePlatformFeatures('cursor', config, schema);

    expect(issues.map((issue) => [issue.type, issue.severity, issue.message])).toEqual([
      [
        'missing_requirement',
        'error',
        'Auto-attached activation requires globs configuration (manifest: unscoped)'
      ],
      [
        'missing_requirement',
        'error',
        'Auto-attached activation requires globs configuration (manifest: unnamed)'
      ],
      ['invalid_config', 'error', 'Invalid glob pattern: ']
    ]);
    expect(issues.every((issue) => issue.schema === 'cursor-rules')).toBe(true);
  });

  it('rejects Cursor globs that are not strings', () => {
    const schema = parseBlueprint({
      id: 'odd-globs',
      platforms: {
        cursor: {
          components: {
            custom: { type: 'cursor-rule', manifests: [{ name: 'odd', globs: [42, '*.ts'] }] }
          }
        }
      }
    });
    const issues = checker.validateCursorFeatures(platformConfig(schema, 'cursor'), schema);

    expect(issues.map((issue) => issue.message)).toEqual(['Invalid glob pattern: 42']);
  });

  it('checks the modes of Windsurf manifests', () => {
    const config: PlatformConfig = {
      components: {
        rules: {
          type: 'windsurf-rule',
          manifests: [
            { name: 'glob', mode: 'glob' },
            { name: 'always', mode: 'always' },
            { name: 'odd', mode: 'sometimes' },
            { name: 'plain', file: 'plain.md' }
          ]
        }
      }
    };
    const schema = schemaWith('modes', {});
    const issues = checker.validatePlatformFeatures('windsurf', config, schema);

    expect(issues).toEqual([
      {
        type: 'invalid_config',
        severity: 'error',
        message: 'Invalid mode: sometimes',
        schema: 'modes'
      }
    ]);
  });

  it('warns once the content passes the Windsurf limit', () => {
    const atLimit: ParsedSchema = { id: 'at-limit', _content: 'x'.repeat(5800) };
    const overLimit: ParsedSchema = { id: 'over-limit', _content: 'x'.repeat(5801) };

    expect(checker.validateWindsurfFeatures({ enabled: true }, atLimit)).toEqual([]);
    expect(checker.validateWindsurfFeatures({ enabled: true }, overLimit)).toEqual([
      {
        type: 'size_warning',
        severity: 'warning',
        message: 'Content may exceed Windsurf limit (estimated 6001 chars)',
        schema: 'over-limit'
      }
    ]);
  });

  it('compares the content with each Copilot repo component limit', () => {
    const schema: ParsedSchema = { id: 'copilot-size', _content: 'x'.repeat(3800) };
    const config: PlatformConfig = {
      components: {
        'repo-level': { type: 'copilot-repo' },
        strict: { type: 'copilot-repo', constraints: { maxChars: 100 } },
        roomy: { type: 'copilot-repo', constraints: { maxChars: 5000 } },
        chat: { type: 'copilot-chat', constraints: { maxChars: 1 } }
      }
    };
    const issues = checker.validatePlatformFeatures('github-copilot', config, schema);

    expect(issues.map((issue) => [issue.type, issue.severity, issue.message])).toEqual([
      [
        'size_warning',
        'warning',
        'Content may exceed GitHub Copilot limit (estimated 4000 chars, limit 3000)'
      ],
      [
        'size_warning',
        'warning',
        'Content may exceed GitHub Copilot limit (estimated 4000 chars, limit 100)'
      ]
    ]);
  });

  it('notes other platforms that are enabled without components', () => {
    const schema = schemaWith('zed-only', {});
    const configured: PlatformConfig = { components: { settings: { type: 'zed-settings' } } };

    expect(checker.validatePlatformFeatures('zed', configured, schema)).toEqual([]);
    expect(checker.validatePlatformFeatures('zed', { enabled: true }, schema)).toEqual([
      {
        type: 'minimal_config',
        severity: 'info',
        message: 'Platform has minimal configuration (enabled only, no components)',
        schema: 'zed-only'
      }
    ]);
  });

  it('describes the features of each known platform', () => {
    expect(checker.analyzePlatformFeatures('cursor', [])).toEqual({
      supported: ['main', 'rules', 'auto-attachment', 'file-patterns'],
      unsupported: [],
      limitations: ['vs-code-dependency']
    });
    expect(checker.analyzePlatformFeatures('windsurf', [])).toEqual({
      supported: ['rules', 'workflows', 'glob-scoping'],
      unsupported: [],
      limitations: ['6k-character-limit']
    });
    expect(checker.analyzePlatformFeatures('github-copilot', [])).toEqual({
      supported: ['repo-level-instructions'],
      unsupported: [],
      limitations: ['github-dependency', '3k-character-limit']
    });
    expect(checker.analyzePlatformFeatures('zed', [])).toEqual({
      supported: [],
      unsupported: [],
      limitations: []
    });
  });

  it('lists the Claude Code features that the schemas use', () => {
    const entries = [
      { filePath: 'main.yaml', schema: parseBlueprint({ id: 'uses-main' }) },
      { filePath: 'other.yaml', schema: schemaWith('no-claude', { zed: { enabled: true } }) }
    ];
    const supported = ['main', 'agents', 'rules', 'commands', 'skills', 'settings'];

    expect(checker.analyzePlatformFeatures('claude-code', entries)).toEqual({
      supported,
      unsupported: [],
      limitations: [],
      used: ['main']
    });
    expect(checker.analyzePlatformFeatures('claude-code', []).used).toBeUndefined();
  });
});

describe('CompatibilityChecker schema results', () => {
  let checker: CompatibilityChecker;

  beforeEach(() => {
    checker = new CompatibilityChecker();
  });

  it('estimates the content size from the body, title and description', () => {
    const schema: ParsedSchema = { title: 'abcd', description: 'ef', _content: 'x'.repeat(10) };

    expect(checker.estimateContentSize(schema)).toBe(216);
    expect(checker.estimateContentSize({ _content: '' })).toBe(200);
  });

  it('collects the platforms of every schema once, in order', () => {
    const withoutPlatforms: ParsedSchema = { id: 'b', _content: '' };
    const entries = [
      { filePath: 'a.yaml', schema: schemaWith('a', { cursor: {}, zed: {} }) },
      { filePath: 'b.yaml', schema: withoutPlatforms },
      { filePath: 'c.yaml', schema: schemaWith('c', { zed: {}, windsurf: {} }) }
    ];

    expect(checker.extractPlatforms(entries)).toEqual(['cursor', 'zed', 'windsurf']);
  });

  it('counts the schemas that enable a platform', async () => {
    const entries = [
      { filePath: 'on.yaml', schema: schemaWith('on', { cursor: { enabled: true } }) },
      { filePath: 'off.yaml', schema: schemaWith('off', { cursor: { enabled: false } }) },
      { filePath: 'none.yaml', schema: schemaWith('none', { zed: { enabled: true } }) }
    ];
    const result = await checker.checkPlatformCompatibility('cursor', entries);

    expect(result).toEqual({
      platform: 'cursor',
      total: 3,
      compatible: 1,
      incompatible: 2,
      issues: [],
      features: {
        supported: ['main', 'rules', 'auto-attachment', 'file-patterns'],
        unsupported: [],
        limitations: ['vs-code-dependency']
      }
    });
  });

  it('scores a schema by the share of its platforms that are enabled', () => {
    const schema = schemaWith('mixed', {
      'claude-code': { enabled: true },
      cursor: { components: { main: { type: 'cursor-main' } } },
      zed: { enabled: false },
      jetbrains: {}
    });

    expect(checker.checkSchemaCompatibility(schema)).toEqual({
      id: 'mixed',
      score: 50,
      issues: [],
      platforms: {
        'claude-code': {
          compatible: true,
          issues: [
            {
              type: 'missing_feature',
              severity: 'warning',
              message: 'Claude Code platform enabled but no components configured',
              schema: 'mixed'
            }
          ]
        },
        cursor: { compatible: true, issues: [] },
        zed: { compatible: false, issues: [] },
        jetbrains: { compatible: false, issues: [] }
      }
    });
  });

  it('rounds the score and falls back when id or platforms are missing', () => {
    const third = schemaWith('third', {
      zed: { enabled: true },
      cursor: { enabled: false },
      windsurf: { enabled: false }
    });

    expect(checker.checkSchemaCompatibility(third).score).toBe(33);
    expect(checker.checkSchemaCompatibility({ _content: '' })).toEqual({
      id: 'unknown-schema',
      platforms: {},
      issues: [],
      score: 0
    });
  });

  it('flags content that Windsurf or Copilot would truncate', () => {
    const schema: ParsedSchema = {
      id: 'large',
      platforms: {
        windsurf: { enabled: true },
        'github-copilot': {
          components: {
            'repo-level': { type: 'copilot-repo' },
            roomy: { type: 'copilot-repo', constraints: { maxChars: 8000 } },
            chat: { type: 'copilot-chat' }
          }
        }
      },
      _content: 'x'.repeat(6000)
    };

    expect(checker.checkCrossPlatformIssues(schema)).toEqual([
      {
        type: 'cross_platform_issue',
        severity: 'warning',
        message: 'Content may be truncated on Windsurf due to character limit'
      },
      {
        type: 'cross_platform_issue',
        severity: 'warning',
        message: 'Content may be truncated on GitHub Copilot due to character limit (3000)'
      }
    ]);
  });

  it('raises no truncation issue for small content or disabled platforms', () => {
    const small = schemaWith('small', { windsurf: { enabled: true } });
    const disabled: ParsedSchema = {
      id: 'disabled',
      platforms: {
        windsurf: { enabled: false },
        'github-copilot': {
          enabled: false,
          components: {
            'repo-level': { type: 'copilot-repo' }
          }
        }
      },
      _content: 'x'.repeat(6000)
    };

    expect(checker.checkCrossPlatformIssues(small)).toEqual([]);
    expect(checker.checkCrossPlatformIssues(disabled)).toEqual([]);
    expect(checker.checkCrossPlatformIssues({ _content: usefulBody })).toEqual([]);
  });
});

describe('CompatibilityChecker directory runs', () => {
  let checker: CompatibilityChecker;
  let tempDir: string;

  beforeEach(async () => {
    checker = new CompatibilityChecker();
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('summarises the real examples', async () => {
    const results = await checker.checkCompatibility(examplesDir);

    expect(results.summary).toEqual({
      schemas: {
        total: 4,
        highCompatibility: 4,
        mediumCompatibility: 0,
        lowCompatibility: 0
      },
      platforms: {
        total: 8,
        details: {
          'claude-code': { compatible: 4, compatibility_rate: 100, issues: 0 },
          cursor: { compatible: 4, compatibility_rate: 100, issues: 0 },
          windsurf: { compatible: 4, compatibility_rate: 100, issues: 4 },
          'github-copilot': { compatible: 4, compatibility_rate: 100, issues: 4 },
          zed: { compatible: 4, compatibility_rate: 100, issues: 0 },
          jetbrains: { compatible: 4, compatibility_rate: 100, issues: 0 },
          'openai-codex': { compatible: 0, compatibility_rate: 0, issues: 0 },
          'generic-ai': { compatible: 4, compatibility_rate: 100, issues: 4 }
        }
      },
      issues: {
        total: 12,
        byType: { size_warning: 8, minimal_config: 4 },
        bySeverity: { error: 0, warning: 8, info: 4 }
      }
    });
    expect(results.platforms['claude-code']?.features.used).toEqual(['main', 'commands', 'skills']);
    expect(results.schemas['react-component-patterns']).toEqual({
      id: 'react-component-patterns',
      score: 88,
      platforms: expect.objectContaining({
        'openai-codex': { compatible: false, issues: [] }
      }),
      issues: [
        {
          type: 'cross_platform_issue',
          severity: 'warning',
          message: 'Content may be truncated on Windsurf due to character limit'
        },
        {
          type: 'cross_platform_issue',
          severity: 'warning',
          message: 'Content may be truncated on GitHub Copilot due to character limit (3000)'
        }
      ]
    });
  });

  it('limits the platform results to the requested platform', async () => {
    const results = await checker.checkCompatibility(examplesDir, 'cursor');

    expect(Object.keys(results.platforms)).toEqual(['cursor']);
    expect(results.summary.schemas.total).toBe(4);
    expect(results.summary.platforms).toEqual({
      total: 1,
      details: {
        cursor: { compatible: 4, compatibility_rate: 100, issues: 0 }
      }
    });
    expect(results.summary.issues.total).toBe(0);
  });

  it('starts from empty results on every run', async () => {
    await checker.checkCompatibility(examplesDir);
    const results = await checker.checkCompatibility(tempDir, 'cursor');

    expect(results.schemas).toEqual({});
    expect(results.summary.schemas.total).toBe(0);
    expect(results.platforms.cursor).toMatchObject({ total: 0, compatible: 0, incompatible: 0 });
    expect(results.summary.platforms.details).toEqual({
      cursor: { compatible: 0, compatibility_rate: 0, issues: 0 }
    });
  });

  it('finds YAML files in nested directories only', async () => {
    await writeScoredTree(tempDir);

    const files = await checker.findSchemaFiles(tempDir);
    const relative = files.map((filePath) => path.relative(tempDir, filePath)).sort();

    expect(relative).toEqual([
      'broken.yaml',
      'high.yaml',
      'invalid.yaml',
      'medium.yml',
      path.join('nested', 'low.yaml')
    ]);
  });

  it('scores the valid schemas of a tree and leaves the others out', async () => {
    await writeScoredTree(tempDir);

    const results = await checker.checkCompatibility(tempDir);
    const ids = Object.keys(results.schemas).sort();

    expect(ids).toEqual(['high-score', 'low-score', 'medium-score']);
    expect(results.summary.schemas).toEqual({
      total: 3,
      highCompatibility: 1,
      mediumCompatibility: 1,
      lowCompatibility: 1
    });
    expect(results.summary.platforms).toEqual({
      total: 5,
      details: {
        'claude-code': { compatible: 2, compatibility_rate: 67, issues: 1 },
        'generic-ai': { compatible: 1, compatibility_rate: 33, issues: 1 },
        cursor: { compatible: 1, compatibility_rate: 33, issues: 1 },
        zed: { compatible: 0, compatibility_rate: 0, issues: 0 },
        jetbrains: { compatible: 0, compatibility_rate: 0, issues: 0 }
      }
    });
    expect(results.summary.issues).toEqual({
      total: 3,
      byType: { missing_feature: 1, minimal_config: 1, invalid_config: 1 },
      bySeverity: { error: 1, warning: 1, info: 1 }
    });
  });
});

describe('compatibility checker CLI run in-process', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('prints usage and succeeds for --help', async () => {
    const result = await runCompatibilityCli(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage: compatibility-checker <schemas-directory> [options]\n');
    expect(result.stdout).toContain('--platform=<name>  Check a specific platform only\n');
  });

  it('prints usage and fails without a directory', async () => {
    const result = await runCompatibilityCli([]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage: compatibility-checker <schemas-directory> [options]\n');
  });

  it('prints the summary and platform rates for the real examples', async () => {
    const result = await runCompatibilityCli([examplesDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.split('\n').slice(0, 14)).toEqual([
      `Checking compatibility for schemas in: ${examplesDir}`,
      '',
      '=== Compatibility Summary ===',
      'Total Schemas: 4',
      'High Compatibility (80%+): 4',
      'Medium Compatibility (50-79%): 0',
      'Low Compatibility (<50%): 0',
      '',
      'Total Issues: 12',
      'Errors: 0',
      'Warnings: 8',
      'Info: 4',
      '',
      '=== Platform Compatibility ==='
    ]);
    expect(result.stdout).toContain('\nclaude-code: 4/4 (100%) - 0 issues\n');
    expect(result.stdout).toContain('\nwindsurf: 4/4 (100%) - 4 issues\n');
    expect(result.stdout).toContain('\nopenai-codex: 0/4 (0%) - 0 issues\n');
    expect(result.stdout).not.toContain('=== Detailed Results ===');
    expect(result.stdout).not.toContain('=== Schema Compatibility Scores ===');
  });

  it('adds platform details and schema scores with --verbose', async () => {
    const result = await runCompatibilityCli([examplesDir, '--verbose']);
    const minimal = 'Platform has minimal configuration (enabled only, no components)';
    const oversized = 'Content may exceed Windsurf limit (estimated 6217 chars)';

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('\n📱 Platform: cursor\nCompatible Schemas: 4/4\n');
    expect(result.stdout).toContain(
      'Features: main, rules, auto-attachment, file-patterns\nLimitations: vs-code-dependency\n'
    );
    expect(result.stdout).toContain(
      '\n📱 Platform: openai-codex\nCompatible Schemas: 0/4\nFeatures: \n'
    );
    expect(result.stdout).toContain(`size_warning: ${oversized} (react-component-patterns)\n`);
    expect(result.stdout).toContain(`minimal_config: ${minimal} (react-component-patterns)\n`);
    expect(result.stdout).toContain('\n=== Schema Compatibility Scores ===\n');
    expect(result.stdout).toContain(' react-component-patterns: 88%\n');
    expect(result.stdout).toContain(
      'Content may be truncated on GitHub Copilot due to character limit (3000)\n'
    );
  });

  it('restricts the report to one platform with --platform', async () => {
    const result = await runCompatibilityCli([examplesDir, '--verbose', '--platform=cursor']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('\nTotal Issues: 0\n');
    expect(result.stdout).toContain('\ncursor: 4/4 (100%) - 0 issues\n');
    expect(result.stdout).toContain('Platform: cursor\n');
    expect(result.stdout).not.toContain('Platform: windsurf');
    expect(result.stdout).not.toContain('\nwindsurf: ');
  });

  it('exits with code 1 when a schema has an error-level issue', async () => {
    await writeScoredTree(tempDir);

    const result = await runCompatibilityCli([tempDir, '--verbose']);
    const missing = 'Claude Code platform enabled but no components configured';
    const minimal = 'Platform has minimal configuration (enabled only, no components)';

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Total Schemas: 3\nHigh Compatibility (80%+): 1\n');
    expect(result.stdout).toContain(
      'Medium Compatibility (50-79%): 1\nLow Compatibility (<50%): 1\n'
    );
    expect(result.stdout).toContain('\nTotal Issues: 3\nErrors: 1\nWarnings: 1\nInfo: 1\n');
    expect(result.stdout).toContain('\nclaude-code: 2/3 (67%) - 1 issues\n');
    expect(result.stdout).toContain('invalid_config: Invalid glob pattern:  (low-score)\n');
    expect(result.stdout).toContain(`missing_feature: ${missing} (medium-score)\n`);
    expect(result.stdout).toContain(`minimal_config: ${minimal} (high-score)\n`);
    expect(result.stdout).toContain(' high-score: 100%\n');
    expect(result.stdout).toContain(' medium-score: 50%\n');
    expect(result.stdout).toContain(' low-score: 33%\n');
  });

  it('rejects a target that is a file', async () => {
    const filePath = await createTestFile(tempDir, 'single.yaml', blueprintSource());

    const result = await runCompatibilityCli([filePath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe(`Compatibility check failed: Directory not found: ${filePath}\n`);
  });

  it('reports a directory that does not exist on stderr', async () => {
    const result = await runCompatibilityCli([path.join(tempDir, 'missing')]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Compatibility check failed: ENOENT');
  });

  it('prints the results as JSON after the status line with --json', async () => {
    const result = await runCompatibilityCli([examplesDir, '--json']);
    // The status line is written to stdout ahead of the JSON document.
    const [statusLine, ...jsonLines] = result.stdout.split('\n');
    const payload: unknown = JSON.parse(jsonLines.join('\n'));

    expect(result.exitCode).toBe(0);
    expect(statusLine).toBe(`Checking compatibility for schemas in: ${examplesDir}`);
    expect(payload).toMatchObject({
      summary: {
        schemas: { total: 4 },
        platforms: { total: 8 },
        issues: { total: 12 }
      }
    });
  });
});
