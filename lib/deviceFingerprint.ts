/**
 * Client-side device fingerprint generator.
 * Produces a stable hash from browser + hardware properties so each
 * physical device gets a unique, reproducible identifier.
 *
 * This does NOT rely on any third-party service — it's computed locally.
 */

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('DeviceFingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('DeviceFingerprint', 4, 17);

    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return `${vendor}~${renderer}`;
  } catch {
    return 'webgl-error';
  }
}

export interface DeviceInfo {
  fingerprint: string;
  browser: string;
  os: string;
  screenResolution: string;
  language: string;
  timezone: string;
  registeredAt?: string;
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

export type FingerprintResult =
  | { available: true; info: DeviceInfo }
  | { available: false; reason: string };

export async function generateDeviceFingerprint(): Promise<FingerprintResult> {
  // Check hard requirements before attempting
  if (typeof window === 'undefined') {
    return { available: false, reason: 'Not a browser environment' };
  }
  if (!window.crypto?.subtle) {
    return { available: false, reason: 'Browser does not support Web Crypto API' };
  }

  try {
    const components = [
      // Hardware & screen
      `${screen.width}x${screen.height}`,
      `${screen.colorDepth}`,
      navigator.hardwareConcurrency?.toString() || 'unknown',
      (navigator as any).deviceMemory?.toString() || 'unknown',

      // Browser
      navigator.userAgent,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.maxTouchPoints?.toString() || '0',
      navigator.platform || 'unknown',

      // Canvas
      getCanvasFingerprint(),

      // WebGL
      getWebGLFingerprint(),

      // Plugins count (stability factor)
      navigator.plugins?.length?.toString() || '0',
    ];

    const raw = components.join('|||');
    const fingerprint = await sha256(raw);

    return {
      available: true,
      info: {
        fingerprint,
        browser: detectBrowser(),
        os: detectOS(),
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  } catch (err: any) {
    return { available: false, reason: err?.message || 'Fingerprint generation failed' };
  }
}
