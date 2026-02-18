/**
 * Centralized z-index values for consistent layering.
 * Use with style={{ zIndex: Z_INDEX.backdrop }} for inline styles.
 */
export const Z_INDEX = {
  /** FAB overlay (below sheet backdrop) */
  fabOverlay: 55,
  /** FAB menu (below sheet backdrop) */
  fabMenu: 56,
  /** Backdrop/overlay (e.g. sheet backdrop) */
  backdrop: 60,
  /** Bottom sheet / modal content, dialogs */
  sheet: 70,
  /** Nested sheet (form opened from another sheet), dropdown overlay */
  sheetNested: 80,
  /** Dropdown menus, popovers */
  dropdown: 90,
  /** Toast notifications */
  toast: 100,
} as const;
