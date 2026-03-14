"use client";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  safety:      { bg: "#ef444420", text: "#ef4444" },
  helpfulness: { bg: "#22c55e20", text: "#22c55e" },
  restriction: { bg: "#f59e0b20", text: "#f59e0b" },
  style:       { bg: "#3b82f620", text: "#3b82f6" },
  safe:        { bg: "#22c55e20", text: "#22c55e" },
  unsafe:      { bg: "#ef444420", text: "#ef4444" },
  borderline:  { bg: "#f59e0b20", text: "#f59e0b" },
  false_refusal: { bg: "#8b5cf620", text: "#8b5cf6" },
  adversarial: { bg: "#f9731620", text: "#f97316" },
  rule_conflict: { bg: "#ec489920", text: "#ec4899" },
};

export function CategoryBadge({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category] || { bg: "#64748b20", text: "#64748b" };
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 6px",
      borderRadius: 4,
      background: colors.bg,
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      whiteSpace: "nowrap",
    }}>
      {category.replace("_", " ")}
    </span>
  );
}

export const PROMPT_CATEGORY_COLOR: Record<string, string> = {
  safe: "#22c55e",
  unsafe: "#ef4444",
  borderline: "#f59e0b",
  false_refusal: "#8b5cf6",
  adversarial: "#f97316",
  rule_conflict: "#ec4899",
};
