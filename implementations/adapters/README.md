# Community Adapters

This directory contains community-contributed platform adapters for AI Context Schema. These adapters help translate AI Context Schema files to platform-specific formats for the comprehensive list of supported IDEs and AI tools.

## Available Adapters

Platform adapters translate AI Context Schema YAML files to platform-specific configuration formats. Based on the [SUPPORTED_IDES_AND_AI_TOOLS.md](../../SUPPORTED_IDES_AND_AI_TOOLS.md), the following adapters are prioritized:

### AI Assistants & Services

#### High Priority

1. **Claude Code Adapter** - `.claude/` memory files and slash commands
2. **Claude Desktop Adapter** - `.claude-desktop/rules/` with MCP integration
3. **Cursor Adapter** - `.cursor/rules/` or `.ai/rules/` with MDC format
4. **GitHub Copilot Adapter** - `.github/copilot/` JSON guidelines
5. **Generic AI Adapter** - `.ai/rules/` universal format

#### Medium Priority

6. **Windsurf Adapter** - `.windsurf/rules/` XML format with character limits
7. **Windsurf Next Adapter** - `.windsurf-next/rules/` enhanced XML format
8. **OpenAI Legacy Adapter** - `.openai/` (deprecated support only)

### Code Editors & IDEs

#### VS Code Family

1. **VS Code Adapter** - `.vscode/ai-rules/` with settings integration
2. **VS Code Insiders Adapter** - `.vscode-insiders/ai-rules/` with MCP
3. **VSCodium Adapter** - `.vscode-oss/ai-rules/` open source variant

#### JetBrains IDEs

1. **JetBrains Universal Adapter** - `.idea/ai-rules/` with MCP (2025.1+)
2. **IntelliJ IDEA Adapter** - Java/Kotlin specific inspections
3. **WebStorm Adapter** - Node.js and TypeScript integration
4. **PyCharm Adapter** - Python interpreter and virtual env support
5. **PHPStorm Adapter** - PHP version and Composer integration
6. **RubyMine Adapter** - Ruby version and Rails support
7. **CLion Adapter** - CMake and debugger integration
8. **DataGrip Adapter** - Database and SQL dialect support
9. **GoLand Adapter** - Go modules and version support
10. **Rider Adapter** - .NET and Unity integration
11. **Android Studio Adapter** - Android SDK and Gradle support

#### Modern Editors

1. **Zed Adapter** - `.zed/ai-rules/` with collaborative features
2. **Vim/Neovim LSP Adapter** - LSP-based integration
3. **Emacs Package Adapter** - Elisp configuration
4. **Sublime Text Adapter** - Plugin-based integration

## Adapter Structure

Each adapter should be in its own subdirectory with:

```
adapters/
├── claude-code/
│   ├── README.md
│   ├── adapter.js
│   ├── package.json
│   ├── examples/
│   └── tests/
├── cursor/
│   ├── README.md
│   ├── adapter.js
│   ├── package.json
│   ├── examples/
│   └── tests/
└── jetbrains/
    ├── README.md
    ├── adapter.js
    ├── package.json
    ├── examples/
    └── tests/
```

### Required Files

- `README.md` - Platform-specific documentation
- `adapter.js` - Main adapter implementation
- `package.json` - Dependencies and metadata
- `examples/` - Example input/output transformations
- `tests/` - Comprehensive adapter tests

### Platform Configuration

Each adapter must handle the platform-specific configuration options defined in the schema:

```javascript
// Example adapter structure
class PlatformAdapter {
  constructor(platformName) {
    this.platformName = platformName;
  }

  async generate(schemas) {
    const files = {};

    for (const schema of schemas) {
      const config = schema.platforms[this.platformName];
      if (!config?.compatible) continue;

      const content = await this.transformSchema(schema, config);
      const filePath = this.getOutputPath(schema, config);
      files[filePath] = content;
    }

    return files;
  }

  transformSchema(schema, config) {
    // Platform-specific transformation logic
  }

  getOutputPath(schema, config) {
    // Platform-specific path logic
  }
}
```

## Platform-Specific Features

### MCP Integration Support

Required for: Claude Code, Claude Desktop, VS Code Family, Cursor, Windsurf, JetBrains IDEs (2025.1+)

### Character Limit Handling

Required for: Windsurf, Windsurf Next (6K character limit)

### Priority System Support

Required for: All platforms (1-10 scale or high/medium/low)

### File Pattern Matching

Required for: Cursor, VS Code Family, JetBrains IDEs

### Auto-Detection Support

All adapters should support the VDK CLI auto-detection system:

- Configuration folder detection
- Settings file parsing
- Extension directory scanning
- Global configuration reading

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on creating new adapters.

### New Adapter Checklist

- [ ] Implement `PlatformAdapter` interface
- [ ] Handle all platform-specific configuration options
- [ ] Support schema compatibility checking
- [ ] Implement proper error handling and validation
- [ ] Add comprehensive tests (>90% coverage)
- [ ] Document platform-specific features
- [ ] Add example transformations
- [ ] Support VDK CLI integration
- [ ] Handle MCP integration (if applicable)
- [ ] Support character limits (if applicable)
- [ ] Implement priority system
- [ ] Add auto-detection capabilities

### Testing Requirements

All adapters must include:

- Unit tests for transformation logic
- Integration tests with real schemas
- Edge case handling tests
- Performance tests for large schema sets
- MCP integration tests (if applicable)
- Character limit tests (if applicable)

### Documentation Requirements

Each adapter must document:

- Platform-specific configuration options
- File output locations and formats
- MCP integration details (if applicable)
- Character limit handling (if applicable)
- Auto-detection capabilities
- Migration from platform-specific formats
- Troubleshooting guide
- Examples of generated output

## Adapter Development Tools

### Schema Validation

```bash
npm run validate-schema input.yaml
```

### Adapter Testing

```bash
npm run test-adapter platform-name
```

### Output Validation

```bash
npm run validate-output platform-name output/
```

### Performance Testing

```bash
npm run perf-test platform-name large-schema-set/
```

## Platform Roadmap

### Phase 1 (Current)

- Claude Code Adapter ✅
- Cursor Adapter ✅
- GitHub Copilot Adapter ✅
- Generic AI Adapter ✅

### Phase 2 (Q1 2024)

- Claude Desktop Adapter
- VS Code Family Adapters
- Windsurf Adapters
- JetBrains Universal Adapter

### Phase 3 (Q2-Q3 2024)

- Specific JetBrains IDE Adapters
- Zed Adapter
- Vim/Neovim LSP Adapter
- Advanced MCP Integration

### Phase 4 (Q4 2024+)

- Emacs Package Adapter
- Sublime Text Adapter
- Custom Platform SDK
- Visual Adapter Builder

## Community Support

For adapter development support:

- 📖 [Documentation](https://github.com/your-repo/ai-context-schema/docs)
- 🐛 [Report Issues](https://github.com/your-repo/ai-context-schema/issues)
- 💬 [Community Discussions](https://github.com/your-repo/ai-context-schema/discussions)
- 🛠️ [Development Guide](../../docs/guides/adapter-development.md)
