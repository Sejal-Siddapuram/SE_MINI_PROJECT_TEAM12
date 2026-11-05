# NFR-02 — Usability

**Owner:** Sampath D Naik
**Requirement (SRS Section 11):** The interface shall follow a consistent design language and be usable by a
first-time student without training, on both desktop and mobile viewports.
**Design reference:** SAD Section 4.5 (UX Design) · **Test case:** TC-NFR-02

## How it is implemented

NFR-02 is a cross-cutting requirement, so it lives in the **shared design layer** that every page uses,
not inside individual pages. That way every module (FR-01, FR-04, FR-07, FR-10, and future ones) gets the
same behaviour automatically.

| What | Where | Why (SAD 4.5 / WCAG) |
|---|---|---|
| One shared stylesheet with design tokens (colours, spacing, radius) | `client/src/styles/global.css` | Consistent design language across all roles |
| Responsive layout: single-column forms and grids, stacked headers below 720px | `global.css` (Mobile layout section) | Usable on mobile viewports |
| Navbar collapses into a **Menu** button on small screens; current page highlighted | `components/Navbar.jsx` | Navigation fits on a phone; users always know where they are |
| **Skip to main content** link | `components/Navbar.jsx` | Keyboard users skip the menu (WCAG 2.4.1) |
| Visible focus ring on links, buttons and inputs | `global.css` | Keyboard users can see where they are (WCAG 2.4.7) |
| Labels linked to inputs; hints and errors linked with `aria-describedby`; `aria-invalid` on errors; required fields marked and announced | `components/FormField.jsx` | Inline validation that screen readers also announce (WCAG 1.3.1, 3.3.1) |
| Page messages use `role="alert"` / `role="status"` with an icon | `components/Alert.jsx` | Errors are announced immediately; meaning not by colour alone |
| Status badges show a **symbol + text** (✓ Approved, ✕ Removed, ◷ Pending …) | `components/StatusBadge.jsx` | Meaning does not depend on colour alone (SAD 4.5, WCAG 1.4.1) |
| Touch targets at least 44px high on mobile | `global.css` | Easy to tap on phones (WCAG 2.5.5) |
| Wide tables scroll inside their card instead of breaking the page | `global.css` (`.table-wrap`) | No sideways scrolling of the whole page on phones |
| Colour pairs chosen for WCAG AA contrast (e.g. primary #1d4ed8 on white ≈ 6.7:1) | `global.css` (`:root`) | Readable text (WCAG 1.4.3) |
| Respects the "reduce motion" system setting | `global.css` | Comfort for motion-sensitive users |

## TC-NFR-02 walkthrough checklist

Run with five first-time students, once on a laptop and once on a phone (or Chrome DevTools → device toolbar → iPhone).
No instructions are given beyond the task.

| # | Task | Desktop | Mobile |
|---|---|---|---|
| 1 | Create a student account (try submitting the empty form first) | ☐ | ☐ |
| 2 | Log in | ☐ | ☐ |
| 3 | Find an internship in Bengaluru using the search filters | ☐ | ☐ |
| 4 | Open the listing and find its deadline and eligibility | ☐ | ☐ |
| 5 | Log out | ☐ | ☐ |
| 6 | Using only the keyboard (Tab / Enter), log in and reach the search page | ☐ | — |

Record for each student: completed unaided (yes/no), time taken, and any point of confusion.

---

## Actual Testing Results – Sampath D Naik

**Testing date:** 5 November 2026  
**Tester:** Sampath D Naik  
**Environment:** Google Chrome, Desktop and Chrome DevTools Mobile Emulation

### 1. Desktop Testing

| Test | Actual Result | Status |
|---|---|---|
| Student dashboard display | Dashboard displayed correctly with cards and navigation | Pass |
| Navigation links | Navigation links opened the respective pages correctly | Pass |
| Listing details | Listing details page displayed correctly | Pass |
| My Applications | Applications page displayed correctly | Pass |

### 2. Mobile Testing

**Device emulation:** Samsung Galaxy – 360 × 800 pixels

| Test | Actual Result | Status |
|---|---|---|
| Responsive navigation | Navigation collapsed into Menu button | Pass |
| Menu interaction | Menu opened and closed correctly | Pass |
| Dashboard layout | Dashboard cards stacked vertically | Pass |
| Text responsiveness | Text wrapped within the screen | Pass |
| Horizontal overflow | Browser width and page width both measured 360px | Pass |
| My Applications table | Listing column was partially cut off on mobile | Needs Improvement |

### 3. Mobile Width Verification

Browser console command:

```javascript
({
  screenWidth: document.documentElement.clientWidth,
  pageWidth: document.documentElement.scrollWidth
})
```

Observed output:

```javascript
{
  screenWidth: 360,
  pageWidth: 360
}
```

This confirms that the page itself does not have horizontal overflow at the tested viewport width.

However, the My Applications table requires further improvement because its Listing column is partially cut off.

### 4. Issues Identified

- The My Applications table is not fully readable at the 360px mobile viewport.
- The five-first-time-student usability walkthrough has not yet been conducted.
- Additional testing with different screen sizes and first-time users is pending.

### 5. Overall Result

The desktop interface and most tested mobile interface elements behaved as expected.

The responsive navigation, dashboard layout, text wrapping and page width checks passed. The My Applications table requires improvement for mobile readability.

**Overall status: Partially Verified – Further usability testing required.**
