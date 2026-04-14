// wallet-ui-common-js/wallet-ui-info-modal-dialog.js

const WalletInfoModal = (function () {
  let _initialized = false;

  let infoModal = null;
  let infoMessage = null;
  let infoDetails = null;
  let infoOkBtn = null;
  let modalRedirect = null;
  let modalOnClose = null;

  // NEW: queue + open flag
  let _queue = [];
  let _isOpen = false;

  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;

    infoModal = document.getElementById('infoOverlayModal');
    infoMessage = document.getElementById('infoModalMessage');
    infoDetails = document.getElementById('infoModalDetails');
    infoOkBtn = document.getElementById('infoOkBtn');

    infoOkBtn.addEventListener('click', () => {
      infoModal.classList.add('hidden');
      _isOpen = false;

      if (typeof modalOnClose === 'function') {
        modalOnClose();
        modalOnClose = null;
      }
      if (modalRedirect) {
        window.location.href = modalRedirect;
        return;
      }

      // NEW: show next queued modal
      if (_queue.length > 0) {
        const next = _queue.shift();
        _showInternal(next);
      }
    });
  }

  function onDomReady(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  function _showInternal({ message, details, imageSrc, imageAlt, redirectTo, onClose }) {

    // Clear/reset all first
    infoMessage.textContent = message || '';
    infoDetails.innerHTML = details || '';

    // Remove any previously added image element
    const existingImg = infoModal.querySelector('img.modal-image');
    if (existingImg) existingImg.remove();

    if (imageSrc) {
      // Hide text message if empty and just image
      if (!message) infoMessage.style.display = 'none';
      else infoMessage.style.display = '';

      // Create image element with styling
      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = imageAlt || '';
      img.className = 'modal-image';
      img.style.width = '600px';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      // Insert image below message
      infoMessage.insertAdjacentElement('afterend', img);
    } else {
      // No image, ensure message visible
      infoMessage.style.display = '';
    }

    if (message) infoMessage.textContent = message;
    infoDetails.innerHTML = details || '';

    modalRedirect = redirectTo || null;
    modalOnClose = typeof onClose === 'function' ? onClose : null;

    infoModal.classList.remove('hidden');
    _isOpen = true;

    // Add class to modal box to expand width if image present
    const modalBox = infoModal.querySelector('.modal-box');
    if (imageSrc) modalBox.classList.add('image-modal');
    else modalBox.classList.remove('image-modal');
  }

  function show({ message, details, imageSrc, imageAlt, redirectTo, onClose }) {
    if (!_initialized) {
      console.warn('WalletInfoModal: show() called before init');
      return;
    }

    const payload = { message, details, imageSrc, imageAlt, redirectTo, onClose };

    // NEW: queue if one already open
    if (_isOpen) {

      if (_isOpen &&
         (infoMessage.textContent || '') === (message || '') &&
         (infoDetails.innerHTML || '') === (details || '')) {
        return; // same as currently showing → ignore
      }

      if (_queue.some(q =>
         (q.message || '') === (message || '') &&
         (q.details || '') === (details || '')
      )) {
        return; // already queued → ignore
      }

      _queue.push(payload);
      return;
    }

    _showInternal(payload);
  }

  function showAndBlock({ message, details, imageSrc, imageAlt, redirectTo }) {
    return new Promise(resolve => {
      show({
        message,
        details,
        imageSrc,
        imageAlt,
        redirectTo,
        onClose: () => resolve()
      });
    });
  }


  function showError(errOrOptions) {
    if (!_initialized) {
      console.warn('WalletInfoModal: showError() called before init');
      return;
    }

    let message = '❌ Error:'; // <-- set heading/message here
    let details = '';

    // If caller passed full options, respect them
    if (errOrOptions && typeof errOrOptions === 'object' && (
      'message' in errOrOptions ||
      'details' in errOrOptions ||
      'imageSrc' in errOrOptions
    )) {
      return show({
        message: `❌ ${errOrOptions.message || 'Error:'}`,
        details: errOrOptions.details || '',
        imageSrc: errOrOptions.imageSrc,
        imageAlt: errOrOptions.imageAlt,
        redirectTo: errOrOptions.redirectTo
      });
    }

    const err = errOrOptions;

    // Extract details safely
    if (err instanceof Error) {
      details = err.message || String(err);
    } else if (typeof err === 'string') {
      details = err;
    } else if (err && typeof err === 'object') {
      // Try common fields first
      if (err.message) {
        details = err.message;
      } else {
        try {
          details = JSON.stringify(err, null, 2);
        } catch {
          details = String(err);
        }
      }
    } else {
      details = String(err);
    }

    // Optional: include code if present
    if (err && typeof err === 'object' && 'code' in err) {
      details += `<br><br><b>Code:</b> ${err.code}`;
    }

    // Set heading element directly to overwrite default "Notice:"
    const titleEl = infoModal.querySelector('#infoModalTitle');
    if (titleEl) titleEl.textContent = '❌ Error:'; // <-- this is the key line

    show({
      message,
      details
    });
  }


  onDomReady(initOnceDomReady);

  return {
    show,
    showAndBlock,
    showError
  };
})();

