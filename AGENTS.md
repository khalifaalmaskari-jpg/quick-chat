# Quick Chat Development Standard

Quick Chat development must follow these three design-engineering skills from Emil Kowalski's public skills repository:

1. apple-design
   https://github.com/emilkowalski/skills/tree/main/skills/apple-design
2. pick-ui-library
   https://github.com/emilkowalski/skills/tree/main/skills/pick-ui-library
3. emil-design-eng
   https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng

## Project priorities

- iPhone/iOS Safari and installed Home Screen PWA behavior are first-class requirements.
- Keep the app fast, local-first, private, and dependency-light.
- Preserve current functionality unless a change is explicitly required.
- Avoid visual churn and large refactors for small fixes.
- Test safe-area, status-bar, viewport, keyboard, sheet, and touch behavior when changing layout.
- Keep offline fallback and automatic-update behavior working.

## Apple Design

- Immediate press feedback on touch-down.
- Direct, predictable, spatially consistent interactions.
- Motion must be interruptible when gesture-driven.
- Use springs only when physical/gesture behavior benefits from them.
- Avoid gratuitous animation.
- Respect prefers-reduced-motion, prefers-reduced-transparency, and prefers-contrast.
- Use safe-area environment variables correctly on iOS.
- Keep touch targets comfortably tappable.
- Sheets and transient surfaces should preserve clear hierarchy and spatial origin.
- Use restrained translucency and blur, especially on Safari.

## Library Selection

Use the curated library only when the task actually needs it:

- Accessible dialogs/popovers/selects: Base UI.
- Toasts: Sonner.
- General spring/gesture animation: Motion.
- Shared state that outgrows local React state: Zustand.
- Conditional class names: clsx.

Before introducing any library:
1. Check what is already installed.
2. Prefer no dependency for trivial CSS/native-platform behavior.
3. Do not add a build system solely for a minor interaction.
4. Do not replace working code just to conform to a library preference.
5. Any new dependency must justify its size and complexity for this small PWA.

## Design Engineering

- UI feedback should feel immediate.
- Pressable controls should have a subtle active state, typically scale(0.97).
- Do not use transition: all.
- Use explicit transition properties.
- UI animations should generally remain below 300ms.
- Use strong ease-out curves for enter/exit and ease-in-out for movement.
- Never use ease-in for primary UI response.
- Do not animate from scale(0).
- Popovers should originate from their trigger; centered modals remain centered.
- Frequently used actions should have little or no animation.
- Prefer transforms and opacity for animation performance.
- Preserve accessibility, focus handling, semantic controls, and keyboard behavior.

## Quick Chat-specific guardrails

- Phone entry must remain the primary action and require the fewest taps possible.
- Keypad feedback must be immediate and must not delay number entry.
- Country selection must remain clear and accessible.
- Settings must never obstruct or corrupt the main phone-entry layout.
- The WhatsApp action must clearly reflect enabled/disabled state.
- History remains local to the device and must remain optional.
- Do not add analytics, trackers, account requirements, or contact access.
- Service-worker releases must activate cleanly without update loops.
- A release must not be called complete until source syntax and deployment are verified.

## Review format

When reviewing UI/code against the design-engineering skill, use:

| Before | After | Why |
| --- | --- | --- |
| Current behavior/style | Proposed behavior/style | Design or engineering rationale |

