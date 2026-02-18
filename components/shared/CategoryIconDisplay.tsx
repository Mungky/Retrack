"use client";

import { getCategoryIcon, isEmojiIcon } from "@/lib/category-icons";

interface CategoryIconDisplayProps {
  /** Icon name (Lucide) or emoji string */
  icon: string | null;
  /** Category name for fallback icon when icon is null */
  name?: string;
  /** Icon size in px */
  size?: number;
  /** Hex color for the icon */
  color?: string;
  /** Optional className */
  className?: string;
  /** Optional inline style (color is merged when color prop is provided) */
  style?: React.CSSProperties;
}

/**
 * Renders category icon (Lucide or emoji) for display in lists/previews.
 */
export function CategoryIconDisplay({
  icon,
  name,
  size = 24,
  color,
  className,
  style,
}: CategoryIconDisplayProps) {
  const mergedStyle = color ? { ...style, color } : style;

  if (isEmojiIcon(icon)) {
    return (
      <span
        className={className}
        style={{ fontSize: size, lineHeight: 1, ...mergedStyle }}
      >
        {icon}
      </span>
    );
  }

  const Icon = getCategoryIcon(icon, name);
  return <Icon size={size} className={className} style={mergedStyle} />;
}
