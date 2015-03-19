var net = require('net') //TCP

var server = net.createServer(function (socket) {
	socket.on('data', function(data) {
        
        data = data.toString();
        // Write the data back to the socket, the client will receive it as data from the server
        // socket.write('You said "' + data + '"');
        var hostIndex = data.search(/host:/i) //search for host in the header (case Insensitive)
        var hostLineEnd = (data.substring(hostIndex)).search(/\n/) + hostIndex
        //this line contains host and possibly port
        var line = data.substring(hostIndex,hostLineEnd)
        var tokens = line.split(':')
        if (tokens.length < 2){
        	console.log('Cannot find host ' + hostIndex + " " + hostLineEnd)
        }
        var host = tokens[1].trim()
        var port = 0
        // port may appear at host in form www.example.com:port
        if (tokens.length == 3){
			port = parseInt(tokens[2])
		}
		var firstLine = data.search('\n') //find index of first line
		firstLine = data.substring(0,firstLine)
		tokens = firstLine.split(' ')
		if (tokens.length < 3){
			//the first line need to have CMD URL HTTP/1.x
			console.log("Illegal firstLine " + firstLine)
		}
		command = tokens[0]
		url = tokens[1]
		if (port == 0){
			if(url.search(':') != -1){
				port = parseInt(url.split(':')[1])
			}else if(url.startsWith(/https/i) || command.startsWith(/connect/i)){
				port = 443
			}else{
				port = 80
			}
		}
        data = data.replace('HTTP/1.1','HTTP/1.0')
        data = data.replace(/keep-alive/ig,'close')

        
    });
});

server.listen(8888, '127.0.0.1')