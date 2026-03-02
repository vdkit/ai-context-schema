# Contributing to AI Context Schema

We welcome contributions to the AI Context Schema specification and its ecosystem. This document outlines how to contribute effectively.

## Types of Contributions

### 1. Specification Improvements

- Clarifications to existing specification
- New platform support definitions
- Schema validation enhancements
- Documentation improvements

### 2. Example Context Schemas

- Technology-specific context schemas
- Language pattern schemas
- Development workflow schemas
- Best practice demonstrations

### 3. Platform Adapters

- Adapters for new AI coding platforms
- Improvements to existing platform support
- Platform-specific optimization features

### 4. Validation Tools

- Schema validation utilities
- Compatibility checking tools
- Migration helpers
- Development tooling

## Getting Started

### Prerequisites

- Node.js 18+ for validation tools
- Git for version control
- Basic understanding of YAML and JSON Schema
- Familiarity with AI coding assistants

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/ai-context-schema.git
cd ai-context-schema

# Install dependencies
npm install

# Validate existing schemas
npm run validate-all

# Run tests
npm test
```

## Contribution Guidelines

### Schema Contributions

#### Creating New Context Schemas

1. **Follow the specification**: Ensure your schema conforms to AI Context Schema v3.0.0
2. **Use descriptive IDs**: Use kebab-case identifiers that clearly describe the context
3. **Provide complete platform support**: Test compatibility across major platforms
4. **Include comprehensive examples**: Add code examples and anti-patterns
5. **Validate thoroughly**: Use validation tools before submitting

#### Schema Structure Template

```yaml
---
id: 'your-context-id'
title: 'Clear, Descriptive Title'
description: 'Detailed description of what this context provides (10-500 chars)'
schemaVersion: '3.0.0'
kind: 'skill' # or command, workflow, agent, etc.
version: '1.0.0'
category: 'technology' # optional editorial grouping
platforms:
  claude-code:
    compatible: true
    memory: true
    command: true
    priority: 8
  claude-desktop:
    compatible: true
    mcpIntegration: true
    rules: true
    priority: 8
  cursor:
    compatible: true
    activation: 'auto-attached'
    globs: ['**/*.ext']
    priority: 'high'
  windsurf:
    compatible: true
    mode: 'workspace'
    characterLimit: 4500
  zed:
    compatible: true
    aiFeatures: true
    performance: 'high'
  jetbrains:
    compatible: true
    ide: 'webstorm' # or appropriate IDE
    mcpIntegration: true
    fileTemplates: true
  vscode:
    compatible: true
    extension: 'ai-context-schema'
    mcpIntegration: true
  github-copilot:
    compatible: true
    priority: 8
    reviewType: 'code-quality'
  generic-ai:
    compatible: true
    priority: 7
tags: ['relevant', 'searchable', 'tags']
author: 'your-github-username'
---
# Context Title

## Purpose
Clear explanation of what this context is for...
## [Additional sections as needed]
```

#### Schema Quality Standards

**Required Elements:**

- Clear, specific purpose statement
- Comprehensive behavioral guidance
- Code examples with explanations
- Anti-patterns and things to avoid
- Platform-specific notes where relevant

**Quality Checklist:**

- [ ] Validates against JSON Schema
- [ ] Contains working code examples
- [ ] Includes both do's and don'ts
- [ ] Tests across claimed compatible platforms
- [ ] Follows consistent formatting
- [ ] Uses appropriate tags and metadata

### Platform Adapter Contributions

AI Context Schema supports 20+ platforms including Claude Code, Claude Desktop, Cursor, Windsurf, VS Code family, JetBrains IDEs, Zed, GitHub Copilot, and more. We welcome adapters for all supported platforms.

#### Adapter Requirements

1. **Implement PlatformAdapter interface**:

```typescript
interface PlatformAdapter {
  name: string;
  generate(schemas: ContextSchema[]): Promise<GeneratedFiles>;
  validate?(config: any): ValidationResult;
}
```

2. **Handle all schema features**: Support required fields, optional fields, and relationships
3. **Preserve behavioral intent**: Ensure AI behavior remains consistent across platform translation
4. **Platform-specific optimizations**: Implement character limits, MCP integration, file patterns, etc.
5. **Implement graceful degradation**: Handle unsupported features appropriately
6. **Provide comprehensive tests**: Unit and integration tests required

#### Platform-Specific Adapter Features

**AI Assistants & Services**

- **Claude Code**: Memory files, slash commands, MCP integration, tool permissions
- **Claude Desktop**: Rules folder, MCP integration, priority system
- **GitHub Copilot**: JSON guidelines, review types, organization scope
- **OpenAI**: Deprecated status handling, model selection (limited support)
- **Generic AI**: Universal format, flexible configuration paths

**AI-First Editors**

- **Cursor**: MDC format, auto-attachment patterns, file glob matching
- **Windsurf/Windsurf Next**: XML format, character limits (6K), MCP integration

**Code Editors & IDEs**

- **VS Code Family**: Settings integration, extensions, MCP support
- **JetBrains IDEs**: File templates, code inspections, IDE-specific features, MCP (2025.1+)
- **Zed**: High-performance features, collaborative mode, AI integration

#### Adapter Implementation Examples

**Claude Desktop Adapter**

```typescript
export class ClaudeDesktopAdapter implements PlatformAdapter {
  name = 'claude-desktop';

  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms['claude-desktop'];
      if (!config?.compatible) continue;

      // Generate rules file
      if (config.rules) {
        files[`.claude-desktop/rules/${schema.id}.md`] = this.generateRuleFile(schema);
      }

      // Handle MCP integration if specified
      if (config.mcpIntegration) {
        files[`.claude-desktop/mcp/${schema.id}.json`] = this.generateMcpConfig(schema);
      }
    }

    return files;
  }
}
```

**JetBrains IDE Adapter**

```typescript
export class JetBrainsAdapter implements PlatformAdapter {
  name = 'jetbrains';

  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms['jetbrains'];
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

      // Handle MCP integration for 2025.1+ versions
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
  name = 'zed';

  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms['zed'];
      if (!config?.compatible) continue;

      // Generate Zed-specific configuration
      const zedConfig = {
        name: schema.title,
        description: schema.description,
        content: schema._content,
        mode: config.mode || 'project',
        aiFeatures: config.aiFeatures,
        collaborative: config.collaborative,
        performance: config.performance
      };

      files[`.zed/ai-rules/${schema.id}.json`] = JSON.stringify(zedConfig, null, 2);

      // Handle high-performance optimizations
      if (config.performance === 'high') {
        files[`.zed/performance/${schema.id}.config`] = this.generatePerformanceConfig(schema);
      }
    }

    return files;
  }
}
```

**VS Code Family Adapter**

```typescript
export class VSCodeAdapter implements PlatformAdapter {
  name = 'vscode';

  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms['vscode'];
      if (!config?.compatible) continue;

      // Generate VS Code settings integration
      if (config.settings) {
        files[`.vscode/ai-context/${schema.id}.json`] = this.generateVSCodeSettings(schema, config);
      }

      // Handle MCP integration
      if (config.mcpIntegration) {
        files[`.vscode/mcp/${schema.id}.json`] = this.generateMcpConfig(schema);
      }

      // Handle commands
      if (config.commands) {
        files[`.vscode/commands/${schema.id}.json`] = this.generateCommands(schema, config);
      }
    }

    return files;
  }
}
```

#### Platform-Specific Considerations

**Character Limits**

- **Windsurf/Windsurf Next**: 6K character limit, implement intelligent truncation
- **VS Code**: No limits, but consider memory usage
- **JetBrains**: No limits, optimize for IDE performance

**MCP Integration**

- **Claude Code/Desktop**: Built-in MCP support
- **VS Code Family**: Via `.vscode/mcp.json` configuration
- **JetBrains IDEs**: 2025.1+ versions via Settings → AI Assistant
- **Cursor**: Via `.cursor/mcp.json`
- **Windsurf**: Via `~/.codeium/windsurf/mcp_config.json`

**File Pattern Matching**

- **Cursor**: Auto-attachment via globs array
- **VS Code**: File associations and workspace patterns
- **JetBrains**: Scope-based activation and file templates

**Priority Systems**

- **Claude Code/Desktop/Windsurf**: 1-10 numeric scale
- **Cursor**: high/medium/low string values
- **GitHub Copilot**: 1-10 for guideline priority
- **Generic AI**: Configurable priority system

### Documentation Contributions

#### Documentation Standards

- Use clear, concise language
- Provide practical examples
- Include code samples where relevant
- Keep examples up-to-date with current best practices
- Use proper markdown formatting

#### Areas Needing Documentation

- Platform-specific implementation guides
- Migration guides from other formats
- Advanced schema composition patterns
- Troubleshooting common issues
- Performance optimization tips

## Submission Process

### For Schema Contributions

1. **Create a new branch**: `git checkout -b add-schema-[your-schema-name]`
2. **Add your schema**: Place in `schemas/v3.0.0/examples/` directory
3. **Validate your schema**: Run `npm run validate schemas/v3.0.0/examples/your-schema.yaml`
4. **Test across platforms**: Verify compatibility claims with actual testing
5. **Update documentation**: Add to README example list if appropriate
6. **Submit pull request**: Use the schema contribution template

### For Specification Changes

1. **Open an issue first**: Discuss proposed changes before implementation
2. **Create RFC if significant**: Use RFC process for major specification changes
3. **Update all related files**: Schema, documentation, examples, and validation
4. **Test backward compatibility**: Ensure existing schemas remain valid
5. **Update version appropriately**: Follow semantic versioning guidelines

### For Platform Adapters

1. **Implement complete adapter**: Include generation, validation, and testing
2. **Add comprehensive tests**: Unit tests and integration tests required
3. **Document platform specifics**: Add platform documentation to `docs/`
4. **Update platform support matrix**: Update README and specification
5. **Provide usage examples**: Show how to use the adapter

## Review Process

### Review Criteria

**Technical Review:**

- Specification compliance
- Code quality and testing
- Documentation completeness
- Backward compatibility
- Performance considerations

**Content Review:**

- Accuracy of technical content
- Clarity of explanations
- Usefulness of examples
- Consistency with existing patterns

### Review Timeline

- **Minor changes**: 2-3 days
- **New schemas**: 1 week
- **Platform adapters**: 1-2 weeks
- **Specification changes**: 2-4 weeks

## Community Standards

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Welcome newcomers and questions
- Collaborate in good faith
- Respect diverse perspectives and experiences

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests, questions
- **GitHub Discussions**: General discussion, ideas, showcases
- **Pull Requests**: Code and documentation contributions

## Release Process

### Versioning

The specification follows semantic versioning:

- **Major (X.0.0)**: Breaking changes to schema structure
- **Minor (X.Y.0)**: Backward-compatible additions
- **Patch (X.Y.Z)**: Bug fixes and clarifications

### Release Schedule

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Quarterly for new features
- **Major releases**: Annually or when breaking changes are necessary

## Recognition

### Contributors

All contributors are recognized in:

- GitHub contributors list
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Author fields in contributed schemas

### Maintainership

Long-term contributors may be invited to become maintainers with:

- Commit access to the repository
- Participation in release planning
- Review authority for pull requests
- Input on specification direction

## Getting Help

### Where to Get Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check existing docs first
- **Examples**: Look at existing schemas for patterns

### Frequently Asked Questions

**Q: How do I validate my schema?**
A: Use `npm run validate your-schema.yaml` or the online validator at [validator URL].

**Q: Which platforms should I test compatibility with?**
A: Test with any platforms you claim compatibility for in your schema's platform configuration.

**Q: Can I contribute schemas for proprietary technologies?**
A: Yes, as long as the schema content doesn't include proprietary information and helps with general development patterns.

**Q: How do I handle platform-specific limitations?**
A: Document limitations in platform configuration and provide fallback guidance in the schema content.

Thank you for contributing to AI Context Schema! Your contributions help make AI-assisted coding more accessible and consistent for developers everywhere.
