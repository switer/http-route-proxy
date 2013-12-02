var http = require('http'),
    send = require('send'),
    url = require('url'),
    path = require('path');

var staticServer = {

    serverId: 0,

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
            directory = path.resolve(__dirname, directory);
            // response file sending
            _this.sendfile(req, res, directory);

        }).listen(port, hostname);
        // marked server instance id
        return serverId;
    },
    sendfile: function (req, res, directory) {
        function error(err) {
            res.statusCode = err.status || 500;
            console.error(err.message);
            res.end(err.message);
        }

        function redirect() {
            res.statusCode = 301;
            res.setHeader('Location', req.url + '/');
            res.end('Redirecting to ' + req.url + '/');
        }
        return send(req, url.parse(req.url).pathname)
            .root(directory)
            .on('error', error)
            .on('directory', redirect)
            .pipe(res);
    }
}

module.exports = staticServer;
