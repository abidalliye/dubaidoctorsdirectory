import { mkdir, readdir, copyFile, cp, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

// Publish only website assets. Repository files, credentials and dashboard
// fixture records (users, patients, appointments, reviews) stay outside the site.
const output = resolve('dist/site');
await mkdir(output, { recursive: true });
for (const entry of await readdir('.', { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    await copyFile(entry.name, resolve(output, entry.name));
  }
}
for (const directory of ['css', 'js', 'Images']) {
  await cp(directory, resolve(output, directory), { recursive: true });
}
await mkdir(resolve(output, '_data'), { recursive: true });
for (const file of ['doctors.json', 'clinics.json', 'blogs.json', 'dha_services.json', 'specialists.json']) {
  await copyFile(resolve('_data', file), resolve(output, '_data', file));
}
const home = await readFile(resolve(output, 'index.html'), 'utf8');
if (!home.includes('Find Doctor Dubai')) throw new Error('Original homepage missing');
for (const file of (await readdir(output)).filter(file => file.endsWith('.html'))) {
  const html = await readFile(resolve(output,file),'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (match[2].trim() && !match[1].includes('application/ld+json')) new Script(match[2], {filename:file});
  }
}
console.log('Built original Find Doctor Dubai website and NestJS API.');
