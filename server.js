var httpProxy = require('http-proxy'),
    colors = require('colors'),
    _ = require('underscore');

var server = {

    /**
     *   mapping root
     */
    rules: {

    },
    /**
     *   defualt port when config port is not pass in
     */
    defaultPort: 80,
    /**
     *   @param hosts[
     *                  {from: "0.0.0.0:8088", to: "github.com"},
     *                  {from: "baidu.com:8000", to: "github.com"}
     *               ]
     */
    proxy: function (hosts) {
        var hostsArray = this.parseHosts(hosts),
            _this = this;

        _.each(hostsArray, function (hostConfig) {
            _this.create(hostConfig.from, hostConfig.to);
        });
    },
    /**
     *   create a server for the one proxy config
     */
    create: function (from, to) {
        var server = httpProxy.createServer(function (req, res, proxy) {
            proxy.proxyRequest(req, res, {
                host: to.hostname,
                port: to.port
            });
        /**
         *  must listen hostname, otherwise it will be fail when repeat listening 
         *  localhost in the some port
         */
        }).listen(from.port, from.hostname); 

        console.log('Listen -> ' + from.hostname.green.grey + ' : ' + from.port.toString().blue.grey + 
                    ' forward ' + to.hostname.green.grey + ' : ' + to.port.toString().blue.grey);
    },
    /**
     *   rerturn the hostname + port format array
     */
    parseHosts: function (hosts) {
        var parseResult = [],
            _this = this;

        _.each(hosts, function (item) {
            parseResult.push({
                from: _this.parseHost(item.from),
                to: _this.parseHost(item.to),
            });
        });

        return parseResult;
    },
    /**
     *   host is a string, should be parse to hostname + port object format
     */
    parseHost: function (host) {
        var hostname = host.split(':')[0],
            port = host.split(':')[1];

        return {
            hostname: hostname,
            port: port ? parseInt(port) : this.defaultPort
        };
    }
}

module.exports = server;