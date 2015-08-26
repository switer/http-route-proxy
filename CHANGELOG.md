## ChangeLog for: http-route-proxy

#### Version 0.2.0 - 2015/08/26
- [Bug]: Fixed bug when using as express middleware sometimes base-url will be stripped off. 

#### Version 0.1.1 - 2013/12/30

- [Feature]: Support using as express connect middleware

#### Version 0.1.0 - 2013/12/28

- [Feature]: Forward to various host on matching the path action.

#### Version 0.0.6-2 - 2013/12/26

- [Feature]: Support write protocal in hostname(https://xxxx.com) instead of using protocal(https: true) option.

#### Version 0.0.6-1 - 2013/12/26

- [Feature]: route field isn't necessary and it has defualt value of `['/']`

#### Version 0.0.6 - 2013/12/26

- [Feature]: Support set request and response headers

#### Version 0.0.5-1 - 2013/12/26

- [Fixed bug]: route proxy http to https website which certificate has not been unauthorized will be response error

#### Version 0.0.5 - 2013/12/25

- [Feature]: Support https route proxy

#### Version 0.0.4 - 2013/12/18

- [Feature]: Support cross-domain request
