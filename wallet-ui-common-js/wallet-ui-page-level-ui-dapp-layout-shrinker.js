//wallet-ui-common/wallet-ui-page-level-ui-dapp-layout-shrinker.js
//BEGIN TRIAL CODE
const WalletPageLevelUiDappLayoutShrinker = (function() {
  let observer;

  function update() {
    const wrapper = document.getElementById('dappStatusWrapper');
    const backArrow = document.getElementById('backArrow');
    if (!wrapper || !backArrow) return;

    if (observer) observer.disconnect();

    const btns = {
      addrFullNo: document.getElementById('dappNoAddress'),
      addrFullYes: document.getElementById('dappCurrentAddress'),
      addrShrinkNo: document.getElementById('dappNoAddressShrunk'),
      addrShrinkYes: document.getElementById('dappCurrentAddressShrunk'),
      netFullNo: document.getElementById('dappNoNetwork'),
      netFullYes: document.getElementById('dappCurrentNetwork'),
      netShrinkNo: document.getElementById('dappNoNetworkShrunk'),
      netShrinkYes: document.getElementById('dappCurrentNetworkShrunk')
    };

    const hasAddr = btns.addrFullYes?.classList.contains('populated');
    const hasNet = btns.netFullYes?.classList.contains('populated');
    const fullAddr = btns.addrFullYes?.dataset.address || "";

    if (btns.addrShrinkYes) btns.addrShrinkYes.classList.toggle('populated', hasAddr);
    if (btns.netShrinkYes) btns.netShrinkYes.classList.toggle('populated', hasNet);

    const isArrowVisible = window.getComputedStyle(backArrow).display !== 'none';
    const BUFFER = 40;
    const arrowRight = isArrowVisible ? backArrow.getBoundingClientRect().right : 0;
    const check = () => isArrowVisible && wrapper.getBoundingClientRect().left < (arrowRight + BUFFER);

    // Reset all
    Object.values(btns).forEach(b => { if(b) b.style.display = 'none'; });

    // 1. Try Full + Full
    if (btns.addrFullYes) btns.addrFullYes.textContent = fullAddr;
    show(hasAddr ? btns.addrFullYes : btns.addrFullNo);
    show(hasNet ? btns.netFullYes : btns.netFullNo);

    if (check()) {
      // Step 2: Full Address + Icon Network
      Object.values(btns).forEach(b => { if(b) b.style.display = 'none'; });
      show(hasAddr ? btns.addrFullYes : btns.addrFullNo);
      show(hasNet ? btns.netShrinkYes : btns.netShrinkNo);

      if (check()) {
        // Step 3: Mid Address + Icon Network
        if (hasAddr && fullAddr.length > 10) {
          btns.addrFullYes.textContent = `${fullAddr.slice(0, 6)}...${fullAddr.slice(-4)}`;
        }

        if (check()) {
          // 4. Try Icon + Icon
          Object.values(btns).forEach(b => { if(b) b.style.display = 'none'; }); // Clear previous full network label
          show(hasAddr ? btns.addrShrinkYes : btns.addrShrinkNo);
          show(hasNet ? btns.netShrinkYes : btns.netShrinkNo);

          // NEW STEP 5: Hide both if collision still occurs
          if (check()) {
            Object.values(btns).forEach(b => { if(b) b.style.display = 'none'; });
            // Note: dappControlBtn and dappStatusBtn usually remain visible
            // unless you want to hide the whole wrapper.
          }
        }
      }
    }

    wrapper.style.display = 'flex';
    attachObserver();
  }

  function show(el) { if (el) el.style.display = 'inline-flex'; }

  function attachObserver() {
    const backArrow = document.getElementById('backArrow');
    const wrapper = document.getElementById('dappStatusWrapper');
    if (!observer) observer = new MutationObserver(update);
    if (backArrow) observer.observe(backArrow, { attributes: true, attributeFilter: ['style', 'class'] });
    if (wrapper) observer.observe(wrapper, { attributes: true, childList: true, subtree: true });
  }

  const init = () => {
    window.addEventListener('resize', update);
    attachObserver();
    update();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    refresh: update // This is the 'update' function inside your IIFE
  };
})();
//END TRIAL CODE
