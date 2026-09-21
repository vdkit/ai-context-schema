# Community Platform Adapters

This directory contains community-contributed platform adapters for AI Context Schema. These adapters extend support beyond the core platforms to additional AI coding assistants and development tools.

## Available Adapters

### Production Ready

- **VS Code Extension** - Full VS Code integration via extension API
- **IntelliJ IDEA Plugin** - Complete IntelliJ platform support
- **Vim/Neovim LSP** - Language Server Protocol integration

### Beta/Experimental

- **Sublime Text Plugin** - Basic Sublime Text support
- **Emacs Mode** - Emacs integration via package
- **JetBrains Fleet** - Early Fleet support

### Planned/Requested

- **Replit Integration** - Cloud IDE support
- **CodeSandbox** - Browser-based development
- **GitHub Codespaces** - Remote development environments

## Adapter Development

### Creating a New Adapter

1. **Create adapter directory**:

   ```tree
   implementations/adapters/your-platform/
   ├── README.md
   ├── src/
   │   ├── adapter.ts
   │   └── generator.ts
   ├── tests/
   │   └── adapter.test.ts
   └── package.json
   ```

2. **Implement PlatformAdapter interface**:

   ```typescript
   interface PlatformAdapter {
     name: string;
     version: string;
     generate(schemas: ContextSchema[]): Promise<GeneratedFiles>;
     validate?(config: any): ValidationResult;
     cleanup?(): Promise<void>;
   }
   ```

3. **Add platform support to schema**:

   ```yaml
   platforms:
     your-platform:
       compatible: true
       customProperty: 'value'
   ```

### Adapter Template

```typescript
import { PlatformAdapter, ContextSchema, GeneratedFiles } from 'ai-context-schema';

export class YourPlatformAdapter implements PlatformAdapter {
  name = 'your-platform';
  version = '1.0.0';

  async generate(schemas: ContextSchema[]): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    for (const schema of schemas) {
      const config = schema.platforms[this.name];
      if (!config?.compatible) continue;

      // Transform schema to your platform's format
      const content = this.transformSchema(schema, config);
      files[`.your-platform/${schema.id}.config`] = content;
    }

    return files;
  }

  private transformSchema(schema: ContextSchema, config: any): string {
    // Platform-specific transformation logic
    return JSON.stringify(
      {
        id: schema.id,
        title: schema.title,
        content: schema._content,
        config: config
      },
      null,
      2
    );
  }

  validate(config: any): ValidationResult {
    const errors: string[] = [];

    // Validate platform-specific configuration
    if (!config.requiredProperty) {
      errors.push('requiredProperty is required');
    }

    return {
      valid: errors.length === 0,
      errors: errors.map((message) => ({ message, type: 'validation_error' }))
    };
  }
}
```

## VS Code Extension

### Installation

```bash
# Install from VS Code Marketplace
ext install ai-context-schema.vscode

# Or install from VSIX
code --install-extension ai-context-schema-1.0.0.vsix
```

### Configuration

```json
{
  "aiContextSchema.autoActivate": true,
  "aiContextSchema.schemasPath": "./schemas",
  "aiContextSchema.showInStatusBar": true,
  "aiContextSchema.validateOnSave": true
}
```

### Platform Schema Configuration

```yaml
platforms:
  vscode:
    compatible: true
    extension: 'ai-context-schema.vscode'
    settings: { 'aiContext.autoActivate': true, 'aiContext.priority': 'high' }
    commands: ['aiContext.apply', 'aiContext.validate', 'aiContext.generate']
```

### Features

- **Auto-activation**: Schemas automatically applied based on file patterns
- **Status bar integration**: Current schema status displayed
- **Command palette**: Schema management commands
- **Settings integration**: VS Code settings control behavior
- **IntelliSense**: Schema suggestions and validation

## IntelliJ IDEA Plugin

### Installation

```bash
# Install from JetBrains Marketplace
# Or download from releases page
```

### Configuration

```xml
<!-- .idea/ai-context-schema.xml -->
<component name="AiContextSchema">
  <option name="enabled" value="true" />
  <option name="schemasPath" value="./schemas" />
  <option name="autoApply" value="true" />
</component>
```

### Platform Schema Configuration

```yaml
platforms:
  intellij:
    compatible: true
    plugin: 'ai-context-schema-plugin'
    fileTemplates: true
    inspections: ['ai-context-patterns', 'schema-compliance']
    intentions: ['apply-schema', 'generate-from-schema']
```

### Features

- **File templates**: Generate files using schema patterns
- **Code inspections**: Validate code against schemas
- **Intentions**: Quick-fix actions based on schemas
- **Tool window**: Schema management interface
- **Project-wide application**: Workspace-level schema management

## Vim/Neovim LSP

### Installation

**Neovim with built-in LSP**:

```lua
-- ~/.config/nvim/init.lua
require('lspconfig').ai_context_schema.setup({
  cmd = { 'ai-context-schema-lsp' },
  filetypes = { 'typescript', 'javascript', 'python', 'rust' },
  root_dir = require('lspconfig.util').root_pattern('.git', 'package.json'),
  settings = {
    aiContextSchema = {
      enabled = true,
      schemasPath = './schemas'
    }
  }
})
```

**Vim with vim-lsp**:

```vim
" ~/.vimrc
if executable('ai-context-schema-lsp')
  au User lsp_setup call lsp#register_server({
    \ 'name': 'ai-context-schema',
    \ 'cmd': {server_info->['ai-context-schema-lsp']},
    \ 'allowlist': ['typescript', 'javascript', 'python', 'rust'],
    \ })
endif
```

### Platform Schema Configuration

```yaml
platforms:
  vim:
    compatible: true
    lsp: true
    commands: ['AiContextApply', 'AiContextValidate', 'AiContextList']
    autocommands:
      [
        'BufEnter *.ts :AiContextApply typescript-patterns',
        'BufEnter *.py :AiContextApply python-patterns'
      ]
```

### Features

- **LSP integration**: Native Language Server Protocol support
- **Auto-completion**: Schema-aware suggestions
- **Diagnostics**: Real-time schema validation
- **Commands**: Vim/Neovim commands for schema management
- **File type detection**: Automatic schema application

## Sublime Text Plugin

### Installation

```bash
# Package Control
# Command Palette > Package Control: Install Package > AI Context Schema

# Manual installation
cd ~/Library/Application\ Support/Sublime\ Text\ 3/Packages/
git clone https://github.com/ai-context-schema/sublime-text-plugin.git "AI Context Schema"
```

### Configuration

```json
{
  "ai_context_schema": {
    "enabled": true,
    "schemas_path": "./schemas",
    "auto_apply": true,
    "show_status": true
  }
}
```

### Platform Schema Configuration

```yaml
platforms:
  sublime:
    compatible: true
    plugin: 'AI Context Schema'
    settings: { 'auto_apply': true, 'show_status': true }
    commands: ['ai_context_apply', 'ai_context_validate']
```

## Contributing Adapters

### Submission Process

1. **Create adapter** following the template and guidelines
2. **Add comprehensive tests** covering all functionality
3. **Update documentation** with installation and usage instructions
4. **Submit pull request** with adapter implementation
5. **Community review** and testing process

### Quality Standards

**Required Features**:

- Schema parsing and validation
- Platform-specific file generation
- Error handling and logging
- Documentation and examples

**Testing Requirements**:

- Unit tests for core functionality
- Integration tests with sample schemas
- Platform-specific testing
- Performance benchmarks

**Documentation Requirements**:

- Installation instructions
- Configuration examples
- Usage guide with examples
- Troubleshooting section

### Support Levels

**Tier 1 - Official Support**

- Maintained by core team
- Full feature support
- Regular updates and bug fixes
- Included in main distribution

**Tier 2 - Community Maintained**

- Maintained by community contributors
- Core feature support
- Community-driven updates
- Listed in official documentation

**Tier 3 - Experimental**

- Early-stage adapters
- Limited feature support
- No guaranteed maintenance
- Community testing and feedback

## Testing Adapters

### Adapter Testing Framework

```typescript
import { AdapterTestSuite } from 'ai-context-schema/testing';

const testSuite = new AdapterTestSuite(new YourPlatformAdapter());

describe('YourPlatformAdapter', () => {
  it('should generate valid configuration files', async () => {
    const schemas = [createTestSchema()];
    const result = await testSuite.testGeneration(schemas);

    expect(result.files).toHaveProperty('.your-platform/test-schema.config');
    expect(result.valid).toBe(true);
  });

  it('should handle platform-specific features', async () => {
    const schema = createSchemaWithPlatformConfig('your-platform', {
      customProperty: 'test-value'
    });

    const result = await testSuite.testPlatformFeatures(schema);
    expect(result.features.customProperty).toBe('test-value');
  });
});
```

### Integration Testing

```bash
# Test adapter with real schemas
npm run test:integration -- --adapter your-platform

# Test with example schemas
npm run test:examples -- --adapter your-platform

# Performance testing
npm run test:performance -- --adapter your-platform
```

## Adapter Registry

### Registering Your Adapter

Add your adapter to the community registry:

```yaml
# .github/adapters-registry.yml
adapters:
  - name: 'your-platform'
    version: '1.0.0'
    author: 'your-username'
    repository: 'https://github.com/your-username/ai-context-schema-your-platform'
    description: 'AI Context Schema adapter for Your Platform'
    platforms: ['your-platform']
    status: 'stable'
    lastUpdated: '2024-01-15'
```

### Adapter Discovery

Users can discover community adapters:

```bash
# List available adapters
npx ai-context-schema adapters list

# Install community adapter
npx ai-context-schema adapters install your-platform

# Search adapters
npx ai-context-schema adapters search "vs code"
```

## Support and Maintenance

### Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Discord**: Real-time community support
- **Documentation**: Comprehensive guides and examples

### Maintenance Guidelines

- **Regular updates**: Keep adapters compatible with latest schema versions
- **Issue response**: Respond to user issues within reasonable timeframe
- **Documentation**: Keep documentation up-to-date
- **Testing**: Maintain test coverage and add tests for new features

### Deprecation Policy

Adapters may be deprecated if:

- Platform is no longer maintained
- Significant security vulnerabilities
- Lack of maintenance or updates
- Better alternatives available

Deprecated adapters will be:

- Marked as deprecated in documentation
- Given 6-month notice before removal
- Archived with historical access
- Migration guides provided when possible

## Future Directions

### Planned Improvements

- **Adapter SDK**: Simplified development framework
- **Auto-generation**: Generate adapter boilerplate automatically
- **Testing framework**: Enhanced testing utilities
- **Distribution**: Package manager integration
- **Analytics**: Usage tracking and insights

### Community Requests

Popular adapter requests from the community:

- Cloud IDE integrations (Replit, CodeSandbox, Gitpod)
- Mobile development platforms
- AI-powered code editors
- Specialized development environments

### Contributing

We welcome contributions to expand platform support! Whether you're building an adapter for a new platform or improving existing ones, your contributions help make AI Context Schema more accessible to developers everywhere.

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general contribution guidelines and this README for adapter-specific requirements.
