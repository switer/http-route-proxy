var proxyServer = require('http-route-proxy');

proxyServer.proxy([
    // common
    {
        from: 'localhost:9000',
        to: 'dev7.ucweb.local:8183',
        route: ['/', '!/public', '!/test']
    },
    // 80 port
    {
        from: 'localhost:9001',
        to: 'github.io',
        route: ['/']
    }
]);