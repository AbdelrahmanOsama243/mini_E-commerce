---
name: Nocturnal Bauhaus
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e7bdb7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ad8883'
  outline-variant: '#5d3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#ff5545'
  on-primary-container: '#5c0002'
  inverse-primary: '#c0000a'
  secondary: '#adc6ff'
  on-secondary: '#002e69'
  secondary-container: '#4b8eff'
  on-secondary-container: '#00285c'
  tertiary: '#f1c100'
  on-tertiary: '#3d2f00'
  tertiary-container: '#d0a600'
  on-tertiary-container: '#4f3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930005'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#ffe08b'
  tertiary-fixed-dim: '#f1c100'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  mono-label:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
This design system is a contemporary, dark-mode evolution of the Bauhaus movement, filtered through a Neo-Brutalist lens. It targets technical audiences, creative professionals, and those seeking a high-signal, low-noise interface. The aesthetic is characterized by structural honesty, geometric precision, and a rejection of decorative flourishes. 

The emotional response should be one of intellectual clarity and rhythmic order. By utilizing a deep charcoal canvas, the design system emphasizes functional hierarchy through heavy outlines, stark color blocking, and a rigid adherence to the grid. It is an unapologetically digital environment that feels engineered rather than decorated.

## Colors
The palette is rooted in the Bauhaus primary triad: **Cadmium Red**, **Ultramarine Blue**, and **Golden Yellow**. In this dark-mode execution, these colors serve as high-visibility functional signals against a near-black (#121212) foundation.

- **Background:** The primary canvas is #121212. 
- **Surface Containers:** Use #1E1E1E for cards and elevated sections to provide subtle depth without relying on shadows.
- **Accents:** Red is reserved for critical actions/errors, Blue for primary interactions, and Yellow for warnings or highlighted data points.
- **Outlines:** All structural boundaries use a high-contrast white or off-white border to maintain the Neo-Brutalist "thick ink" aesthetic in a digital dark space.

## Typography
**Space Grotesk** is used across all levels to reinforce the technical, geometric nature of the design system. 

- **Headlines:** Should be set with tight leading and slight negative letter-spacing to create a "blocky" impact.
- **Body Text:** Maintains generous line height for legibility against the dark background.
- **Labels:** Utilize uppercase styling and increased letter-spacing to mimic architectural blueprints.
- **Hierarchy:** Contrast is achieved through drastic weight shifts (Bold vs. Light) rather than just size changes.

## Layout & Spacing
The layout follows a strict **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Grid Logic:** Elements must snap to the grid. Gutters are kept at a constant 24px to ensure the white borders of adjacent containers do not touch, maintaining a "channeled" look.
- **Rhythm:** All margins and paddings are multiples of the 8px base unit. 
- **Alignment:** Use hard vertical and horizontal lines to separate content sections. Avoid soft transitions; favor "boxy" layouts where the skeleton of the UI is visible.

## Elevation & Depth
In this design system, depth is purely structural, not atmospheric. 
- **No Shadows:** Traditional box-shadows are strictly forbidden. 
- **Outlines:** Use 2px solid white (#FFFFFF) borders for primary elements and 1px borders for secondary elements to define boundaries.
- **Stark Layering:** Elevation is communicated by shifting the background color from #121212 (Level 0) to #1E1E1E (Level 1). 
- **Hard Offsets:** For an "active" state, elements can use a "hard shadow" effect—a solid color block (Primary Blue or Red) offset by 4px or 8px behind the main container, creating a faux-3D geometric effect.

## Shapes
The shape language is strictly **geometric and sharp**. 
- **Corners:** All corners are 0px (Sharp). This reinforces the industrial, grid-based philosophy of the Bauhaus.
- **Geometry:** Use circles only for specific functional icons or avatars to provide a singular point of organic contrast against the pervasive rectangularity.
- **Dividers:** Use 1px or 2px solid lines for all separators.

## Components
- **Buttons:** Rectangular with a 2px white border. Primary buttons use a solid Primary Blue fill with white text. Hover states shift the background to Primary Yellow with black text.
- **Input Fields:** Black background with a 1px white border. On focus, the border weight increases to 2px and changes to Primary Blue.
- **Cards:** Use the #1E1E1E surface color with a 2px white border. Section headers within cards should be separated by a 1px horizontal rule.
- **Chips/Labels:** Small rectangular blocks with a solid Primary Red or Yellow fill and black text for maximum contrast.
- **Lists:** Items are separated by solid 1px white lines. Interactive list items should have a Primary Blue background on hover.
- **Checkboxes:** Square (0px radius) with a 2px border. When checked, the interior is filled with a solid Primary Blue block.