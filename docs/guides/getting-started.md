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
- Node.js 22+ (for validation tools)

## Quick Start

### 1. Install Validation Tools

```bash
# Install globally for command-line usage
pnpm add -g @vdkit/ai-context-schema

# Or use pnpm dlx for one-time usage
pnpm dlx @vdkit/ai-context-schema --help
```

### 2. Create Your First Schema

Create a file called `my-first-schema.yaml`:

````yaml
---
id: "my-react-patterns"
title: "My React Development Patterns"
description: "Personal React development guidelines and best practices"
schemaVersion: "3.0"
kind: "skill"
version: "1.0.0"
category: "technology"
framework: "react"
language: "typescript"
platforms:
  claude-code:
    components:
      skills:
        type: "claude-skill"
        location: ".claude/skills/"
        enabled: true
        manifests:
          - name: "my-react-patterns"
            file: "my-react-patterns.md"
            enabled: true
  cursor:
    components:
      rules:
        type: "cursor-rule"
        location: ".cursor/rules/"
        enabled: true
        format: "mdc"
        manifests:
          - name: "my-react-patterns"
            file: "my-react-patterns.mdc"
            enabled: true
            globs: ["**/*.tsx", "**/*.jsx"]
            activation: "auto-attached"
  windsurf:
    components:
      rules:
        type: "windsurf-rule"
        location: ".windsurf/rules/"
        enabled: true
        manifests:
          - name: "my-react-patterns"
            file: "my-react-patterns.md"
            enabled: true
            globs: ["**/*.tsx", "**/*.jsx"]
            mode: "glob"
  github-copilot:
    components:
      repo-level:
        type: "copilot-repo"
        location: ".github/copilot-instructions.md"
        enabled: true
        constraints:
          maxChars: 3000
  generic-ai:
    enabled: true
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
schemaVersion: '3.0'
kind: 'skill'
version: '1.0.0' # Semantic versioning
category: 'technology' # Optional editorial grouping
platforms:
  # At least one platform must be specified.
  # A platform is "on" unless it sets `enabled: false`.
  claude-code:
    enabled: true
```

### Platform Configuration

Each platform declares a `components` object (and/or an `enabled` flag). Component types are platform-specific. The legacy flat `compatible:`/`memory:` model has been removed.

#### AI Assistants

**Claude Code** — component types: `claude-main`, `claude-agent`, `claude-rule`, `claude-command`, `claude-skill`, `claude-settings`

```yaml
claude-code:
  components:
    main:
      type: 'claude-main'
      location: 'CLAUDE.md'
      enabled: true
    commands:
      type: 'claude-command'
      location: '.claude/commands/'
      enabled: true
      manifests:
        - name: 'react-component'
          file: 'react-component.md'
          enabled: true
          allowedTools: ['Read', 'Write']
          argumentHint: '<component-name>'
```

**Generic AI** — enable without platform-specific components

```yaml
generic-ai:
  enabled: true
```

#### AI-First Editors

**Cursor** — component types: `cursor-main`, `cursor-rule`

```yaml
cursor:
  components:
    rules:
      type: 'cursor-rule'
      location: '.cursor/rules/'
      enabled: true
      format: 'mdc'
      manifests:
        - name: 'react-patterns'
          file: 'react-patterns.mdc'
          enabled: true
          globs: ['**/*.tsx'] # required for auto-attached
          activation: 'auto-attached' # auto-attached, agent-requested, manual, always
```

**Windsurf** — component types: `windsurf-rule`, `windsurf-workflow` (6,000 character content limit)

```yaml
windsurf:
  components:
    rules:
      type: 'windsurf-rule'
      location: '.windsurf/rules/'
      enabled: true
      manifests:
        - name: 'react-patterns'
          file: 'react-patterns.md'
          enabled: true
          globs: ['**/*.tsx']
          mode: 'glob' # glob or always
```

**Zed** — component type: `zed-settings`

```yaml
zed:
  components:
    settings:
      type: 'zed-settings'
      location: '~/.config/zed/settings.json'
      enabled: true
```

#### Code Editors & IDEs

**JetBrains IDEs** — component type: `aiignore`

```yaml
jetbrains:
  components:
    aiignore:
      type: 'aiignore'
      location: '.aiignore'
      enabled: true
```

#### GitHub Services

**GitHub Copilot** — component type: `copilot-repo` (3,000 character content limit)

```yaml
github-copilot:
  components:
    repo-level:
      type: 'copilot-repo'
      location: '.github/copilot-instructions.md'
      enabled: true
      constraints:
        maxChars: 3000
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
    components:
      rules:
        type: 'cursor-rule'
        location: '.cursor/rules/'
        enabled: true
        manifests:
          - name: 'technology-name-patterns'
            file: 'technology-name-patterns.mdc'
            enabled: true
            globs: ['**/*.tsx', '**/*.ts', '**/components/**/*']
            activation: 'auto-attached'
  claude-code:
    components:
      skills:
        type: 'claude-skill'
        location: '.claude/skills/'
        enabled: true
        manifests:
          - name: 'technology-name-patterns'
            file: 'technology-name-patterns.md'
            enabled: true
```

### Language-Specific Schema

For TypeScript, Python, etc.:

```yaml
id: 'language-name-conventions'
category: 'language'
language: 'typescript'
platforms:
  cursor:
    components:
      rules:
        type: 'cursor-rule'
        location: '.cursor/rules/'
        enabled: true
        manifests:
          - name: 'language-name-conventions'
            file: 'language-name-conventions.mdc'
            enabled: true
            globs: ['**/*.ts', '**/*.tsx']
            activation: 'auto-attached'
  windsurf:
    components:
      rules:
        type: 'windsurf-rule'
        location: '.windsurf/rules/'
        enabled: true
        manifests:
          - name: 'language-name-conventions'
            file: 'language-name-conventions.md'
            enabled: true
            mode: 'glob'
```

### Project-Specific Schema

For your specific codebase:

```yaml
id: 'my-project-context'
category: 'project'
scope: 'project'
platforms:
  claude-code:
    components:
      main:
        type: 'claude-main'
        location: 'CLAUDE.md'
        enabled: true
  github-copilot:
    components:
      repo-level:
        type: 'copilot-repo'
        location: '.github/copilot-instructions.md'
        enabled: true
        constraints:
          maxChars: 3000
```

### Task-Specific Schema

For testing, deployment, etc.:

```yaml
id: 'testing-strategy'
category: 'task'
scope: 'project'
platforms:
  cursor:
    components:
      rules:
        type: 'cursor-rule'
        location: '.cursor/rules/'
        enabled: true
        manifests:
          - name: 'testing-strategy'
            file: 'testing-strategy.mdc'
            enabled: true
            activation: 'agent-requested' # Only when explicitly requested
  claude-code:
    components:
      commands:
        type: 'claude-command'
        location: '.claude/commands/'
        enabled: true
        manifests:
          - name: 'test'
            file: 'test.md'
            enabled: true
```

## Advanced Features

### Schema Composition

Build complex schemas from simpler ones:

```yaml
# Base schema
id: 'typescript-base'
requires: []

# Extended schema
id: 'react-typescript'
requires: ['typescript-base']
suggests: ['react-testing']
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
Error: platforms must have at least one platform (minProperties)
✅ Fix: Add at least one enabled platform, e.g. `generic-ai: { enabled: true }`
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
