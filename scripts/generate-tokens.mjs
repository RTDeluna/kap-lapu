#!/usr/bin/env node
// Generates src/theme/tokens.ts from design/tokens.json.
// Run with `npm run gen:tokens` whenever design/tokens.json changes.
// Aliases like "{surface-sunk}" are resolved against the same theme.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(root, 'design/tokens.json');
const output = resolve(root, 'src/theme/tokens.ts');

const json = JSON.parse(readFileSync(input, 'utf8'));

const camel = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const px = (value) => {
  const n = Number.parseFloat(String(value));
  if (Number.isNaN(n)) throw new Error(`Not a px value: ${value}`);
  return n;
};

// Colors, with {alias} resolution per theme.
const themeIds = json.color.themes.map((t) => t.id);
const rawColors = Object.fromEntries(json.color.tokens.map((t) => [t.name, t.value]));

function resolveColor(name, theme, seen = []) {
  if (seen.includes(name)) throw new Error(`Alias cycle: ${[...seen, name].join(' -> ')}`);
  const token = rawColors[name];
  if (!token) throw new Error(`Unknown color token: ${name}`);
  const value = token[theme];
  if (value === undefined) throw new Error(`Token ${name} has no ${theme} value`);
  const alias = /^\{([a-z0-9-]+)\}$/.exec(value);
  return alias ? resolveColor(alias[1], theme, [...seen, name]) : value;
}

const colors = Object.fromEntries(
  themeIds.map((theme) => [
    theme,
    Object.fromEntries(Object.keys(rawColors).map((n) => [camel(n), resolveColor(n, theme)])),
  ]),
);

// Type styles.
const typography = {};
for (const group of json.type.groups) {
  for (const s of group.styles) {
    typography[camel(s.name)] = {
      family: group.family,
      fontSize: px(s.fontSize),
      lineHeight: px(s.lineHeight),
      fontWeight: Number(s.fontWeight),
      letterSpacing: s.letterSpacing ? px(s.letterSpacing) : 0,
    };
  }
}

const strip = (name, prefix) => camel(name.replace(new RegExp(`^${prefix}-`), ''));
const spacing = Object.fromEntries(json.spacing.tokens.map((t) => [strip(t.name, 'space'), px(t.value)]));
const radius = Object.fromEntries(json.radius.tokens.map((t) => [strip(t.name, 'radius'), px(t.value)]));
const size = Object.fromEntries(json.size.tokens.map((t) => [camel(t.name), px(t.value)]));
const shadow = Object.fromEntries(
  themeIds.map((theme) => [
    theme,
    Object.fromEntries(json.shadow.tokens.map((t) => [strip(t.name, 'shadow'), t.value[theme]])),
  ]),
);

const banner = `// GENERATED FILE. Do not edit by hand.
// Source: design/tokens.json (version ${json.version}). Regenerate with \`npm run gen:tokens\`.
`;

const body = `${banner}
export const themeIds = ${JSON.stringify(themeIds)} as const;
export type ThemeId = (typeof themeIds)[number];

export const colors = ${JSON.stringify(colors, null, 2)} as const;
export type ColorName = keyof (typeof colors)['light'];

export const typography = ${JSON.stringify(typography, null, 2)} as const;
export type TypeStyleName = keyof typeof typography;

export const spacing = ${JSON.stringify(spacing, null, 2)} as const;

export const radius = ${JSON.stringify(radius, null, 2)} as const;

export const size = ${JSON.stringify(size, null, 2)} as const;

/** CSS box-shadow strings, usable with React Native's \`boxShadow\` style. */
export const shadow = ${JSON.stringify(shadow, null, 2)} as const;
`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, body);
console.log(`Wrote ${output.replace(root + '/', '')}`);
