import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA & Lighthouse TaskFlow Install System', () => {
  it('should have a valid public/manifest.json with Lighthouse TaskFlow branding and app icons', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifestContent.name).toBe('Lighthouse TaskFlow');
    expect(manifestContent.short_name).toBe('Lighthouse TaskFlow');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('should have Lighthouse Logo and PWA icons generated in public folder', () => {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'lighthouse-icon.png');
    const icon192 = path.join(process.cwd(), 'public', 'icons', 'icon-192.png');
    const icon512 = path.join(process.cwd(), 'public', 'icons', 'icon-512.png');
    const appleIcon = path.join(process.cwd(), 'public', 'icons', 'apple-touch-icon.png');

    expect(fs.existsSync(logoPath)).toBe(true);
    expect(fs.existsSync(icon192)).toBe(true);
    expect(fs.existsSync(icon512)).toBe(true);
    expect(fs.existsSync(appleIcon)).toBe(true);
  });
});
