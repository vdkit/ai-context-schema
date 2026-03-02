#!/usr/bin/env node

/**
 * AI Context Schema Validator
 * Validates context schemas against the AI Context Schema specification
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Load the JSON Schema definition
const schemaDefinition = require('../schemas/v3.0.0/context-schema.json');

/**
 *
 */
class SchemaValidator {
  /**
   * Create a schema validator instance.
   * @param {object | null} schema - Optional schema definition override.
   */
  constructor(schema = null) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      validateFormats: true
    });
    addFormats(this.ajv);

    this.schemaDefinition = schema || schemaDefinition;
    this.validator = this.ajv.compile(this.schemaDefinition);
    this.dependencies = new Map();
  }

  /**
   * Validate a single context schema file
   * @param {string} filePath - Path to the schema file
   * @returns {ValidationResult}
   */
  async validateFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const schema = this.parseSchema(content);

      return this.validateSchema(schema, filePath);
    } catch (error) {
      return {
        valid: false,
        filePath,
        errors: [
          {
            type: 'parse_error',
            message: `Failed to parse file: ${error.message}`,
            path: null
          }
        ]
      };
    }
  }

  /**
   * Validate multiple schema files
   * @param {string[]} filePaths - Array of file paths
   * @returns {ValidationResults}
   */
  async validateFiles(filePaths) {
    const results = [];
    const allSchemas = new Map();

    // First pass: parse and validate individual schemas
    for (const filePath of filePaths) {
      const result = await this.validateFile(filePath);
      results.push(result);

      if (result.valid && result.schema) {
        allSchemas.set(result.schema.id, {
          schema: result.schema,
          filePath
        });
      }
    }

    // Second pass: validate relationships
    for (const result of results) {
      if (result.valid && result.schema) {
        const relationshipErrors = this.validateRelationships(result.schema, allSchemas);

        if (relationshipErrors.length > 0) {
          result.errors.push(...relationshipErrors);
          result.valid = relationshipErrors.every((e) => e.severity !== 'error');
        }
      }
    }

    return {
      results,
      summary: this.generateSummary(results)
    };
  }

  /**
   * Parse a schema file (YAML frontmatter + markdown content)
   * @param {string} content - File content
   * @returns {object} Parsed schema
   */
  parseSchema(content) {
    // Split YAML frontmatter from markdown content
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('Invalid format: YAML frontmatter not found');
    }

    const [, frontmatter, markdownContent] = match;

    let schema;
    try {
      schema = yaml.load(frontmatter);
    } catch (error) {
      throw new Error(`Invalid YAML frontmatter: ${error.message}`);
    }

    // Add the markdown content to the schema for validation
    schema._content = markdownContent.trim();

    return schema;
  }

  /**
   * Validate a parsed schema against the JSON Schema definition
   * @param {object} schema - Parsed schema object
   * @param {string} filePath - Source file path
   * @returns {ValidationResult}
   */
  validateSchema(schema, filePath) {
    const result = {
      valid: true,
      filePath,
      schema,
      errors: [],
      warnings: []
    };

    // JSON Schema validation
    const isValid = this.validator(schema);
    if (!isValid) {
      result.valid = false;
      result.errors.push(...this.formatAjvErrors(this.validator.errors));
    }

    // Business logic validation
    const businessErrors = this.validateBusinessRules(schema);
    result.errors.push(...businessErrors.filter((e) => e.severity === 'error'));
    result.warnings.push(...businessErrors.filter((e) => e.severity === 'warning'));

    // Content validation
    const contentErrors = this.validateContent(schema);
    result.errors.push(...contentErrors.filter((e) => e.severity === 'error'));
    result.warnings.push(...contentErrors.filter((e) => e.severity === 'warning'));

    if (result.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }

  /**
   * Format AJV validation errors
   * @param {Array} ajvErrors - AJV error objects
   * @returns {Array} Formatted error objects
   */
  formatAjvErrors(ajvErrors) {
    return ajvErrors.map((error) => ({
      type: 'schema_validation',
      severity: 'error',
      path: error.instancePath || error.schemaPath,
      message: `${error.instancePath} ${error.message}`,
      data: error.data,
      allowedValues: error.params?.allowedValues
    }));
  }

  /**
   * Validate business rules beyond JSON Schema
   * @param {object} schema - Schema object
   * @returns {Array} Business rule validation errors
   */
  validateBusinessRules(schema) {
    const errors = [];

    // Check for dependency cycles
    if (this.hasCyclicDependencies(schema)) {
      errors.push({
        type: 'cyclic_dependency',
        severity: 'error',
        path: 'requires',
        message: 'Cyclic dependency detected in requires field'
      });
    }

    // Validate platform configurations
    for (const [platform, config] of Object.entries(schema.platforms || {})) {
      const platformErrors = this.validatePlatformConfig(platform, config);
      errors.push(...platformErrors);
    }

    // Check ID format and uniqueness
    if (schema.id && !/^[a-z0-9-]+$/.test(schema.id)) {
      errors.push({
        type: 'invalid_id',
        severity: 'error',
        path: 'id',
        message: 'ID must be kebab-case (lowercase letters, numbers, and hyphens only)'
      });
    }

    // Version format validation
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

    // Check for conflicting relationships
    const conflicts = this.findRelationshipConflicts(schema);
    errors.push(...conflicts);

    return errors;
  }

  /**
   * Validate platform-specific configuration
   * @param {string} platform - Platform name
   * @param {object} config - Platform configuration
   * @returns {Array} Platform validation errors
   */
  validatePlatformConfig(platform, config) {
    const errors = [];

    if (config.compatible === false) {
      return errors; // Skip validation for incompatible platforms
    }

    switch (platform) {
      case 'claude-code':
        if (config.command && !config.namespace) {
          errors.push({
            type: 'missing_namespace',
            severity: 'warning',
            path: `platforms.${platform}.namespace`,
            message: 'Namespace recommended when command is enabled'
          });
        }
        break;

      case 'cursor':
        if (config.activation === 'auto-attached' && !config.globs) {
          errors.push({
            type: 'missing_globs',
            severity: 'error',
            path: `platforms.${platform}.globs`,
            message: 'Globs required for auto-attached activation'
          });
        }
        break;

      case 'windsurf':
        if (config.characterLimit && config.characterLimit > 6000) {
          errors.push({
            type: 'character_limit_exceeded',
            severity: 'warning',
            path: `platforms.${platform}.characterLimit`,
            message: 'Character limit exceeds Windsurf maximum (6000)'
          });
        }
        break;

      case 'github-copilot':
        if (config.priority && (config.priority < 1 || config.priority > 10)) {
          errors.push({
            type: 'invalid_priority',
            severity: 'error',
            path: `platforms.${platform}.priority`,
            message: 'Priority must be between 1 and 10'
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Validate schema content
   * @param {object} schema - Schema object
   * @returns {Array} Content validation errors
   */
  validateContent(schema) {
    const errors = [];
    const content = schema._content || '';

    // Check for minimum content length
    if (content.length < 50) {
      errors.push({
        type: 'insufficient_content',
        severity: 'warning',
        path: 'content',
        message: 'Content appears too short to be useful'
      });
    }

    // Check for basic markdown structure
    if (!content.includes('#')) {
      errors.push({
        type: 'missing_headers',
        severity: 'warning',
        path: 'content',
        message: 'Content should include markdown headers for organization'
      });
    }

    // Check for code examples
    if (!content.includes('```')) {
      errors.push({
        type: 'missing_examples',
        severity: 'warning',
        path: 'content',
        message: 'Content should include code examples'
      });
    }

    // Estimate character count for Windsurf compatibility
    const estimatedChars = content.length + (schema.title?.length || 0) + 200;
    if (estimatedChars > 6000) {
      const windsurfConfig = schema.platforms?.windsurf;
      if (windsurfConfig?.compatible) {
        errors.push({
          type: 'windsurf_size_warning',
          severity: 'warning',
          path: 'content',
          message: `Content may be too large for Windsurf (estimated ${estimatedChars} chars, limit 6000)`
        });
      }
    }

    return errors;
  }

  /**
   * Check for cyclic dependencies
   * @param {object} schema - Schema object
   * @returns {boolean} True if cyclic dependencies exist
   */
  hasCyclicDependencies(schema) {
    const visited = new Set();
    const recursionStack = new Set();
    const normalizeDependencyId = (dependency) => {
      if (typeof dependency === 'string') {
        return dependency;
      }
      if (dependency && typeof dependency === 'object') {
        return dependency.id;
      }
      return null;
    };

    const hasCycle = (schemaId, requires = []) => {
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
        if (hasCycle(dependencyId, this.dependencies.get(dependencyId) || [])) {
          return true;
        }
      }

      recursionStack.delete(schemaId);
      return false;
    };

    this.dependencies.set(schema.id, schema.requires || []);
    return hasCycle(schema.id, schema.requires || []);
  }

  /**
   * Find relationship conflicts
   * @param {object} schema - Schema object
   * @returns {Array} Relationship conflict errors
   */
  findRelationshipConflicts(schema) {
    const errors = [];
    const requires = new Set(
      (schema.requires || [])
        .map((dependency) => (typeof dependency === 'string' ? dependency : dependency?.id))
        .filter(Boolean)
    );
    const conflicts = new Set(schema.conflicts || []);

    // Check for schemas that are both required and conflicted
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

  /**
   * Validate relationships between schemas
   * @param {object} schema - Schema to validate
   * @param {Map} allSchemas - Map of all schemas by ID
   * @returns {Array} Relationship validation errors
   */
  validateRelationships(schema, allSchemas) {
    const errors = [];
    const normalizeDependencyId = (dependency) =>
      typeof dependency === 'string' ? dependency : dependency?.id;

    // Check if required dependencies exist
    for (const requiredDependency of schema.requires || []) {
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

    // Check if suggested dependencies exist (warning only)
    for (const suggestedId of schema.suggests || []) {
      if (!allSchemas.has(suggestedId)) {
        errors.push({
          type: 'missing_suggestion',
          severity: 'warning',
          path: 'suggests',
          message: `Suggested schema not found: ${suggestedId}`
        });
      }
    }

    // Check if superseded schemas exist
    for (const supersededId of schema.supersedes || []) {
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

  /**
   * Generate validation summary
   * @param {Array} results - Validation results
   * @returns {object} Summary statistics
   */
  generateSummary(results) {
    const summary = {
      total: results.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      warnings: results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0),
      errorTypes: {},
      warningTypes: {}
    };

    // Count error types
    for (const result of results) {
      for (const error of result.errors) {
        summary.errorTypes[error.type] = (summary.errorTypes[error.type] || 0) + 1;
      }
      for (const warning of result.warnings || []) {
        summary.warningTypes[warning.type] = (summary.warningTypes[warning.type] || 0) + 1;
      }
    }

    return summary;
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node schema-validator.js <file-or-directory> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --verbose    Show detailed output');
    console.log('  --json       Output results as JSON');
    console.log('  --warnings   Show warnings in addition to errors');
    process.exit(1);
  }

  const validator = new SchemaValidator();
  const options = {
    verbose: args.includes('--verbose'),
    json: args.includes('--json'),
    warnings: args.includes('--warnings')
  };

  const target = args[0];
  let filePaths = [];

  // Determine if target is file or directory
  if (fs.statSync(target).isDirectory()) {
    // Find all .yaml and .yml files recursively
    const findSchemaFiles = (dir) => {
      const files = fs.readdirSync(dir);
      let schemaFiles = [];

      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          schemaFiles.push(...findSchemaFiles(fullPath));
        } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          schemaFiles.push(fullPath);
        }
      }

      return schemaFiles;
    };

    filePaths = findSchemaFiles(target);
  } else {
    filePaths = [target];
  }

  if (filePaths.length === 0) {
    console.log('No schema files found');
    process.exit(1);
  }

  console.log(`Validating ${filePaths.length} schema file(s)...`);

  const results = await validator.validateFiles(filePaths);

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printResults(results, options);
  }

  // Exit with error code if validation failed
  process.exit(results.summary.invalid > 0 ? 1 : 0);
}

/**
 * Print validation results to console
 * @param {object} results - Validation results
 * @param {object} options - Output options
 */
function printResults(results, options) {
  const { summary } = results;

  console.log('\n=== Validation Summary ===');
  console.log(`Total files: ${summary.total}`);
  console.log(`Valid: ${summary.valid}`);
  console.log(`Invalid: ${summary.invalid}`);
  console.log(`Errors: ${summary.errors}`);
  console.log(`Warnings: ${summary.warnings}`);

  if (summary.invalid > 0 || options.verbose) {
    console.log('\n=== Detailed Results ===');

    for (const result of results.results) {
      if (!result.valid || options.verbose) {
        console.log(`\n📄 ${result.filePath}`);
        console.log(`Status: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);

        if (result.schema) {
          console.log(`ID: ${result.schema.id}`);
          console.log(`Title: ${result.schema.title}`);
          console.log(`Version: ${result.schema.version}`);
        }

        if (result.errors.length > 0) {
          console.log('\nErrors:');
          for (const error of result.errors) {
            console.log(`  ❌ ${error.type}: ${error.message}`);
            if (error.path) {
              console.log(`     Path: ${error.path}`);
            }
          }
        }

        if (options.warnings && result.warnings && result.warnings.length > 0) {
          console.log('\nWarnings:');
          for (const warning of result.warnings) {
            console.log(`  ⚠️  ${warning.type}: ${warning.message}`);
            if (warning.path) {
              console.log(`     Path: ${warning.path}`);
            }
          }
        }
      }
    }
  }

  if (Object.keys(summary.errorTypes).length > 0) {
    console.log('\n=== Error Types ===');
    for (const [type, count] of Object.entries(summary.errorTypes)) {
      console.log(`${type}: ${count}`);
    }
  }

  if (options.warnings && Object.keys(summary.warningTypes).length > 0) {
    console.log('\n=== Warning Types ===');
    for (const [type, count] of Object.entries(summary.warningTypes)) {
      console.log(`${type}: ${count}`);
    }
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = { SchemaValidator };
