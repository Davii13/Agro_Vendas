// Numeric fields in AgroVendas (quantities, prices, amounts paid, boxes) are never negative.
// These helpers keep a minus sign out of them, whether it is typed or pasted.

/** Keys that make no sense in these fields: the sign keys and the exponent (1e5) of number inputs. */
const TECLAS_BLOQUEADAS = new Set(["-", "+", "e", "E"])

/** True when the pressed key must be ignored in a field that only takes non-negative numbers. */
export function teclaBloqueada(tecla: string): boolean {
  return TECLAS_BLOQUEADAS.has(tecla)
}

/** Removes any minus sign from a typed or pasted value: "-5" becomes "5". */
export function removerSinalNegativo(valor: string): string {
  return valor.replace(/[-−–—]/g, "")
}

/** A field may hold negative numbers only if it explicitly asks for a negative minimum. */
export function aceitaNegativo(min: string | number | undefined): boolean {
  return min !== undefined && min !== "" && Number(min) < 0
}
