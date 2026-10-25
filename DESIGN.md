---
name: tiwhub
description: Clear, connected learning and family operations for Thai tutoring centers.
colors:
  oasis-blue: "#2563EB"
  oasis-navy: "#17335C"
  oasis-cyan: "#06B6D4"
  oasis-white: "#FFFFFF"
  oasis-canvas: "#F4F8FC"
  oasis-surface-soft: "#EAF2FB"
  oasis-line: "#D8E4F1"
  oasis-body: "#52657D"
  oasis-success: "#16815D"
  oasis-warning: "#A86B00"
  oasis-danger: "#C23A48"
typography:
  display:
    fontFamily: "Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    lineHeight: 1.12
  body:
    fontFamily: "Sarabun, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.oasis-blue}"
    textColor: "{colors.oasis-white}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.oasis-white}"
    textColor: "{colors.oasis-navy}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: tiwhub

## Overview

**Creative North Star: “Oasis of Learning”**

The selected Oasis Pages identity pairs a clear blue open-book mark with deep navy typography and a bright cyan point of connection. It should feel dependable and easy to understand for school teams and families checking real student, class, attendance, and payment information throughout the day. Thai-first copy and Sarabun remain the voice of the product.

The Front admin and LineLiff family portal share one brand palette and component language while preserving their separate workflows. Existing Bento and Neobrutalism visual modes are unified under Oasis; tenant-uploaded logos, student photographs, receipts, QR codes, and semantic status colors remain intact.

**Key Characteristics:**
- Clear academic blue, open space, and confident navy text.
- Cyan is a small connective accent, not a competing primary.
- Soft, readable surfaces with subtle blue-tinted borders and depth.
- The open-book mark and tiwhub wordmark identify the platform.

## Colors

The palette is a bright educational blue supported by deep navy, clear cyan, and cool white-blue neutrals.

### Primary
- **Oasis Blue** (#2563EB): Primary actions, selected navigation, links, and the platform mark.
- **Oasis Cyan** (#06B6D4): Secondary highlights, progress details, and small connection accents.

### Secondary
- **Learning Navy** (#17335C): Headings, high-emphasis text, and dark brand areas.

### Neutral
- **Canvas Blue Mist** (#F4F8FC): Application page backgrounds.
- **Quiet Blue Surface** (#EAF2FB): Subtle information blocks, selected soft states, and input backgrounds.
- **Bright White** (#FFFFFF): Cards, menus, fields, and content surfaces.
- **Blue Line** (#D8E4F1): Dividers and restrained component boundaries.
- **Slate Copy** (#52657D): Supporting and explanatory text.

### Named Rules
**The One Oasis Rule.** Front and LineLiff use the same blue, navy, cyan, and cool-neutral identity; legacy Sage and high-contrast black-outline skins are not alternate brand themes.

**The Status Stays True Rule.** Success, warning, danger, and payment/attendance states keep their distinct semantic hues; brand blue never replaces meaning.

## Typography

**Display Font:** Sarabun (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Sarabun (with ui-sans-serif, system-ui, sans-serif)

**Character:** Friendly, familiar Thai forms with sturdy weights for quick scanning. Keep labels plain and direct; do not add a separate display face that competes with the education mark.

### Hierarchy
- **Display** (700, 32–48px, 1.12): Major public and dashboard headlines.
- **Headline** (600–700, 24–32px, 1.2): Page titles and primary panel headings.
- **Title** (600–700, 16–20px, 1.35): Cards, sections, and grouped form fields.
- **Body** (400, 14–16px, 1.6): Thai-first instructions, records, and descriptions.
- **Label** (500–600, 12–14px, 1.4): Form labels, table headings, and compact navigation.

### Named Rules
**The Thai First Rule.** Sarabun remains the shared UI face so Thai copy stays readable and consistent in both apps.

## Layout

Front keeps its dense admin navigation and wide working canvas on desktop, then moves to a compact header and bottom navigation on small screens. LineLiff remains a single-column, thumb-friendly family portal with readable vertical rhythm. Use the existing responsive breakpoints, safe-area spacing, horizontal table behavior, and task ordering; color changes must not reduce working density or hide actions.

## Elevation & Depth

Depth comes primarily from white surfaces against a cool blue-mist canvas, fine blue-tinted borders, and restrained offset ambient shadows. Keep resting controls legible without decoration; reserve deeper elevation for menus, dialogs, and interaction feedback.

### Shadow Vocabulary
- **Soft Surface** (`0 3px 14px rgba(23, 53, 92, 0.06)`): Cards and grouped content.
- **Floating Surface** (`0 8px 24px rgba(23, 53, 92, 0.10)`): Menus, popovers, and overlays.

## Shapes

Use softly rounded, familiar application shapes: controls around 8–12px, cards around 16–24px, and pill geometry only for compact status chips or child selectors. Thin cool-blue borders replace heavy black outlines. Preserve existing hit-area sizes and keyboard focus visibility.

## Components

Components feel calm, direct, and easy to scan; they should support routine school work rather than compete with it.

### Buttons
- **Shape:** Gently rounded (12px).
- **Primary:** Oasis Blue with white text and comfortable touch height.
- **Hover / Focus:** Darken blue slightly; show a clear blue focus ring. Preserve disabled and loading states.
- **Secondary:** White or Quiet Blue Surface with navy text and a fine blue border.

### Chips
- **Style:** Soft neutral background, navy text, compact pill silhouette.
- **State:** Selected uses Oasis Blue with white text; semantic status chips retain their meaning colors.

### Cards / Containers
- **Corner Style:** Softly rounded (16–24px).
- **Background:** Bright White against Canvas Blue Mist; use Quiet Blue Surface for grouped secondary information.
- **Shadow Strategy:** Soft Surface only where separation benefits scanning.
- **Border:** Fine Blue Line when adjacent surfaces need definition.
- **Internal Padding:** Existing 16–24px rhythm.

### Inputs / Fields
- **Style:** White or Quiet Blue Surface, fine Blue Line, gently rounded (8–12px).
- **Focus:** Oasis Blue border and visible focus ring; errors remain red and include recovery guidance.

### Navigation
- **Style:** White shell, navy labels, blue selected state, cyan reserved for secondary highlights. Preserve the admin sidebar on desktop and bottom navigation on mobile.

### Brand Mark
Use the open-book Oasis mark and the tiwhub wordmark for platform identity. Preserve institute-uploaded logos as tenant identity, never replace them with the platform mark.

## Do's and Don'ts

### Do:
- **Do** use Oasis Blue (#2563EB), Learning Navy (#17335C), and Oasis Cyan (#06B6D4) consistently in both apps.
- **Do** keep state-specific colors for attendance, payment, success, warning, and error feedback.
- **Do** retain Thai-first Sarabun typography, existing workflows, and mobile-safe controls.
- **Do** use the selected open-book mark for platform identity while preserving uploaded tenant logos.

### Don't:
- **Don't** leave Sage as a separate brand palette or restore the black-outline Neobrutalism skin.
- **Don't** use cyan for large text or primary action surfaces where contrast is weaker than Oasis Blue.
- **Don't** recolor real institute marks, student photos, QR codes, or payment evidence.
- **Don't** change API behavior, page permissions, or workflow copy as a side effect of visual rebranding.
