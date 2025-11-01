import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

let envLoaded = false;

function parseEnvLine(line) {
  const eqIndex = line.indexOf('=');
  if (eqIndex <= 0) {
    return null;
  }

  const key = line.slice(0, eqIndex).trim();
  if (!key) {
    return null;
  }

  let value = line.slice(eqIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function loadFromFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function loadEnv(envPath) {
  if (envLoaded) {
    return;
  }

  envLoaded = true;
  const resolvedPath = envPath ?? path.resolve(process.cwd(), '.env');
  loadFromFile(resolvedPath);
}

loadEnv();
