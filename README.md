http-route-proxy
==========

Convenient HTTP proxy for cross-domain request, request forward.

## Installing

```bash
npm install http-route-proxy
```

## Testing

```bash
npm test
```

## Using http-route-proxy

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
        // necessary field, match forward action rule
        route: ['/', '!/public', '!/test']
    },
]);
```

## Set Headers
proxyServer.proxy([
    {
        from: 'localhost:9000',
        to: 'www.google.com',
        https: true,
        headers: {
            req: {origin: 'www.google.com', referer: 'www.google.com'},
            res: {'access-control-allow-origin': 'https://www.google.com', 'access-control-allow-credentials': true}
        },
        route: ['/']
    },
]);

## Using HTTPS
proxyServer.proxy([
    {
        from: 'localhost:9000',
        to: 'www.google.com',
        https: true,
        route: ['/']
    },
]);

## License

MIT
