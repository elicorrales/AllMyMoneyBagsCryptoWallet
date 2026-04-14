const WalletPageLevelUiStatusLines = (function () {
  let _statusLines = [];

  // Utility: remove outer html/head/body tags, <hr>, and newlines
  function sanitizeHtml(html) {
    if (!html) return '';
    return html
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>.*?<\/head>/gis, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '')
      .replace(/<hr[^>]*>/gi, '')
      .replace(/\\r\\n|\\r|\\n/g, '')  // remove escaped newline sequences
      .replace(/[\r\n]+/g, '');        // remove real control chars
  }

  function updateStatus(statusLines) {
    if (!statusLines) return;

    // Normalize: always an array
    const lines = Array.isArray(statusLines) ? statusLines : [statusLines];
    _statusLines = lines;

    const statusDiv = document.getElementById('walletStatus');
    if (!statusDiv) return;

    // Clear previous children
    statusDiv.innerHTML = '';

    // Render each line as its own div
    _statusLines.forEach(line => {
      const lineDiv = document.createElement('div');
      lineDiv.style.padding = '4px 0';

      if (/<\/?[a-z][\s\S]*>/i.test(line)) {
        // HTML case
        lineDiv.innerHTML = sanitizeHtml(line);
      } else {
        // Plain text case (leave newlines intact)
        lineDiv.textContent = line;
      }

      statusDiv.appendChild(lineDiv);

      // Thin line separator (explicit UI element)
      const separator = document.createElement('div');
      separator.style.height = '1px';
      separator.style.backgroundColor = '#ccc';
      separator.style.margin = '2px 0';
      statusDiv.appendChild(separator);
    });
  }

  function clearStatus() {
    _statusLines = [];
    updateStatus([]);
  }

  function getCurrentStatus() {
    return [..._statusLines];
  }

  function appendStatus(newLines) {
    if (!newLines) return;
    // Ensure newLines is an array
    const linesToAdd = Array.isArray(newLines) ? newLines : [newLines];
    // Merge with existing status
    _statusLines = _statusLines.concat(linesToAdd);
    updateStatus(_statusLines);
  }

  return {
    updateStatus,
    clearStatus,
    getCurrentStatus,
    appendStatus,
  };
})();
