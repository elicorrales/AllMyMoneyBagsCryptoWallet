// wallet-ui-common-js/wallet-ui-page-level-ui-back-arrow.js

const WalletPageLevelUiBackArrow = (function () {
  let _backArrowStack = [];


  function logBackArrowStack(context) {
    console.log('\nBackArrow============================================');
    console.log(`[BackArrow Stack Dump] - ${context}`);
    _backArrowStack.forEach((entry, idx) => {
      console.log(`${idx}: panelToShow=${entry.panelToShow || '(none)'}, execFn=${typeof entry.execFn}`);
    });
    console.log('BackArrow============================================\n');
  }

  /**
   * Internal helper to verify if the arrow is actually visible to the user
   */
  function isElementActuallyVisible(el) {
    while (el) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      el = el.parentElement;
    }
    return true;
  }

  function showBackArrow({ show: panelToShow, onBackArrow: execFn } = {}) {
    const backArrow = document.getElementById("backArrow");

    if (!backArrow) {
      console.error("showBackArrow called but #backArrow element not found", { panelToShow, execFn });
      throw new Error("Invalid back arrow call: element not found");
    }

    const top = _backArrowStack[_backArrowStack.length - 1];

    // Only skip if both panel and function code are identical
    if (
      top?.panelToShow === panelToShow &&
      (String(top?.execFn) === String(execFn) || (!top?.execFn && !execFn))
    ) {
      return; // Skip pushing duplicate entry
    }

    _backArrowStack.push({ panelToShow, execFn });

    backArrow.style.display = 'block';

    // Verify visibility after attempting to show
    if (window.getComputedStyle(backArrow).display === 'none') {
      throw new Error("Invalid back arrow call: arrow remains hidden");
    }

    if (!isElementActuallyVisible(backArrow)) {
      throw new Error("Invalid back arrow call: not visible in DOM (check parents)");
    }

    backArrow.onclick = () => {
      logBackArrowStack();
      const last = _backArrowStack.pop();
      if (!last) return;

      if (typeof last.execFn === 'function') last.execFn();
      if (last.panelToShow) WalletUiPanel.show(last.panelToShow);

      if (_backArrowStack.length === 0) {
        backArrow.style.display = 'none';
        backArrow.onclick = null;
      }
    };
  }

  function noBackArrow() {
    const backArrow = document.getElementById("backArrow");
    if (backArrow) {
      backArrow.style.display = 'none';
      backArrow.onclick = null;
      _backArrowStack = [];
    }
  }

  function triggerBackArrow() {
    const backArrow = document.getElementById("backArrow");
    if (backArrow && typeof backArrow.onclick === "function") {
      backArrow.onclick();
    }
  }

  return {
    showBackArrow,
    noBackArrow,
    triggerBackArrow
  };
})();
