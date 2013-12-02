/**
 *   Proxy server module
 */

var httpProxy = require('http-proxy'), // base on nodejitsu proxy server
    staticServer = require('./tools/static'), // static server
    colors = require('colors'), // use to pretty console log
    path = require('path'),
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
    proxies: {
        // from: Object {hostname, name}
        // to: Object {hostname, name}
        // rules: Object {static, forward, rewrite}
    },
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
        HOST: /^[0-9a-zA-Z\.]+\:?[0-9]*$/,
        ROUTE_FORWARD: /^([A-Z]+:)?\/.*$/,
        // static request must be GET method
        ROUTE_STATIC: /^!([A-Z]+:)?\/.*$/
        // ROUTE_REWRITE: /^\^.*/
    },
    str: {
        ROUTE_METHOD_PREFIX: '([A-Z]+:)?'
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

        // init static server
        // var staticServerId = staticServer.init(),
        //     staticServerConfig = staticServer.server[staticServerId];

        // create proxy server
        var server = httpProxy.createServer(function (req, res, proxy) {

            var method = req.method,
                requestURL = req.url,
                url = method.toUpperCase() + ':' + req.url;

            var proxyKey = _this.serverProxiesIndexes[serverId],
                proxyConfig = _this.proxies[proxyKey];

            if (_this.staticMatched(url, proxyConfig.rules.static)) {
                

                var directory = path.resolve(process.cwd(), '.');

                // send static files without server
                staticServer.sendfile(req, res, directory);

                // forward to static server
                // proxy.proxyRequest(req, res, {
                //     host: staticServerConfig.hostname,
                //     port: staticServerConfig.port
                // });

                console.log(method.blue + '  ' + requestURL + ' from '.green.grey +  from.hostname + ':' + from.port.toString().blue);
                
            } else if (_this.forwardMatched(url, proxyConfig.rules.forward)) {

                // forward to remote server
                proxy.proxyRequest(req, res, {
                    host: to.hostname,
                    port: to.port
                });
                console.log('forward '.yellow.grey + method.blue + '  ' + requestURL + ' from '.green.grey +  from.hostname + ':' + from.port.toString().blue + 
                        ' to '.green.grey + to.hostname + ':' + to.port.toString().blue.grey +
                        requestURL);
            }
            else {
                proxy.proxyRequest(req, res, {
                    host: to.hostname,
                    port: to.port
                });
            }
        /**
         *  must listen hostname, otherwise it will be fail when repeat listening 
         *  localhost in the some port
         */
        }, {
            // use client origin
            changeOrigin: true
        }).listen(from.port, from.hostname);

        console.log('Listen from ' + from.hostname.green.grey + ' : ' + from.port.toString().blue.grey + 
                    ' to ' + to.hostname.green.grey + ' : ' + to.port.toString().blue.grey);

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
        var _this = this,
            forwards = [],
            rewrites = [],
            statices = [];

        _.each(routes, function (route) {
            if (_this.regexps.ROUTE_FORWARD.exec(route)) {
                forwards.push(_this.forwardRouteRule2Regexp(route));
            } else if (_this.regexps.ROUTE_STATIC.exec(route)) {
                statices.push(_this.staticRouteRule2Regexp(route));
            }
        });

        return {
            forward: forwards,
            rewrite: rewrites,
            static: statices
        };
    },
    /**
     *   url route rule to regexp
     */
    string2Regexp: function (rule) {
        rule = rule.replace('/','\\/');
        rule = '^' + rule + '.*$';
        return new RegExp(rule);
    },
    staticRouteRule2Regexp: function (rule) {
        var matches = this.regexps.ROUTE_STATIC.exec(rule);

        rule = rule.replace(/^!/, '');

        if (!matches[1]) {
            rule = this.str.ROUTE_METHOD_PREFIX + rule;
        }
        return this.string2Regexp(rule);
    },
    forwardRouteRule2Regexp: function (rule) {
        var matches = this.regexps.ROUTE_FORWARD.exec(rule);

        if (!matches[1]) {
            rule = this.str.ROUTE_METHOD_PREFIX + rule;
        }
        return this.string2Regexp(rule);
    },
    /**
     *   Match url in forward rule
     */
    forwardMatched: function (url, forwardRules) {
        var isMatched = false;
        _.each(forwardRules, function (rule) {
            if (rule.exec(url)) {
                isMatched = true;
                return true;
            }
        });

        return isMatched;
    },
    /**
     *   Match url in static rule
     */
    staticMatched: function (url, staticRules) {
        var isMatched = false;
        _.each(staticRules, function (rule) {
            if (rule.exec(url)) {
                isMatched = true;
                return true;
            }
        });

        return isMatched;
    },
    /**
     *   resolve request url to restfull method
     */
    resolveURL: function () {

    }

}

module.exports = server;