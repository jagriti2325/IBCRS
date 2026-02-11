# Assets Directory

This directory contains all static assets for the IBCRS website.

## Files

### logo.svg
- **Purpose:** Website logo displayed in navigation and hero section
- **Format:** SVG (Scalable Vector Graphics)
- **Size:** Used at various sizes (auto-scaling)
- **Color:** Blue/Cyan gradient
- **Used in:** Navigation bar, branding

### favicon.svg
- **Purpose:** Website favicon shown in browser tab
- **Format:** SVG (Scalable Vector Graphics)
- **Size:** 64x64px
- **Color:** Blue theme
- **Used in:** Browser tab, bookmarks, history

## Usage

These assets are automatically referenced in `index.html`:

```html
<!-- Favicon -->
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">

<!-- Logo (can be used in navigation) -->
<img src="assets/logo.svg" alt="IBCRS Logo">
```

## Customization

To customize these assets:

1. **Edit logo.svg** - Open in any SVG editor (Inkscape, Adobe XD, etc.)
2. **Edit favicon.svg** - Keep aspect ratio 1:1
3. **Add new assets** - Create subdirectories as needed:
   - `images/` - PNG/JPG images
   - `icons/` - Icon files
   - `screenshots/` - Documentation screenshots

## Adding More Assets

### Example: Add a screenshot
```html
<img src="assets/images/screenshot-1.png" alt="Screenshot">
```

### Example: Add custom icon
```html
<i class="custom-icon"></i>
```

## Asset Organization

```
assets/
├── logo.svg                    # Main logo
├── favicon.svg                 # Browser favicon
├── images/                     # (Optional)
│   ├── screenshot-1.png
│   └── demo.gif
├── icons/                      # (Optional)
│   └── custom-icon.svg
└── screenshots/                # (Optional)
    └── demo.png
```

## SVG Guidelines

For professional SVGs:
- Use clean paths
- Include viewBox attribute
- Keep file size under 50KB
- Use consistent colors
- Test in multiple browsers

## Browser Support

- ✅ Chrome 85+
- ✅ Firefox 78+
- ✅ Safari 14+
- ✅ Edge 85+
- ⚠️ IE 11 (limited SVG support)

---

*IBCRS Assets Directory - All branding and media files*
