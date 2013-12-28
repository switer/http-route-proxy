/**
 *  http-route-proxy
 *  http://github.com/switer/http-route-proxy
 *
 *  Copyright (c) 2013 "switer" guankaishe
 *  Licensed under the MIT license.
 *  https://github.com/switer/http-route-proxy/blob/master/LICENSE
 */

var httpProxy = require('http-proxy'), // base on nodejitsu proxy server
    staticServer = require('./tools/static'), // static server
    util = require('./tools/util'),
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
     *  defualt port for https
     */
    defualtHttpsPort: 443,
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

        // handle each proxy config
        _.each(hosts, function (hostConfig) {

            var hostObj = {
                from: _this.parseHost(hostConfig.from),
                routes: _this.parseRouteRule(hostConfig)
            }

            var serverId = _this.create(hostObj.from, hostObj.routes, hostConfig);
            _this.saveHost(hostObj.from, hostObj.routes, serverId);

        });
    },
    /**
     *   create a server for the one proxy config
     */
    create: function (from, routes, options) {

        var serverId = this.serverId, // for serverid hoisting
            // proxy server options
            proxyOptions = {
                // use client origin
                changeOrigin: true,
                target: {
                    // https: true,
                    // rejectUnauthorized: false
                }
            },
            _this = this; // for hoisting context of `this`
        // nessary for fixing node-http-proxy rejectUnauthorized option not work bug
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        // create proxy server
        var server = httpProxy.createServer(
            /**
             *  middleware
             *  Cross-Domain-Access
             */
            function (req, res, next) {
                // TODO
                next();
            }, 
            function (req, res, proxy) {

            var method = req.method,
                requestURL = req.url,
                url = method.toUpperCase() + ':' + req.url,
                forwardRouteObj = null;

            // var proxyKey = _this.serverProxiesIndexes[serverId],
            var proxyConfig = _this.proxies[serverId];


            if (_this.staticMatched(url, proxyConfig.rules.static)) {
                // match route is static file response
                var directory = path.resolve(process.cwd(), '.');

                // send static files without server
                staticServer.sendfile(req, res, directory);

                console.log(method.blue.grey + '  ' + requestURL + ' from '.green.grey +  from.hostname + ':' + from.port.toString().blue.grey);
                
            } else if (forwardRouteObj = _this.forwardMatched(url, proxyConfig.rules.forward)) {
                // set headers of config
                _this.setHeaders(req, res, forwardRouteObj.options.headers);

                var forwardObj = forwardRouteObj.forward,
                    // forward options
                    proxyForwardOptions = {
                        changeOrigin: true,
                        host: forwardObj.hostname,
                        port: forwardObj.port
                    };

                if (forwardRouteObj.options.https) {
                    // set https forward options
                    proxyForwardOptions = _.extend(proxyForwardOptions, {
                        target: {
                            https: true,
                            rejectUnauthorized: false
                        }
                    });
                }

                // forward to remote server
                proxy.proxyRequest(req, res, proxyForwardOptions);

                console.log('forward '.yellow.grey + method.blue.grey + '  ' + requestURL + ' from '.green.grey +  from.hostname + ':' + 
                        from.port.toString().blue.grey +' to '.green.grey + forwardObj.protocal + '://' + forwardObj.hostname + ':' + forwardObj.port.toString().blue.grey +
                        requestURL);
            }
            else {

                console.log('Sorry proxy error, the proxy cause that error, please check your'.red); 
            }
        /**
         *  must listen hostname, otherwise it will be fail when repeat listening 
         *  localhost in the some port
         */
        })
          .listen(from.port, from.hostname)
          .on('error', function (e) {
            // catch server listen error
            console.log('Create proxy error,'.red.grey + "cause by can't listen host from " + 
                from.hostname.yellow.grey + ' : ' + from.port.toString().blue.grey);
          });
        
        console.log('Listen from ' + from.hostname.green.grey + ' : ' + from.port.toString().blue.grey);

        server.proxy.on('proxyError', function (err, req, res) {
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });

            res.end('Something went wrong. And we are reporting a custom error message.\n' + err); 
        });

        return this.serverId ++;
    },
    /**
     *  Set headers by proxy config
     */
    setHeaders: function (req, res, headers) {
        var reqHeaders = headers && headers.req ? headers.req: {},
            resHeaders = headers && headers.res ? headers.res: {},
            origin = req.headers.origin || req.headers.host;

        // if exist Origin, use "Cross-Domain-Access"
        if (origin) {
            // currently, we only support receiving http request
            res.setHeader('access-control-allow-origin', 'http://' + origin);
            res.setHeader('access-control-allow-credentials', true);
        }
        //rewrite header on config
        if (headers) {
            _.each(reqHeaders, function (value, key) {
                req.headers[key] = value;
            });
            _.each(resHeaders, function (value, key) {
                res.setHeader(key, value);
            });
        }
        // avoid node-http-proxy to rewrite headers
        var setHeader = res.setHeader;
        res.setHeader = function (key, value) {
            if (!resHeaders[key]) setHeader.call(res, key, value);
        }

    },
    /**
     *   host is a string, should be parse to hostname + port object format
     */
    parseHost: function (host, options) {
        options = options || {};

        var hostChunks = host.match(/^([a-z]+)\:\/\/(.*)$/),
            protocal = hostChunks? hostChunks[1]: '',
            hostSection = hostChunks? hostChunks[2]: host,
            hostname = hostSection.split(':')[0],
            port = hostSection.split(':')[1],
            protocalObj = this.protocal(protocal),
            protocalOptions = protocalObj.unknow ? options: protocalObj;

        return {
            protocal: this.options2protocal(protocalOptions),
            protocalOption: protocalOptions,
            hostname: hostname,
            port: port ? parseInt(port) : (protocalOptions.https ? this.defualtHttpsPort : this.defaultPort)
        };
    },
    /**
     *   save each host config
     */
    saveHost: function (fromObj, routeRules, serverId) {

        // save proxy config
        this.proxies[serverId] = {

            from: fromObj,
            rules: routeRules

        };

    },
    /**
     *  Check route if has default action , if has not, put it on first
     */
    checkDefaultAction: function (routes) {

        var isContainDefaultAction = false;

        _.each(routes, function (item) {
            if (item == '/' || item.action == '/') {
                isContainDefaultAction = true;
                return true;
            }
        });
        // put default action on the first tuples
        if (!isContainDefaultAction) routes.unshift('/'); 
        return routes;
    },
    /**
     *   validate host string
     */
    validHost: function (host) {
        return this.regexps.HOST.exec(host) ? true : false;
    },
    /**
     *  
     *  @return Object
     */
    protocal: function (protocal) {
        var protocalObj = {
            http: false,
            https: false,
            websocket: false,
            unknow: false
        };
        if (protocal === 'http') {
            protocalObj.http = true;
        } else if (protocal === 'https') {
            protocalObj.https = true;
        } else if (protocal === 'ws') {
            protocalObj.websocket = true;
        } else {
            protocalObj.unknow = true;
        }
        return protocalObj;
    },
    /**
     *  protocal option to protocal name
     */
    options2protocal: function (options) {

        if (options.https) {
            return 'https';
        } else if (options.websocket) {
            return 'ws';
        } else if (options.http) {
            return 'http';
        } else {
            return 'http';
        }
    },
    /**
     *   parse each route rule to url matched rule
     */
    parseRouteRule: function (options) {
        options = util.copy(options);

        var routes = options.route || [];
        routes = this.checkDefaultAction(routes);

        var _this = this,
            forwards = [],
            rewrites = [],
            statices = [],
            forwardObj = null;

        _.each(routes, function (route) {

            if (_.isObject(route)) {

                var routeOptions = route,
                    forwardObj = _this.parseHost(routeOptions.forward);

                routeOptions = _.extend(routeOptions, forwardObj.protocalOption);

                forwards.push({
                    rule: _this.forwardRouteRule2Regexp(routeOptions.action),
                    forward: forwardObj,
                    options: routeOptions
                });

            }
            else if (_this.regexps.ROUTE_FORWARD.exec(route)) {

                var forwardObj = _this.parseHost(options.to, options);
                options = _.extend(options, forwardObj.protocalOption);
                forwards.push({
                    rule: _this.forwardRouteRule2Regexp(route),
                    forward: forwardObj,
                    options: options
                });

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
    /**
     *  find the rule whether is static route rule and return regexpess rule.
     */
    staticRouteRule2Regexp: function (rule) {
        var matches = this.regexps.ROUTE_STATIC.exec(rule);

        rule = rule.replace(/^!/, '');

        if (!matches[1]) {
            rule = this.str.ROUTE_METHOD_PREFIX + rule;
        }
        return this.string2Regexp(rule);
    },
    /**
     *  find the rule whether is forward route rule and return regexpess rule.
     */
    forwardRouteRule2Regexp: function (rule) {
        var matches = this.regexps.ROUTE_FORWARD.exec(rule);

        if (!matches[1]) {
            rule = this.str.ROUTE_METHOD_PREFIX + '(@)'.replace('@', rule);
        }
        return this.string2Regexp(rule);
    },
    /**
     *   Match url in forward rule
     */
    forwardMatched: function (url, forwardRules) {
        var matchedRoute = null;
        _.each(forwardRules, function (ruleObj) {

            if (ruleObj.rule.exec(url)) {
                matchedRoute = ruleObj;
                return true;
            }
        });

        return matchedRoute;
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
    }

}

module.exports = server;