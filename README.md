http-route-proxy
==========

Convenient HTTP proxy for cross-domain request, request forward.

## Installing

```bash
npm install http-route-proxy
```


## Useing http-route-proxy

__Example__:

```javascript
var proxyServer = require('http-route-proxy');

/**
 *   proxy configs
 */
proxyServer.proxy([
    // common config
    {
        // origin host + port
        from: 'localhost:9000',
        // forward host + port
        to: '192.168.1.1:8088',
        // necessary field
        route: ['/', '!/public', '!/test']
    },
    // host with 80 port
    {
        from: 'localhost:9001',
        to: 'github.io',
        route: ['/']
    }
]);
```

## License

MIT
