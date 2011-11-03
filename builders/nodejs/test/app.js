var sys = require("sys"),  
    http = require("http"),  
    url = require("url"),  
    path = require("path"),  
    fs = require("fs"),

	express = require("express"),
    doodads = require('../doodads-builder');

/*
var builder = new doodads.Builder(__dirname);
var req =  {
	params: ['TestDoodad'],
	originalUrl: '/TestDoodad.doodad'
}
builder.build(req, function (content) {
    console.log(content);
});
*/

var	app = express.createServer();

app.use(express.bodyParser());
app.use("/javascript", express.static(__dirname + '/javascript'));
app.use("/stylesheet", express.static(__dirname + '/stylesheet'));
app.set("view options", { layout: false });
app.use("/views", express.static(__dirname + '/public/views', { maxAge: 86400000 }));

app.get('/', function(req, res){
	res.render(__dirname + '/index.html', { layout: false });
});

app.register('.html', {
	compile: function(str, options){
		return function(locals){
			return str;
		};
	}
});

var builder = new doodads.Builder(__dirname);
app.get('*.doodad', function(req, res){
	builder.build(req, function (content) {
        res.writeHead(200, {'Content-Type' : 'text/html', 'Cache-Control' : "max-age=2592000, must-revalidate"});
        res.end(content);
	});
});

var port = process.env.PORT || 8080;

app.listen(port, function() {
  console.log("Listening on " + port);
}); 	