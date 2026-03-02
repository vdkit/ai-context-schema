# Platform Support

AI Context Schema is designed to work across multiple AI coding assistant platforms and IDEs. This document details the current platform support, integration methods, and platform-specific considerations based on the comprehensive list from [SUPPORTED_IDES_AND_AI_TOOLS.md](../../SUPPORTED_IDES_AND_AI_TOOLS.md).

## Supported Platforms

### AI Assistants & Services

#### Anthropic Claude

##### Claude Code

**Status**: ✅ Full Support
**Configuration Location**: `.claude/`
**Schema Version**: v3.0.0+

```yaml
platforms:
  claude-code:
    compatible: true
    memory: true # Include in memory files
    command: true # Enable as slash command
    namespace: 'project' # project or user scope
    priority: 8 # Memory hierarchy priority (1-10)
    allowedTools: ['web_search', 'web_fetch']
    mcpIntegration: true # Uses MCP servers
```

##### Claude Desktop

**Status**: ✅ Full Support
**Configuration Location**: `.claude-desktop/`
**MCP Support**: ✅ via `~/Library/Application Support/Claude/claude_desktop_config.json`

```yaml
platforms:
  claude-desktop:
    compatible: true
    mcpIntegration: true
    rules: true # Include in rules folder
    priority: 8 # Context priority (1-10)
```

#### OpenAI Tools

**Status**: ⚠️ Limited Support
**Configuration Location**: `.openai/`
**Notes**: Original Codex API deprecated March 2023

```yaml
platforms:
  openai:
    compatible: false # Deprecated
    status: 'deprecated'
    apiVersion: 'v1'
    model: 'gpt-4'
    notes: 'Use generic-ai instead'
```

#### GitHub Services

##### GitHub Copilot

**Status**: ✅ Full Support
**Configuration Location**: `.github/copilot/`
**Enterprise Support**: ✅

```yaml
platforms:
  github-copilot:
    compatible: true
    priority: 8 # Priority for guideline selection (1-10)
    reviewType: 'security' # security, performance, code-quality, style, general
    scope: 'repository' # repository or organization
```

#### Generic AI Tool

**Status**: ✅ Full Support
**Configuration Location**: `.ai/`
**Notes**: Standard configuration for most AI coding assistants

```yaml
platforms:
  generic-ai:
    compatible: true
    configPath: '.ai/'
    rulesPath: '.ai/rules/'
    priority: 7 # Context priority (1-10)
```

### AI-First Editors

#### Cursor AI

**Status**: ✅ Full Support
**Configuration Location**: `.cursor/` or `.ai/rules/`
**MCP Support**: ✅

```yaml
platforms:
  cursor:
    compatible: true
    activation: 'auto-attached' # auto-attached, agent-requested, manual, always
    globs: ['**/*.tsx', '**/*.ts'] # File patterns for activation
    priority: 'high' # high, medium, low
    fileTypes: ['typescript', 'javascript', 'react']
```

#### Windsurf (Codeium)

**Status**: ✅ Full Support
**Configuration Location**: `.windsurf/`
**MCP Support**: ✅ via `~/.codeium/windsurf/mcp_config.json`

```yaml
platforms:
  windsurf:
    compatible: true
    mode: 'workspace' # global or workspace
    xmlTag: 'react-context' # XML wrapper tag
    characterLimit: 4500 # Estimated character usage
    priority: 7 # Context priority (1-10)
```

#### Windsurf Next

**Status**: ✅ Full Support
**Configuration Location**: `.windsurf-next/`
**MCP Support**: ✅ via `~/.codeium/windsurf-next/mcp_config.json`

```yaml
platforms:
  windsurf-next:
    compatible: true
    mode: 'workspace' # global or workspace
    xmlTag: 'windsurf-next-context' # XML wrapper tag
    characterLimit: 4500 # Estimated character usage
    priority: 7 # Context priority (1-10)
```

### Microsoft Visual Studio Code Family

#### VS Code (Stable)

**Status**: ✅ Full Support
**Configuration Location**: `.vscode/`
**MCP Support**: ✅ via `.vscode/mcp.json`

```yaml
platforms:
  vscode:
    compatible: true
    extension: 'ai-context-schema' # Required extension
    settings: # VS Code settings integration
      { 'aiContext.autoActivate': true }
    commands: ['aiContext.apply', 'aiContext.validate']
```

#### VS Code Insiders

**Status**: ✅ Full Support
**Configuration Location**: `.vscode-insiders/`
**MCP Support**: ✅ via `.vscode-insiders/mcp.json`

```yaml
platforms:
  vscode-insiders:
    compatible: true
    extension: 'ai-context-schema-insiders'
    mcpIntegration: true
    settings: { 'aiContext.autoActivate': true }
    commands: ['aiContext.apply', 'aiContext.validate']
```

#### VSCodium

**Status**: ✅ Full Support
**Configuration Location**: `.vscode-oss/`
**Notes**: Open source VS Code distribution

```yaml
platforms:
  vscodium:
    compatible: true
    extension: 'ai-context-schema-oss'
    configPath: '.vscode-oss/'
    settings: { 'aiContext.autoActivate': true }
    commands: ['aiContext.apply', 'aiContext.validate']
```

### Modern Editors

#### Zed Editor

**Status**: ✅ Full Support
**Configuration Location**: `.zed/`
**Notes**: High-performance collaborative editor with AI features

```yaml
platforms:
  zed:
    compatible: true
    mode: 'project' # global or project
    aiFeatures: true # Uses Zed AI features
    collaborative: true # Supports collaborative features
    performance: 'high' # high, medium, low
```

### JetBrains IDEs

#### General JetBrains Platform

**Status**: ✅ Full Support
**Configuration Location**: `.idea/`
**MCP Support**: ✅ (2025.1+ versions)

```yaml
platforms:
  jetbrains:
    compatible: true
    ide: 'intellij' # intellij, webstorm, pycharm, phpstorm, rubymine, clion, datagrip, goland, rider, android-studio
    plugin: 'ai-context-schema-plugin'
    mcpIntegration: true # 2025.1+ versions
    fileTemplates: true
    inspections: ['ContextSchemaValidation']
```

#### IntelliJ IDEA

```yaml
platforms:
  intellij:
    compatible: true
    plugin: 'ai-context-schema-plugin'
    fileTemplates: true
    inspections: ['JavaPatterns', 'KotlinPatterns']
```

#### WebStorm

```yaml
platforms:
  webstorm:
    compatible: true
    nodeIntegration: true # Node.js integration
    typescript: true # TypeScript support
    plugin: 'NodeJS'
    inspections: ['JavaScriptPatterns', 'TypeScriptPatterns']
```

#### PyCharm

```yaml
platforms:
  pycharm:
    compatible: true
    pythonInterpreter: true # Python interpreter configuration
    virtualEnv: true # Virtual environment support
    inspections: ['PythonPatterns', 'DjangoPatterns']
```

#### PHPStorm

```yaml
platforms:
  phpstorm:
    compatible: true
    phpVersion: '8.0' # Required PHP version
    composer: true # Composer integration
    inspections: ['PhpPatterns', 'LaravelPatterns']
```

#### RubyMine

```yaml
platforms:
  rubymine:
    compatible: true
    rubyVersion: '3.0' # Required Ruby version
    rails: true # Ruby on Rails support
    inspections: ['RubyPatterns', 'RailsPatterns']
```

#### CLion

```yaml
platforms:
  clion:
    compatible: true
    cmake: true # CMake integration
    debugger: true # Debugger configuration
    inspections: ['CppPatterns', 'CMakePatterns']
```

#### DataGrip

```yaml
platforms:
  datagrip:
    compatible: true
    databases: ['postgresql', 'mysql', 'mongodb']
    sqlDialect: 'PostgreSQL'
    inspections: ['SQLPatterns', 'DatabasePatterns']
```

#### GoLand

```yaml
platforms:
  goland:
    compatible: true
    goVersion: '1.21' # Required Go version
    modules: true # Go modules support
    inspections: ['GoPatterns', 'GoModulePatterns']
```

#### Rider

```yaml
platforms:
  rider:
    compatible: true
    dotnetVersion: '8.0' # Required .NET version
    unity: true # Unity integration
    inspections: ['CSharpPatterns', 'UnityPatterns']
```

#### Android Studio

```yaml
platforms:
  android-studio:
    compatible: true
    androidSdk: '34' # Required Android SDK version
    gradleVersion: '8.0' # Required Gradle version
    inspections: ['AndroidPatterns', 'KotlinPatterns']
```

## Platform Feature Comparison

| Platform           | Memory/Context    | Auto-activation  | Commands          | Character Limits | MCP Support | Priority System |
| ------------------ | ----------------- | ---------------- | ----------------- | ---------------- | ----------- | --------------- |
| **Claude Code**    | ✅ Memory files   | ✅ Always active | ✅ Slash commands | ❌ No limits     | ✅ Full     | ✅ 1-10 scale   |
| **Claude Desktop** | ✅ Rules folder   | ✅ Always active | ❌ Not supported  | ❌ No limits     | ✅ Full     | ✅ 1-10 scale   |
| **Cursor**         | ✅ Rule files     | ✅ File patterns | ❌ Not supported  | ❌ No limits     | ✅ Full     | ✅ High/Med/Low |
| **Windsurf**       | ✅ XML memory     | ✅ Workspace     | ❌ Not supported  | ⚠️ 6K limit      | ✅ Full     | ✅ 1-10 scale   |
| **Windsurf Next**  | ✅ XML memory     | ✅ Workspace     | ❌ Not supported  | ⚠️ 6K limit      | ✅ Full     | ✅ 1-10 scale   |
| **GitHub Copilot** | ✅ Guidelines     | ✅ Repository    | ❌ Not supported  | ❌ No limits     | ❌ No       | ✅ 1-10 scale   |
| **VS Code Family** | ✅ Settings       | ✅ File patterns | ✅ Commands       | ❌ No limits     | ✅ Full     | ✅ 1-10 scale   |
| **Zed**            | ✅ Project config | ✅ Project       | ✅ Commands       | ❌ No limits     | ❌ Planned  | ✅ High/Med/Low |
| **JetBrains IDEs** | ✅ Config files   | ✅ File patterns | ✅ Actions        | ❌ No limits     | ✅ 2025.1+  | ✅ 1-10 scale   |
| **OpenAI**         | ❌ Deprecated     | ❌ Deprecated    | ❌ Deprecated     | ❌ Deprecated    | ❌ No       | ❌ Deprecated   |
| **Generic AI**     | ✅ Rule files     | ✅ Configurable  | ✅ Configurable   | ❌ No limits     | ⚠️ Depends  | ✅ 1-10 scale   |

## Model Context Protocol (MCP) Support

The following platforms support MCP for enhanced AI context:

- ✅ **VS Code** (all variants) - via `.vscode/mcp.json`
- ✅ **Cursor AI** - via `.cursor/mcp.json`
- ✅ **Windsurf** (all variants) - via `~/.codeium/windsurf/mcp_config.json`
- ✅ **JetBrains IDEs** (2025.1+) - via Settings → Tools → AI Assistant → Model Context Protocol
- ✅ **Claude Desktop** - via `~/Library/Application Support/Claude/claude_desktop_config.json`
- ✅ **Claude Code** - built-in MCP integration

## Platform-Specific Optimizations

### Claude Code Optimizations

- **Memory Hierarchy**: Organizes schemas by priority and scope
- **Command Generation**: Creates contextual slash commands
- **Tool Integration**: Supports MCP server integration
- **Context Injection**: Seamless context switching

### Cursor Optimizations

- **File Pattern Matching**: Intelligent auto-attachment based on file types
- **Agent Integration**: Works with Cursor's agent system
- **Real-time Activation**: Immediate schema application when files are opened

### Windsurf Optimizations

- **Content Compression**: Intelligent truncation for character limits
- **XML Formatting**: Structured XML for optimal parsing
- **Workspace Awareness**: Project-level context understanding

### JetBrains Optimizations

- **IDE-Specific Features**: Tailored for each JetBrains IDE
- **File Templates**: Integration with IDE file templates
- **Code Inspections**: Custom inspections for context validation
- **Plugin Architecture**: Extensible through JetBrains plugin system

### Zed Optimizations

- **High Performance**: Optimized for Zed's high-performance architecture
- **Collaborative Features**: Real-time collaborative context sharing
- **AI Integration**: Deep integration with Zed's AI features

## Auto-Detection Capabilities

VDK CLI automatically detects IDE usage through:

- **Configuration folders**: `.vscode`, `.idea`, `.cursor`, `.windsurf`, etc.
- **Settings files**: `settings.json`, `workspace.xml`, `config.json`
- **Extension directories**: IDE-specific extension paths
- **Global configuration files**: User-level IDE configurations

Example detection:

```bash
# Auto-detect and initialize all IDEs in current project
vdk init

# Initialize specific IDE
vdk init --ide webstorm

# List all detected IDEs
vdk detect
```

## Migration Guide

### From Platform-Specific Formats

#### From Cursor .mdc Files

```bash
vdk migrate cursor --input .cursor/rules --output schemas/
```

#### From JetBrains Templates

```bash
vdk migrate jetbrains --input .idea/fileTemplates --output schemas/
```

#### From VS Code Settings

```bash
vdk migrate vscode --input .vscode/settings.json --output schemas/
```

## Troubleshooting

### Common Issues

#### Schema Not Activating

1. Check platform compatibility flag: `compatible: true`
2. Verify file patterns (for auto-activation platforms)
3. Validate schema syntax using `vdk validate`
4. Check platform-specific requirements

#### Content Truncation (Windsurf)

1. Reduce schema content length
2. Increase priority to avoid truncation
3. Split complex schemas into smaller ones
4. Use `characterLimit` field appropriately

#### MCP Integration Issues

1. Verify MCP configuration files exist
2. Check MCP server status and logs
3. Validate MCP server registration
4. Ensure proper permissions for MCP access

### Debug Mode

Enable debug logging for troubleshooting:

```bash
export DEBUG=ai-context-schema:*
vdk generate --verbose --debug
```

## Contributing Platform Support

We welcome contributions for new platform adapters! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on:

- Implementing new platform adapters
- Testing adapter implementations
- Documenting platform-specific features
- Submitting adapter contributions

## Getting Started

To initialize AI Context Schema for your detected IDEs:

```bash
# Auto-detect and initialize all IDEs in current project
vdk init

# Initialize specific IDE
vdk init --ide jetbrains

# List all supported IDEs
vdk list-ides

# Generate rules for specific IDE
vdk scan --ide zed

# Check detected IDEs
vdk detect

# Validate configuration
vdk validate
```

For more detailed information about each platform, refer to the comprehensive [SUPPORTED_IDES_AND_AI_TOOLS.md](../../SUPPORTED_IDES_AND_AI_TOOLS.md) document.
