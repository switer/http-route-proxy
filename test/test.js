var proxyServer = require('../server');

proxyServer.proxy([
    // 'POST:/'
    // 'POST:*'
    // 'GET:/public'
    // '!POST:/public'
    {
        from: '10.1.84.165:4836',
        to: 'dev7.ucweb.local:8183',
        route: ['/', '!/public', '!/test']
    }
]);

// proxyServer.cross({
//     origin: ['10.1.84.165:4836', 'localhost:8088'],
//     to: 'github.io'
// });