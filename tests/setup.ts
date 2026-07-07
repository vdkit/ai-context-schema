import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, vi } from 'vitest';

export async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'ai-context-schema-test-'));
}

export async function cleanupTempDir(directory: string): Promise<void> {
  await rm(directory, { recursive: true, force: true });
}

export async function createTestFile(
  directory: string,
  filename: string,
  content: string
): Promise<string> {
  const filePath = path.join(directory, filename);
  await writeFile(filePath, content, 'utf8');
  return filePath;
}

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
