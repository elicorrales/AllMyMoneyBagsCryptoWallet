// site-persistence.js

const SitePersistence = {
  KEY: 'authorized_dapps',

  // REQUIRED entries that must always exist
  REQUIRED_URLS: [
    'chrome://extensions/',
    'chrome://settings/content/all'
  ],

  /**
   * Adds a URL to the persistent list
   * - new sites go to the top
   * - existing sites move to the top
   * Cleans input to basic origin (e.g., https://example.com)
   */
  async addUrl(url) {
    try {
      const origin = new URL(url).origin;
      const list = await this.getAllUrls();

      // remove required urls before manipulating order
      const filtered = list.filter(u => !this.REQUIRED_URLS.includes(u));

      // remove if already present
      const without = filtered.filter(u => u !== origin);

      // add to top
      const updated = [origin, ...without];

      await chrome.storage.local.set({ [this.KEY]: updated });
    } catch (e) {
      console.error('[SitePersistence] Invalid URL provided:', url);
    }
  },

  /**
   * Removes a URL from the persistent list
   */
  async removeUrl(url) {
    try {
      const origin = new URL(url).origin;
      const list = await this.getAllUrls();
      const updated = list.filter(item => item !== origin);
      await chrome.storage.local.set({ [this.KEY]: updated });
    } catch (e) {
      console.error('[SitePersistence] Invalid URL provided:', url);
    }
  },

  /**
   * Retrieves the current list of URLs from disk
   * - user sites first (in stored order)
   * - required chrome:// urls always last
   */
  async getAllUrls() {
    const result = await chrome.storage.local.get(this.KEY);
    const list = result[this.KEY] || [];

    // remove required urls from stored list
    const filtered = list.filter(url => !this.REQUIRED_URLS.includes(url));

    // append required urls at the end
    return [...filtered, ...this.REQUIRED_URLS];
  },

  /**
   * Clears the entire list
   */
  async clear() {
    await chrome.storage.local.remove(this.KEY);
  }
};
