# Getting Started with AI Context Schema

This guide helps you create your first AI Context Schema and deploy it across AI coding platforms.

## What You'll Learn

- How to write a basic context schema
- How to validate your schema
- How to deploy to AI platforms
- Best practices for effective schemas

## Prerequisites

- Basic understanding of YAML and Markdown
- Familiarity with at least one AI coding assistant (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, JetBrains IDEs, Zed, or GitHub Copilot)
- Node.js 18+ (for validation tools)

## Quick Start

### 1. Install Validation Tools

```bash
# Install globally for command-line usage
npm install -g ai-context-schema

# Or use npx for one-time usage
npx ai-context-schema --version
```

### 2. Create Your First Schema

Create a file called `my-first-schema.yaml`:

````yaml
---
id: "my-react-patterns"
title: "My React Development Patterns"
description: "Personal React development guidelines and best practices"
schemaVersion: "3.0.0"
kind: "skill"
version: "1.0.0"
category: "technology"
framework: "react"
language: "typescript"
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
  vscode:
    compatible: true
    extension: "ai-context-schema"
    mcpIntegration: true
  github-copilot:
    compatible: true
    priority: 8
    reviewType: "code-quality"
  generic-ai:
    compatible: true
    priority: 7
tags: ["react", "typescript", "personal"]
author: "your-username"
---

# My React Development Patterns

## Component Structure

Always use functional components with TypeScript:

```tsx
interface Props {
  title: string;
  children: React.ReactNode;
}

export const MyComponent: React.FC<Props> = ({ title, children }) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
};
````

## State Management

Use useState for local state:

```tsx
const [count, setCount] = useState(0);
```

## Anti-Patterns

Avoid these patterns:

- Class components for new code
- Inline styles
- Prop drilling beyond 2 levels

````

### 3. Validate Your Schema

```bash
# Validate syntax and structure
npx ai-context-schema validate my-first-schema.yaml

# Check platform compatibility
npx ai-context-schema check-compatibility my-first-schema.yaml
````

### 4. Deploy to Platforms

#### Using VDK (Reference Implementation)

```bash
# Install VDK CLI
npm install -g @vibe-dev-kit/cli

# Deploy to all compatible platforms
vdk generate --schema my-first-schema.yaml

# Deploy to specific platform
vdk generate cursor --schema my-first-schema.yaml
```

#### Manual Deployment

Each platform has specific file locations and formats:

**AI Assistants:**

- **Claude Code**: Place in `.claude/` directory
- **Claude Desktop**: Place in `.claude-desktop/rules/` directory
- **Generic AI**: Place in `.ai/rules/` directory

**AI-First Editors:**

- **Cursor**: Place in `.cursor/rules/` or `.ai/rules/` directory
- **Windsurf**: Place in `.windsurf/rules/` directory
- **Windsurf Next**: Place in `.windsurf-next/rules/` directory

**Code Editors & IDEs:**

- **VS Code**: Place in `.vscode/ai-rules/` directory
- **VS Code Insiders**: Place in `.vscode-insiders/ai-rules/` directory
- **VSCodium**: Place in `.vscode-oss/ai-rules/` directory
- **Zed**: Place in `.zed/ai-rules/` directory
- **JetBrains IDEs**: Place in `.idea/ai-rules/` directory

**GitHub Services:**

- **GitHub Copilot**: Place in `.github/copilot/` directory

## Understanding Schema Structure

### Required Fields

Every schema MUST include these fields:

```yaml
id: 'unique-kebab-case-identifier'
title: 'Human Readable Title'
description: 'Detailed description of what this schema provides'
schemaVersion: '3.0.0'
kind: 'skill'
version: '1.0.0' # Semantic versioning
category: 'technology' # Optional editorial grouping
platforms:
  # At least one platform must be specified
  claude-code:
    compatible: true
```

### Platform Configuration

Each platform has specific configuration options:

#### AI Assistants

**Claude Code**

```yaml
claude-code:
  compatible: true
  memory: true # Include in memory files
  command: true # Create slash command
  namespace: 'project' # project or user
  priority: 8 # 1-10, higher = more important
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

**Generic AI**

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
  xmlTag: 'react-context' # XML wrapper tag
  characterLimit: 4000 # Estimated content size (max 6000)
```

**Zed**

```yaml
zed:
  compatible: true
  mode: 'project' # global or project
  aiFeatures: true # Uses Zed AI features
  performance: 'high' # high, medium, low
```

#### Code Editors & IDEs

**VS Code**

```yaml
vscode:
  compatible: true
  extension: 'ai-context-schema' # Required extension
  settings: { 'aiContext.autoActivate': true }
  mcpIntegration: true # Uses MCP servers
```

**JetBrains IDEs**

```yaml
jetbrains:
  compatible: true
  ide: 'webstorm' # intellij, webstorm, pycharm, etc.
  mcpIntegration: true # 2025.1+ versions
  fileTemplates: true
  inspections: ['ContextSchemaValidation']
```

#### GitHub Services

**GitHub Copilot**

```yaml
github-copilot:
  compatible: true
  priority: 8 # 1-10 for suggestion priority
  reviewType: 'code-quality' # security, performance, code-quality, style
  scope: 'repository' # repository or organization
```

### Optional Fields

Enhance your schema with these optional fields:

```yaml
# Categorization
subcategory: 'frontend-framework'
framework: 'react'
language: 'typescript'
complexity: 'medium' # simple, medium, complex
scope: 'component' # file, component, feature, project, system
audience: 'developer' # developer, architect, team-lead, junior
maturity: 'stable' # experimental, beta, stable, deprecated

# Relationships
requires: ['typescript-base'] # Hard dependencies
suggests: ['react-testing'] # Soft recommendations
conflicts: ['vue-patterns'] # Incompatible schemas
supersedes: ['old-react-guide'] # Schemas this replaces

# Metadata
tags: ['react', 'typescript', 'components']
author: 'your-username'
contributors: ['teammate1', 'teammate2']
discussionUrl: 'https://github.com/org/repo/discussions/123'
```

## Content Best Practices

### Structure Your Content

Use clear markdown sections:

```markdown
# Schema Title

## Purpose

Brief explanation of what this schema is for...

## Guidelines

Core principles and rules...

## Code Examples

Working code samples with explanations...

## Anti-Patterns

What to avoid and why...

## Platform Notes

Platform-specific considerations...
```

### Effective Guidelines

**Be Specific**: Instead of "write good code," provide concrete examples:

````markdown
❌ Write clean functions
✅ Keep functions under 20 lines and single-purpose:

```tsx
// Good: Single responsibility
const formatUserName = (user: User) => `${user.firstName} ${user.lastName}`;

// Avoid: Multiple responsibilities
const processUser = (user: User) => {
  const name = `${user.firstName} ${user.lastName}`;
  saveToDatabase(user);
  sendWelcomeEmail(user);
  return name;
};
```
````

**Include Context**: Explain why patterns are recommended:

```markdown
## Use Functional Components

Prefer functional components over class components because they:

- Have simpler syntax and less boilerplate
- Better support for React Hooks
- Easier to test and debug
- Better performance with React.memo
```

**Show Anti-Patterns**: Help AI avoid common mistakes:

````markdown
## Anti-Patterns

❌ **Avoid**: Inline styles

```jsx
<div style={{ color: 'red', fontSize: '16px' }}>Text</div>
```
````

✅ **Use**: CSS classes or styled-components

```jsx
<div className="error-text">Text</div>
```

````

## Testing Your Schema

### Local Testing

Before deploying, test your schema locally:

```bash
# Validate schema structure
npx ai-context-schema validate my-schema.yaml --verbose

# Check all example schemas
npx ai-context-schema validate schemas/ --warnings

# Test platform compatibility
npx ai-context-schema check-compatibility my-schema.yaml
````

### Integration Testing

Test your schema with actual AI platforms:

1. **Deploy to test environment**
2. **Create test files** that should trigger the schema
3. **Verify AI behavior** matches expectations
4. **Test edge cases** and error scenarios

### Performance Testing

Monitor schema impact:

```bash
# Check estimated content size
npx ai-context-schema validate my-schema.yaml --platform windsurf

# Test with multiple schemas
npx ai-context-schema check-compatibility schemas/ --verbose
```

## Common Patterns

### Technology-Specific Schema

For React, Vue, Angular, etc.:

```yaml
id: 'technology-name-patterns'
category: 'technology'
framework: 'react' # or vue, angular, etc.
language: 'typescript'
platforms:
  cursor:
    globs: ['**/*.tsx', '**/*.ts', '**/components/**/*']
  claude-code:
    memory: true
    command: true
```

### Language-Specific Schema

For TypeScript, Python, etc.:

```yaml
id: 'language-name-conventions'
category: 'language'
language: 'typescript'
platforms:
  cursor:
    globs: ['**/*.ts', '**/*.tsx']
  windsurf:
    mode: 'workspace'
```

### Project-Specific Schema

For your specific codebase:

```yaml
id: 'my-project-context'
category: 'project'
scope: 'project'
platforms:
  claude-code:
    memory: true
    namespace: 'project'
  github-copilot:
    scope: 'repository'
```

### Task-Specific Schema

For testing, deployment, etc.:

```yaml
id: 'testing-strategy'
category: 'task'
scope: 'project'
platforms:
  cursor:
    activation: 'agent-requested' # Only when explicitly requested
  claude-code:
    command: true # Available as slash command
```

## Advanced Features

### Schema Composition

Build complex schemas from simpler ones:

```yaml
# Base schema
id: "typescript-base"
requires: []

# Extended schema
id: "react-typescript"
requires: ["typescript-base"]
suggests: ["react-testing"]
```

### Conditional Logic

Use platform-specific content:

```markdown
## Platform Notes

### Claude Code

Use the `/component` command to generate new React components.

### Cursor

This schema auto-activates for .tsx files in component directories.

### Windsurf

Context optimized for workspace-level React projects.
```

### Dynamic Content

Include project-specific variables:

```markdown
## Project Structure

Follow the established patterns in your `${projectRoot}/src/components/` directory.

Use the project's TypeScript configuration from `${projectRoot}/tsconfig.json`.
```

## Troubleshooting

### Common Validation Errors

**Invalid ID format**

```bash
Error: ID must be kebab-case
✅ Fix: Use "my-schema-name" instead of "My Schema Name"
```

**Missing required platforms**

```bash
Error: At least one platform must be compatible
✅ Fix: Set compatible: true for at least one platform
```

**Invalid version format**

```bash
Error: Version must follow semantic versioning
✅ Fix: Use "1.0.0" instead of "v1.0"
```

### Platform-Specific Issues

**Windsurf character limit exceeded**

```bash
Warning: Content may exceed Windsurf limit (6000 chars)
✅ Fix: Reduce content length or increase characterLimit estimate
```

**Cursor auto-attachment without globs**

```bash
Error: Auto-attached activation requires globs
✅ Fix: Add globs: ["**/*.ext"] for auto-attachment
```

### Content Issues

**Schema too verbose**

- Break into smaller, focused schemas
- Use clear, concise language
- Focus on most important patterns

**Missing examples**

- Add working code examples
- Include both good and bad patterns
- Explain why patterns are recommended

## Next Steps

### Explore Examples

Study the example schemas in this repository:

- [`react-example.yaml`](../../schemas/v3.0.0/examples/react-example.yaml) - React development patterns
- [`api-example.yaml`](../../schemas/v3.0.0/examples/api-example.yaml) - REST API patterns
- [`testing-example.yaml`](../../schemas/v3.0.0/examples/testing-example.yaml) - Testing approaches

### Join the Community

- **GitHub Discussions**: Share schemas and get help
- **Issues**: Report bugs or request features
- **Pull Requests**: Contribute improvements

### Advanced Topics

- [Platform Support Guide](platform-support.md) - Deep dive into platform-specific features
- [Migration Guide](migration-guide.md) - Migrate from existing AI configurations
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute to the project

### Build Your Schema Library

Start building a collection of schemas for your team:

1. **Audit existing AI configurations** across your projects
2. **Identify common patterns** and convert to schemas
3. **Test with your team** and gather feedback
4. **Iterate and improve** based on usage

With AI Context Schema, you can create consistent, reusable AI context that works across all platforms and projects. Start simple, test thoroughly, and build up your schema library over time.
