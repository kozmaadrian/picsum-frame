# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Designers and front-end developers who need placeholder photography for web/UI mockups. They're mid-task in the browser or in a design tool and want a correctly sized image quickly, without leaving what they're doing.

## Product Purpose
A Chrome extension (toolbar popup) that generates random photos from Lorem Picsum (picsum.photos) at an exact size. You preview the photo, refresh until you like one, then download it. Success means a usable, correctly sized file on disk in a few seconds.

## Positioning
Size first: it's built around the dimensions and aspect ratios used in UI work, and the preview is exactly the file that gets downloaded.

## Operating Context
- Opened from the Chrome toolbar as a popup over any page; short, repeated sessions.
- Images come from picsum.photos (max 5000 px per side; supports grayscale, blur 1–10, `.jpg`/`.webp`).
- Photos are Unsplash photos served by Picsum; author credit is available from `/id/{id}/info`.

## Capabilities and Constraints
- Presets of common UI aspect ratios (prioritized for web/UI mockups), Small/Medium/Large sizes per ratio, and exact width/height controls.
- Preview, refresh (new random photo), download.
- Changing size or effects keeps the current photo; only refresh picks a new one.
- Chrome Manifest V3; no backend, no account.

## Evidence on Hand
None. No testimonials, usage numbers, or store listing exist; don't invent any.

## Product Principles
1. The preview is the download. What you see is the exact file you get.
2. Size is the main control. Ratios and dimensions get the clearest presentation.
3. Two actions matter: refresh and download. Everything else stays out of their way.
4. Remember the last setup; reopening the popup continues where you left off.
