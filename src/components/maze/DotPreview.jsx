import React from "react";

/**
 * Renders a dot skin: a glowing circle, or a glowing star for the
 * "Shooting Star" skin.
 */
export default function DotPreview({ skin, size = 28 }) {
  if (skin?.star) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ filter: `drop-shadow(0 0 6px ${skin.color})` }}
      >
        <path
          d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 4.1 1.6-6.7L2.2 8.9l6.9-.6z"
          fill={skin.color}
        />
      </svg>
    );
  }
  const c = skin?.color || "#5EEAD4";
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, background: c, boxShadow: `0 0 10px ${c}` }}
    />
  );
}