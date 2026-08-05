// Conversor minimo de "markdown lite" a HTML: negrita, cursiva y links.
// Deliberadamente NO es un parser de markdown completo (sin titulos, listas,
// citas, bloques de codigo, etc.) porque el widget del CMS solo expone 3
// botones: negrita, cursiva y link. Mantenerlo acotado a esos 3 formatos
// evita tener que instalar una dependencia nueva (marked, markdown-it, etc.)
// justo antes de publicar el sitio en su dominio definitivo.
export function mdLiteToHtml(text: string): string {
  return text
    // **negrita** -> <strong>. Va antes que cursiva para que el regex de
    // cursiva no rompa los asteriscos dobles.
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // *cursiva* -> <em>
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // [texto](url) -> <a>. La clase text-link y target/rel quedan fijos aca
    // para que el editor no tenga que escribirlos a mano.
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a class="text-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}
