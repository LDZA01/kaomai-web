# Design System

## Overview

Kao Mai uses the “Open Futures” direction: bright friendly color, documentary photography, and varied composition communicate opportunity and confidence. The operational product uses the same optimistic system at a calmer, task-focused density.

## Color

- Friendly blue: `oklch(55% 0.20 260)`; primary actions, current selection, and core brand energy.
- Navy ink: `oklch(20.8% 0.006 264)`; headings and body text.
- Page surface: `oklch(97.2% 0.008 245)`; bright, lightly brand-tinted, never cream.
- Fresh teal: `oklch(67% 0.14 184)`; connection, progress, and opportunity.
- Hope green: `oklch(68% 0.18 145)`; verified positive outcomes and confirmed success.
- Semantic states use distinct green, amber, red, and blue with text labels and icons; color is never the only signal.

## Typography

Noto Sans Thai is the single family across public and product surfaces. Public headings use fluid sizes with balanced wrapping; product UI uses a fixed compact scale. Body copy remains at least 1rem with comfortable Thai line-height.

## Layout

Public pages use asymmetric photography-led compositions, varied section rhythm, and a 1280px maximum width. Product pages use a stable top bar, 248px sidebar, task-first content hierarchy, and structural responsive collapse. Cards are reserved for discrete actionable objects; lists and dividers handle related information.

## Components

Controls use 10–12px radii, minimum 44px targets, visible focus rings, and explicit hover, active, disabled, loading, error, and success states. Navy is the default primary action; teal is not used as general decoration.

## Motion

Product motion is limited to 150–250ms state feedback. Public motion may use one restrained image reveal and subtle path movement. All motion respects `prefers-reduced-motion`.

## Imagery

Use authentic documentary-style Thai workplace, training, shelter, and partnership photography. Subjects retain agency and dignity. Never use pity framing, staged charity symbolism, identifiable organizations, or generated replacement logos. The existing `public/pic/kaowmai-mark.svg` is immutable.
