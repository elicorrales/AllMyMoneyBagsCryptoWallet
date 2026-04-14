document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('okButton');
  if (btn) {
    btn.addEventListener('click', () => {
      window.close();
    });
  }
});

