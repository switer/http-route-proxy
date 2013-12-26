var proxyServer = require('../server');

/**
 *   proxy configs
 */
proxyServer.proxy([
    {
        from: 'localhost:9012',
        to: 'www.google.com',
        https: true
    },
    {
        form: 'localhost:9003',
        to: 'www.google.com',
        route: [
            'www.google.com/',
            'weibo.com/post',
            '!/public'
        ]

    },
    // common config
    {
        // origin host + port
        from: 'localhost:9002',
        // forward host + port
        to: 'localhost:9012',
        // reset headers
        headers: {
            req: {
                origin: 'www.google.com',
                referer: 'www.google.com'
            }
        }
    },
    // host with 80 port
    {
        from: 'localhost:9001',
        to: 'github.com',
        https: true
    }
]);