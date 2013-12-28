var proxyServer = require('../server');

/**
 *   proxy configs
 */
proxyServer.proxy([
    {
        from: 'localhost:9012',
        to: 'https://www.google.com'
    },
    {
        from: 'localhost:9001',
        to: 'google.com'
        route: [
            '/', // forward config.to
            '!/public', // forward local static files 
            {
                action: '/otn',
                forward: 'www.google.com'
                headers: {
                    req: {Origin: 'www.google.com'}
                },
                https: true
            }
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