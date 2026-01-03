/**
 * Color utilities for handling brightness and contrast.
 */

/**
 * Calculates the contrasting text color (black or white) for a given hex background color.
 * Uses the relative luminance formula for WCAG accessibility.
 */
export function getContrastColor(hexColor: string): string {
    if (!hexColor) return '#ffffff';

    // Remove # if present
    const hex = hexColor.replace('#', '');

    let r, g, b;

    // Handle short hex (#RGB)
    if (hex.length === 3) {
        const r1 = hex.substring(0, 1);
        const g1 = hex.substring(1, 2);
        const b1 = hex.substring(2, 3);
        r = parseInt(r1 + r1, 16);
        g = parseInt(g1 + g1, 16);
        b = parseInt(b1 + b1, 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        // Fallback for invalid hex
        return '#ffffff';
    }

    // Calculate relative luminance
    // Using simple formula as per user's existing logic in card-badge.tsx
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
}
