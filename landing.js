// landing.js (updated)

// Only HTML and CSS remain here; all JS is discovered from the HTML itself
const filesToBundle = [
  { url: 'SimpleWebPageCryptoWallet.html', name: 'SimpleWebPageCryptoWallet.html' },
  { url: 'wallet.css',                 name: 'wallet.css' }
];

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

function updateButtons() {
  const ismobile = isMobile();
  if (ismobile) {
    document.getElementById("mobileNotice").style.display = "block";
    document.getElementById("mainContent").style.display = "none";
  } else {
    document.getElementById("mobileNotice").style.display = "none";
  }
}

function getTimestampFilename() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
  return `simple-webpage-crypto-wallet-${date}-${time}.zip`;
}

async function downloadAll() {
  try {
    const blobWriter = new zip.BlobWriter('application/zip');
    const writer = new zip.ZipWriter(blobWriter);

    //
    // STEP A: Fetch the HTML first and parse it to discover all <script src="…"> tags.
    //
    const folderURL = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
    const htmlResp = await fetch(new URL('SimpleWebPageCryptoWallet.html', folderURL));
    if (!htmlResp.ok) throw new Error('SimpleWebPageCryptoWallet.html not found');
    let htmlText = await htmlResp.text();

    // Parse HTML to DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Collect every <script> whose src is a relative URL (endsWith ".js")
    const scriptElements = Array.from(doc.querySelectorAll('script[src]'));
    const scriptSrcs = scriptElements
      .map(s => s.getAttribute('src').trim())
      .filter(src => src.endsWith('.js'));

    if (scriptSrcs.length === 0) {
      throw new Error('No <script src="…"> tags found in HTML to bundle.');
    }

    //
    // STEP B: Fetch and concatenate all discovered scripts into one `bundle.js`.
    //
    let bundleContent = '';
    for (const src of scriptSrcs) {
      // Reconstruct full URL (handles relative paths)
      const resp = await fetch(new URL(src, folderURL));
      if (!resp.ok) throw new Error(`${src} not found`);
      const text = await resp.text();
      // Add a separator and the original filename as a comment, for clarity/debug
      bundleContent += `\n\n// ----------- ${src} -----------\n\n`;
      bundleContent += text;
    }
    // Add the combined bundle as "bundle.js"
    await writer.add('bundle.js', new zip.TextReader(bundleContent));

    //
    // STEP C: Modify the HTML DOM—
    //   1. Remove every <script src="…"> we just bundled
    //   2. Insert a single `<script src="bundle.js" defer></script>` at the bottom of <body>
    //
    for (const scriptEl of scriptElements) {
      scriptEl.remove();
    }
    const bundleScript = doc.createElement('script');
    bundleScript.src = 'bundle.js';
    bundleScript.defer = true;
    doc.body.appendChild(bundleScript);

    // Re-serialize the modified HTML (include DOCTYPE)
    htmlText = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

    //
    // STEP D: Add the modified HTML and wallet.css into the ZIP
    //
    await writer.add(
      'SimpleWebPageCryptoWallet.html',
      new zip.TextReader(htmlText)
    );

    // Fetch and add wallet.css (straight copy)
    const cssResp = await fetch(new URL('wallet.css', folderURL));
    if (!cssResp.ok) throw new Error('wallet.css not found');
    const cssText = await cssResp.text();
    await writer.add('wallet.css', new zip.TextReader(cssText));

    //
    // STEP E: Finalize ZIP and trigger download
    //
    const zipBlob = await writer.close();
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = getTimestampFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(zipUrl);

  } catch (err) {
    alert(`Failed to create bundle. Please try again.\nError: ${err.message || err}`);
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateButtons();
  const dlBtn = document.getElementById("downloadAllBtn");
  if (dlBtn) dlBtn.addEventListener("click", downloadAll);
});

