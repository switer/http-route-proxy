var proxyServer = require('./server');

proxyServer.proxy([
    { from: '10.1.84.165:4836', to: '10.1.84.68:9394', /*context:['GET:/post','/','!/public']*, '^/'*/ },
    { from: 'localhost', to: '10.1.84.68:9394', /*context:[]*/ }
]);