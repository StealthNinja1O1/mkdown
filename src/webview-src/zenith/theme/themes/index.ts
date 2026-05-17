import type { ZenithThemeConfig } from "../../types";

export const builtinThemes: Record<string, ZenithThemeConfig> = {
  "zenith-dark": {},
  "zenith-light": {},
};

export function isBuiltinTheme(name: string): name is keyof typeof builtinThemes {
  return name in builtinThemes;
}
