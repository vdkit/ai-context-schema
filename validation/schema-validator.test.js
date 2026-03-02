const { SchemaValidator } = require('./schema-validator');

describe('SchemaValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  test('should create validator instance', () => {
    expect(validator).toBeDefined();
    expect(validator.ajv).toBeDefined();
    expect(validator.validator).toBeDefined();
  });

  test('should parse valid schema content', () => {
    const content = `---
id: test-schema
title: Test Schema
description: A test schema
schemaVersion: 3.0
version: 1.0.0
kind: skill
category: technology
platforms:
  claude-code:
    compatible: true
---

# Test Schema
This is a test schema.`;

    const schema = validator.parseSchema(content);
    expect(schema.id).toBe('test-schema');
    expect(schema.title).toBe('Test Schema');
    expect(schema.version).toBe('1.0.0');
    expect(schema._content).toBe('# Test Schema\nThis is a test schema.');
  });

  test('should throw error for invalid YAML frontmatter', () => {
    const content = `---
invalid: yaml: content:
---

# Test Schema`;

    expect(() => validator.parseSchema(content)).toThrow();
  });

  test('should throw error for missing frontmatter', () => {
    const content = 'Just markdown content without frontmatter';

    expect(() => validator.parseSchema(content)).toThrow(
      'Invalid format: YAML frontmatter not found'
    );
  });
});
