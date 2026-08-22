(() => {
  const parts = window.__DS_CHUNKS || [];
  if (parts.length !== 5) {
    console.error("Dead Signal: expected 5 chunks, got", parts.length);
    return;
  }
  const code = atob(parts.join(""));
  (0, eval)(code);
})();
