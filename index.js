/**
 *  http-route-proxy
 *  http://github.com/switer/http-route-proxy
 *
 *  Copyright (c) 2013 "switer" guankaishe
 *  Licensed under the MIT license.
 *  https://github.com/switer/http-route-proxy/blob/master/LICENSE
 */

var httpProxy = require('http-proxy'), // base on nodejitsu proxy server
    staticServer = require('./lib/static'), // static server
    util = require('./lib/util'),
    colors = require('colors'), // use to pretty console log
    path = require('path'),
    Url = require('url'),
    _ = require('underscore'); // use each method.....

var server = {

    /**
     *  request proxy route match status code
     */
    status: {

        STATIC: 0,
        FORWARD: 1,
        UNMATCHED: 2
    },
    /**
     *   id for each proxy server
     */
    serverId: 1,
    /**
     *   mapping root
     */
    rules: {},
    /**
     *   save proxy host
     */
    proxies: {
        /**
         *  from: Object {hostname, name}
         *  rules: Object {static, forward, rewrite}
         */
    },
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
    /**
     *  for creating request route matching rule
     */
    str: {
        ROUTE_METHOD_PREFIX: '([A-Z]+:)?'
    },
    /**
     *  Proxy enter api
     */
    proxy: function (hosts) {

        // handle each proxy config
        _.each(hosts, function (hostConfig) {

            var hostObj = {
                from: this.parseHost(hostConfig.from),
                routes: this.parseRouteRule(hostConfig)
            }

            var serverId = this.create(hostObj.from, hostObj.routes, hostConfig);
            this.saveHost(hostObj.from, hostObj.routes, serverId);

        }.bind(this));
    },
    /**
     *  support as express connect middleware
     */
    connect: function (config) {

        var proxy = new httpProxy.RoutingProxy(),
            connectConfig = {
                rules: this.parseRouteRule(config)
            },
            _this = this;

        return function (req, res, next) {

            _this.proxyMiddleware(req, res, proxy, connectConfig, function (proxyStatus) {
                // processing in express
                if (proxyStatus.status !== _this.status.FORWARD) {
                    next();
                }
                // forward request
                else {
                    console.log(proxyStatus.message);
                }
            });
        }
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

                _this.proxyMiddleware(req, res, proxy, _this.proxies[serverId], function (statusObj) {
                    console.log(statusObj.message);
                });
                
            /**
             *  must listen hostname, otherwise it will be fail when repeat listening 
             *  localhost in the some port
             */
            }).listen(from.port, from.hostname)
              .on('error', function (e) {
                // catch server listen error
                console.log('Create proxy error,'.red.grey + "cause by can't listen host from " + 
                    from.hostname.yellow.grey + ' : ' + from.port.toString().blue.grey);
              });
        
        console.log('Listen from ' + from.hostname.green.grey + ' : ' + from.port.toString().blue.grey);

        // Custom error
        server.proxy.on('proxyError', function (err, req, res) {
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });
            res.end('Something went wrong. And we are reporting a custom error message.\n' + err); 
        });

        return this.serverId ++;
    },
    /**
     *  Proxy middle for handling request and response
     */
    proxyMiddleware: function (req, res, proxy, config, next) {

        var from = this.parseHost(req.headers.host),
            method = req.method,
            // rewrite url to originUrl for proxy agent
            requestURL = req.url = req.url || req.originalUrl,
            url = method.toUpperCase() + ':' + requestURL,
            forwardRouteObj = null;

        // get proxy config by proxy server id
        var proxyConfig = config;

        if (this.staticMatched(url, proxyConfig.rules.static)) {
            // match route is static file response
            var directory = path.resolve(process.cwd(), '.');

            // send static files without server
            staticServer.sendfile(req, res, directory);

            next({
                status: this.status.STATIC,
                message: method.blue.grey + '  ' + requestURL + ' from '.green.grey +  from.hostname + ':' + from.port.toString().blue.grey
            });
            
        } else if (forwardRouteObj = this.forwardMatched(url, proxyConfig.rules.forward)) {
            // set headers of config
            this.setHeaders(req, res, forwardRouteObj.options.headers);

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

            next({
                status: this.status.FORWARD,
                message: 'forward '.yellow.grey + method.blue.grey + '  ' + requestURL + ' from '.green.grey +  from.hostname + ':' + 
                    from.port.toString().blue.grey +' to '.green.grey + forwardObj.protocal + '://' + forwardObj.hostname + ':' + 
                    forwardObj.port.toString().blue.grey + requestURL
            });
        }
        else {
            next({
                status: this.status.UNMATCHED,
                message: "Sorry proxy error, http-route-proxy can't match any forward rule, please check your proxy config".red
            });
        }
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
        // if route config is empty, give it default
        routes = this.checkDefaultAction(routes);

        var _this = this,
            forwards = [], // forward route rules
            // rewrites = [], // currently it's useless
            statices = [], // static route rules
            forwardObj = null;

        _.each(routes, function (route) {

            // route detail config 
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
            // forward route match, route rule in shorthand
            else if (_this.regexps.ROUTE_FORWARD.exec(route)) {
                // parse forward host
                var forwardObj = _this.parseHost(options.to, options);
                // set foward options
                options = _.extend(options, forwardObj.protocalOption);
                // save config
                forwards.push({
                    rule: _this.forwardRouteRule2Regexp(route),
                    forward: forwardObj,
                    options: options
                });

            }
            // static route match, route rule in shorthand
            else if (_this.regexps.ROUTE_STATIC.exec(route)) {
                statices.push(_this.staticRouteRule2Regexp(route));
            }
        });

        return {
            forward: forwards,
            // rewrite: rewrites,
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
     *  Match url by forward route rule
     *  @return {Object} routeRule
     */
    forwardMatched: function (url, forwardRules) {
        var matchedRoute = null;

        forwardRules.some(function (ruleObj) {
            if (ruleObj.rule.exec(url)) {
                matchedRoute = ruleObj;
                return true;
            }
        });

        return matchedRoute;
    },
    /**
     *  Match url by static route rule
     *  @return <Boolean> isMatched
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