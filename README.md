# AI Context Schema

[![npm version](https://badge.fury.io/js/ai-context-schema.svg)](https://badge.fury.io/js/ai-context-schema)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.16788626.svg)](https://doi.org/10.5281/zenodo.16788626)

**Universal AI Context Schema: A New Interoperability Standard for AI Development Tools**

## The Problem

AI coding assistants and IDEs (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, JetBrains IDEs, Zed, GitHub Copilot) each use different configuration formats for context and behavioral instructions. With 20+ supported platforms, developers must maintain separate configurations for each tool, leading to:

- **Configuration fragmentation** across tools
- **Behavioral inconsistencies** when switching platforms
- **Maintenance overhead** for multiple format specifications
- **Limited interoperability** between AI development workflows

## The Solution

AI Context Schema provides a universal format that enables developers to define AI context once and deploy it consistently across all platforms while preserving behavioral intent.

### Core Principles

1. **Write Once, Deploy Everywhere**: Single schema format works across all AI platforms
2. **Behavioral Preservation**: Intent maintained through platform-specific adaptations
3. **Structured Validation**: JSON Schema validation prevents configuration errors
4. **Relationship Awareness**: Schemas can depend on, extend, and conflict with each other

### Ecosystem Operating Contract (Normative)

All ecosystem implementation and documentation should follow this order:

1. `ai-context-schema` (canonical contract)
2. `VDK-Blueprints` (curated canonical inventory)
3. `VDK-CLI` (runtime retrieval, adaptation, deployment)
4. `VDK-Hub` (distribution and discovery UX/API)
5. `VDK-Wiki` (documentation surface)

`VDK-CLI` is the execution core. Runtime semantics for blueprint search, scoring, adaptation outcomes, and deployment are defined there and mirrored downstream by Hub and Wiki.

Curated library policy:

- Default retrieval blends `L0-L3` (generic to specific)
- `L4` provenance variants are excluded by default and only included on explicit request
- Deployment should be deterministic for a selected artifact (`vdk deploy <blueprint-id>`)

## How It Works

Context schemas are YAML files with frontmatter metadata and Markdown content:

```yaml
---
id: "react-patterns"
title: "React Development Guidelines"
description: "Modern React patterns with TypeScript and hooks"
schemaVersion: "3.0"
kind: "skill"
version: "1.0.0"
category: "technology"
platforms:
  claude-code:
    compatible: true
    memory: true
    command: true
  claude-desktop:
    compatible: true
    mcpIntegration: true
    rules: true
  cursor:
    compatible: true
    activation: "auto-attached"
    globs: ["**/*.tsx", "**/*.jsx"]
  windsurf:
    compatible: true
    mode: "workspace"
    characterLimit: 4500
  zed:
    compatible: true
    aiFeatures: true
    performance: "high"
  jetbrains:
    compatible: true
    ide: "webstorm"
    mcpIntegration: true
  github-copilot:
    compatible: true
    priority: 8
    reviewType: "code-quality"
  generic-ai:
    compatible: true
    priority: 7
---

# React Development Guidelines

## Component Structure
Use functional components with TypeScript...

## Hooks Usage
Prefer built-in hooks over custom ones...

## Anti-Patterns
Avoid class components for new code...
```

Platform adapters transform schemas into platform-specific formats while preserving behavioral intent.

## Installation & Usage

```bash
# Install validation tools
npm install -g ai-context-schema

# Validate a schema
ai-context-schema validate my-schema.yaml

# Validate all examples
ai-context-schema validate-all

# Check platform compatibility
ai-context-schema check-compatibility schemas/
```

## Schema Structure

### Required Fields

- `id`: Unique identifier (kebab-case)
- `title`: Human-readable name
- `description`: Purpose description (10-500 chars)
- `schemaVersion`: Schema contract version (for example `3.0`)
- `kind`: Canonical blueprint kind (for example `skill`, `command`, `workflow`, `agent`)
- `version`: Semantic version
- `platforms`: Platform compatibility specification

Canonical `kind` values:

- `project-memory`
- `conditional-rule`
- `skill`
- `command`
- `workflow`
- `agent`
- `hook`
- `mcp-integration`
- `plugin-distribution`

`category` remains supported as optional editorial grouping.

Optional retrieval metadata used by curated inventories:

- `specificityLayer`: `L0`..`L4`
- `equivalenceOutcome`: `lossless` | `lossy` | `unsupported`
- `curation.status`: `curated` | `experimental` | `community` | `deprecated`

### Platform Configuration

Each platform has specific configuration options. Here are examples for key platforms:

#### AI Assistants

**Claude Code**

```yaml
claude-code:
  compatible: true
  memory: true # Include in memory files
  command: true # Enable as slash command
  namespace: 'project' # project or user scope
  priority: 8 # Memory hierarchy (1-10)
  mcpIntegration: true # Uses MCP servers
```

**Claude Desktop**

```yaml
claude-desktop:
  compatible: true
  mcpIntegration: true # MCP support
  rules: true # Include in rules folder
  priority: 8 # Context priority (1-10)
```

**Generic AI** (Universal format)

```yaml
generic-ai:
  compatible: true
  configPath: '.ai/'
  rulesPath: '.ai/rules/'
  priority: 7 # Context priority (1-10)
```

#### AI-First Editors

**Cursor**

```yaml
cursor:
  compatible: true
  activation: 'auto-attached' # auto-attached, manual, always
  globs: ['**/*.tsx'] # File patterns for activation
  priority: 'high' # high, medium, low
```

**Windsurf**

```yaml
windsurf:
  compatible: true
  mode: 'workspace' # workspace or global
  xmlTag: 'context' # XML wrapper tag
  characterLimit: 4500 # Content size estimate
```

#### Modern Editors

**Zed Editor**

```yaml
zed:
  compatible: true
  mode: 'project' # global or project
  aiFeatures: true # Uses Zed AI features
  collaborative: true # Supports collaborative features
  performance: 'high' # high, medium, low
```

**VS Code Family**

```yaml
vscode:
  compatible: true
  extension: 'ai-context-schema' # Required extension
  settings: { 'aiContext.autoActivate': true }
  commands: ['aiContext.apply', 'aiContext.validate']
  mcpIntegration: true
```

#### JetBrains IDEs

**General JetBrains**

```yaml
jetbrains:
  compatible: true
  ide: 'webstorm' # intellij, webstorm, pycharm, etc.
  mcpIntegration: true # 2025.1+ versions
  fileTemplates: true
  inspections: ['ContextSchemaValidation']
```

**WebStorm**

```yaml
webstorm:
  compatible: true
  nodeIntegration: true # Node.js integration
  typescript: true # TypeScript support
  inspections: ['JavaScriptPatterns', 'TypeScriptPatterns']
```

#### GitHub Services

**GitHub Copilot**

```yaml
github-copilot:
  compatible: true
  priority: 8 # Suggestion priority (1-10)
  reviewType: 'security' # security, performance, code-quality, style
  scope: 'repository' # repository or organization
```

### Schema Relationships

```yaml
requires: ['typescript-base'] # Hard dependencies
suggests: ['testing-patterns'] # Soft recommendations
conflicts: ['vue-patterns'] # Incompatible schemas
supersedes: ['old-patterns'] # Schemas this replaces
```

## Platform Adapter System

Platform adapters handle format translation:

```typescript
interface PlatformAdapter {
  name: string;
  generate(schemas: ContextSchema[]): Promise<GeneratedFiles>;
  validate?(config: any): ValidationResult;
}
```

### Output Examples

**Claude Code**: `.claude/CLAUDE.md` (memory file)

```markdown
# React Development Guidelines

[Schema content optimized for Claude Code...]
```

**Cursor**: `.cursor/rules/react-patterns.mdc` (rule file)

```yaml
---
title: 'React Development Guidelines'
activation: 'auto-attached'
globs: ['**/*.tsx']
---
[Schema content...]
```

**Windsurf**: `.windsurf/rules/react-patterns.xml` (XML memory)

```xml
<context priority="8">
  <purpose>React development patterns</purpose>
  <content>[Optimized content...]</content>
</context>
```

**GitHub Copilot**: `.github/copilot/guidelines.json` (configuration)

```json
{
  "name": "React Development Guidelines",
  "priority": 8,
  "reviewType": "code-quality",
  "patterns": [...]
}
```

## Validation & Quality Assurance

The specification includes comprehensive validation:

- **JSON Schema validation** against v3.0.0 specification
- **Platform compatibility** checking
- **Content optimization** for platform limits
- **Relationship resolution** for dependencies and conflicts

## Implementation Status

### AI Assistants & Services

| Platform       | Status     | Configuration Location | Features                    |
| -------------- | ---------- | ---------------------- | --------------------------- |
| Claude Code    | ✅ Full    | `.claude/`             | Memory files, commands, MCP |
| Claude Desktop | ✅ Full    | `.claude-desktop/`     | Rules, MCP integration      |
| GitHub Copilot | ✅ Full    | `.github/copilot/`     | Review integration          |
| Generic AI     | ✅ Full    | `.ai/`                 | Universal format            |
| OpenAI         | ⚠️ Limited | `.openai/`             | Deprecated support          |

### AI-First Editors

| Platform      | Status  | Configuration Location | Features                       |
| ------------- | ------- | ---------------------- | ------------------------------ |
| Cursor        | ✅ Full | `.cursor/rules/`       | Auto-attachment, patterns, MCP |
| Windsurf      | ✅ Full | `.windsurf/rules/`     | XML format, limits, MCP        |
| Windsurf Next | ✅ Full | `.windsurf-next/`      | Enhanced XML format, MCP       |

### Code Editors & IDEs

| Platform         | Status  | Configuration Location | Features                    |
| ---------------- | ------- | ---------------------- | --------------------------- |
| VS Code          | ✅ Full | `.vscode/`             | Settings integration, MCP   |
| VS Code Insiders | ✅ Full | `.vscode-insiders/`    | Settings integration, MCP   |
| VSCodium         | ✅ Full | `.vscode-oss/`         | Open source VS Code support |
| Zed Editor       | ✅ Full | `.zed/`                | AI features, collaborative  |

### JetBrains IDEs

| Platform       | Status  | Configuration Location | Features                          |
| -------------- | ------- | ---------------------- | --------------------------------- |
| IntelliJ IDEA  | ✅ Full | `.idea/`               | Inspections, templates, MCP       |
| WebStorm       | ✅ Full | `.idea/`               | Node.js, TypeScript integration   |
| PyCharm        | ✅ Full | `.idea/`               | Python interpreter, virtual env   |
| PHPStorm       | ✅ Full | `.idea/`               | PHP version, Composer integration |
| RubyMine       | ✅ Full | `.idea/`               | Ruby version, Rails support       |
| CLion          | ✅ Full | `.idea/`               | CMake, debugger integration       |
| DataGrip       | ✅ Full | `.idea/`               | Database, SQL dialect support     |
| GoLand         | ✅ Full | `.idea/`               | Go modules, version support       |
| Rider          | ✅ Full | `.idea/`               | .NET, Unity integration           |
| Android Studio | ✅ Full | `.idea/`               | Android SDK, Gradle support       |

**Total Supported Platforms: 20+**

## Examples

The repository includes comprehensive examples:

- [`react-example.yaml`](./schemas/v3.0.0/examples/react-example.yaml) - React development patterns
- [`api-example.yaml`](./schemas/v3.0.0/examples/api-example.yaml) - REST API development
- [`security-example.yaml`](./schemas/v3.0.0/examples/security-example.yaml) - Security best practices
- [`testing-example.yaml`](./schemas/v3.0.0/examples/testing-example.yaml) - Testing strategies

## Technical Specification

The complete technical specification is available in [SPECIFICATION.md](./SPECIFICATION.md), covering:

- Schema structure and validation rules
- Platform adapter requirements
- Content formatting guidelines
- Versioning and compatibility
- Security considerations

## Development Tools

```bash
# Schema validation
ai-context-schema validate schema.yaml
ai-context-schema validate-all
ai-context-schema validate --warnings

# Development utilities
ai-context-schema check-compatibility
ai-context-schema test
ai-context-schema lint

# Documentation validation
ai-context-schema docs:serve
```

### Blueprint linting and auto-fix workflow

`ai-context-schema` uses Oxlint with `@vdk/oxlint-plugin-blueprints` to enforce blueprint contract integrity for v3 examples.

```bash
# Contract lint (Oxlint + custom blueprint rule)
pnpm run lint

# Preview frontmatter normalization changes
pnpm run lint:blueprints:dry

# Apply deterministic frontmatter normalization
pnpm run lint:blueprints:fix

# Full lint pipeline (contract + formatting + markdown docs)
pnpm run lint:all

# Full project gate
pnpm run check
```

Current blueprint normalization includes:

- `schemaVersion` alignment (`3.0`)
- required `kind` insertion when missing
- required `version` insertion/normalization when missing or invalid
- `id` normalization to kebab-case

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Schema Files  │───▶│  Platform        │───▶│  Generated      │
│   (.yaml)       │    │  Adapters        │    │  Configurations │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        │                        │                       ▼
        │                        │              ┌─────────────────┐
        │                        │              │ AI Platforms    │
        │                        │              │ • Claude Code   │
        ▼                        │              │ • Cursor        │
┌─────────────────┐              │              │ • Windsurf      │
│ JSON Schema     │              │              │ • GitHub Copilot│
│ Validation      │              │              └─────────────────┘
└─────────────────┘              │
                                 ▼
                        ┌──────────────────┐
                        │ Relationship     │
                        │ Resolution       │
                        │ • Dependencies   │
                        │ • Conflicts      │
                        │ • Supersession   │
                        └──────────────────┘
```

## Contributing

We welcome contributions to the specification and ecosystem:

- **Schema examples** for new technologies and patterns
- **Platform adapters** for additional AI coding tools
- **Validation improvements** and tooling enhancements
- **Documentation** and implementation guides

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## Versioning

The specification follows semantic versioning:

- **Major**: Breaking schema structure changes
- **Minor**: Backward-compatible feature additions
- **Patch**: Bug fixes and clarifications

Current major version: **3.0** (specification patch updates may apply, see `SPECIFICATION.md` changelog)

## Requirements

- Node.js >= 22.0.0
- npm >= 8.0.0 or pnpm >= 7.0.0

## License

MIT License - see [LICENSE](LICENSE) for details.

## Further Reading

- [Getting Started Guide](./docs/guides/getting-started.md) - Complete setup instructions
- [Platform Support](./docs/reference/platform-support.md) - Platform-specific implementation details
- [Migration Guide](./docs/guides/migration-guide.md) - Upgrading from existing configurations
- [Full Specification](./SPECIFICATION.md) - Complete technical documentation

---

**AI Context Schema** enables consistent AI assistant behavior across all development platforms through standardized configuration. Write once, deploy everywhere.
