function hexToOklchString(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length == 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const l = Math.max(r, g, b);
    const m = Math.min(r, g, b);
    let h, s;
    if (l === m) {
        h = s = 0;
    } else {
        const d = l - m;
        s = l > 0.5 ? d / (2 - l - m) : d / (l + m);
        switch (l) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    // Very rough approximation for now to avoid writing a full OKLCH converter in JS. 
    // Usually Tailwind provides nice hex -> oklch or we can just stick to hex in CSS variables if tailwind v4 supports it.
    // Let's just output the HEX for now.
    return hex;
}

const colors = {
    primary: '#0891B2',
    secondary: '#22D3EE',
    cta: '#22C55E',
    background: '#ECFEFF',
    text: '#164E63'
};
console.log(colors);
