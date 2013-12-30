app.use(Proxy.connect([
    {
        to: 'google.com',
        https: true,
        route: [
            '/',
            '!/public'
        ]
    }
]));

Proxy.connect = function () {
    {

    }
}