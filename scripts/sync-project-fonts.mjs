import { mkdir, writeFile } from 'node:fs/promises';

// Keep these strings in sync with the card names and CSS text transforms.
const fonts = [
  { id: 'domarrow', family: 'Crimson Pro', text: 'DoMarrow', directory: 'crimsonpro' },
  { id: 'marrowtalk', family: 'Archivo', text: 'MarrowTalk', directory: 'archivo' },
  { id: 'vibe-translate', family: 'IBM Plex Sans', text: 'Vibe Translate', directory: 'ibmplexsans' },
  { id: 'ashen-omega', family: 'Cinzel', text: 'ASHEN OMEGA', directory: 'cinzel' },
];

const output = new URL('../src/assets/fonts/projects/', import.meta.url);
const licenses = new URL('../public/fonts/licenses/', import.meta.url);
await mkdir(output, { recursive: true });
await mkdir(licenses, { recursive: true });

async function read(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response;
}

for (const font of fonts) {
  const query = new URLSearchParams({
    family: `${font.family}:wght@600`,
    text: font.text,
    display: 'swap',
  });
  const css = await (await read(`https://fonts.googleapis.com/css2?${query}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
  })).text();
  const match = css.match(/url\((https:\/\/[^)]+)\) format\('woff2'\)/);
  if (!match) throw new Error(`No WOFF2 subset returned for ${font.family}`);
  const bytes = new Uint8Array(await (await read(match[1])).arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== 'wOF2') {
    throw new Error(`Invalid WOFF2 response for ${font.family}`);
  }
  const license = await (await read(`https://raw.githubusercontent.com/google/fonts/main/ofl/${font.directory}/OFL.txt`)).text();
  await writeFile(new URL(`${font.id}.woff2`, output), bytes);
  await writeFile(new URL(`${font.id}-OFL.txt`, licenses), license);
  console.log(`${font.family} 600: ${font.text} (${bytes.length} bytes)`);
}
