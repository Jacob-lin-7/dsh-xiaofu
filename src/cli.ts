#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import {
  MAX_ZIP_BYTES,
  PackError,
  readZip,
  validatePackFiles,
} from './host/packs.js';

const args = process.argv.slice(2);
const json = args.includes('--json');
const target = args.find((item) => !item.startsWith('--'));

function fail(error: unknown): never {
  const code = error instanceof PackError ? error.code : 'ERROR';
  const message = error instanceof Error ? error.message : String(error);
  if (json) {
    console.log(JSON.stringify({ ok: false, code, message }, null, 2));
  } else {
    console.error(`FAIL [${code}] ${message}`);
  }
  process.exit(1);
}

async function readDirectory(root: string, current = root, files = new Map<string, Buffer>()) {
  const items = await readdir(current, { withFileTypes: true });
  for (const item of items) {
    const full = join(current, item.name);
    if (item.isDirectory()) {
      await readDirectory(root, full, files);
    } else if (item.isFile()) {
      const name = relative(root, full).split(sep).join('/');
      files.set(name, await readFile(full));
    }
  }
  return files;
}

async function main(): Promise<void> {
  if (!target) {
    console.error('用法: dsh-xiaofu validate <pack.zip|目录> [--json]');
    process.exit(2);
  }

  let files: Map<string, Buffer>;
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      files = await readDirectory(target);
    } else {
      if (info.size > MAX_ZIP_BYTES) {
        throw new PackError('TOO_LARGE', `压缩包超过 ${MAX_ZIP_BYTES / 1024 / 1024}MB`, 413);
      }
      files = await readZip(await readFile(target));
    }
  } catch (error) {
    fail(error);
    return;
  }

  let result: ReturnType<typeof validatePackFiles>;
  try {
    result = validatePackFiles(files);
  } catch (error) {
    fail(error);
    return;
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          id: result.manifest.id,
          name: result.manifest.name,
          version: result.manifest.version,
          files: result.files,
          manifest: result.manifest,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    `OK ${result.manifest.id} · ${result.manifest.name} v${result.manifest.version} · ${result.files.length} 个文件`,
  );
  for (const file of result.files) {
    console.log(`  ${file}`);
  }
}

void main();
