var proxyServer = require('../server');

/**
 *   proxy configs
 */
proxyServer.proxy([
    {
        from: 'localhost:9012',
        to: 'www.12306.cn',
        // to: 'unionpaysecure.com',
        https: true,
        route: ['/']
    },
    // common config
    {
        // origin host + port
        from: 'localhost:9002',
        // forward host + port
        to: 'www.12306.cn',
        // necessary field
        route: ['/', '!/public', '!/test']
    },
    // host with 80 port
    {
        from: 'localhost:9001',
        to: 'github.com',
        https: true,
        route: ['/']
    }
]);