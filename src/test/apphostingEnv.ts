import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Shared reader for the apphosting*.yaml guard tests (MCA-44).

export type EnvEntry = { variable: string; value?: string; secret?: string; availability?: string }

export function readApphostingFile(file: string): string {
  return readFileSync(fileURLToPath(new URL(`../../${file}`, import.meta.url)), 'utf8')
}

// Minimal reader for the `env:` list shape App Hosting uses. A real YAML parser
// is only a transitive dependency here, so this avoids relying on it.
export function readEnv(file: string): EnvEntry[] {
  const entries: EnvEntry[] = []
  for (const line of readApphostingFile(file).split('\n')) {
    const variable = line.match(/^\s*-\s*variable:\s*(\S+)/)
    if (variable) {
      entries.push({ variable: variable[1] })
      continue
    }
    const field = line.match(/^\s+(value|secret|availability):\s*(.*?)\s*$/)
    if (field && entries.length > 0) {
      const key = field[1] as 'value' | 'secret' | 'availability'
      entries[entries.length - 1][key] = field[2].replace(/^"(.*)"$/, '$1')
    }
  }
  return entries
}
