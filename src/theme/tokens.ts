// GENERATED FILE. Do not edit by hand.
// Source: design/tokens.json (version 1). Regenerate with `npm run gen:tokens`.

export const themeIds = ["light","dark"] as const;
export type ThemeId = (typeof themeIds)[number];

export const colors = {
  "light": {
    "surface": "#fbf6ec",
    "surfaceRaised": "#ffffff",
    "surfaceSunk": "#f2e9d8",
    "line": "#e3d7c3",
    "lineStrong": "#8c7e68",
    "ink": "#10303a",
    "inkMuted": "#56676a",
    "mango": "#f5a524",
    "mangoSoft": "#fdebc8",
    "mangoInk": "#8f5300",
    "onMango": "#10303a",
    "dagat": "#0b6b75",
    "dagatSoft": "#d6edec",
    "onDagat": "#ffffff",
    "lapu": "#e4573d",
    "lapuSoft": "#fbddd4",
    "lapuInk": "#b33a22",
    "onLapu": "#ffffff",
    "danger": "#b42318",
    "dangerSoft": "#fde4e1",
    "mapWater": "#bfe1e0",
    "mapLand": "#f2e9d8",
    "focusRing": "#0b6b75",
    "mascotOutline": "#10303a",
    "mascotEye": "#ffffff"
  },
  "dark": {
    "surface": "#0b1f26",
    "surfaceRaised": "#12303a",
    "surfaceSunk": "#08181e",
    "line": "#1f4652",
    "lineStrong": "#6a8f97",
    "ink": "#f4efe4",
    "inkMuted": "#a9babc",
    "mango": "#ffb534",
    "mangoSoft": "#3a2a0b",
    "mangoInk": "#ffc65c",
    "onMango": "#0b1f26",
    "dagat": "#4cc3c8",
    "dagatSoft": "#0d3a40",
    "onDagat": "#0b1f26",
    "lapu": "#ff7a5c",
    "lapuSoft": "#45201a",
    "lapuInk": "#ff9a80",
    "onLapu": "#0b1f26",
    "danger": "#ff8a80",
    "dangerSoft": "#3d1512",
    "mapWater": "#0f3640",
    "mapLand": "#08181e",
    "focusRing": "#4cc3c8",
    "mascotOutline": "#10303a",
    "mascotEye": "#ffffff"
  }
} as const;
export type ColorName = keyof (typeof colors)['light'];

export const typography = {
  "display": {
    "family": "display",
    "fontSize": 34,
    "lineHeight": 38,
    "fontWeight": 800,
    "letterSpacing": -0.5
  },
  "titleLg": {
    "family": "display",
    "fontSize": 26,
    "lineHeight": 30,
    "fontWeight": 800,
    "letterSpacing": -0.3
  },
  "title": {
    "family": "display",
    "fontSize": 20,
    "lineHeight": 26,
    "fontWeight": 700,
    "letterSpacing": 0
  },
  "headline": {
    "family": "sans",
    "fontSize": 17,
    "lineHeight": 22,
    "fontWeight": 700,
    "letterSpacing": 0
  },
  "body": {
    "family": "sans",
    "fontSize": 16,
    "lineHeight": 24,
    "fontWeight": 400,
    "letterSpacing": 0
  },
  "bodyStrong": {
    "family": "sans",
    "fontSize": 16,
    "lineHeight": 24,
    "fontWeight": 600,
    "letterSpacing": 0
  },
  "bodySm": {
    "family": "sans",
    "fontSize": 14,
    "lineHeight": 20,
    "fontWeight": 400,
    "letterSpacing": 0
  },
  "label": {
    "family": "sans",
    "fontSize": 13,
    "lineHeight": 16,
    "fontWeight": 600,
    "letterSpacing": 0.2
  },
  "caption": {
    "family": "sans",
    "fontSize": 12,
    "lineHeight": 16,
    "fontWeight": 400,
    "letterSpacing": 0
  }
} as const;
export type TypeStyleName = keyof typeof typography;

export const spacing = {
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32
} as const;

export const radius = {
  "sm": 8,
  "md": 14,
  "lg": 22,
  "pill": 999
} as const;

export const size = {
  "tapMin": 48,
  "pin": 36
} as const;

/** CSS box-shadow strings, usable with React Native's `boxShadow` style. */
export const shadow = {
  "light": {
    "card": "0 1px 2px rgba(16,48,58,0.08), 0 6px 16px rgba(16,48,58,0.08)",
    "sheet": "0 -8px 24px rgba(16,48,58,0.12)"
  },
  "dark": {
    "card": "0 1px 2px rgba(0,0,0,0.4), 0 6px 16px rgba(0,0,0,0.35)",
    "sheet": "0 -8px 24px rgba(0,0,0,0.5)"
  }
} as const;
