# Migration Guide

This guide helps you migrate from existing AI assistant configurations to AI Context Schema format. We provide migration paths from common formats and best practices for smooth transitions.

## Migration Overview

### Benefits of Migration

- **Universal compatibility**: One schema works across all AI platforms
- **Improved validation**: Structured validation and error checking
- **Better organization**: Standardized metadata and relationships
- **Future-proof**: Support for new platforms and features
- **Team collaboration**: Shared schemas and collections

### Migration Strategy

1. **Assess current configurations**: Inventory existing AI assistant configurations
2. **Plan migration order**: Start with most critical/frequently used contexts
3. **Convert incrementally**: Migrate one context at a time
4. **Validate thoroughly**: Test across target platforms
5. **Deploy gradually**: Roll out to team members progressively

## Migrating from Cursor MDC Files

### Current Cursor Format

```yaml
---
title: 'React Patterns'
description: 'React development guidelines'
activation: 'auto-attached'
globs: ['**/*.tsx', '**/*.jsx']
priority: 'high'
---
# React Development Guidelines

Use functional components with hooks...
```

### AI Context Schema Equivalent

```yaml
---
id: 'react-patterns'
title: 'React Patterns'
description: 'React development guidelines and best practices'
version: '1.0.0'
category: 'technology'
framework: 'react'
language: 'typescript'
platforms:
  cursor:
    compatible: true
    activation: 'auto-attached'
    globs: ['**/*.tsx', '**/*.jsx']
    priority: 'high'
  claude-code:
    compatible: true
    memory: true
    command: true
  claude-desktop:
    compatible: true
    mcpIntegration: true
    rules: true
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
    ide: 'webstorm'
    mcpIntegration: true
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
tags: ['react', 'typescript', 'frontend']
author: 'your-username'
---
# React Development Guidelines

Use functional components with hooks...
```

### Automated Migration

```bash
# Using VDK CLI (reference implementation)
vdk migrate cursor --input .cursor/rules --output schemas/

# Manual script
node scripts/migrate-cursor.js .cursor/rules/ schemas/
```

### Manual Migration Steps

1. **Create new schema file**: `schemas/react-patterns.yaml`
2. **Add required metadata**:

   ```yaml
   id: 'react-patterns' # kebab-case identifier
   version: '1.0.0' # semantic version
   category: 'technology' # appropriate category
   ```

3. **Convert platform configuration**:

   ```yaml
   platforms:
     cursor:
       compatible: true
       activation: 'auto-attached' # preserve original activation
       globs: ['**/*.tsx'] # preserve file patterns
       priority: 'high' # preserve priority
   ```

4. **Add multi-platform support**:

   ```yaml
   platforms:
     claude-code: { compatible: true, memory: true }
     claude-desktop: { compatible: true, mcpIntegration: true, rules: true }
     windsurf: { compatible: true, mode: 'workspace', characterLimit: 4500 }
     zed: { compatible: true, aiFeatures: true, performance: 'high' }
     jetbrains: { compatible: true, ide: 'webstorm', mcpIntegration: true }
     vscode: { compatible: true, extension: 'ai-context-schema', mcpIntegration: true }
     github-copilot: { compatible: true, priority: 8, reviewType: 'code-quality' }
     generic-ai: { compatible: true, priority: 7 }
   ```

5. **Preserve content**: Copy markdown content as-is
6. **Validate**: `npx ai-context-schema validate schemas/react-patterns.yaml`

## Migrating from Claude Code Memory Files

### Current Claude Format

```markdown
# CLAUDE.md

## Project Context

This is a React TypeScript project using Next.js...

## Coding Guidelines

- Use functional components
- Implement proper error boundaries
- Follow TypeScript best practices

## Commands

- `/component` - Generate React component
- `/api` - Generate API route
```

### Migration Strategy

1. **Split into focused schemas**: Break monolithic memory into specific contexts
2. **Extract commands**: Convert manual commands to schema-based commands
3. **Add proper metadata**: Include versioning and platform support

#### Example: Component Guidelines Schema

```yaml
---
id: 'react-component-guidelines'
title: 'React Component Guidelines'
description: 'Component development patterns and best practices'
version: '1.0.0'
category: 'technology'
framework: 'react'
platforms:
  claude-code:
    compatible: true
    memory: true
    command: true
    namespace: 'project'
  cursor:
    compatible: true
    activation: 'auto-attached'
    globs: ['**/components/**/*.tsx']
tags: ['react', 'components', 'typescript']
---
# React Component Guidelines

Use functional components with hooks for all new components...
```

#### Example: API Development Schema

```yaml
---
id: 'nextjs-api-patterns'
title: 'Next.js API Development'
description: 'API route development patterns for Next.js applications'
version: '1.0.0'
category: 'technology'
framework: 'nextjs'
platforms:
  claude-code:
    compatible: true
    memory: true
    command: true
  cursor:
    compatible: true
    globs: ['**/api/**/*.ts', '**/pages/api/**/*.ts']
tags: ['nextjs', 'api', 'typescript']
---
# Next.js API Development

Create API routes following REST principles...
```

## Migrating from GitHub Copilot JSON

### Current Copilot Format

```json
{
  "guidelines": [
    {
      "name": "React Patterns",
      "description": "Use modern React patterns",
      "priority": 8,
      "patterns": ["Use functional components", "Implement proper prop types"]
    }
  ]
}
```

### AI Context Schema Equivalent

````yaml
---
id: "react-patterns-copilot"
title: "React Patterns"
description: "Modern React development patterns for consistent code quality"
version: "1.0.0"
category: "technology"
framework: "react"
platforms:
  github-copilot:
    compatible: true
    priority: 8
    reviewType: "code-quality"
  claude-code:
    compatible: true
    memory: true
  cursor:
    compatible: true
    activation: "auto-attached"
    globs: ["**/*.tsx", "**/*.jsx"]
tags: ["react", "patterns", "code-quality"]
---

# React Patterns

## Functional Components
Use functional components with hooks instead of class components:

```tsx
// ✅ Good
const MyComponent: React.FC<Props> = ({ title }) => {
  return <h1>{title}</h1>;
};

// ❌ Avoid
class MyComponent extends React.Component {
  render() {
    return <h1>{this.props.title}</h1>;
  }
}
````

## Prop Types

Implement proper TypeScript interfaces for props...

````

## Migrating from Windsurf XML

### Current Windsurf Format
```xml
<typescript-context priority="7">
  <purpose>TypeScript development guidelines</purpose>
  <content>
    Use strict type checking...
  </content>
</typescript-context>
````

### AI Context Schema Equivalent

````yaml
---
id: 'typescript-guidelines'
title: 'TypeScript Development Guidelines'
description: 'Strict typing and best practices for TypeScript development'
version: '1.0.0'
category: 'language'
language: 'typescript'
platforms:
  windsurf:
    compatible: true
    mode: 'workspace'
    xmlTag: 'typescript-context'
    priority: 7
  claude-code:
    compatible: true
    memory: true
  cursor:
    compatible: true
    activation: 'auto-attached'
    globs: ['**/*.ts', '**/*.tsx']
tags: ['typescript', 'types', 'language']
---
# TypeScript Development Guidelines

Use strict type checking for all TypeScript projects...

## Migrating from VS Code Settings

### Current VS Code Format

```json
{
  "aiContext.rules": [
    {
      "name": "TypeScript Guidelines",
      "filePatterns": ["**/*.ts", "**/*.tsx"],
      "guidelines": ["Use strict types", "Implement proper interfaces"]
    }
  ]
}
````

### AI Context Schema Equivalent

```yaml
---
id: 'typescript-vscode-guidelines'
title: 'TypeScript Guidelines'
description: 'TypeScript development guidelines for VS Code projects'
version: '1.0.0'
category: 'language'
language: 'typescript'
platforms:
  vscode:
    compatible: true
    extension: 'ai-context-schema'
    settings: { 'aiContext.autoActivate': true }
    mcpIntegration: true
  vscode-insiders:
    compatible: true
    extension: 'ai-context-schema-insiders'
    mcpIntegration: true
  vscodium:
    compatible: true
    extension: 'ai-context-schema-oss'
    configPath: '.vscode-oss/'
  claude-code:
    compatible: true
    memory: true
  cursor:
    compatible: true
    activation: 'auto-attached'
    globs: ['**/*.ts', '**/*.tsx']
tags: ['typescript', 'vscode', 'language']
---
# TypeScript Guidelines

Use strict types and implement proper interfaces...
```

## Migrating from JetBrains IDEs

### Current JetBrains Format

JetBrains IDEs typically use file templates and inspection profiles:

```xml
<!-- File Template -->
<template>
  <name>React Component</name>
  <extension>tsx</extension>
  <content>
    import React from 'react';

    interface ${NAME}Props {
      // Define props here
    }

    export const ${NAME}: React.FC<${NAME}Props> = (props) => {
      return <div>Hello World</div>;
    };
  </content>
</template>
```

### AI Context Schema Equivalent

````yaml
---
id: 'react-jetbrains-patterns'
title: 'React Component Patterns for JetBrains'
description: 'React component development patterns optimized for JetBrains IDEs'
version: '1.0.0'
category: 'technology'
framework: 'react'
language: 'typescript'
platforms:
  jetbrains:
    compatible: true
    ide: 'webstorm'
    mcpIntegration: true
    fileTemplates: true
    inspections: ['ReactHooksUsage', 'TypeScriptValidateTypes']
  webstorm:
    compatible: true
    nodeIntegration: true
    typescript: true
    inspections: ['JavaScriptPatterns', 'TypeScriptPatterns']
  intellij:
    compatible: true
    plugin: 'JavaScript'
    fileTemplates: true
  claude-code:
    compatible: true
    memory: true
    command: true
  cursor:
    compatible: true
    activation: 'auto-attached'
    globs: ['**/*.tsx', '**/*.jsx']
tags: ['react', 'typescript', 'jetbrains', 'webstorm']
---
# React Component Patterns for JetBrains

## Component Structure

Always define proper interfaces for component props:

```tsx
interface ComponentNameProps {
  // Define props with proper types
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  children,
  onClick
}) => {
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
      {children}
    </div>
  );
};
````

## Platform Notes

### WebStorm

- Use built-in React component templates
- Enable TypeScript inspections for better type checking
- Configure Node.js integration for proper module resolution

### IntelliJ IDEA

- Install JavaScript/TypeScript plugins
- Configure file templates for consistent component structure

````

## Migrating from Zed Configuration

### Current Zed Format

```json
{
  "ai": {
    "contexts": [
      {
        "name": "Python Guidelines",
        "scope": "project",
        "patterns": ["**/*.py"],
        "content": "Use type hints and follow PEP 8"
      }
    ]
  }
}
````

### AI Context Schema Equivalent

````yaml
---
id: 'python-zed-guidelines'
title: 'Python Guidelines for Zed'
description: 'Python development guidelines optimized for Zed editor'
version: '1.0.0'
category: 'language'
language: 'python'
platforms:
  zed:
    compatible: true
    mode: 'project'
    aiFeatures: true
    collaborative: true
    performance: 'high'
  claude-code:
    compatible: true
    memory: true
  cursor:
    compatible: true
    activation: 'auto-attached'
    globs: ['**/*.py']
  pycharm:
    compatible: true
    pythonInterpreter: true
    virtualEnv: true
    inspections: ['PythonPatterns']
tags: ['python', 'zed', 'type-hints', 'pep8']
---
# Python Guidelines for Zed

## Type Hints

Always use type hints for function parameters and return values:

```python
def process_data(data: List[Dict[str, Any]]) -> Dict[str, int]:
    """Process data and return summary statistics."""
    return {"count": len(data), "total": sum(len(item) for item in data)}
````

## Platform Notes

### Zed Editor

- Utilizes high-performance parsing for real-time feedback
- Collaborative features work with shared context schemas
- AI features integrate seamlessly with project-level context

````

## Migrating from Custom JSON Formats

### Generic JSON Configuration

```json
{
  "name": "API Guidelines",
  "type": "backend",
  "rules": [
    "Use RESTful endpoints",
    "Implement proper error handling",
    "Include request validation"
  ],
  "examples": {
    "endpoint": "GET /api/users",
    "error": "return 404 for not found"
  }
}
````

### Migration Script Template

```javascript
// migrate-custom.js
const fs = require('fs');
const yaml = require('js-yaml');

function migrateCustomFormat(inputFile, outputDir) {
  const customConfig = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  const schema = {
    id: slugify(customConfig.name),
    title: customConfig.name,
    description: `Migrated from ${inputFile}`,
    version: '1.0.0',
    category: mapCategory(customConfig.type),
    platforms: {
      'claude-code': { compatible: true, memory: true },
      cursor: { compatible: true, activation: 'auto-attached' },
      windsurf: { compatible: true, mode: 'workspace' },
      'github-copilot': { compatible: true, priority: 8 }
    },
    tags: extractTags(customConfig),
    author: 'migration-script'
  };

  const content = generateMarkdownContent(customConfig);
  const fullSchema = `---\n${yaml.dump(schema)}---\n\n${content}`;

  const outputFile = `${outputDir}/${schema.id}.yaml`;
  fs.writeFileSync(outputFile, fullSchema);

  console.log(`Migrated ${inputFile} -> ${outputFile}`);
}

function generateMarkdownContent(config) {
  let content = `# ${config.name}\n\n`;

  if (config.rules) {
    content += '## Guidelines\n\n';
    config.rules.forEach((rule) => {
      content += `- ${rule}\n`;
    });
    content += '\n';
  }

  if (config.examples) {
    content += '## Examples\n\n';
    Object.entries(config.examples).forEach(([key, value]) => {
      content += `### ${key}\n\`\`\`\n${value}\n\`\`\`\n\n`;
    });
  }

  return content;
}
```

## Migration Best Practices

### Content Migration

#### Preserve Intent

- Keep the original behavioral intent intact
- Don't change the meaning or purpose during migration
- Maintain the same level of detail and specificity

#### Improve Structure

- Break large monolithic configs into focused schemas
- Use clear section headers and organization
- Add examples and anti-patterns where missing

#### Enhance Metadata

```yaml
# Add comprehensive metadata
id: 'descriptive-kebab-case-id'
title: 'Clear, Descriptive Title'
description: 'Detailed description of purpose and scope'
version: '1.0.0'
category: 'appropriate-category'
complexity: 'simple|medium|complex'
scope: 'file|component|feature|project|system'
audience: 'developer|architect|team-lead|junior'
maturity: 'experimental|beta|stable'
```

### Platform Configuration

#### Start Conservative

```yaml
platforms:
  # Start with platforms you can test
  cursor:
    compatible: true
    activation: 'manual' # Start with manual activation
  claude-code:
    compatible: true
    memory: true
    # Add commands later after testing
```

#### Expand Gradually

```yaml
platforms:
  cursor:
    compatible: true
    activation: 'auto-attached' # Upgrade to auto after testing
    globs: ['**/*.tsx']
    priority: 'high'
  claude-code:
    compatible: true
    memory: true
    command: true # Add commands after validation
    namespace: 'project'
```

### Validation and Testing

#### Pre-migration Checklist

- [ ] Inventory all existing configurations
- [ ] Identify dependencies between configurations
- [ ] Plan migration order (dependencies first)
- [ ] Set up validation environment

#### Post-migration Validation

```bash
# Validate schema syntax
npx ai-context-schema validate schemas/*.yaml

# Test platform generation
npx ai-context-schema generate cursor --schemas your-schema

# Verify content preservation
diff -u original-config schemas/migrated-schema.yaml
```

#### Testing Across Platforms

1. **Generate configurations**: Test generation for each target platform
2. **Deploy to test environment**: Test in isolated development environment
3. **Verify behavior**: Ensure AI assistant behavior matches expectations
4. **Test edge cases**: Verify handling of complex scenarios
5. **Performance check**: Monitor for any performance impacts

### Team Migration

#### Communication Plan

1. **Announce migration**: Inform team of migration timeline and benefits
2. **Provide training**: Share documentation and examples
3. **Gradual rollout**: Start with volunteer early adopters
4. **Gather feedback**: Collect and address migration issues
5. **Full deployment**: Roll out to entire team after validation

#### Migration Timeline Template

```
Week 1: Planning and Assessment
- Inventory existing configurations
- Plan migration order
- Set up migration environment

Week 2-3: Core Migration
- Migrate critical/frequently used configurations
- Validate and test migrated schemas
- Address any issues discovered

Week 4: Team Rollout
- Train team members on new format
- Deploy to development environments
- Monitor and gather feedback

Week 5: Production Deployment
- Deploy to production environments
- Monitor performance and behavior
- Address any remaining issues
```

## Troubleshooting Migration Issues

### Common Migration Problems

#### Schema Validation Errors

```bash
# Check specific validation errors
npx ai-context-schema validate --verbose schemas/problematic-schema.yaml

# Common issues:
# - Missing required fields (id, title, description, version, category, platforms)
# - Invalid version format (must be semantic version)
# - Invalid platform configuration
# - Circular dependencies in requires/conflicts
```

#### Content Loss During Migration

- **Problem**: Important context lost during automated migration
- **Solution**: Manual review and content enhancement
- **Prevention**: Use migration scripts as starting point, not final result

#### Platform Compatibility Issues

- **Problem**: Schema doesn't work as expected on target platform
- **Solution**: Check platform-specific requirements and limitations
- **Prevention**: Test incrementally on each target platform

#### Performance Degradation

- **Problem**: Slower AI response times after migration
- **Solution**: Optimize schema content length and priority settings
- **Prevention**: Monitor performance during gradual rollout

### Migration Support

#### Getting Help

- **Documentation**: Check platform-specific documentation
- **Community**: Use GitHub Discussions for migration questions
- **Issues**: Report bugs or missing features via GitHub Issues
- **Examples**: Study existing schema examples for patterns

#### Migration Tools

- **VDK CLI**: `vdk migrate` command for common formats
- **Validation**: `npx ai-context-schema validate` for schema checking
- **Generation**: `npx ai-context-schema generate` for testing output
- **Custom Scripts**: Write platform-specific migration scripts

## Post-Migration Optimization

### Performance Tuning

1. **Monitor AI response times**: Compare before/after performance
2. **Optimize schema content**: Remove unnecessary verbosity
3. **Adjust priorities**: Fine-tune platform priority settings
4. **Consolidate schemas**: Merge related schemas where appropriate

### Content Enhancement

1. **Add missing examples**: Include code examples and anti-patterns
2. **Improve organization**: Use clear sections and headers
3. **Update for modern practices**: Incorporate latest best practices
4. **Add platform-specific notes**: Include platform-specific guidance

### Maintenance Planning

1. **Version management**: Plan for schema updates and versioning
2. **Team ownership**: Assign ownership for schema maintenance
3. **Review schedule**: Regular review and update cycles
4. **Feedback loop**: Collect and incorporate team feedback

Successful migration to AI Context Schema provides a foundation for more consistent, maintainable, and powerful AI-assisted development workflows.
