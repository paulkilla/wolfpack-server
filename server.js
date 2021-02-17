var http = require('http');
var WebSocketServer = require('websocket').server;

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(80, function() {
    console.log((new Date()) + ' Server is listening on port 80');
});

wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

let squads = {};

wss.on('request', function(request) {
    var ws = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' ws accepted.');
    ws.on('message', function(message) {
        try {
            const json = JSON.parse(message.utf8Data);
            if(json.message_type === 'join') {
                if(!squads[json.data.squad]) squads[json.data.squad] = {};
                if(!squads[json.data.squad][ws]) squads[json.data.squad][ws] = ws;
            } else {
                Object.entries(squads[json.squad]).forEach(([, ws]) => ws.send(message.utf8Data));
            }
        } catch(err) {
            console.error('Message that threw error was: ')
            console.error(message.utf8Data);
            console.error(err.message);
        }
    });
    ws.on('close', function(reasonCode, description) {
        for (var key in squads) {
            if(Object.keys(squads[key]).length === 1) {
                delete squads[key];
            }
        }
        console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
    });
});
