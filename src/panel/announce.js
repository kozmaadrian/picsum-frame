/** Screen-reader announcements through a polite live region. */
export function createAnnouncer(region) {
  return function announce(text) {
    region.textContent = "";
    // Clearing first makes repeated identical messages announce again.
    requestAnimationFrame(() => {
      region.textContent = text;
    });
  };
}
