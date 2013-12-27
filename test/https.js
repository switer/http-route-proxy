var httpProxy = require('http-proxy');

var options = {
    changeOrigin: true,
    target: {
        https: true,
        rejectUnauthorized: false
    }
}

// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
httpProxy.createServer(options, function (req, res, proxy) {
    proxy.proxyRequest(req, res, {
        host: 'www.12306.cn',
        port: 443
    });
}).listen(9001);
