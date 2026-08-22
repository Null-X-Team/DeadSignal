(() => {
  const parts = window.__DS_CHUNKS || [];
  if (parts.length !== 5) {
    console.error("Dead Signal load error", parts.length);
    return;
  }
  const code = atob(parts.join(""));
  (0, eval)(code);
})();
