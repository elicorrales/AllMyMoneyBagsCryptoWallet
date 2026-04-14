// wallet-new-select-ui-password-panel.js

const WalletNewSelectPasswordPanel = (function () {
  let _initialized = false;
  let _failedAttempts = 0; // track bad tries

  async function setupToAuthenticateUser(panelToShowIfAuthenticated) {
    WalletUiPanel.show('newSelectPasswordPanel');

    const mainPasswordInput = document.getElementById('mainPasswordInput');
    const mainPasswordContinueBtn = document.getElementById('mainPasswordContinueBtn');
    const mainPasswordError = document.getElementById('mainPasswordError');
    const toggleMainPasswordVisibility = document.getElementById('toggleMainPasswordVisibility');

    if (mainPasswordInput && mainPasswordContinueBtn && mainPasswordError) {
      // Show/hide password toggle
      if (toggleMainPasswordVisibility) {
        toggleMainPasswordVisibility.addEventListener('click', () => {
          if (mainPasswordInput.type === 'password') {
            mainPasswordInput.type = 'text';
            toggleMainPasswordVisibility.textContent = 'Hide password';
          } else {
            mainPasswordInput.type = 'password';
            toggleMainPasswordVisibility.textContent = 'Show password';
          }
        });
      }

      // Enable Continue button if input not empty
      mainPasswordInput.addEventListener('input', () => {
        mainPasswordContinueBtn.disabled = mainPasswordInput.value.trim() === '';
        mainPasswordError.textContent = '';
      });

      // Allow Enter key to trigger Continue
      mainPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !mainPasswordContinueBtn.disabled) {
          mainPasswordContinueBtn.click();
        }
      });

      // On click: verify, then show crypto list panel and update page-level UI
      mainPasswordContinueBtn.addEventListener('click', async () => {

        await WalletBusyModal.show("Authenticating.....");

        // Give browser a chance to paint the modal/spinner
        await new Promise(r => requestAnimationFrame(r));

        try {
          const password = mainPasswordInput.value;
          const walletsObj = WalletPersistence.walletManager.getAllWallets();
          const wallets = Object.values(walletsObj);

          let authenticated = false;
          for (const wallet of wallets) {
            const encrypted = wallet.encryptedMnemonic;
            try {
              await WalletCore.decryptMnemonic(encrypted, password);
              WalletBusyModal.hide();
              // At least one wallet authenticated user
              WalletUiPanel.show(panelToShowIfAuthenticated);
              WalletAppState.password = password;
              authenticated = true;
              //if "loggedin" (authenticated), show the hamburger Menu
              WalletPageLevelUI.updatePageLevelUI(WalletAppState.password !== null);

              _failedAttempts = 0; // reset on success
              return;
            } catch {
              WalletBusyModal.hide();
              // wrong password, try next wallet
            }
          }

          if (!authenticated) {
            _failedAttempts++;
            if (_failedAttempts >= 3) {
              WalletInfoModal.show({
                message: "Too many failed attempts. Closing app.",
                redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
              });
            } else {
              mainPasswordError.textContent = `Incorrect password. Attempts left: ${3 - _failedAttempts}`;
              mainPasswordInput.value = '';
              mainPasswordInput.focus();
            }
          }
        } catch (err) {
          WalletBusyModal.hide();
          WalletInfoModal.show({
            message: `Authentication Error:${err}`,
            redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
          });
        }
      });
    }
  }

  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;
  }

  function onDomReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  onDomReady(initOnceDomReady);

  return {
    setupToAuthenticateUser,
  };
})();

