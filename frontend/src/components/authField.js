export function createPlaceholderField(type, name, placeholder, options = {}) {
  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.placeholder = placeholder;
  input.setAttribute("aria-label", placeholder);
  input.required = options.required !== false;
  if (options.autocomplete) input.autocomplete = options.autocomplete;
  if (options.minLength) input.minLength = options.minLength;

  return input;
}
