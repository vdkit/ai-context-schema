# VDK: Reference Implementation

VDK (Vibe Development Kit) serves as the reference implementation of the AI Context Schema specification, demonstrating a complete ecosystem for AI context management.

## Implementation Overview

VDK implements AI Context Schema through three integrated components:

### 1. VDK CLI - Local Analysis Engine

**Repository**: [vdkit/vdk-cli](https://github.com/vdkit/vdk-cli)
**Package**: `@vibe-dev-kit/cli`

The CLI provides:

- **Project Analysis**: Automatic detection of frameworks, languages, and patterns
- **Schema Resolution**: Fetches relevant context schemas based on project analysis
- **Platform Deployment**: Generates platform-specific configurations
- **Validation**: Schema validation and compatibility checking

#### Key Features

```bash
# Analyze project and deploy context schemas
vdk init --interactive

# Generate for specific platform
vdk generate cursor --schemas react-components,api-patterns

# Validate custom schema
vdk validate my-context.yaml

# List available schemas
vdk list --category technology
```

### 2. VDK Blueprints Repository - Context Schema Library

**Repository**: [vdkit/VDK-Blueprints](https://github.com/vdkit/VDK-Blueprints)

Contains a curated context schema library organized by:

- **Rules**: Coding standards, conventions, and guardrails
- **Commands**: Reusable operational prompts and workflows
- **Workflows**: End-to-end multi-step execution patterns
- **Skills & Agents**: Reusable capabilities and execution personas

All schemas conform to AI Context Schema v3.0.0 specification.

### 3. VDK Hub - Web Management Platform

**URL**: [vdk.tools](https://vdk.tools)
**Repository**: [vdkit/vdk-hub](https://github.com/vdkit/vdk-hub)

Web platform providing:

- **Schema Catalog**: Browse and search curated context schemas
- **Generator Wizard**: 7-step custom package creation
- **Collections**: Personal and team schema libraries
- **Analytics**: Usage tracking and insights

## Platform Adapter Implementation

VDK demonstrates complete platform adapter implementations for all 20+ supported platforms:

### AI Assistants & Services

**Claude Code Adapter**

```typescript
export class ClaudeCodeAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const memoryFiles = schemas
      .filter((s) => s.platforms['claude-code']?.memory)
      .map((s) => this.generateMemoryFile(s));

    const commands = schemas
      .filter((s) => s.platforms['claude-code']?.command)
      .map((s) => this.generateSlashCommand(s));

    return {
      '.claude/CLAUDE.md': this.combineMemoryFiles(memoryFiles),
      '.claude/CLAUDE_COMMANDS.md': this.generateCommandsFile(commands)
    };
  }
}
```

**Claude Desktop Adapter**

```typescript
export class ClaudeDesktopAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms['claude-desktop'];
      if (!config?.compatible) continue;

      if (config.rules) {
        files[`.claude-desktop/rules/${schema.id}.md`] = this.generateRuleFile(schema);
      }

      if (config.mcpIntegration) {
        files[`.claude-desktop/mcp/${schema.id}.json`] = this.generateMcpConfig(schema);
      }
    }

    return files;
  }
}
```

**Generic AI Adapter**

```typescript
export class GenericAiAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms['generic-ai'];
      if (!config?.compatible) continue;

      const configPath = config.configPath || '.ai/';
      const rulesPath = config.rulesPath || '.ai/rules/';

      files[`${rulesPath}${schema.id}.md`] = this.generateUniversalFormat(schema);
    }

    return files;
  }
}
```

### AI-First Editors

**Cursor Adapter**

```typescript
export class CursorAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const cursorConfig = schema.platforms.cursor;
      if (!cursorConfig?.compatible) continue;

      files[`.cursor/rules/${schema.id}.mdc`] = this.generateMDCFile(schema);

      if (cursorConfig.globs && cursorConfig.activation === 'auto-attached') {
        files[`.cursor/patterns/${schema.id}.json`] = this.generatePatternConfig(
          schema,
          cursorConfig
        );
      }
    }

    return files;
  }
}
```

**Windsurf Adapter**

```typescript
export class WindsurfAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms.windsurf;
      if (!config?.compatible) continue;

      // Handle character limit (6K max)
      const optimizedContent = this.optimizeForCharacterLimit(
        schema,
        config.characterLimit || 6000
      );

      files[`.windsurf/rules/${schema.id}.xml`] = this.generateXMLFormat(
        schema,
        optimizedContent,
        config
      );
    }

    return files;
  }
}
```

### Code Editors & IDEs

**VS Code Family Adapter**

```typescript
export class VSCodeAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms.vscode;
      if (!config?.compatible) continue;

      // Generate settings integration
      if (config.settings) {
        files[`.vscode/ai-context/${schema.id}.json`] = this.generateVSCodeSettings(schema, config);
      }

      // Handle MCP integration
      if (config.mcpIntegration) {
        files[`.vscode/mcp/${schema.id}.json`] = this.generateMcpConfig(schema);
      }

      // Generate commands
      if (config.commands) {
        files[`.vscode/commands/${schema.id}.json`] = this.generateCommands(schema, config);
      }
    }

    return files;
  }
}
```

**JetBrains IDE Adapter**

```typescript
export class JetBrainsAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms.jetbrains;
      if (!config?.compatible) continue;

      // Generate IDE-specific configuration
      files[`.idea/ai-rules/${schema.id}.xml`] = this.generateIdeaConfig(schema, config);

      // Handle file templates
      if (config.fileTemplates) {
        files[`.idea/fileTemplates/${schema.id}.ft`] = this.generateFileTemplate(schema);
      }

      // Handle code inspections
      if (config.inspections) {
        files[`.idea/inspectionProfiles/${schema.id}.xml`] = this.generateInspectionProfile(
          schema,
          config
        );
      }

      // Handle MCP integration (2025.1+)
      if (config.mcpIntegration) {
        files[`.idea/mcp/${schema.id}.json`] = this.generateMcpConfig(schema);
      }
    }

    return files;
  }
}
```

**Zed Adapter**

```typescript
export class ZedAdapter implements PlatformAdapter {
  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms.zed;
      if (!config?.compatible) continue;

      // Generate Zed-optimized configuration
      const zedConfig = {
        name: schema.title,
        description: schema.description,
        content: this.optimizeForPerformance(schema, config),
        mode: config.mode || 'project',
        aiFeatures: config.aiFeatures,
        collaborative: config.collaborative,
        performance: config.performance
      };

      files[`.zed/ai-rules/${schema.id}.json`] = JSON.stringify(zedConfig, null, 2);

      // Handle performance optimizations
      if (config.performance === 'high') {
        files[`.zed/performance/${schema.id}.config`] = this.generatePerformanceConfig(schema);
      }
    }

    return files;
  }
}
```

## Schema Processing Pipeline

VDK implements the complete schema processing pipeline:

### 1. Project Analysis

```typescript
interface ProjectAnalysis {
  frameworks: string[];
  languages: string[];
  patterns: DetectedPattern[];
  dependencies: PackageDependency[];
  structure: ProjectStructure;
}

class ProjectAnalyzer {
  async analyze(projectPath: string): Promise<ProjectAnalysis> {
    const structure = await this.scanDirectory(projectPath);
    const dependencies = await this.analyzeDependencies(projectPath);
    const frameworks = this.detectFrameworks(dependencies, structure);
    const languages = this.detectLanguages(structure);
    const patterns = this.detectPatterns(structure, dependencies);

    return { frameworks, languages, patterns, dependencies, structure };
  }
}
```

### 2. Schema Resolution

```typescript
class SchemaResolver {
  async resolveSchemas(analysis: ProjectAnalysis): Promise<ContextSchema[]> {
    const candidates = await this.findCandidateSchemas(analysis);
    const resolved = await this.resolveDependencies(candidates);
    const filtered = this.resolveConflicts(resolved);

    return this.sortByPriority(filtered);
  }

  private async resolveDependencies(schemas: ContextSchema[]): Promise<ContextSchema[]> {
    const resolved = new Set<string>();
    const result: ContextSchema[] = [];

    for (const schema of schemas) {
      await this.addWithDependencies(schema, resolved, result);
    }

    return result;
  }
}
```

### 3. Platform Generation

```typescript
class GenerationEngine {
  constructor(private adapters: Map<string, PlatformAdapter>) {}

  async generateAll(
    schemas: ContextSchema[],
    platforms: string[]
  ): Promise<Map<string, GeneratedFiles>> {
    const results = new Map<string, GeneratedFiles>();

    for (const platform of platforms) {
      const adapter = this.adapters.get(platform);
      if (!adapter) continue;

      const compatibleSchemas = schemas.filter((s) => s.platforms[platform]?.compatible);

      results.set(platform, await adapter.generate(compatibleSchemas));
    }

    return results;
  }
}
```

## Validation Implementation

VDK provides comprehensive validation:

### Schema Validation

```typescript
import Ajv from 'ajv';
import { contextSchemaDefinition } from './schemas/v3.0.0/context-schema.json';

class SchemaValidator {
  private ajv = new Ajv({ allErrors: true });
  private validator = this.ajv.compile(contextSchemaDefinition);

  validate(schema: any): ValidationResult {
    const valid = this.validator(schema);

    if (!valid) {
      return {
        valid: false,
        errors: this.validator.errors || []
      };
    }

    return this.validateBusinessRules(schema);
  }

  private validateBusinessRules(schema: ContextSchema): ValidationResult {
    const errors: ValidationError[] = [];

    // Check dependency cycles
    if (this.hasCyclicDependencies(schema)) {
      errors.push({
        path: 'requires',
        message: 'Cyclic dependency detected'
      });
    }

    // Validate platform compatibility
    for (const [platform, config] of Object.entries(schema.platforms)) {
      if (config.compatible && !this.validatePlatformConfig(platform, config)) {
        errors.push({
          path: `platforms.${platform}`,
          message: `Invalid configuration for platform ${platform}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## Performance Characteristics

VDK demonstrates production-ready performance:

- **Project Analysis**: <2s for typical codebases (<10k files)
- **Schema Resolution**: <500ms for dependency graph resolution
- **Platform Generation**: <1s for multi-platform deployment
- **Memory Usage**: ~50MB during analysis, ~10MB at rest
- **Cache Efficiency**: 90%+ cache hit rate for repeat operations

## Testing Strategy

VDK implements comprehensive testing:

### Unit Tests

```typescript
describe('SchemaResolver', () => {
  it('should resolve dependencies in correct order', async () => {
    const schemas = [
      createSchema('base', { requires: [] }),
      createSchema('derived', { requires: ['base'] }),
      createSchema('complex', { requires: ['derived', 'base'] })
    ];

    const resolved = await resolver.resolveDependencies(schemas);

    expect(resolved.map((s) => s.id)).toEqual(['base', 'derived', 'complex']);
  });
});
```

### Integration Tests

```typescript
describe('CLI Integration', () => {
  it('should generate configurations for React project', async () => {
    const projectPath = './test-fixtures/react-project';
    const result = await cli.run(['init', '--project', projectPath]);

    expect(result.exitCode).toBe(0);
    expect(fs.existsSync(`${projectPath}/.claude/CLAUDE.md`)).toBe(true);
    expect(fs.existsSync(`${projectPath}/.cursor/rules/react-components.mdc`)).toBe(true);
  });
});
```

## Extension Points

VDK provides clear extension mechanisms:

### Custom Platform Adapters

```typescript
export interface PlatformAdapter {
  name: string;
  generate(schemas: ContextSchema[]): Promise<GeneratedFiles>;
  validate?(config: any): ValidationResult;
}

// Register custom adapter
vdk.registerAdapter(new MyCustomAdapter());
```

### Custom Schema Sources

```typescript
export interface SchemaSource {
  name: string;
  fetch(query: SchemaQuery): Promise<ContextSchema[]>;
}

// Register custom source
vdk.registerSource(new MySchemaSource());
```

## Migration Support

VDK provides migration tools for existing configurations:

```bash
# Migrate from Cursor .mdc files
vdk migrate cursor --input .cursor/rules --output schemas/

# Convert from custom format
vdk convert --from custom-format.json --to ai-context-schema
```

## Community Integration

VDK demonstrates community-driven development:

- **Schema Contributions**: Pull request workflow for new schemas
- **Platform Support**: Community-driven platform adapter development
- **Validation Pipeline**: Automated testing and validation for contributions
- **Documentation**: Auto-generated documentation from schema metadata

## Getting Started with VDK

```bash
# Install CLI
npm install -g @vibe-dev-kit/cli

# Initialize in existing project
cd my-project
vdk init

# Or start with web interface
open https://vdk.tools
```

VDK serves as both a practical tool and a reference implementation, demonstrating how AI Context Schema can be implemented at scale with real-world performance and reliability requirements.
