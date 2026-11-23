---
name: Genda Booking System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cadbf6'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d2e4ff'
  on-surface: '#0a1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#203146'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#004f35'
  on-tertiary: '#ffffff'
  tertiary-container: '#006a48'
  on-tertiary-container: '#60eeb1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0a1c30'
  surface-variant: '#d2e4ff'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an airy, pristine, and modern mobile-first booking experience tailored for aesthetic specialists, barbershops, hair salons, nail techs, and lash artists. The aesthetic balances boutique service refinement with high-utility booking mechanics.

- **Brand Personality**: Clean, dependable, serene, and impeccably organized. It projects the hygiene, precision, and artistry that clients demand from beauty and personal care practitioners.
- **Target Audience**: Discerning clients booking aesthetic and grooming services from their smartphones, alongside modern beauty solo-practitioners and studio owners seeking an elevated, professional digital storefront.
- **Design Movement**: Soft Technical Minimalism. Relying on immaculate white space, gossamer-thin ice-blue division planes, generously rounded containers, and crisp royal blue focal points to keep conversion effortless and friction-free.

## Colors

The palette establishes an open, hygienic baseline using pure white and crystalline blue-tinted surfaces, anchoring critical interaction zones with authoritative deep royal and navy tones.

- **Primary (`#1D4ED8`)**: Royal Blue for high-intent interactive elements, selected states, primary action triggers, and active steps. Use `#1E40AF` for pressed and active feedback states.
- **Secondary / Headings (`#1E3A8A`)**: Deep Navy Blue for brand titles, service headers, prices, and critical confirmations. Ensures high contrast without the harshness of pure black.
- **Tertiary / Success (`#10B981`)**: Emerald Green for confirmed booking badges, open promotional slots, and availability statuses.
- **Surfaces**:
  - Canvas Base: `#FFFFFF` (Pure White)
  - Secondary Surface: `#F4F8FF` (Soft Ice Blue) for nested category trays, pill rails, and inactive slot backgrounds.
- **Borders & Dividers**: `#DBEAFE` for primary structural strokes and unselected interactive boundaries; `#BFDBFE` for distinct separations and input focus boundaries.
- **Neutral & Meta (`#5A6B82`)**: Slate Blue for durations, service summaries, inactive dates, helper guidance, and secondary labels.

## Typography

The typographic hierarchy utilizes `Plus Jakarta Sans` across all tiers to maintain a geometric yet friendly rhythm suited for mobile legibility.

- **Headlines**: Set tightly with negative letter-spacing for brand impact and section clarity. Mobile viewport overrides scale down title sizes to avoid aggressive word wrapping within cards.
- **Numerical Hierarchy**: Prices and durations utilize `headline-sm` and `label-md` with semi-bold weights to facilitate rapid scanning.
- **Labels & Micro-copy**: Duration badges and step trackers are kept upper-case or sentence-case with slight positive letter spacing for crystal-clear readability at compact sizes.

## Layout & Spacing

A mobile-first responsive layout architecture optimized for narrow portrait viewports with a maximum content constraint on wider screens.

- **Container Constraint**: Mobile views span full width with `1rem` edge margins. Desktop/Tablet viewports clamp to a central max-width of `480px` (or `680px` for multi-column summaries) to retain the single-hand tactile feel of a native booking app.
- **Spacing Rhythm**: Governed by multiples of `0.25rem` (4px baseline).
  - Compact element groupings (badge padding, chip interiors) utilize `space-xs` and `space-sm`.
  - Component internals (card padding, input insets) employ `space-md` (`1rem`).
  - Section-to-section flows (service list to calendar step) use `space-lg` to `space-xl`.
- **Viewport Safe-Zones**: Bottom scrolling padding accounts for the permanent fixed booking dock with an extra `5rem` bottom spacer on all scrollable screens.

## Elevation & Depth

Visual hierarchy uses delicate tonal layering and ambient sky-tinted diffusion rather than heavy dropshadows.

- **Flat Stratification**: The foundational tier is pure `#FFFFFF`. Grouped collections, calendar rails, and input trays rest on `#F4F8FF` (Soft Ice Blue).
- **Ambient Shadow System**:
  - `Elevation-1 (Cards & Chips)`: `0px 2px 8px -2px rgba(30, 58, 138, 0.04), 0px 1px 3px -1px rgba(30, 58, 138, 0.02)`. Tinted softly with navy to eliminate dirty gray shadows.
  - `Elevation-2 (Sticky Booking Bar & Floating Sheets)`: `0px -4px 20px -2px rgba(30, 58, 138, 0.06), 0px 2px 6px -1px rgba(30, 58, 138, 0.03)`. Gives the sticky bottom CTA an ethereal lift above flowing content.
- **Outlines & Glass Effects**: Borders using `#DBEAFE` reinforce edge clarity. Modals and floating navigation elements use an optional `backdrop-blur: 12px` combined with `rgba(255, 255, 255, 0.88)` fill.

## Shapes

The shape system employs generous, modern roundedness to reflect an inviting, friendly salon persona while maintaining structural discipline.

- **Base Radius (`0.5rem`)**: Applied to compact controls, time slot pills, and sub-badges.
- **Large Radius (`1rem` / `rounded-xl`)**: Applied to service cards, text input containers, and interactive option wrappers.
- **Extra Large Radius (`1.5rem` / `rounded-2xl`)**: Applied to major modal bottom sheets and step segment containers.
- **Pill Radius (`9999px`)**: Reserved for horizontal day pickers, category filter chips, and primary floating action buttons.

## Components

### Service Selector Cards
- **Structure**: Surface `#FFFFFF`, border `1px solid #DBEAFE`, padding `1rem`, radius `rounded-xl`.
- **Selected State**: Border shifts to `2px solid #1D4ED8`, subtle background glow `#F4F8FF`.
- **Badges**: Service duration and pricing sit in pill badges using `#F4F8FF` background, `#1E3A8A` text, and `0.25rem 0.625rem` padding.

### Day & Date Horizontal Scroller
- **Pills**: Compact vertical day cards (`width: 3.75rem`, `height: 4.75rem`), radius `rounded-xl` or full pill, border `1px solid #DBEAFE`.
- **Contents**: Day abbreviation (`body-sm`, `#5A6B82`) stacked above day number (`headline-sm`, `#1E3A8A`).
- **Selected**: Background `#1D4ED8`, text `#FFFFFF`, subtext `#DBEAFE`, elevation-1.

### Time Slot Grid
- **Pill Buttons**: 3 or 4-column fluid CSS grid. Height `2.75rem`, radius `rounded-lg`, border `1px solid #DBEAFE`, background `#FFFFFF`.
- **State Changes**:
  - `Hover/Focus`: Border `#1D4ED8`, text `#1D4ED8`.
  - `Selected`: Background `#1D4ED8`, text `#FFFFFF`, border-color `#1D4ED8`.
  - `Disabled/Booked`: Background `#F4F8FF`, border `1px dashed #DBEAFE`, text `#BFDBFE`, strike-through style.

### Progressive Step Indicators
- **Layout**: Horizontal chain consisting of numbered or segmented pills.
- **Active Step**: Filled `#1D4ED8` badge with high-contrast white text.
- **Completed Step**: Soft `#DBEAFE` fill with emerald `#10B981` check icon.
- **Connecting Track**: `2px` horizontal rule colored `#DBEAFE`.

### Inputs (Client Name & WhatsApp)
- **Container**: Border `1.5px solid #DBEAFE`, background `#F4F8FF` (transitions to `#FFFFFF` on active focus), radius `rounded-xl`, height `3.25rem`, padding `0 1rem`.
- **Typography**: Label `#5A6B82` floating or stacked, user text `#1E3A8A`.
- **Focus**: Border `#1D4ED8`, box-shadow `0 0 0 3px rgba(29, 78, 216, 0.12)`.

### Sticky Bottom Booking Dock
- **Bar Wrapper**: Fixed to screen bottom, background `rgba(255, 255, 255, 0.95)`, `backdrop-blur: 16px`, border-top `1px solid #DBEAFE`, padding `1rem 1rem calc(1rem + env(safe-area-inset-bottom))`.
- **Action Button**: Width `100%`, height `3.5rem`, background `#1D4ED8`, hover `#1E40AF`, radius `9999px` (pill), text `#FFFFFF` (`label-lg`), flex justify-between with cumulative price on the left and "Continue" with forward-arrow chevron on the right.