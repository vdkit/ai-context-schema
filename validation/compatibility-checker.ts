#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  getComponentManifests,
  getPlatformComponents,
  isPlatformEnabled,
  SchemaValidator,
  type ParsedSchema,
  type PlatformComponent,
  type PlatformConfig
} from './schema-validator.js';

type IssueSeverity = 'error' | 'warning' | 'info';

interface CompatibilityIssue {
  type: string;
  severity: IssueSeverity;
  message: string;
  schema?: string;
  filePath?: string;
}

interface SchemaEntry {
  filePath: string;
  schema: ParsedSchema;
}

interface PlatformFeatureSummary {
  supported: string[];
  unsupported: string[];
  limitations: string[];
  used?: string[];
}

interface PlatformCompatibilityResult {
  platform: string;
  total: number;
  compatible: number;
  incompatible: number;
  issues: CompatibilityIssue[];
  features: PlatformFeatureSummary;
}

interface SchemaPlatformCompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
}

interface SchemaCompatibilityResult {
  id: string;
  platforms: Record<string, SchemaPlatformCompatibilityResult>;
  issues: CompatibilityIssue[];
  score: number;
}

interface CompatibilitySummary {
  schemas: {
    total: number;
    highCompatibility: number;
    mediumCompatibility: number;
    lowCompatibility: number;
  };
  platforms: {
    total: number;
    details: Record<
      string,
      {
        compatible: number;
        compatibility_rate: number;
        issues: number;
      }
    >;
  };
  issues: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<IssueSeverity, number>;
  };
}

interface CompatibilityResults {
  platforms: Record<string, PlatformCompatibilityResult>;
  schemas: Record<string, SchemaCompatibilityResult>;
  summary: CompatibilitySummary;
}

interface CliOptions {
  json: boolean;
  platform?: string;
  verbose: boolean;
}

function isDirectExecution(importMetaUrl: string): boolean {
  const entrypoint = process.argv[1];
  return entrypoint !== undefined && pathToFileURL(entrypoint).href === importMetaUrl;
}

function writeStdout(message: string): void {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

async function collectSchemaFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const schemaFiles: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      schemaFiles.push(...(await collectSchemaFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
      schemaFiles.push(fullPath);
    }
  }

  return schemaFiles;
}

function printUsage(): void {
  writeStdout('Usage: compatibility-checker <schemas-directory> [options]');
  writeStdout('');
  writeStdout('Options:');
  writeStdout('  --help             Show this help message');
  writeStdout('  --json             Output results as JSON');
  writeStdout('  --platform=<name>  Check a specific platform only');
  writeStdout('  --verbose          Show detailed output');
}

export class CompatibilityChecker {
  readonly validator: SchemaValidator;
  results: CompatibilityResults;

  constructor() {
    this.validator = new SchemaValidator();
    this.results = this.createEmptyResults();
  }

  createEmptyResults(): CompatibilityResults {
    return {
      platforms: {},
      schemas: {},
      summary: {
        schemas: {
          total: 0,
          highCompatibility: 0,
          mediumCompatibility: 0,
          lowCompatibility: 0
        },
        platforms: {
          total: 0,
          details: {}
        },
        issues: {
          total: 0,
          byType: {},
          bySeverity: {
            error: 0,
            warning: 0,
            info: 0
          }
        }
      }
    };
  }

  async checkCompatibility(
    schemasDir: string,
    platformFilter?: string
  ): Promise<CompatibilityResults> {
    this.results = this.createEmptyResults();
    const schemaFiles = await this.findSchemaFiles(schemasDir);
    const schemas: SchemaEntry[] = [];

    for (const filePath of schemaFiles) {
      try {
        const content = await readFile(filePath, 'utf8');
        const schema = this.validator.parseSchema(content);
        const validation = this.validator.validateSchema(schema, filePath);

        if (validation.valid) {
          schemas.push({ schema, filePath });
        } else {
          this.results.summary.issues.total += 1;
        }
      } catch {
        this.results.summary.issues.total += 1;
        this.results.summary.issues.byType.parse_error =
          (this.results.summary.issues.byType.parse_error ?? 0) + 1;
      }
    }

    const platforms = platformFilter ? [platformFilter] : this.extractPlatforms(schemas);
    for (const platform of platforms) {
      this.results.platforms[platform] = await this.checkPlatformCompatibility(platform, schemas);
    }

    for (const { schema } of schemas) {
      if (!schema.id) {
        continue;
      }

      this.results.schemas[schema.id] = this.checkSchemaCompatibility(schema);
    }

    this.generateSummary();
    return this.results;
  }

  async findSchemaFiles(directory: string): Promise<string[]> {
    return collectSchemaFiles(directory);
  }

  extractPlatforms(schemas: SchemaEntry[]): string[] {
    const platforms = new Set<string>();

    for (const { schema } of schemas) {
      if (!schema.platforms) {
        continue;
      }

      for (const platform of Object.keys(schema.platforms)) {
        platforms.add(platform);
      }
    }

    return [...platforms];
  }

  async checkPlatformCompatibility(
    platform: string,
    schemas: SchemaEntry[]
  ): Promise<PlatformCompatibilityResult> {
    const result: PlatformCompatibilityResult = {
      platform,
      total: schemas.length,
      compatible: 0,
      incompatible: 0,
      issues: [],
      features: {
        supported: [],
        unsupported: [],
        limitations: []
      }
    };

    const compatibleSchemas = schemas.filter(({ schema }) => {
      const platformConfig = schema.platforms?.[platform];
      return platformConfig !== undefined && isPlatformEnabled(platformConfig);
    });

    result.compatible = compatibleSchemas.length;
    result.incompatible = result.total - result.compatible;

    for (const { schema } of compatibleSchemas) {
      const platformConfig = schema.platforms?.[platform];
      if (!platformConfig) {
        continue;
      }

      result.issues.push(...this.validatePlatformFeatures(platform, platformConfig, schema));
    }

    result.features = this.analyzePlatformFeatures(platform, compatibleSchemas);
    return result;
  }

  validatePlatformFeatures(
    platform: string,
    config: PlatformConfig,
    schema: ParsedSchema
  ): CompatibilityIssue[] {
    switch (platform) {
      case 'claude-code':
        return this.validateClaudeFeatures(config, schema);
      case 'cursor':
        return this.validateCursorFeatures(config, schema);
      case 'windsurf':
        return this.validateWindsurfFeatures(config, schema);
      case 'github-copilot':
        return this.validateCopilotFeatures(config, schema);
      default:
        return this.validateGenericFeatures(config, schema);
    }
  }

  validateClaudeFeatures(config: PlatformConfig, schema: ParsedSchema): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];
    const components = getPlatformComponents(config);

    if (config.enabled !== false && components.length === 0) {
      issues.push({
        type: 'missing_feature',
        severity: 'warning',
        message: 'Claude Code platform enabled but no components configured',
        schema: schema.id
      });
    }

    return issues;
  }

  validateCursorFeatures(config: PlatformConfig, schema: ParsedSchema): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    for (const component of getPlatformComponents(config)) {
      if (component.type !== 'cursor-rule') {
        continue;
      }

      for (const manifest of getComponentManifests(component)) {
        if (manifest.activation === 'auto-attached' && !Array.isArray(manifest.globs)) {
          issues.push({
            type: 'missing_requirement',
            severity: 'error',
            message: `Auto-attached activation requires globs configuration (manifest: ${manifest.name ?? 'unnamed'})`,
            schema: schema.id
          });
        }

        if (Array.isArray(manifest.globs)) {
          for (const glob of manifest.globs) {
            if (typeof glob !== 'string' || glob.length === 0) {
              issues.push({
                type: 'invalid_config',
                severity: 'error',
                message: `Invalid glob pattern: ${String(glob)}`,
                schema: schema.id
              });
            }
          }
        }
      }
    }

    return issues;
  }

  validateWindsurfFeatures(config: PlatformConfig, schema: ParsedSchema): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];
    const estimatedSize = this.estimateContentSize(schema);

    if (estimatedSize > 6000) {
      issues.push({
        type: 'size_warning',
        severity: 'warning',
        message: `Content may exceed Windsurf limit (estimated ${estimatedSize} chars)`,
        schema: schema.id
      });
    }

    for (const component of getPlatformComponents(config)) {
      for (const manifest of getComponentManifests(component)) {
        if (typeof manifest.mode === 'string' && !['glob', 'always'].includes(manifest.mode)) {
          issues.push({
            type: 'invalid_config',
            severity: 'error',
            message: `Invalid mode: ${manifest.mode}`,
            schema: schema.id
          });
        }
      }
    }

    return issues;
  }

  validateCopilotFeatures(config: PlatformConfig, schema: ParsedSchema): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];
    const estimatedSize = this.estimateContentSize(schema);

    for (const component of getPlatformComponents(config)) {
      if (component.type !== 'copilot-repo') {
        continue;
      }

      const maxChars = component.constraints?.maxChars ?? 3000;
      if (estimatedSize > maxChars) {
        issues.push({
          type: 'size_warning',
          severity: 'warning',
          message: `Content may exceed GitHub Copilot limit (estimated ${estimatedSize} chars, limit ${maxChars})`,
          schema: schema.id
        });
      }
    }

    return issues;
  }

  validateGenericFeatures(config: PlatformConfig, schema: ParsedSchema): CompatibilityIssue[] {
    if (getPlatformComponents(config).length > 0) {
      return [];
    }

    return [
      {
        type: 'minimal_config',
        severity: 'info',
        message: 'Platform has minimal configuration (enabled only, no components)',
        schema: schema.id
      }
    ];
  }

  analyzePlatformFeatures(platform: string, schemas: SchemaEntry[]): PlatformFeatureSummary {
    const features: PlatformFeatureSummary = {
      supported: [],
      unsupported: [],
      limitations: []
    };

    const configs = schemas
      .map(({ schema }) => schema.platforms?.[platform])
      .filter((config): config is PlatformConfig => Boolean(config));

    const usesComponentType = (predicate: (component: PlatformComponent) => boolean): boolean =>
      configs.some((config) => getPlatformComponents(config).some(predicate));

    switch (platform) {
      case 'claude-code':
        features.supported = ['main', 'agents', 'rules', 'commands', 'skills', 'settings'];
        if (usesComponentType((component) => component.type === 'claude-main')) {
          features.used = [...(features.used ?? []), 'main'];
        }
        if (usesComponentType((component) => component.type === 'claude-command')) {
          features.used = [...(features.used ?? []), 'commands'];
        }
        if (usesComponentType((component) => component.type === 'claude-skill')) {
          features.used = [...(features.used ?? []), 'skills'];
        }
        break;
      case 'cursor':
        features.supported = ['main', 'rules', 'auto-attachment', 'file-patterns'];
        features.limitations = ['vs-code-dependency'];
        break;
      case 'windsurf':
        features.supported = ['rules', 'workflows', 'glob-scoping'];
        features.limitations = ['6k-character-limit'];
        break;
      case 'github-copilot':
        features.supported = ['repo-level-instructions'];
        features.limitations = ['github-dependency', '3k-character-limit'];
        break;
    }

    return features;
  }

  checkSchemaCompatibility(schema: ParsedSchema): SchemaCompatibilityResult {
    const schemaId = schema.id ?? 'unknown-schema';
    const result: SchemaCompatibilityResult = {
      id: schemaId,
      platforms: {},
      issues: [],
      score: 0
    };

    const platformEntries = Object.entries(schema.platforms ?? {});
    let compatiblePlatforms = 0;

    for (const [platform, config] of platformEntries) {
      const platformResult: SchemaPlatformCompatibilityResult = {
        compatible: isPlatformEnabled(config),
        issues: []
      };

      if (platformResult.compatible) {
        compatiblePlatforms += 1;
        platformResult.issues = this.validatePlatformFeatures(platform, config, schema);
      }

      result.platforms[platform] = platformResult;
    }

    result.score =
      platformEntries.length > 0
        ? Math.round((compatiblePlatforms / platformEntries.length) * 100)
        : 0;
    result.issues.push(...this.checkCrossPlatformIssues(schema));

    return result;
  }

  checkCrossPlatformIssues(schema: ParsedSchema): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];
    const contentSize = this.estimateContentSize(schema);

    const windsurfConfig = schema.platforms?.windsurf;
    if (windsurfConfig !== undefined && isPlatformEnabled(windsurfConfig) && contentSize > 6000) {
      issues.push({
        type: 'cross_platform_issue',
        severity: 'warning',
        message: 'Content may be truncated on Windsurf due to character limit'
      });
    }

    const copilotConfig = schema.platforms?.['github-copilot'];
    if (copilotConfig !== undefined && isPlatformEnabled(copilotConfig)) {
      for (const component of getPlatformComponents(copilotConfig)) {
        if (component.type !== 'copilot-repo') {
          continue;
        }

        const maxChars = component.constraints?.maxChars ?? 3000;
        if (contentSize > maxChars) {
          issues.push({
            type: 'cross_platform_issue',
            severity: 'warning',
            message: `Content may be truncated on GitHub Copilot due to character limit (${maxChars})`
          });
        }
      }
    }

    return issues;
  }

  estimateContentSize(schema: ParsedSchema): number {
    return (
      (schema.title?.length ?? 0) +
      (schema.description?.length ?? 0) +
      (schema._content?.length ?? 0) +
      200
    );
  }

  generateSummary(): void {
    const { platforms, schemas } = this.results;

    this.results.summary = {
      schemas: {
        total: Object.keys(schemas).length,
        highCompatibility: Object.values(schemas).filter((schema) => schema.score >= 80).length,
        mediumCompatibility: Object.values(schemas).filter(
          (schema) => schema.score >= 50 && schema.score < 80
        ).length,
        lowCompatibility: Object.values(schemas).filter((schema) => schema.score < 50).length
      },
      platforms: {
        total: Object.keys(platforms).length,
        details: {}
      },
      issues: {
        total: 0,
        byType: {},
        bySeverity: {
          error: 0,
          warning: 0,
          info: 0
        }
      }
    };

    for (const [platform, data] of Object.entries(platforms)) {
      this.results.summary.platforms.details[platform] = {
        compatible: data.compatible,
        compatibility_rate: data.total > 0 ? Math.round((data.compatible / data.total) * 100) : 0,
        issues: data.issues.length
      };

      for (const issue of data.issues) {
        this.results.summary.issues.total += 1;
        this.results.summary.issues.byType[issue.type] =
          (this.results.summary.issues.byType[issue.type] ?? 0) + 1;
        this.results.summary.issues.bySeverity[issue.severity] += 1;
      }
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exitCode = args.includes('--help') ? 0 : 1;
    return;
  }

  const schemasDir = args[0];
  if (schemasDir === undefined) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const options: CliOptions = {
    json: args.includes('--json'),
    verbose: args.includes('--verbose'),
    platform: args.find((arg) => arg.startsWith('--platform='))?.split('=')[1]
  };

  const schemasDirStats = await stat(schemasDir);
  if (!schemasDirStats.isDirectory()) {
    throw new Error(`Directory not found: ${schemasDir}`);
  }

  writeStdout(`Checking compatibility for schemas in: ${schemasDir}`);

  const checker = new CompatibilityChecker();
  const results = await checker.checkCompatibility(schemasDir, options.platform);

  if (options.json) {
    writeStdout(JSON.stringify(results, null, 2));
  } else {
    printCompatibilityResults(results, options);
  }

  process.exitCode = results.summary.issues.bySeverity.error > 0 ? 1 : 0;
}

function printCompatibilityResults(results: CompatibilityResults, options: CliOptions): void {
  const { summary, platforms, schemas } = results;

  writeStdout('\n=== Compatibility Summary ===');
  writeStdout(`Total Schemas: ${summary.schemas.total}`);
  writeStdout(`High Compatibility (80%+): ${summary.schemas.highCompatibility}`);
  writeStdout(`Medium Compatibility (50-79%): ${summary.schemas.mediumCompatibility}`);
  writeStdout(`Low Compatibility (<50%): ${summary.schemas.lowCompatibility}`);
  writeStdout(`\nTotal Issues: ${summary.issues.total}`);
  writeStdout(`Errors: ${summary.issues.bySeverity.error}`);
  writeStdout(`Warnings: ${summary.issues.bySeverity.warning}`);
  writeStdout(`Info: ${summary.issues.bySeverity.info}`);

  writeStdout('\n=== Platform Compatibility ===');
  for (const [platform, stats] of Object.entries(summary.platforms.details)) {
    const platformStats = platforms[platform];
    if (!platformStats) {
      continue;
    }

    writeStdout(
      `${platform}: ${stats.compatible}/${platformStats.total} (${stats.compatibility_rate}%) - ${stats.issues} issues`
    );
  }

  if (!options.verbose) {
    return;
  }

  writeStdout('\n=== Detailed Results ===');
  for (const [platform, data] of Object.entries(platforms)) {
    if (options.platform && platform !== options.platform) {
      continue;
    }

    writeStdout(`\n📱 Platform: ${platform}`);
    writeStdout(`Compatible Schemas: ${data.compatible}/${data.total}`);
    writeStdout(`Features: ${data.features.supported.join(', ')}`);

    if (data.features.limitations.length > 0) {
      writeStdout(`Limitations: ${data.features.limitations.join(', ')}`);
    }

    if (data.issues.length > 0) {
      writeStdout('Issues:');
      for (const issue of data.issues) {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        writeStdout(`  ${icon} ${issue.type}: ${issue.message} (${issue.schema ?? 'unknown'})`);
      }
    }
  }

  writeStdout('\n=== Schema Compatibility Scores ===');
  for (const [id, data] of Object.entries(schemas)) {
    const scoreIcon = data.score >= 80 ? '🟢' : data.score >= 50 ? '🟡' : '🔴';
    writeStdout(`${scoreIcon} ${id}: ${data.score}%`);

    if (data.issues.length > 0) {
      for (const issue of data.issues) {
        writeStdout(`    ⚠️ ${issue.message}`);
      }
    }
  }
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    writeStderr(
      `Compatibility check failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  });
}
