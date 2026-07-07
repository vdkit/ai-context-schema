#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Ajv, type ErrorObject, type ValidateFunction } from 'ajv';
import yaml from 'js-yaml';

import schemaDefinition from '../schemas/vdk/blueprint-schema.json' with { type: 'json' };

const ajvFormatsModule = await import('ajv-formats');
const addFormats = ajvFormatsModule.default.default;

type IssueSeverity = 'error' | 'warning' | 'info';

export interface DependencyReference extends Record<string, unknown> {
  id?: string;
}

export interface ComponentManifest extends Record<string, unknown> {
  name?: string;
  file?: string;
  enabled?: boolean;
  globs?: string[];
  activation?: string;
  mode?: string;
}

export interface PlatformComponent extends Record<string, unknown> {
  type?: string;
  location?: string;
  enabled?: boolean;
  manifests?: ComponentManifest[];
  constraints?: {
    maxChars?: number;
  };
}

export interface PlatformConfig extends Record<string, unknown> {
  enabled?: boolean;
  components?: Record<string, PlatformComponent>;
}

export interface ParsedSchema extends Record<string, unknown> {
  id?: string;
  title?: string;
  description?: string;
  schemaVersion?: string;
  version?: string;
  kind?: string;
  category?: string;
  platforms?: Record<string, PlatformConfig>;
  requires?: Array<string | DependencyReference>;
  suggests?: string[];
  conflicts?: string[];
  supersedes?: string[];
  _content: string;
}

export interface ValidationIssue {
  type: string;
  severity: IssueSeverity;
  path: string | null;
  message: string;
  data?: unknown;
  allowedValues?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  filePath: string;
  schema?: ParsedSchema;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  errors: number;
  warnings: number;
  errorTypes: Record<string, number>;
  warningTypes: Record<string, number>;
}

export interface ValidationResults {
  results: ValidationResult[];
  summary: ValidationSummary;
}

interface SchemaRegistryEntry {
  filePath: string;
  schema: ParsedSchema;
}

interface CliOptions {
  json: boolean;
  verbose: boolean;
  warnings: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A platform is considered enabled (the "platform-on" flag) unless it
 * explicitly opts out with `enabled: false`. In the v3.0 component
 * architecture, presence of a `components` object also implies the platform
 * is active.
 */
export function isPlatformEnabled(config: PlatformConfig): boolean {
  if (config.enabled === false) {
    return false;
  }

  return config.enabled === true || isRecord(config.components);
}

export function getPlatformComponents(config: PlatformConfig): PlatformComponent[] {
  if (!isRecord(config.components)) {
    return [];
  }

  return Object.values(config.components).filter(
    (component): component is PlatformComponent => isRecord(component)
  );
}

export function getComponentManifests(component: PlatformComponent): ComponentManifest[] {
  return Array.isArray(component.manifests)
    ? component.manifests.filter((manifest): manifest is ComponentManifest => isRecord(manifest))
    : [];
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

function partitionIssues(issues: ValidationIssue[]): {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity !== 'error');
  return { errors, warnings };
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
  writeStdout('Usage: ai-context-schema <file-or-directory> [options]');
  writeStdout('');
  writeStdout('Options:');
  writeStdout('  --help       Show this help message');
  writeStdout('  --verbose    Show detailed output');
  writeStdout('  --json       Output results as JSON');
  writeStdout('  --warnings   Show warnings in addition to errors');
}

export class SchemaValidator {
  ajv: Ajv;
  dependencies: Map<string, Array<string | DependencyReference>>;
  schemaDefinition: object;
  validator: ValidateFunction<ParsedSchema>;

  constructor(schema: object | null = null) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      validateFormats: true
    });
    addFormats(this.ajv);

    this.schemaDefinition = schema ?? schemaDefinition;
    this.validator = this.ajv.compile<ParsedSchema>(this.schemaDefinition);
    this.dependencies = new Map();
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    try {
      const content = await readFile(filePath, 'utf8');
      const schema = this.parseSchema(content);
      return this.validateSchema(schema, filePath);
    } catch (error) {
      return {
        valid: false,
        filePath,
        errors: [
          {
            type: 'parse_error',
            severity: 'error',
            message: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
            path: null
          }
        ],
        warnings: []
      };
    }
  }

  async validateFiles(filePaths: string[]): Promise<ValidationResults> {
    const results: ValidationResult[] = [];
    const allSchemas = new Map<string, SchemaRegistryEntry>();

    for (const filePath of filePaths) {
      const result = await this.validateFile(filePath);
      results.push(result);

      if (result.valid && result.schema?.id) {
        allSchemas.set(result.schema.id, {
          schema: result.schema,
          filePath
        });
      }
    }

    for (const result of results) {
      if (!result.valid || !result.schema) {
        continue;
      }

      const relationshipIssues = this.validateRelationships(result.schema, allSchemas);
      const { errors, warnings } = partitionIssues(relationshipIssues);
      result.errors.push(...errors);
      result.warnings.push(...warnings);

      if (errors.length > 0) {
        result.valid = false;
      }
    }

    return {
      results,
      summary: this.generateSummary(results)
    };
  }

  parseSchema(content: string): ParsedSchema {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('Invalid format: YAML frontmatter not found');
    }

    const frontmatter = match[1];
    const markdownContent = match[2] ?? '';
    if (frontmatter === undefined) {
      throw new Error('Invalid format: YAML frontmatter not found');
    }

    const loaded = yaml.load(frontmatter);

    if (!isRecord(loaded)) {
      throw new Error('Invalid YAML frontmatter: expected an object');
    }

    return {
      ...loaded,
      _content: markdownContent.trim()
    };
  }

  validateSchema(schema: ParsedSchema, filePath: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      filePath,
      schema,
      errors: [],
      warnings: []
    };

    const isValid = this.validator(schema);
    if (!isValid) {
      result.valid = false;
      result.errors.push(...this.formatAjvErrors(this.validator.errors));
    }

    const businessIssues = this.validateBusinessRules(schema);
    const businessPartition = partitionIssues(businessIssues);
    result.errors.push(...businessPartition.errors);
    result.warnings.push(...businessPartition.warnings);

    const contentIssues = this.validateContent(schema);
    const contentPartition = partitionIssues(contentIssues);
    result.errors.push(...contentPartition.errors);
    result.warnings.push(...contentPartition.warnings);

    if (result.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }

  formatAjvErrors(ajvErrors: ErrorObject[] | null | undefined): ValidationIssue[] {
    if (!ajvErrors) {
      return [];
    }

    return ajvErrors.map((error) => ({
      type: 'schema_validation',
      severity: 'error',
      path: error.instancePath || error.schemaPath || null,
      message: `${error.instancePath} ${error.message}`.trim(),
      data: error.data,
      allowedValues:
        isRecord(error.params) && 'allowedValues' in error.params
          ? error.params.allowedValues
          : undefined
    }));
  }

  validateBusinessRules(schema: ParsedSchema): ValidationIssue[] {
    const errors: ValidationIssue[] = [];

    if (this.hasCyclicDependencies(schema)) {
      errors.push({
        type: 'cyclic_dependency',
        severity: 'error',
        path: 'requires',
        message: 'Cyclic dependency detected in requires field'
      });
    }

    for (const [platform, config] of Object.entries(schema.platforms ?? {})) {
      errors.push(...this.validatePlatformConfig(platform, config, schema));
    }

    if (schema.id && !/^[a-z0-9-]+$/.test(schema.id)) {
      errors.push({
        type: 'invalid_id',
        severity: 'error',
        path: 'id',
        message: 'ID must be kebab-case (lowercase letters, numbers, and hyphens only)'
      });
    }

    if (
      schema.version &&
      !/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/.test(schema.version)
    ) {
      errors.push({
        type: 'invalid_version',
        severity: 'error',
        path: 'version',
        message: 'Version must follow semantic versioning format (e.g., 1.0.0)'
      });
    }

    errors.push(...this.findRelationshipConflicts(schema));

    return errors;
  }

  validatePlatformConfig(
    platform: string,
    config: PlatformConfig,
    schema: ParsedSchema
  ): ValidationIssue[] {
    const errors: ValidationIssue[] = [];

    // A platform explicitly disabled with `enabled: false` is skipped.
    if (!isPlatformEnabled(config)) {
      return errors;
    }

    const components = getPlatformComponents(config);
    const estimatedContentChars = this.estimateContentChars(schema);

    switch (platform) {
      case 'cursor': {
        // Auto-attached Cursor rules require glob patterns to scope activation.
        for (const component of components) {
          if (component.type !== 'cursor-rule') {
            continue;
          }

          for (const manifest of getComponentManifests(component)) {
            if (manifest.activation === 'auto-attached' && !Array.isArray(manifest.globs)) {
              errors.push({
                type: 'missing_globs',
                severity: 'error',
                path: `platforms.${platform}.components`,
                message: `Globs required for auto-attached activation (manifest: ${manifest.name ?? 'unnamed'})`
              });
            }
          }
        }
        break;
      }

      case 'windsurf': {
        // Windsurf imposes a hard 6,000 character total limit on its rule content.
        if (estimatedContentChars > 6000) {
          errors.push({
            type: 'character_limit_exceeded',
            severity: 'warning',
            path: `platforms.${platform}.components`,
            message: `Content (estimated ${estimatedContentChars} chars) exceeds Windsurf maximum (6000)`
          });
        }
        break;
      }

      case 'github-copilot': {
        // GitHub Copilot repo-level instructions are limited to 3,000 characters.
        for (const component of components) {
          if (component.type !== 'copilot-repo') {
            continue;
          }

          const maxChars = component.constraints?.maxChars ?? 3000;
          if (estimatedContentChars > maxChars) {
            errors.push({
              type: 'character_limit_exceeded',
              severity: 'warning',
              path: `platforms.${platform}.components`,
              message: `Content (estimated ${estimatedContentChars} chars) exceeds GitHub Copilot limit (${maxChars})`
            });
          }
        }
        break;
      }
    }

    return errors;
  }

  /**
   * Estimates the total deployed character footprint of a blueprint
   * (title + markdown body + framing overhead) used for platform character
   * limit checks against the `components` content.
   */
  estimateContentChars(schema: ParsedSchema): number {
    const content = typeof schema._content === 'string' ? schema._content : '';
    return content.length + (schema.title?.length ?? 0) + (schema.description?.length ?? 0) + 200;
  }

  validateContent(schema: ParsedSchema): ValidationIssue[] {
    const errors: ValidationIssue[] = [];
    const content = typeof schema._content === 'string' ? schema._content : '';

    if (content.length < 50) {
      errors.push({
        type: 'insufficient_content',
        severity: 'warning',
        path: 'content',
        message: 'Content appears too short to be useful'
      });
    }

    if (!content.includes('#')) {
      errors.push({
        type: 'missing_headers',
        severity: 'warning',
        path: 'content',
        message: 'Content should include markdown headers for organization'
      });
    }

    if (!content.includes('```')) {
      errors.push({
        type: 'missing_examples',
        severity: 'warning',
        path: 'content',
        message: 'Content should include code examples'
      });
    }

    return errors;
  }

  hasCyclicDependencies(schema: ParsedSchema): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const normalizeDependencyId = (dependency: string | DependencyReference): string | null => {
      if (typeof dependency === 'string') {
        return dependency;
      }

      return typeof dependency.id === 'string' ? dependency.id : null;
    };

    const hasCycle = (
      schemaId: string,
      requires: Array<string | DependencyReference> = []
    ): boolean => {
      if (recursionStack.has(schemaId)) {
        return true;
      }
      if (visited.has(schemaId)) {
        return false;
      }

      visited.add(schemaId);
      recursionStack.add(schemaId);

      for (const dependency of requires) {
        const dependencyId = normalizeDependencyId(dependency);
        if (!dependencyId) {
          continue;
        }

        if (hasCycle(dependencyId, this.dependencies.get(dependencyId) ?? [])) {
          return true;
        }
      }

      recursionStack.delete(schemaId);
      return false;
    };

    if (!schema.id) {
      return false;
    }

    const requires = schema.requires ?? [];
    this.dependencies.set(schema.id, requires);
    return hasCycle(schema.id, requires);
  }

  findRelationshipConflicts(schema: ParsedSchema): ValidationIssue[] {
    const errors: ValidationIssue[] = [];
    const requires = new Set(
      (schema.requires ?? [])
        .map((dependency) => (typeof dependency === 'string' ? dependency : dependency.id))
        .filter((dependencyId): dependencyId is string => Boolean(dependencyId))
    );
    const conflicts = new Set(schema.conflicts ?? []);

    const intersection = [...requires].filter((id) => conflicts.has(id));
    if (intersection.length > 0) {
      errors.push({
        type: 'conflicting_relationships',
        severity: 'error',
        path: 'requires/conflicts',
        message: `Schemas cannot be both required and conflicted: ${intersection.join(', ')}`
      });
    }

    return errors;
  }

  validateRelationships(
    schema: ParsedSchema,
    allSchemas: Map<string, SchemaRegistryEntry>
  ): ValidationIssue[] {
    const errors: ValidationIssue[] = [];

    const normalizeDependencyId = (
      dependency: string | DependencyReference | undefined
    ): string | null => {
      if (typeof dependency === 'string') {
        return dependency;
      }

      return dependency && typeof dependency.id === 'string' ? dependency.id : null;
    };

    for (const requiredDependency of schema.requires ?? []) {
      const requiredId = normalizeDependencyId(requiredDependency);
      if (!requiredId) {
        continue;
      }

      if (!allSchemas.has(requiredId)) {
        errors.push({
          type: 'missing_dependency',
          severity: 'error',
          path: 'requires',
          message: `Required schema not found: ${requiredId}`
        });
      }
    }

    for (const suggestedId of schema.suggests ?? []) {
      if (!allSchemas.has(suggestedId)) {
        errors.push({
          type: 'missing_suggestion',
          severity: 'warning',
          path: 'suggests',
          message: `Suggested schema not found: ${suggestedId}`
        });
      }
    }

    for (const supersededId of schema.supersedes ?? []) {
      if (!allSchemas.has(supersededId)) {
        errors.push({
          type: 'missing_superseded',
          severity: 'warning',
          path: 'supersedes',
          message: `Superseded schema not found: ${supersededId}`
        });
      }
    }

    return errors;
  }

  generateSummary(results: ValidationResult[]): ValidationSummary {
    const summary: ValidationSummary = {
      total: results.length,
      valid: results.filter((result) => result.valid).length,
      invalid: results.filter((result) => !result.valid).length,
      errors: results.reduce((sum, result) => sum + result.errors.length, 0),
      warnings: results.reduce((sum, result) => sum + result.warnings.length, 0),
      errorTypes: {},
      warningTypes: {}
    };

    for (const result of results) {
      for (const error of result.errors) {
        summary.errorTypes[error.type] = (summary.errorTypes[error.type] ?? 0) + 1;
      }

      for (const warning of result.warnings) {
        summary.warningTypes[warning.type] = (summary.warningTypes[warning.type] ?? 0) + 1;
      }
    }

    return summary;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exitCode = args.includes('--help') ? 0 : 1;
    return;
  }

  const validator = new SchemaValidator();
  const options: CliOptions = {
    verbose: args.includes('--verbose'),
    json: args.includes('--json'),
    warnings: args.includes('--warnings')
  };

  const target = args[0];
  if (target === undefined) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const targetStats = await stat(target);
  const filePaths = targetStats.isDirectory() ? await collectSchemaFiles(target) : [target];

  if (filePaths.length === 0) {
    writeStdout('No schema files found');
    process.exitCode = 1;
    return;
  }

  writeStdout(`Validating ${filePaths.length} schema file(s)...`);

  const results = await validator.validateFiles(filePaths);

  if (options.json) {
    writeStdout(JSON.stringify(results, null, 2));
  } else {
    printResults(results, options);
  }

  process.exitCode = results.summary.invalid > 0 ? 1 : 0;
}

function printResults(results: ValidationResults, options: CliOptions): void {
  const { summary } = results;

  writeStdout('\n=== Validation Summary ===');
  writeStdout(`Total files: ${summary.total}`);
  writeStdout(`Valid: ${summary.valid}`);
  writeStdout(`Invalid: ${summary.invalid}`);
  writeStdout(`Errors: ${summary.errors}`);
  writeStdout(`Warnings: ${summary.warnings}`);

  if (summary.invalid > 0 || options.verbose) {
    writeStdout('\n=== Detailed Results ===');

    for (const result of results.results) {
      if (result.valid && !options.verbose) {
        continue;
      }

      writeStdout(`\n📄 ${result.filePath}`);
      writeStdout(`Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);

      if (result.schema) {
        writeStdout(`ID: ${result.schema.id ?? ''}`);
        writeStdout(`Title: ${result.schema.title ?? ''}`);
        writeStdout(`Version: ${result.schema.version ?? ''}`);
      }

      if (result.errors.length > 0) {
        writeStdout('\nErrors:');
        for (const error of result.errors) {
          writeStdout(`  ❌ ${error.type}: ${error.message}`);
          if (error.path) {
            writeStdout(`     Path: ${error.path}`);
          }
        }
      }

      if (options.warnings && result.warnings.length > 0) {
        writeStdout('\nWarnings:');
        for (const warning of result.warnings) {
          writeStdout(`  ⚠️  ${warning.type}: ${warning.message}`);
          if (warning.path) {
            writeStdout(`     Path: ${warning.path}`);
          }
        }
      }
    }
  }

  if (Object.keys(summary.errorTypes).length > 0) {
    writeStdout('\n=== Error Types ===');
    for (const [type, count] of Object.entries(summary.errorTypes)) {
      writeStdout(`${type}: ${count}`);
    }
  }

  if (options.warnings && Object.keys(summary.warningTypes).length > 0) {
    writeStdout('\n=== Warning Types ===');
    for (const [type, count] of Object.entries(summary.warningTypes)) {
      writeStdout(`${type}: ${count}`);
    }
  }
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    writeStderr(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
