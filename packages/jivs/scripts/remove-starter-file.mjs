import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const generatedStarterFile = resolve(scriptDirectory, '../starter_code/create_JivsServices.ts');

await rm(generatedStarterFile, { force: true });