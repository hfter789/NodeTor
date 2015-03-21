if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
	return this.indexOf(str) === 0;
  };
}

var net = require('net') //TCP

var server = net.createServer(function (socket) {
	socket.once('data', function(data) {
		data = data.toString();
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
		console.log(firstLine)
		tokens = firstLine.split(' ')
		if (tokens.length < 3){
			//the first line need to have CMD URL HTTP/1.x
			console.log("Illegal firstLine " + firstLine)
		}
		var command = tokens[0]
		var url = tokens[1]
		if (port == 0){
			if(url.search(':') == -1){
				port = parseInt(url.split(':')[1])
			//search(regex) == 0 means starts with.
			}else if(url.search(/https/i) == 0 || command.search(/connect/i)==0){
				port = 443
			}else{
				port = 80
			}
		}
		data = data.replace('HTTP/1.1','HTTP/1.0')
		data = data.replace(/keep-alive/ig,'close') //this is the final request
		connect = false
		if (command.search(/connect/i) == 0){
			connect = true
		}
		connectServer(host,port,socket,connect,data)

	});
});

function cleanUp(socket1,socket2){
	socket1.removeAllListeners()
	socket1.destroy()
	socket2.removeAllListeners()
	socket2.destroy()
}

function connectServer(host,port,clientSocket,connect,data){
	var serSocket = net.connect(
			{port:port,host:host},
			function(){
				if(connect){
					try{
						clientSocket.write('HTTP/1.1 200 OK\n\n');
					}catch(er){
						cleanUp(clientSocket,serSocket)
					}
				}else{
					try{
						serSocket.write(data)
					}catch(er){
						cleanUp(clientSocket,serSocket)
						return
					}
				}
				clientSocket.on('data',function(data){
					try{
						serSocket.write(data)
					}catch(er){
						cleanUp(clientSocket,serSocket)
					}
				})
			})
	serSocket.on('error',function(er){
		cleanUp(clientSocket,serSocket)
	})
	serSocket.on('data',function(data){
		try{
			clientSocket.write(data)
		}catch(er){
			// client side has closed the connection
			cleanUp(clientSocket,serSocket)
		}
	})
}

server.listen(8888, '127.0.0.1')