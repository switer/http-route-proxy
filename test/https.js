var httpProxy = require('http-proxy');

var options = {
    changeOrigin: true,
    target: {
        https: true
    }
}

httpProxy.createServer(options, function (req, res, proxy) {
    proxy.proxyRequest(req, res, {
        host: 'github.com',
        port: 443
    });
}).listen(9001);
