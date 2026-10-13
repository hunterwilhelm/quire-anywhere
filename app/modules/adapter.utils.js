// Fills {name} placeholders from values. A placeholder without a value is dropped along with the brackets or parentheses around it
// ("Game [{year}]" -> "Game"), and the result is trimmed.
export function renderTemplate(template, values) {
  const filled = key => values[key] == null ? "" : String(values[key]);
  return template
      .replace(/\s*[\[(]\s*\{(\w+)\}\s*[\])]/g, (match, key) => filled(key) ? match.replace(`{${key}}`, filled(key)) : "")
      .replace(/\{(\w+)\}/g, (match, key) => filled(key))
      .trim();
}
