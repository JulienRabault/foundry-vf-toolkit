/**
 * Apply a glossary (ordered list of [pattern, replacement]) to text or HTML.
 *
 * In HTML only text nodes are touched: tags, attributes, @UUID[...] targets
 * and image paths stay as they are. Rules run in order, so put the longest
 * and most specific expressions first ("Wave Echo Cave" before "Wave Echo").
 */

/** @param {Array<[string|RegExp, string]>} rules  strings are matched as whole words */
export function compileGlossary(rules) {
  return rules.map(([from, to]) => {
    if (from instanceof RegExp) return [from.global ? from : new RegExp(from.source, from.flags + 'g'), to];
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return [new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'gu'), to];
  });
}

export function replaceText(text, compiled) {
  return compiled.reduce((t, [re, to]) => t.replace(re, to), text);
}

/** Replace only in text nodes; `@UUID[...]` targets are protected, their {labels} are translated. */
export function replaceHtml(html, compiled) {
  return html.replace(/(^|>)([^<]+)/g, (m, lead, text) => {
    const parts = text.split(/(@\w+\[[^\]]*\])/g);
    return lead + parts.map((p, i) => (i % 2 ? p : replaceText(p, compiled))).join('');
  });
}

/** Load a glossary JSON file: [["Phandalin","Phandaline"], ["/\\bRedbrands?\\b/","Fers Rouges"]]. */
export function parseGlossary(json) {
  return JSON.parse(json).map(([from, to]) => {
    const m = /^\/(.*)\/([a-z]*)$/s.exec(from);
    return [m ? new RegExp(m[1], m[2]) : from, to];
  });
}
