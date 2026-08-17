(() => {
  const cleanImpactUI = () => {
    const selectors = [
      '.cf-impact',
      '.cf-impact-panel',
      '.cf-cluster-impact',
      '.cf-impact-grid',
      '.cf-impact-circle'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(el => el.remove());

    document.querySelectorAll('.card .meta span, .card .meta > span, .cf-dept-row > div, .cf-cluster > div > span, .stat').forEach(el => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (
        text === 'impact' ||
        text.includes('impact points') ||
        text.includes('combined case impact') ||
        text.includes('avg. impact') ||
        /^impact\s+\d+\/100$/.test(text)
      ) {
        el.remove();
      }
    });

    document.querySelectorAll('.cf-dept-row').forEach(row => {
      const children = [...row.children];
      children.forEach(child => {
        const text = (child.textContent || '').toLowerCase();
        if (text.includes('avg impact')) child.remove();
      });
    });
  };

  const start = () => {
    cleanImpactUI();
    const observer = new MutationObserver(cleanImpactUI);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
