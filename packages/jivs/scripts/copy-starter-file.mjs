import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const source = resolve(scriptDirectory, '../../../starter_code/create_JivsServices.ts');
const destination = resolve(scriptDirectory, '../starter_code/create_JivsServices.ts');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);