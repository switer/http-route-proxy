var proxyServer = require('../server');

proxyServer.proxy([
    // 'POST:/'
    // 'POST:*'
    // 'GET:/public'
    // '!POST:/public'
    { from: '10.1.84.165:4836', to: '10.1.84.68:9394', route:['GET:/post','/','!/public'], rewrite:['/public', '/remote'] },
    { from: 'localhost', to: '10.1.84.68:9394', /*context:[]*/ }
]);