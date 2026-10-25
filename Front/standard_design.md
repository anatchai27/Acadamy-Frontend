# tiwhub Front UI standard

`../DESIGN.md` is the canonical visual identity shared by Front and LineLiff. This file records implementation guidance specific to the Front admin and public platform.

## Brand system

- Platform name: `tiwhub`; use the selected open-book mark from `/public/tiwhub-mark.svg` and horizontal lockup from `/public/tiwhub-logo.svg`.
- Core palette: Oasis Blue `#2563EB`, Learning Navy `#17335C`, Oasis Cyan `#06B6D4`, canvas `#F4F8FC`, white surfaces, and blue-tinted borders.
- Sarabun is the Thai-first UI typeface.
- Use one Oasis visual system. Do not reintroduce the old black-outline Neobrutalism skin or Sage palette.
- Keep uploaded institute logos as tenant identity. The tiwhub mark is the platform fallback only.
- Success, warning, danger, attendance, and payment states remain semantically distinct.

## Components and behavior

- Buttons use clear labels, Oasis Blue for the primary action, rounded corners, visible focus, and intact disabled/loading states.
- Cards and forms use white/cool-blue surfaces, fine borders, and restrained blue-tinted shadows.
- Keep admin navigation, permissions, route behavior, content density, form validation, and API behavior unchanged during visual rebranding.
- Maintain readable data tables, dialogs, filters, badges, and notification surfaces; use blue as brand, not as a replacement for semantic status colors.

## Responsive behavior

- Keep the desktop sidebar and move to the existing compact mobile header and horizontal bottom navigation at small widths.
- Use dynamic viewport height (`dvh`) for mobile full-height surfaces.
- Preserve safe-area padding, horizontal table overflow, and reachable touch targets.
- Keep action buttons below page titles on mobile and adjacent to headings on wider screens.

## Accessibility

- Preserve keyboard navigation and strong `:focus-visible` outlines.
- Maintain readable text contrast, semantic labels, image alt text, and error recovery instructions.
- Do not rely on color alone to convey payment, attendance, or request status.
