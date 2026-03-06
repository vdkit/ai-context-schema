# AI Context Schema Specification v3.0

## Abstract

The AI Context Schema v3.0 specification defines a standardized format for describing AI assistant behavior, context, and platform-specific component configurations. This version introduces comprehensive support for agents, commands, skills, rules, workflows, and platform-specific architectures.

## 1. Overview

### 1.1 Purpose

AI coding assistants have evolved from simple completion tools to sophisticated agent systems with multi-component architectures, permission models, conditional rule application, and MCP integration. v3.0 provides a universal format that captures these complexities and enables semantic-preserving conversion between platforms.

### 1.2 Key Changes from v2.x

**Breaking Changes:**

- `schemaVersion: "3.0"` now required
- `platforms` object restructured with `components` architecture
- Component-level granularity (agents, rules, commands, skills, workflows)
- New `source` and `metadata` objects for conversion tracking
- No backward compatibility (clean v3.0 architecture)

### 1.3 Ecosystem Processing Order (Normative)

VDK ecosystem components MUST be treated in this processing order:

1. **ai-context-schema** defines canonical contract and validation
2. **VDK-Blueprints** stores curated canonical blueprint artifacts
3. **VDK-CLI** performs retrieval, scoring, adaptation, and deployment
4. **VDK-Hub** distributes/browses synchronized blueprint catalog data
5. **VDK-Wiki** documents behavior, operations, and user guidance

`VDK-CLI` is the execution core for runtime blueprint selection and deployment semantics. Hub and Wiki must describe and expose CLI-compatible behavior, not redefine selection rules.

### 1.4 Design Principles

- **Component-Level Granularity**: Define individual agents, commands, skills, rules
- **Platform-Specific Adaptation**: Each platform has unique component types and constraints
- **Semantic Preservation**: Maintain behavioral intent across format translations
- **Conversion Metadata**: Store source format for round-trip conversions

## 2. Schema Structure

### 2.1 Required Fields

Every context schema MUST include:

- `schemaVersion`: Must be "3.0"
- `id`: Unique identifier (kebab-case)
- `title`: Human-readable title
- `description`: Detailed description (10-500 characters)
- `version`: Semantic version number
- `kind`: Canonical behavioral kind (`project-memory`, `conditional-rule`, `skill`, `command`, `workflow`, `agent`, `hook`, `mcp-integration`, `plugin-distribution`)
- `platforms`: Platform-specific configurations (minimum 1)

`category` remains supported as an optional editorial grouping field for browsing and repository organization.

### 2.2 Canonical Retrieval Metadata

To support curated retrieval and deterministic deployment selection across generic and specific blueprints, implementations SHOULD preserve the following optional metadata when available:

- `specificityLayer`: `L0` to `L4`
  - `L0`: Universal baseline guidance
  - `L1`: Language-oriented guidance
  - `L2`: Framework/tool guidance
  - `L3`: Project-local implementation guidance
  - `L4`: Provenance or near-duplicate variant (excluded by default unless explicitly requested)
- `equivalenceOutcome`: `lossless`, `lossy`, or `unsupported` for cross-platform adaptation outcomes
- `curation.status`: curation lifecycle (`curated`, `experimental`, `community`, `deprecated`)

These fields are intentionally optional in schema validation so existing repositories can adopt them incrementally.

### 2.2.1 Curated Retrieval and Deployment Semantics

Implementations SHOULD enforce curated retrieval to minimize noise while preserving breadth:

- Default retrieval blends `L0-L3`
- `L4` is excluded by default and only included when explicitly requested (for example provenance/audit mode)
- Retrieval SHOULD prioritize canonical `kind` compatibility before platform adaptation
- Deployment SHOULD be deterministic for a selected artifact id (for example `vdk deploy <blueprint-id>`)

These semantics are operationally enforced by `VDK-CLI` and should be reflected consistently in Hub and Wiki surfaces.

### 2.3 Platform Configuration

Each platform has a `components` object defining available component types:

```json
{
  "platforms": {
    "claude-code": {
      "components": {
        "main": {
          "type": "claude-main",
          "location": "CLAUDE.md",
          "enabled": true
        },
        "agents": {
          "type": "claude-agent",
          "location": ".claude/agents/",
          "enabled": true,
          "manifests": [
            {
              "name": "security-reviewer",
              "file": "security-reviewer.md",
              "tools": ["Read", "Grep", "Glob"],
              "model": "sonnet",
              "triggers": ["PROACTIVELY"]
            }
          ]
        }
      }
    }
  }
}
```

## 3. Component Types by Platform

### 3.1 Claude Code

**Component Types:**

- `claude-main`: CLAUDE.md main context file
- `claude-agent`: Subagent definitions in `.claude/agents/*.md`
- `claude-rule`: Conditional rules in `.claude/rules/*.md`
- `claude-command`: Slash commands in `.claude/commands/*.md`
- `claude-skill`: Skill templates in `.claude/skills/*.md`
- `claude-settings`: Permissions in `.claude/settings.json`

**Agent Manifest:**

```json
{
  "name": "security-reviewer",
  "file": "security-reviewer.md",
  "tools": ["Read", "Grep", "Glob"],
  "model": "sonnet",
  "triggers": ["PROACTIVELY"]
}
```

### 3.2 Cursor

**Component Types:**

- `cursor-main`: canonical anchor rule in `.cursor/rules/index.mdc`
- `cursor-rule`: MDC rules in `.cursor/rules/*.mdc`

**Activation Modes:**

- `auto-attached`: Triggered by glob patterns
- `agent-requested`: AI decides based on description
- `manual`: Invoked with @ruleName
- `always`: Always applied

### 3.3 GitHub Copilot

**Component Types:**

- `copilot-repo`: Repository-level instructions
- `copilot-directory`: Directory-scoped instructions

**Constraints:**

- Maximum 3,000 characters per level
- No file references (inline only)
- No complex frontmatter

### 3.4 Windsurf

**Component Types:**

- `windsurf-rule`: Rules in `.windsurf/rules/*.md`
- `windsurf-workflow`: Workflows in `.windsurf/workflows/*.yaml`

### 3.5 Continue

**Component Types:**

- `continue-config`: Main config in `~/.continue/config.yaml`
- `continue-slash-command`: Slash command definitions

### 3.6 Aider

**Component Types:**

- `aider-config`: Configuration in `.aider.conf.yml`
- `aider-ignore`: Context exclusions in `.aiderignore`

### 3.7 OpenAI Codex (AGENTS.md)

**Component Types:**

- `agents-md`: Combined agent definitions in `AGENTS.md`
- `agent-file`: Individual agent files in `.agents/*.md`

### 3.8 Gemini CLI

**Component Types:**

- `gemini-main`: Main context in `GEMINI.md`
- `gemini-settings`: Settings in `.gemini/settings.json`
- `gemini-context`: Context files in `.gemini/context/*.md`

### 3.9 Tabnine

**Component Types:**

- `tabnine-guideline`: Guidelines in `.tabnine/guidelines/*.md`

### 3.10 Zed

**Component Types:**

- `zed-settings`: Settings in `~/.config/zed/settings.json`

### 3.11 JetBrains

**Component Types:**

- `aiignore`: Context exclusions in `.aiignore`

## 4. Source and Metadata Objects

### 4.1 Source Object

Preserves original content for conversion:

```json
{
  "source": {
    "content": "---\nname: security-reviewer\n...",
    "format": "markdown",
    "hasYAMLFrontmatter": true,
    "platform": "claude-code"
  }
}
```

### 4.2 Metadata Object

Semantic information for intelligent conversion:

```json
{
  "metadata": {
    "componentType": "agent",
    "triggers": ["authentication", "crypto"],
    "tools": ["Read", "Grep", "Glob"],
    "expertise": ["security", "cryptography"],
    "model": "sonnet"
  }
}
```

## 5. Dependencies and Relationships

```json
{
  "requires": ["typescript-base", { "id": "testing-patterns", "version": ">=2.0.0" }],
  "suggests": ["accessibility-guidelines"],
  "conflicts": ["legacy-patterns"],
  "supersedes": ["old-toolkit"]
}
```

## 6. Validation

### 6.1 Schema Validation

All context schemas MUST validate against `context-schema.json`.

### 6.2 Platform-Specific Validation

Each platform has specific constraints:

- **Claude Code**: Valid tool names, glob patterns, PROACTIVELY triggers
- **Cursor**: Valid activation modes, minimatch globs, MDC format
- **GitHub Copilot**: 3,000 character limit per level
- **Windsurf**: 6,000 character total limit, valid modes

## 7. Migration from v2.x

**No Automated Migration:**

- v3.0 is a complete redesign
- Manual migration required
- Use new schema structure from scratch

**Migration Steps:**

1. Add `schemaVersion: "3.0"`
2. Restructure `platforms` with `components`
3. Add component manifests
4. Include `source`/`metadata` objects
5. Validate against v3.0 schema

## 8. Examples

### 8.1 Security Agent Example

```json
{
  "schemaVersion": "3.0",
  "id": "security-reviewer-agent",
  "title": "Security Review Agent",
  "description": "Automated security review for authentication and cryptographic code",
  "version": "2.1.0",
  "category": "agent-system",
  "platforms": {
    "claude-code": {
      "components": {
        "agents": {
          "type": "claude-agent",
          "location": ".claude/agents/",
          "enabled": true,
          "manifests": [
            {
              "name": "security-reviewer",
              "file": "security-reviewer.md",
              "tools": ["Read", "Grep", "Glob"],
              "model": "sonnet",
              "triggers": ["PROACTIVELY"]
            }
          ]
        }
      }
    },
    "cursor": {
      "components": {
        "rules": {
          "type": "cursor-rule",
          "location": ".cursor/rules/",
          "enabled": true,
          "manifests": [
            {
              "name": "security-review",
              "file": "security-review.mdc",
              "globs": ["src/auth/**/*.ts", "src/crypto/**/*.ts"],
              "activation": "auto-attached"
            }
          ]
        }
      }
    }
  },
  "source": {
    "content": "...",
    "format": "markdown",
    "hasYAMLFrontmatter": true,
    "platform": "claude-code"
  },
  "metadata": {
    "componentType": "agent",
    "triggers": ["authentication", "crypto"],
    "tools": ["Read", "Grep", "Glob"],
    "expertise": ["security", "cryptography"]
  }
}
```

## 9. References

- [JSON Schema Draft 7](http://json-schema.org/draft-07/schema)
- [YAML 1.2 Specification](https://yaml.org/spec/1.2/spec.html)
- [Semantic Versioning](https://semver.org/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 10. Changelog

### v3.0.0 (2025-12-27)

**Breaking Changes:**

- Complete schema redesign
- Platform components architecture
- No backward compatibility with v2.x

**New Features:**

- Component-level granularity
- Platform-specific component types
- Component manifests with metadata
- Source and metadata objects
- Tool permissions and model selection
- Conditional rule patterns
- MCP configuration support
- Plugin system support

### v3.0.1 (2026-02-19)

**Specification clarifications:**

- Documented `kind` as the required canonical behavioral taxonomy field
- Clarified `category` as optional editorial grouping
- Added canonical retrieval metadata guidance for `specificityLayer`, `equivalenceOutcome`, and `curation.status`

### v3.0.2 (2026-03-03)

**Specification clarifications:**

- Updated Cursor `cursor-main` location guidance to canonical `.cursor/rules/index.mdc`
- Removed deprecated `.cursorrules` default location from canonical examples
