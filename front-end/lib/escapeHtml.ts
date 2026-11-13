const ENTIDADES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
}

/** Makes any value safe to place inside HTML text or a quoted attribute. */
export function escapeHtml(valor: unknown): string {
  if (valor === null || valor === undefined) return ""
  return String(valor).replace(/[&<>"'`]/g, (c) => ENTIDADES[c])
}
