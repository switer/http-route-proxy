http-route-proxy
==========

Convenient HTTP/HTTPS route proxy for cross-domain request, request forward.Support using as express connect middleware.

### Installing

```bash
npm install http-route-proxy
```

### Testing

```bash
npm test
```

### Using http-route-proxy

#### Sample:

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
        // match forward action rule
        // `"/"` means forward match all actions, 
        // `!/public` means match local static forward match `/public.*`
        route: ['/', '!/public']
    }
]);
```

#### Set Headers
```javascript
proxyServer.proxy([
    {
        from: 'localhost:9000',
        to: 'www.google.com',
        https: true,
        headers: {
            req: {origin: 'www.google.com', referer: 'www.google.com'},
            res: {'access-control-allow-origin': 'https://www.google.com', 'access-control-allow-credentials': true}
        }
    }
]);
```

#### Using HTTPS
```javascript
proxyServer.proxy([
    {
        from: 'localhost:9000',
        to: 'www.google.com',
        https: true
    }
]);
// or
proxyServer.proxy([
    {
        from: 'localhost:9000',
        to: 'https://www.google.com'
    }
]);
```

#### Forward By Request Path
Forward to various host on matching the path action

```javascript
proxyServer.proxy([
    {
        from: 'localhost:9000',
        to: 'www.google.com',
        route: [
            {
                action: '/switer',
                forward: 'https://github.com',
                headers: {
                    req: {origin: 'https://github.com'}
                }
            },
            {
                action: '/imper',
                forward: 'https://switer.github.io',
                headers: {
                    req: {origin: 'https://github.io'}
                }
            },
            '!/public'
        ]
    }
]);
```

#### Using as express connect middleware
__express app.js config:__
Push it on the first of connect

```javascript
app.use(proxyServer.connect({
  to: 'www.google.com',
  https: true,
  route: ['/']
}));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
```

### Change Log

#### Version 0.2.0 - 2015/08/26
- [Bug]: Fixed bug when using as express middleware sometimes base-url will be stripped off. 

#### Version 0.1.1 - 2013/12/30

- [Feature]: Support using as express connect middleware

#### Version 0.1.0 - 2013/12/28

- [Feature]: Forward to various host on matching the path action.

#### Version 0.0.6-1 - 2013/12/26

- [Feature]: route field isn't necessary and it has defualt value of `['/']`

#### Version 0.0.6 - 2013/12/26

- [Feature]: Support set request and response headers

#### Version 0.0.5-1 - 2013/12/26

- [Fixed bug]: route proxy http to https website which certificate has not been unauthorized will be response error

#### Version 0.0.5 - 2013/12/25

- [Feature]: Support https route proxy

#### Version 0.0.4 - 2013/12/18

- [Feature]: Support cross-domain request


### License

The MIT License (MIT)

Copyright (c) 2013 `guankaishe`

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

