// wallet-ui-new-password-panel.js

//document.addEventListener('DOMContentLoaded', () => {
(document.readyState === 'loading' ? document.addEventListener.bind(document, 'DOMContentLoaded') : fn => fn())(() => {
  const pwdInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const toggleEl = document.getElementById('toggleNewPasswordVisibility');
  const skipLengthCheckbox = document.getElementById('skipLengthCheckCheckbox');
  const continueBtn = document.getElementById('passwordContinueBtn');
  const messageEl = document.getElementById('message');
  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');

  const iterationSlider = document.getElementById('iterationSlider');
  const iterationLabel = document.getElementById('iterationLabel');
  const hardenHelpIcon = document.getElementById('hardenHelpIcon');
  const resetHelpIcon = document.getElementById('resetHelpIcon');

  // passwordHelpPanel and the Help link
  const passwordHelpPanel = document.getElementById('passwordHelpPanel');
  const passwordHelpLink = document.getElementById('passwordHelpLink');


  // Try This links
  const tryThisPhrase1 = document.getElementById('tryThisPhrase1');
  const tryThisPhrase2 = document.getElementById('tryThisPhrase2');

  // Ensure all required elements exist before wiring up
  if (!pwdInput || !confirmInput || !toggleEl || !skipLengthCheckbox || !continueBtn || !messageEl || !strengthBar || !strengthLabel || !passwordHelpPanel || !passwordHelpLink || !tryThisPhrase1 || !tryThisPhrase2 || !iterationSlider || !iterationLabel) return;

  // Handle Argon2 slider for existing vs new users
  if (WalletPersistence.argon2SliderLevelIsSet) {
    // Existing wallet: lock slider to stored value
    iterationSlider.value = WalletPersistence.selectedArgon2SliderLevel;
    iterationSlider.disabled = true;
    updateIterationLabel(WalletPersistence.selectedArgon2SliderLevel);
  } else {
    // New install: compute default slider index
    let defaultIndex = 0;

    if (WalletPersistence.estimatedArgon2Delays) {
      const delays = WalletPersistence.estimatedArgon2Delays;
      const found = delays.findIndex(ms => ms > 3000 && ms < 4000);
      if (found !== -1) {
        defaultIndex = found;
      } else {
        // fallback: pick closest to 3500ms
        const target = 3500;
        let minDiff = Infinity;
        delays.forEach((ms, i) => {
          const diff = Math.abs(ms - target);
          if (diff < minDiff) {
            minDiff = diff;
            defaultIndex = i;
          }
        });
      }
    }

    WalletPersistence.selectedArgon2SliderLevel = defaultIndex;
    iterationSlider.value = defaultIndex;
    updateIterationLabel(defaultIndex);
  }

  function updateIterationLabel(index) {
    let label = `Level ${index + 1}`;
    if (WalletPersistence.estimatedArgon2Delays) {
      const seconds = (WalletPersistence.estimatedArgon2Delays[index] / 1000).toFixed(1);
      label += ` (~${seconds}s)`;
    }
    iterationLabel.textContent = label;
  }

  hardenHelpIcon.addEventListener('click', () => {
    WalletInfoModal.show({
      message: "Better seed-phrase-protection increases some delays you will notice.\nIt also makes it harder for attackers.",
      imageSrc: "images/harden-help.jpg",
      imageAlt: "Harden Slider Explanation"
    });
  });
  resetHelpIcon.addEventListener('click', () => {
    WalletInfoModal.show({
      message: "To change seed-phrase-protection level, you have to start over.\nYou have clear everything.",
      imageSrc: "images/reset-help.jpg",
      imageAlt: "Reset Help Explanation"
    });
  });

  iterationSlider.addEventListener('input', () => {
    const index = parseInt(iterationSlider.value, 10);
    WalletPersistence.selectedArgon2SliderLevel = index;
    updateIterationLabel(index);
  });

  toggleEl.addEventListener('click', () => {
    // Flip the visibility flag
    WalletAppState.passwordVisible = !WalletAppState.passwordVisible;

    // Determine new <input> type
    const newType = WalletAppState.passwordVisible ? 'text' : 'password';

    // Apply to both password fields
    pwdInput.type = newType;
    confirmInput.type = newType;
    toggleEl.textContent = WalletAppState.passwordVisible ? 'Hide passwords' : 'Show passwords';
  });

  // handle clicking the Help link to toggle passwordHelpPanel visibility AND toggle link text
  passwordHelpLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (passwordHelpPanel.style.display === 'block') {
      passwordHelpPanel.style.display = 'none';
      passwordHelpLink.textContent = 'Help Me With My Password';
    } else {
      passwordHelpPanel.style.display = 'block';
      passwordHelpLink.textContent = 'Hide Password Help';
    }
  });

  // handlers for "Try this?" links
  tryThisPhrase1.addEventListener('click', (e) => {
    e.preventDefault();
    pwdInput.value = 'I love my pet';
    confirmInput.value = 'I love my pet';
    pwdInput.dispatchEvent(new Event('input'));
  });

  tryThisPhrase2.addEventListener('click', (e) => {
    e.preventDefault();
    pwdInput.value = 'MySecure!Pass#482';
    confirmInput.value = 'MySecure!Pass#482';
    pwdInput.dispatchEvent(new Event('input'));
  });

  const updateStrengthUI = (password) => {
    const result = zxcvbn(password);
    WalletAppState.lastPasswordScore = result.score;
    const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const colors = ['red', 'orangered', 'orange', 'yellowgreen', 'green'];
    const widths = ['20%', '40%', '60%', '80%', '100%'];
    strengthBar.style.width = widths[result.score];
    strengthBar.style.backgroundColor = colors[result.score];
    strengthLabel.textContent = levels[result.score];
  };

  const validatePasswordLength = () => {
    const len = pwdInput.value.length;
    const allowShort = skipLengthCheckbox.checked;

    // Update strength UI on every input
    updateStrengthUI(pwdInput.value);

    // If user hasn't typed anything yet, clear any message and keep button disabled
    if (len === 0) {
      messageEl.textContent = '';
      continueBtn.disabled = true;
      checkMatch(); // to reset confirm styling
      return;
    }

    const score = WalletAppState.lastPasswordScore;
    if (score < 2) {
      messageEl.textContent = 'Password is too weak. Try making it longer or using more variety.';
      messageEl.style.color = 'red';
      continueBtn.disabled = true;
      checkMatch(); // still allow confirm styling to update
      return;
    }

    if (!allowShort && len < 22) {
      messageEl.textContent = 'Password must be at least 22 characters.';
      messageEl.style.color = 'red';
      continueBtn.disabled = true;
    } else {
      messageEl.textContent = '';
      // Defer enabling until match check
      continueBtn.disabled = true;
    }

    // Re-check match styling
    checkMatch();
  };

  const checkMatch = () => {
    const pwd = pwdInput.value;
    const confirm = confirmInput.value;

    // If confirm is empty, no mismatch styling or message
    if (confirm === '') {
      confirmInput.style.backgroundColor = '';
      // Only clear message if it was showing mismatch
      if (messageEl.textContent === 'Passwords do not match.') {
        messageEl.textContent = '';
      }
      return;
    }

    if (pwd !== confirm) {
      confirmInput.style.backgroundColor = 'pink';
      messageEl.textContent = 'Passwords do not match.';
      messageEl.style.color = 'red';
      continueBtn.disabled = true;
    } else {
      confirmInput.style.backgroundColor = '';
      // Clear mismatch message if present
      if (messageEl.textContent === 'Passwords do not match.') {
        messageEl.textContent = '';
      }
      // If length and strength check is OK, re-enable continue
      const len = pwd.length;
      const allowShort = skipLengthCheckbox.checked;
      const score = WalletAppState.lastPasswordScore;
      if ((allowShort || len >= 22) && score >= 2) {
        messageEl.textContent = '';
        continueBtn.disabled = false;
      }
    }
  };

  pwdInput.addEventListener('input', () => {
    validatePasswordLength();
  });

  skipLengthCheckbox.addEventListener('change', () => {
    validatePasswordLength();
  });

  confirmInput.addEventListener('input', () => {
    checkMatch();
  });

  continueBtn.addEventListener('click', eventHandlerPasswordContinue);

  // Initial state: no message, button disabled
  messageEl.textContent = '';
  continueBtn.disabled = true;
});

function eventHandlerPasswordContinue() {
  const pwdInput = document.getElementById('password');
  if (pwdInput) {
    WalletAppState.password = pwdInput.value;
  }
  WalletUiPanel.show('walletChoice');
}

