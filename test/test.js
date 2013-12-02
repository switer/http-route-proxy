var proxyServer = require('../server');

proxyServer.proxy([

    {
        from: '10.1.84.165:4836',
        to: 'dev7.ucweb.local:8183',
        route: ['/', '!/public', '!/test']
    },{
        from: 'localhost:4836',
        // to: 'dev7.ucweb.local:8183',
        to: 'dynamic.12306.cn',
        route: ['/']
    }
]);