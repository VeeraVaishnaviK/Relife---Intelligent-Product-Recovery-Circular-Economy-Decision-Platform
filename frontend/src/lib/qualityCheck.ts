/**
 * Lightweight client-side image quality check:
 * 1. Mean luminance (brightness) check to detect dark / underlit captures.
 * 2. Laplacian pixel-variance check to detect handheld motion blur.
 */

export interface QualityCheckResult {
  passed: boolean;
  blurScore: number;
  brightness: number;
  message: string;
  isBlurry: boolean;
  isDark: boolean;
  isOverexposed: boolean;
}

const BLUR_THRESHOLD = 85.0; // Variance threshold (under 85 is blurry)
const MIN_BRIGHTNESS = 42.0; // Under 42 is too dark
const MAX_BRIGHTNESS = 235.0; // Over 235 is overexposed / glare

export function evaluateImageQuality(canvas: HTMLCanvasElement): QualityCheckResult {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      passed: true,
      blurScore: 120.0,
      brightness: 128.0,
      message: 'Quality check bypassed (context unavailable)',
      isBlurry: false,
      isDark: false,
      isOverexposed: false,
    };
  }

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Convert to grayscale & compute mean luminance
  const gray = new Float32Array(width * height);
  let totalLuminance = 0;

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // Standard perceptual ITU-R BT.601 weights
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[j] = lum;
    totalLuminance += lum;
  }

  const brightness = totalLuminance / (width * height);
  const isDark = brightness < MIN_BRIGHTNESS;
  const isOverexposed = brightness > MAX_BRIGHTNESS;

  // Discrete Laplacian 3x3 kernel:
  // [ 0,  1, 0]
  // [ 1, -4, 1]
  // [ 0,  1, 0]
  let lapSum = 0;
  let lapSumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 2) {
    // Step by 2 for speed
    const row = y * width;
    for (let x = 1; x < width - 1; x += 2) {
      const idx = row + x;
      const center = gray[idx];
      const lap =
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - width] +
        gray[idx + width] -
        4 * center;

      lapSum += lap;
      lapSumSq += lap * lap;
      count++;
    }
  }

  const meanLap = count > 0 ? lapSum / count : 0;
  const blurScore = count > 0 ? lapSumSq / count - meanLap * meanLap : 120.0;
  const isBlurry = blurScore < BLUR_THRESHOLD;

  const passed = !isBlurry && !isDark && !isOverexposed;

  let message = 'Image quality passed (Sharp & Well-lit)';
  if (isBlurry && isDark) {
    message = 'Image is too blurry and lighting is too dark. Please hold steady with better light.';
  } else if (isBlurry) {
    message = `Image is blurry (Sharpness: ${Math.round(blurScore)} / 100 min). Please hold camera steady.`;
  } else if (isDark) {
    message = `Environment is too dark (Luminance: ${Math.round(brightness)}). Please illuminate the product.`;
  } else if (isOverexposed) {
    message = 'Excessive glare or overexposure detected. Adjust angle away from direct reflection.';
  }

  return {
    passed,
    blurScore: Math.round(blurScore * 10) / 10,
    brightness: Math.round(brightness * 10) / 10,
    message,
    isBlurry,
    isDark,
    isOverexposed,
  };
}
