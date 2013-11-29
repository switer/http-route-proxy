/**
 *   Proxy server module
 */

var httpProxy = require('http-proxy'), // base on nodejitsu proxy server
    colors = require('colors'), // use to pretty console log
    _ = require('underscore'); // use each method.....

var server = {

    /**
     *   id for each proxy server
     */
    serverId: 1,
    /**
     *   mapping root
     */
    rules: {},
    /**
     *   marked proxy host
     */
    proxies: {},
    /**
     *   a server to proxies indexes
     */
    serverProxiesIndexes: {},
    /**
     *   defualt port when config port is not pass in
     */
    defaultPort: 80,
    /**
     *   module regexps
     */
    regexps: {
        // validate host string
        HOST: /^\s*[0-9a-zA-Z\.]+\:?[0-9]*\s*$/,
    },
    /**
     *   @param hosts[
     *                  {from: "0.0.0.0:8088", to: "github.com"},
     *                  {from: "baidu.com:8000", to: "github.com"}
     *               ]
     */
    proxy: function (hosts) {
        var _this = this;

        _.each(hosts, function (hostConfig) {

            var hostObj = {
                from: _this.parseHost(hostConfig.from),
                to: _this.parseHost(hostConfig.to)
            }

            var serverId = _this.create(hostObj.from, hostObj.to);

            _this.saveHost(hostConfig, serverId);

        });
    },
    /**
     *   create a server for the one proxy config
     */
    create: function (from, to) {

        var serverId = this.serverId, // for serverid hoisting

            _this = this; // for hoisting context of `this`

        var server = httpProxy.createServer(function (req, res, proxy) {

            var url = req.url;

            var proxyKey = _this.serverProxiesIndexes[serverId],
                proxyConfig = _this.proxies[proxyKey];

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

        return this.serverId ++;
    },
    /**
     *   rerturn the hostname + port format array
     */
    // parseHosts: function (hosts) {
    //     var parseResult = [],
    //         _this = this;

    //     _.each(hosts, function (item) {
    //         parseResult.push({
    //             from: _this.parseHost(item.from),
    //             to: _this.parseHost(item.to),
    //         });
    //     });

    //     return parseResult;
    // },
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
    },
    /**
     *   save each host config
     */
    saveHost: function (config, serverId) {

        // craete host proxy config key
        var proxyKey = [config.from, config.to].join('->');

        // save proxy config
        this.proxies[proxyKey] = {

            from: this.parseHost(config.from),
            to: this.parseHost(config.to),
            rules: this.parseRouteRule(config.route)
            
        };

        // serverid to proxies key indexes
        this.serverProxiesIndexes[serverId] = proxyKey;
    },
    /**
     *   validate host string
     */
    validHost: function (host) {
        return this.regexps.HOST.exec(host) ? true : false;
    },
    /**
     *   parse each route rule to url matched rule
     */
    parseRouteRule: function (routes) {
        var _this = this;
        _.each(routes, function (route) {

        });
    }
}

module.exports = server;