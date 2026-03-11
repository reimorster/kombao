type AccentTokens = {
  bg: string;
  bgStrong: string;
  panel: string;
  panelStrong: string;
  border: string;
  shadow: string;
  accent: string;
  accentSoft: string;
  accentContrast: string;
  accentGlow: string;
  accentWash: string;
};

function normalizeHex(hex: string) {
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : "#305252";
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) };
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }

  return {
    h: Math.round(hue * 60),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function channelLuminance(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getContrastColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance =
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b);
  return luminance > 0.45 ? "#1b1916" : "#fffdf8";
}

function hsla(h: number, s: number, l: number, alpha: number) {
  return `hsla(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}% / ${alpha})`;
}

export function deriveAccentTokens(hex: string, isDark: boolean): AccentTokens {
  const accent = normalizeHex(hex);
  const { h, s, l } = rgbToHsl(hexToRgb(accent));
  const tunedSaturation = Math.max(28, Math.min(72, s));
  const tunedLightness = Math.max(34, Math.min(62, l));

  if (isDark) {
    return {
      bg: hsla(h, Math.max(18, tunedSaturation - 26), 10, 1),
      bgStrong: hsla(h, Math.max(16, tunedSaturation - 22), 16, 1),
      panel: hsla(h, Math.max(10, tunedSaturation - 30), 13, 0.84),
      panelStrong: hsla(h, Math.max(12, tunedSaturation - 26), 16, 0.96),
      border: hsla(h, Math.max(16, tunedSaturation - 18), 78, 0.12),
      shadow: `0 24px 70px ${hsla(h, Math.max(24, tunedSaturation), 4, 0.42)}`,
      accent,
      accentSoft: hsla(h, tunedSaturation, Math.min(70, tunedLightness + 8), 0.18),
      accentContrast: getContrastColor(accent),
      accentGlow: hsla(h, Math.min(88, tunedSaturation + 12), Math.min(72, tunedLightness + 14), 0.26),
      accentWash: hsla(h, Math.max(20, tunedSaturation - 14), Math.min(60, tunedLightness + 8), 0.16),
    };
  }

  return {
    bg: hsla(h, Math.max(18, tunedSaturation - 24), 92, 1),
    bgStrong: hsla(h, Math.max(20, tunedSaturation - 18), 82, 1),
    panel: hsla(h, Math.max(16, tunedSaturation - 28), 97, 0.84),
    panelStrong: hsla(h, Math.max(14, tunedSaturation - 24), 99, 0.96),
    border: hsla(h, Math.max(18, tunedSaturation - 14), 24, 0.16),
    shadow: `0 22px 55px ${hsla(h, Math.max(22, tunedSaturation - 6), 22, 0.14)}`,
    accent,
    accentSoft: hsla(h, tunedSaturation, tunedLightness, 0.16),
    accentContrast: getContrastColor(accent),
    accentGlow: hsla(h, Math.min(88, tunedSaturation + 10), Math.min(78, tunedLightness + 12), 0.28),
    accentWash: hsla(h, Math.max(22, tunedSaturation - 8), Math.min(88, tunedLightness + 22), 0.24),
  };
}
