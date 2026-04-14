(function() {
    const PREFIX = '_SimpleWebpageCryptoWallet_';
    const config = {
        connected: true,
        chainId: '0x01',
        address: '0xBC2e4c7C6d5295C206045533E2311d1C24984262'
    };

    Object.entries(config).forEach(([key, value]) => {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    });

    console.log(`✅ Storage primed for ${window.location.hostname}`);
    console.table({
        site: window.location.hostname,
        address: config.address,
        chainId: config.chainId,
        status:  config.connected
    });
})();
