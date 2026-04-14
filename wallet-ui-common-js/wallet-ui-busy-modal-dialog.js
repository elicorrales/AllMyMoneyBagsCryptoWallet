const WalletBusyModal = {

  async show(message = 'Working...', preDelay = 0) {
    const modal = document.getElementById('busyOverlayModal');
    const msg = document.getElementById('busyModalMessage');
    if (!modal || !msg) return;

    if (preDelay > 0) {
      await new Promise(r => setTimeout(r, preDelay));
    }

    msg.textContent = message;
    modal.classList.remove('hidden');

    // let browser paint
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 0));
  },

  hide(delay = 0) {
    const run = async () => {
      const modal = document.getElementById('busyOverlayModal');
      if (modal) {
        modal.classList.add('hidden');
        await new Promise(r => requestAnimationFrame(r)); // ensure hide is rendered
      }
    };

    if (delay > 0) {
      return new Promise(async r => { await run(); setTimeout(r, delay); });
    } else {
      run();
    }
  },

  update(message) {
    const msg = document.getElementById('busyModalMessage');
    if (msg) {
      msg.textContent = message;
    }
  }
};

window.WalletBusyModal = WalletBusyModal;

