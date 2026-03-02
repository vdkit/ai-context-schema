/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Extend Jest matchers
expect.extend({
  toBeValidSchema(received) {
    const { SchemaValidator } = require('../validation/schema-validator');
    const validator = new SchemaValidator();

    try {
      const result = validator.validateSchema(received, 'test-schema');
      return {
        message: () =>
          result.valid
            ? 'Expected schema to be invalid'
            : `Expected schema to be valid, but got errors: ${result.errors.map((e) => e.message).join(', ')}`,
        pass: result.valid
      };
    } catch (error) {
      return {
        message: () => `Schema validation failed: ${error.message}`,
        pass: false
      };
    }
  },

  toHavePlatformSupport(received, platform) {
    const platforms = received.platforms || {};
    const hasSupport = platforms[platform]?.compatible === true;

    return {
      message: () =>
        hasSupport
          ? `Expected schema not to support platform "${platform}"`
          : `Expected schema to support platform "${platform}"`,
      pass: hasSupport
    };
  },

  toMatchSchemaVersion(received, version) {
    const schemaVersion = received.schemaVersion;

    return {
      message: () =>
        schemaVersion === version
          ? `Expected schema version not to be "${version}"`
          : `Expected schema version to be "${version}", got "${schemaVersion}"`,
      pass: schemaVersion === version
    };
  }
});

// Global test utilities
global.createTestSchema = (overrides = {}) => ({
  schemaVersion: '3.0',
  id: 'test-schema',
  title: 'Test Schema',
  description: 'A test schema for unit testing',
  version: '1.0.0',
  kind: 'skill',
  category: 'technology',
  platforms: {
    'claude-code': { compatible: true, memory: true },
    cursor: { compatible: true, activation: 'auto-attached', globs: ['**/*.test.js'] }
  },
  tags: ['test'],
  author: 'test',
  _content: '# Test Schema\n\nThis is a test schema.',
  ...overrides
});

global.createInvalidSchema = (invalidFields = {}) => ({
  // Missing required fields intentionally
  ...invalidFields
});

// Mock console methods in tests to reduce noise
const originalConsole = { ...console };

global.mockConsole = () => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
};

global.restoreConsole = () => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
};

// Test data helpers
global.testSchemas = {
  minimal: {
    schemaVersion: '3.0',
    id: 'minimal-test',
    title: 'Minimal Test Schema',
    description: 'A minimal schema for testing',
    version: '1.0.0',
    kind: 'skill',
    category: 'technology',
    platforms: {
      'claude-code': { compatible: true }
    }
  },

  complex: {
    schemaVersion: '3.0',
    id: 'complex-test',
    title: 'Complex Test Schema',
    description: 'A complex schema with all features for testing',
    version: '2.1.0',
    kind: 'skill',
    category: 'technology',
    subcategory: 'framework',
    framework: 'test-framework',
    language: 'typescript',
    complexity: 'complex',
    scope: 'project',
    audience: 'developer',
    maturity: 'stable',
    platforms: {
      'claude-code': {
        compatible: true,
        memory: true,
        command: true,
        namespace: 'project',
        priority: 8
      },
      cursor: {
        compatible: true,
        activation: 'auto-attached',
        globs: ['**/*.ts', '**/*.tsx'],
        priority: 'high'
      },
      windsurf: {
        compatible: true,
        mode: 'workspace',
        xmlTag: 'test-context',
        characterLimit: 4000
      },
      'github-copilot': {
        compatible: true,
        priority: 9,
        reviewType: 'code-quality'
      }
    },
    requires: ['typescript-base'],
    suggests: ['testing-patterns'],
    conflicts: ['javascript-patterns'],
    tags: ['test', 'typescript', 'complex'],
    author: 'test-author',
    contributors: ['contributor1', 'contributor2']
  },

  invalid: {
    // Missing required fields
    title: 'Invalid Schema',
    description: 'This schema is missing required fields'
  }
};

// Platform test helpers
global.testPlatforms = {
  claudeCode: {
    compatible: true,
    memory: true,
    command: true,
    namespace: 'project',
    priority: 8,
    allowedTools: ['web_search'],
    mcpIntegration: false
  },

  cursor: {
    compatible: true,
    activation: 'auto-attached',
    globs: ['**/*.ts', '**/*.js'],
    priority: 'high',
    fileTypes: ['typescript', 'javascript']
  },

  windsurf: {
    compatible: true,
    mode: 'workspace',
    xmlTag: 'test-context',
    characterLimit: 5000,
    priority: 7
  },

  githubCopilot: {
    compatible: true,
    priority: 8,
    reviewType: 'code-quality',
    scope: 'repository'
  }
};

// Async test helpers
global.waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

global.expectAsync = async (asyncFn) => {
  try {
    const result = await asyncFn();
    return expect(result);
  } catch (error) {
    return expect(() => {
      throw error;
    });
  }
};

// File system test helpers (for testing file operations)
const fs = require('fs');
const path = require('path');
const os = require('os');

global.createTempDir = () => {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-schema-test-'));
};

global.cleanupTempDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

global.createTestFile = (dir, filename, content) => {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
};

// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in tests, but log the error
});

// Cleanup after all tests
afterAll(() => {
  // Restore console
  global.restoreConsole();

  // Clean up any global state
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
