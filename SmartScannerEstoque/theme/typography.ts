export const Typography = {
  sizes: {
    xs: 11,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 22,
    title: 28,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: 'bold' as const,
  },
  families: {
    regular: undefined,
    monospace: 'monospace',
  },
} as const;
