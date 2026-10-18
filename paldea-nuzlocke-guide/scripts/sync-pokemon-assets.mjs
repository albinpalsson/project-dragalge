import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetsDir } from '@project-dragalge/pokemon-data/assets-dir';

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const targetDir = path.resolve(appDir, 'public/assets');

await cp(assetsDir, targetDir, { recursive: true });
