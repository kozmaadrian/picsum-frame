/** Element by id; throws early if the markup and the scripts drift apart. */
export function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
}

/** Minimal element builder: h("span", { className: "x" }, "text", childNode). */
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "style") Object.assign(element.style, value);
    else if (key === "dataset") Object.assign(element.dataset, value);
    else if (key.startsWith("aria-") || key === "role") element.setAttribute(key, value);
    else element[key] = value;
  }
  element.append(...children);
  return element;
}
