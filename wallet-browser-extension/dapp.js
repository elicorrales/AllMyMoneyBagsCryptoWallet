//dapp.js

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('closeButton');
  if (btn) {
    btn.addEventListener('click', () => {
      window.close();
    });
  }
});


async function populateDeFiList() {
  const ul = document.querySelector('.defi-list-box ul');
  ul.innerHTML = ''; // clear existing items

  // get user-added sites
  const userSites = await SitePersistence.getAllUrls();
  const allSites = [...userSites.map(url => ({ name: url, url }))];

  allSites.forEach(site => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = site.url;
    // removed target="_blank" so it opens in same tab
    a.textContent = site.name;

    // minimal fix: handle chrome:// links
    if (site.url.startsWith("chrome://")) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.tabs.update({ url: site.url });
      });
    }

    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = 'X';
    deleteBtn.title = 'Delete URL';     // tooltip
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.color = '#ff5555';
    deleteBtn.style.marginLeft = '8px';
    deleteBtn.style.fontSize = '1.3em';   

    deleteBtn.onclick = async () => {
      await SitePersistence.removeUrl(site.url);
      populateDeFiList(); // refresh list
    };

    li.appendChild(a);
    li.appendChild(deleteBtn);
    ul.appendChild(li);
  });
}

populateDeFiList();

// Register this dapp window with the background immediately
chrome.runtime.sendMessage({
  type: 'REGISTER',
  from: 'dapp',
  role: 'dapp',
  origin: window.location.origin,
  href: window.location.href
});
