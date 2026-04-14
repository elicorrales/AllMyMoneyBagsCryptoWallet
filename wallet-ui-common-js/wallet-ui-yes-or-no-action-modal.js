// walletYesOrNoAction.js

const WalletYesOrNoAction = (function () {
  const modal = document.getElementById("yesOrNoOverlayModal");
  const titleEl = modal.querySelector("h3");
  const detailsEl = modal.querySelector("p");
  const itemsEl = document.getElementById("yesOrNoDetails");
  const negativeBtn = document.getElementById("yesOrNoNegativeBtn");
  const positiveBtn = document.getElementById("yesOrNoPositiveBtn");

  function hideModal() {
    modal.classList.add("hidden");
  }

  function showModal({ message, details = "", negative, positive, onNegative = null, onPositive }) {
    console.log('\n\n message: ', message, '\n\n');
    // Reset styling first
    titleEl.style.whiteSpace = "normal";
    detailsEl.style.whiteSpace = "normal";

    const messageHasHtml = /<[a-z][\s\S]*>/i.test(message);
    const messageHasNewline = message.includes("\n");
    if (messageHasHtml) {
        // Use innerHTML if tags are detected
        titleEl.innerHTML = message;
    } else if (messageHasNewline) {
        // Use textContent + CSS white-space for \n
        titleEl.textContent = message;
        titleEl.style.whiteSpace = "pre-line";
    } else {
        // Default behavior
        titleEl.textContent = message;
    }

    const detailsHasHtml = /<[a-z][\s\S]*>/i.test(details);
    const detailsHasNewline = details.includes("\n");
    if (detailsHasHtml) {
        // Use innerHTML if tags are detected
        detailsEl.innerHTML = details;
    } else if (detailsHasNewline) {
        // Use textContent + CSS white-space for \n
        detailsEl.textContent = details;
        detailsEl.style.whiteSpace = "pre-line";
    } else {
        // Default behavior
        detailsEl.textContent = details;
    }

    negativeBtn.textContent = negative;
    positiveBtn.textContent = positive;

    // clear previous listeners
    negativeBtn.onclick = null;
    positiveBtn.onclick = null;

    negativeBtn.onclick = () => {
      hideModal();
      if (typeof onNegative === "function") onNegative();
    };

    positiveBtn.onclick = () => {
      hideModal();
      if (typeof onPositive === "function") onPositive();
    };

    modal.classList.remove("hidden");
  }

  // --- UPDATED ADDITION ---
  function showAndBlock({ message, details, negative, positive, onNegative = null, onPositive = null }) {
    return new Promise((resolve) => {
      showModal({
        message,
        details,
        negative,
        positive,
        onNegative: () => {
          if (typeof onNegative === "function") onNegative();
          resolve(false); // Resolve Promise with false
        },
        onPositive: () => {
          if (typeof onPositive === "function") onPositive();
          resolve(true);  // Resolve Promise with true
        },
      });
    });
  }
  // --------------------

  return {
    showModal,
    showAndBlock, // <-- Added to return object
  };
})();

