/**
 * Escapes characters that have a special meaning in regular expressions,
 * so a search like "C++" or "(remote)" is treated as plain text.
 */
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
