var http = require('http'),
    send = require('send'),
    url = require('url'),
    colors = require('colors'),
    path = require('path');

var staticServer = {

    // server id with increasing
    serverId: 0,
    // serverr config with serverId as key
    server: {},

    init: function (hostname, port, options) {
        hostname = hostname || 'localhost';
        port = port || 9000;
        options = options || {};

        var directory = options.directory || '.',
            serverId = this.serverId ++;

        this.server[serverId] = {
            hostname: hostname,
            port: port,
            directory: directory
        };

        var _this = this;
        http.createServer(function(req, res) {
            // resolve root directory to local path 
            directory = path.resolve(process.cwd(), directory);
            // response file sending
            _this.sendfile(req, res, directory);

        }).listen(port, hostname);
        // marked server instance id
        return serverId;
    },
    /**
     *   send static file or directory which is requested
     */
    sendfile: function (req, res, directory) {
        // error handler
        function error(err) {
            res.statusCode = err.status || 500;
            err.message && console.log(err.message.red);
            res.end(err.message);
        }
        // directory redirect handler
        function redirect() {
            res.statusCode = 301;
            res.setHeader('Location', req.url + '/');
            res.end('Redirecting to ' + req.url + '/');
        }
        // send
        return send(req, url.parse(req.url).pathname)
            .root(directory)
            .on('error', error)
            .on('directory', redirect)
            .pipe(res);
    }
}

module.exports = staticServer;
