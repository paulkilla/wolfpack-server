var http = require('http');
var WebSocketServer = require('websocket').server;

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8001, function() {
    console.log((new Date()) + ' Server is listening on port 8001');
});

wss = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

let squads = {};

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wss.on('request', function(request) {
    var ws = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' ws accepted.');
    ws.id = wss.getUniqueID();
    ws.on('message', function(message) {
        try {
            const json = JSON.parse(message.utf8Data);
            if(json.message_type === 'join') {
                ws.squad = json.data.squad;
                if(!squads[json.data.squad]) squads[json.data.squad] = {};
                if(!squads[json.data.squad][ws.id]) squads[json.data.squad][ws.id] = ws;
                console.log('ID [' + ws.id + '] joined [' + ws.squad + ']');
            } else {
                Object.entries(squads[ws.squad]).forEach(([, ws]) => ws.send(message.utf8Data));
            }
        } catch(err) {
            console.error('Message that threw error was: ')
            console.error(message.utf8Data);
            console.error(err.message);
        }
    });
    ws.on('close', function(reasonCode, description) {
        if(Object.keys(squads[ws.squad]).length === 1) {
            delete squads[ws.squad];
        } else {
            delete squads[ws.squad][ws.id];
        }
        console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
    });
});
