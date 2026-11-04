import { copyFile, cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(join(root, 'lib'), { recursive: true });
await copyFile(join(root, 'src/client/index.js'), join(root, 'lib/client.js'));
await cp(join(root, 'src/desktop-helper'), join(root, 'lib/desktop-helper'), {
  recursive: true,
});
console.log('dsh-hex-pet: client + desktop helper copied to lib/');
