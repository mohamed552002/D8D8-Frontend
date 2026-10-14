---
name: Cloud Nine Gaming
colors:
  surface: '#f5faff'
  surface-dim: '#d6dbdf'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4f9'
  surface-container: '#eaeef3'
  surface-container-high: '#e4e9ee'
  surface-container-highest: '#dee3e8'
  on-surface: '#171c20'
  on-surface-variant: '#3e484f'
  inverse-surface: '#2c3135'
  inverse-on-surface: '#edf1f6'
  outline: '#6e7980'
  outline-variant: '#bdc8d1'
  surface-tint: '#00668a'
  primary: '#00668a'
  on-primary: '#ffffff'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#7bd0ff'
  secondary: '#006d36'
  on-secondary: '#ffffff'
  secondary-container: '#6dfe9c'
  on-secondary-container: '#007439'
  tertiary: '#a43073'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff8cc5'
  on-tertiary-container: '#811057'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#f5faff'
  on-background: '#171c20'
  surface-variant: '#dee3e8'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: auto
---

## Brand & Style

The design system is built for a lighthearted, social trivia experience. It prioritizes a sense of "airiness" and "softness" to reduce the friction of competition and maximize the joy of play. 

The aesthetic is a hybrid of **Modern Minimalism** and **Soft Glassmorphism**. It utilizes high-key backgrounds with translucent, frosted-glass overlays to create a sense of depth that feels like layers of clouds. The interface should feel optimistic, approachable, and effortless.

**Key Visual Principles:**
- **Weightlessness:** Elements should appear to float rather than sit heavily on the page.
- **Clarity:** High whitespace usage ensures focus remains on the trivia questions.
- **Friendliness:** Every corner is rounded, and every interaction is soft.

## Colors

The palette is inspired by a clear sky at midday. The primary Sky Blue drives the main actions, while the Mint Green serves as the "success" or "correct answer" indicator. 

- **Primary (#38BDF8):** Used for main CTAs, active states, and primary navigation.
- **Secondary (#4ADE80):** Used for positive feedback, point increases, and "Correct" states.
- **Accents:** Pink (#F472B6) and Orange (#FB923C) are used sparingly for timer warnings, special power-ups, or category badges to maintain a playful energy.
- **Surface (#F8FAFC):** The foundational canvas. It is a very cool, bright neutral that allows the vibrant accents to pop without feeling aggressive.
- **Text:** Use a deep slate (#1E293B) for headlines to ensure readability, and a softer slate (#64748B) for secondary metadata.

## Typography

The design system uses **Outfit** exclusively to maintain a modern, geometric, and friendly tone across all touchpoints. 

**RTL Support (Arabic):** 
Outfit supports a wide range of characters, but for Arabic scripts, ensure the `line-height` is increased by approximately 20% to prevent clipping of diacritics. The font-weight should remain consistent across languages to maintain the brand's visual "heaviness." Headlines should be center-aligned in game lobbies but right-aligned for long-form text in RTL locales.

## Layout & Spacing

This design system uses a **Fluid Grid** model with high horizontal padding to create a "contained" feel for the game board.

- **Mobile:** 4-column grid with 16px margins. Elements are mostly stacked vertically to accommodate thumb-reach.
- **Desktop:** 12-column grid with a max-width of 1200px. Content is centered with large "air" margins on the left and right to simulate a focus mode.
- **RTL Adjustments:** Grid columns and flex-box directions must flip 180 degrees. Progress bars should fill from right-to-left.

## Elevation & Depth

Instead of traditional heavy drop shadows, this design system uses **Soft Tonal Layers** and **Backdrop Blurs**.

1.  **Level 0 (Surface):** The #F8FAFC background.
2.  **Level 1 (Cards):** White surfaces with a very subtle 1px border (#E2E8F0). No shadow.
3.  **Level 2 (Modals/Overlays):** Semi-transparent white (rgba(255, 255, 255, 0.7)) with a `backdrop-filter: blur(12px)`. This creates the "Cloud" effect.
4.  **Level 3 (Active Elements):** A soft, diffused shadow using the primary color tint: `0 10px 15px -3px rgba(56, 189, 248, 0.2)`. This is reserved only for the currently selected answer or primary action button.

## Shapes

The design system utilizes **Pill-shaped** geometry for almost all interactive components.

- **Standard Buttons & Inputs:** 1rem (16px) radius, creating a friendly, "bouncy" appearance.
- **Large Cards/Modals:** 2rem (32px) radius.
- **Selection Indicators:** Use fully circular (pill) shapes for radio buttons and toggle switches.
- **Avatar Containers:** Always circular to reinforce the social, friendly nature of the game.

## Components

### Buttons
- **Primary:** Sky Blue background, white text. Bold weight. High-bounce hover effect (scale 1.05).
- **Secondary (Answers):** White background, 1px light blue border. On selection, the border thickens and turns Primary Sky Blue.

### Cards (Trivia Question)
Large, white containers with 32px padding. Ensure the question text is always `display-lg` to grab immediate attention.

### Chips (Category Tags)
Small, pill-shaped tags using low-opacity versions of the accent colors (e.g., light pink background with dark pink text) for easy categorization without clutter.

### Input Fields
Soft grey-blue borders that transition to Sky Blue on focus. Use "Outfit" at `body-lg` for comfortable typing on mobile.

### Game Timer
A circular progress ring using the Secondary Mint Green, transitioning to Accent Orange when less than 5 seconds remain.

### RTL Considerations
Ensure that icon-button pairings (e.g., "Back" arrow) flip the icon direction. The "Back" arrow points right in Arabic and left in English.