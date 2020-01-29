class AuthenticationService {
  startServer() {
    var http = require('http');
    var url = require('url');
    var server = http.createServer(function (req, res) { 
        var uri = url.parse(req.url, true);
        console.log(req.url);
        alert(req.url);
        if (uri.pathname == '/') {       
            console.log(uri.pathname);
            alert(uri.pathname);
        } else if (uri.pathname == "/install") {
            console.log(uri.pathname);
            alert(uri.pathname);
            var authUrl = authorizationUrl 
                + '?client_id=' + clientId 
                + '&redirect_uri=' + encodeURIComponent(redirectURI);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(
                '<html><body>' 
                + '<a href="' + authUrl + '">Connect Quire</a>' 
            + '</body></html>');
            res.end();
        } else if (uri.pathname == "/quire-anywhere/success.html") {
            console.log(uri.pathname);
            alert(uri.pathname);
        }
    });
    server.listen(3000);
  }
}