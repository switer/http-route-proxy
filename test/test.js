var proxyServer = require('../server');

/**
 *   proxy configs
 */
proxyServer.proxy([
    // {
    //     from: 'localhost:9004',
    //     to: 'https://www.google.com'
    // },
    {
        from: 'localhost:9004',
        to: 'https://kyfw.12306.cn'
    },
    {
        from: 'localhost:9003',
        route: [{
                action: '/',
                forward: 'https://www.google.com'
            },
            '!/public', // forward to local static files
            {
                action: '/otn',
                forward: 'localhost:9004',
                headers: {
                    req: {
                        origin: 'https://kyfw.12306.cn/',
                        referer: 'https://kyfw.12306.cn/'
                    }
                }
            }, {
                action: '/otn/login/init',
                forward: 'kyfw.12306.cn',
                headers: {
                    req: {
                        Origin: 'kyfw.12306.cn'
                    },
                    res: {
                        Doo: 'guankaishe'
                    }
                }
            }
        ]
    },
    // common config
    {
        // origin host + port
        from: 'localhost:9002',
        // forward host + port
        to: 'www.google.com',
        // protocal option
        https: true,
        // reset headers
        headers: {
            req: {
                origin: 'https://www.google.com',
                referer: 'https://www.google.com'
            },
            res: {
                Doo: 'www.google.com'
            }
        }
    },
    // host with 80 port
    {
        from: 'localhost:9001',
        to: 'github.com',
        https: true,
        headers: {
            req: {
                origin: 'https://github.com',
                referer: 'https://github.com'
            }
        }
    }
]);
