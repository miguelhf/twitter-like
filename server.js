/************************************************************************************************************
*
*	Formato de las notas:
*	{	"timestamp":date in full JavaScript format,
*		"author":string,
*		"content":string shorter than 140 char,
*		"favs": {
*			"fav_count":integer,
*			"fav_users": [
*				"user1",
*				"user2",
*				"user3"	
*			]
*		}
*	}
/************************************************************************************************************
*
*	Estructura del sistema de almacenamiento
*		{"authors":["author1","author2","author3",...], (array que contiene los autores publicados)
*		"notes":[json of note 1, json of note 2, ...]} (array que contiene las notas existentes)
*
*************************************************************************************************************
*
*	Formato de las peticiones (todas las notas están en el formato anterior):
*	- llamar al API para crear notas:
*		POST con carga: {"user":string, "action":"write", "note":nota}
*		(los tres primeros campos de la nota llegarán completos o la nota no se guardará).
*	- llamar al API para consultar las notas:
*		POST con carga: {"user":string, "action":"read_all", "note":nota}
*		(el único campo de la nota que tiene que estar especificado es el autor que se desea consultar)
*	- llamar al API para consultar una sola nota
*		POST con carga: {"user":string, "action":"read_one", "note":nota}
*		(los dos únicos campos de la nota que tienen que estar especificados es el autor y el timestamp)
*	- llamar al API para marcar como favorita una nota:
*		POST con carga: {"user":string, "action":"fav", "note":nota}
*		(los dos únicos campos de la nota que tienen que estar especificados son el autor y el timestamp)
*	- llamar al API para consultar las notas marcadas como favoritas:
*		POST con carga: {"user":string, "action":"get_favs", "note":nota}
*		(ningún requerimiento relativo al contenido de la nota)
*
*************************************************************************************************************/

// imports
var http = require('http');
var fs = require('fs'); 

//global variables declaration
var json_file = JSON.parse(fs.readFileSync('./logfile.json'));
var authors_array = json_file.authors;
var notes_array = json_file.notes;
var server = http.createServer();

server.on('request', control);
server.listen(8080);
console.log('\x1Bc');

// setInterval(close_sys, 100000);

function control(req, res) {
	req.on('data', function(chunk){
		var payload = JSON.parse(chunk);
		console.log("Just received a request! Retrieving data...\n"+
			"requesting user:"		+ payload.user+"\n"+
			"requested action:"	+ payload.action+"\n"+
			"requested author:"	+ payload.note.author+"\n"+
			"requested timestamp:"	+ payload.note.timestamp+"\n"+
			"requested content: "	+ payload.note.content);
		if ((req.method == 'POST') && (payload.action == 'write')) {
		/*	llamar al API para crear notas:
		*	POST con carga: {"user":string, "action":"write", "note":nota}
		*	(los tres primeros campos de la nota llegarán completos o la nota no se guardará).
		*/	if ((payload.user == payload.note.author) && (check_content(payload.note.content))) {
				save_note(payload.note);
				console.log("write zone -- saving note: "+JSON.stringify(notes_array[notes_array.length-1]));
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("write zone -- all good so far, sending response: OK\n");
			} else {
				res.writeHead(400, "BAD REQUEST", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("write zone -- something went wrong, sending response: BAD REQUEST\n");
			}
		} else if ((req.method == 'POST') && (payload.action == 'search')) {
			console.log("search zone -- ¿does the author exist? "+check_author(payload.note.author));
		/*	llamar al API para buscar a un autor:
		*	POST con carga: {"user":string, "action":"read_all", "note":nota}
		*	(el único campo de la nota que tiene que estar especificado es el autor que se desea consultar)
		*/	if (check_author(payload.note.author)) {
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				res.write(JSON.stringify(get_notes_by_author(payload.note.author)));
				console.log("search zone -- all good so far, sending response: OK\nwith payload: "
					+JSON.stringify(get_notes_by_author(payload.note.author))+"\n");
			} else {
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				// El servidor envía el JSON de error para señalar que el usuario buscado no existe.
				res.write(JSON.stringify([{
					"timestamp":	"0",
					"author":		"",
					"content":		"",
					"favs":			{"fav_count":"0", "fav_users":[]}
				}]));
				console.log("search zone -- the author doesn't exist\n");
			}
		} else if ((req.method == 'POST') && (payload.action == 'read_all')) {
			console.log("read_all zone -- ¿does the author exist? "+check_author(payload.note.author));
		/*	llamar al API para consultar las notas:
		*	POST con carga: {"user":string, "action":"read_all", "note":nota}
		*	(el único campo de la nota que tiene que estar especificado es el autor que se desea consultar)
		*/	if (check_author(payload.note.author)) {
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				res.write(JSON.stringify(get_notes_by_author(payload.note.author)));
				console.log("read_all zone -- all good so far, sending response: OK\nwith payload: "
					+JSON.stringify(get_notes_by_author(payload.note.author))+"\n");
			} else {
				res.writeHead(400, "BAD REQUEST", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("read_all zone -- something went wrong, sending response: BAD REQUEST\n");
			}
		} else if ((req.method == 'POST') && (payload.action == 'read_one')) {
		/*	llamar al API para consultar una sola nota
		*	POST con carga: {"user":string, "action":"read_one", "note":nota}
		*	(los dos únicos campos de la nota que tienen que estar especificados es el autor y el timestamp)
		*/	if (check_author(payload.note.author) && (check_timestamp(payload.note.timestamp))) {
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				res.write(JSON.stringify(get_notes_by_author(payload.note.author, payload.note.timestamp)));
				console.log("read_one zone -- all good so far, sending response: OK\nwith payload: "
					+JSON.stringify(get_notes_by_author(payload.note.author, payload.note.timestamp))+"\n");
			} else {
				res.writeHead(400, "BAD REQUEST", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("read_one zone -- something went wrong, sending response: BAD REQUEST\n");
			}
		} else if ((req.method == 'POST') && (payload.action == 'fav')) {
		/*	llamar al API para marcar como favorita una nota:
		*	POST con carga: {"user":string, "action":"fav", "note":nota}
		*	(los dos únicos campos de la nota que tienen que estar especificados son el autor y el timestamp)
		*/	if (check_author(payload.note.author) && (check_timestamp(payload.note.timestamp))) {
				fav(payload.user, payload.note);
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("fav zone -- all good so far, sending response: OK\n");
			} else {
				res.writeHead(400, "BAD REQUEST", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("fav zone -- something went wrong, sending response: BAD REQUEST\n");
			}
		} else if ((req.method == 'POST') && (payload.action == 'unfav')) {
			console.log("entering unfav zone");
		/*	llamar al API para desmarcar como favorita una nota:
		*	POST con carga: {"user":string, "action":"fav", "note":nota}
		*	(los dos únicos campos de la nota que tienen que estar especificados son el autor y el timestamp)
		*/	if (check_author(payload.note.author) && (check_timestamp(payload.note.timestamp))) {
				unfav(payload.user, payload.note);
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("unfav zone -- all good so far, sending response: OK\n");
			} else {
				res.writeHead(400, "BAD REQUEST", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("unfav zone -- something went wrong, sending response: BAD REQUEST\n");
			}
		} else if ((req.method == 'POST') && (payload.action == 'get_favs')) {
		/*	llamar al API para consultar las notas marcadas como favoritas:
		*	POST con carga: {"user":string, "action":"get_favs", "note":nota}
		*	(ningún requerimiento relativo al contenido de la nota)
		*/	if (check_author(payload.note.author) && (check_timestamp(payload.note.timestamp))) {
				res.writeHead(200, "OK", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				res.write(JSON.stringify(get_notes_by_favs(payload.user)));
				console.log("get_favs zone -- all good so far, sending response: OK\nwith payload: "
					+JSON.stringify(get_notes_by_favs(payload.user))+"\n");
			} else {
				res.writeHead(400, "BAD REQUEST", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
				console.log("get_favs zone -- something went wrong, sending response: BAD REQUEST\n");
			}
		} else {
			//	llamada incorrecta
			res.writeHead(400, "BAD REQUEST", {'Content-Type': 'text', 'Access-Control-Allow-Origin': '*'});
			console.log("default zone -- something went wrong, sending response: BAD REQUEST\n");
		}
		res.end();
	update_log();
	});
}

function check_timestamp(timestamp) {
	try {
		var d = Date.parse(timestamp);
		return true;
	}
	catch (err) {
		return false;
	}
}

function check_content(content) {
	if (typeof content === 'string' || content instanceof String)
		if (content.length <= 140)
			return true;
	else return false;
}

function check_author(author) {
	var exists = false;
	for (var i=0; i<authors_array.length; i++) exists = exists || (author == authors_array[i]);
	return exists;
}

function get_notes(kind_of_param, param, notes_array) {
 	var filtered_array = new Array();
 	switch (kind_of_param) {
 		case "timestamp":
 			for (var j=0; j<notes_array.length; j++) {
 				var note = notes_array[j];
 				if (note.timestamp == param)
 					filtered_array.push(note);
 			}
 			break;
 		case "author":
 			for (var j=0; j<notes_array.length; j++) {
 				var note = notes_array[j];
 				if (note.author == param)
 					filtered_array.push(note);
 			}
 			break;
 		case "content":
 			for (var j=0; j<notes_array.length; j++) {
 				var note = notes_array[j];
 				if (note.content == param)
 					filtered_array.push(note);
 			}
 			break;
 		case "faved":
 			for (var j=0; j<notes_array.length; j++) {
 				var note = notes_array[j];
 				for (var i=0; i<note.favs.fav_users.length; i++)
 					if (note.favs.fav_users[i] == param)
 						filtered_array.push(note);
 			}
 			break;
 		default:
 			break;
 	}
 	return filtered_array;
 }

function get_notes_by_author(author, timestamp) {
	var filt_notes = notes_array.slice();
	if (check_author(author)) {
		switch (arguments.length) {
			case 2:
				filt_notes = get_notes("timestamp", timestamp, filt_notes);
			case 1:
				filt_notes = get_notes("author", author, filt_notes);
				break;
			default:
				return null;
		}
		return filt_notes;
	}
}

function get_notes_by_favs(user) {
	return get_notes("faved", user, notes_array);
}

function save_note(note) {
	note.timestamp = Date.now();
	notes_array.push(note);
	if (!check_author(note.author)) authors_array.push(note.author);
}

function fav(user, note) {
	var array = new Array();
	for (var j=0; j<notes_array.length; j++) {
		var note_element = notes_array[j];
		if (note_element.timestamp == note.timestamp) {
			if (note_element.author == note.author) {
				var already_faved = false;
				for (var i=0; i<note_element.favs.fav_users.length; i++) already_faved = already_faved || (note_element.favs.fav_users[i] == user);
				if (!already_faved) {
					note_element.favs.fav_users.push(user);
					note_element.favs.fav_count++;
				}
			}
		}
	}
}

function unfav(user, note) {
	var array = new Array();
	for (var j=0; j<notes_array.length; j++) {
		var note_element = notes_array[j];
		if (note_element.timestamp == note.timestamp) {
			if (note_element.author == note.author) {
				var already_faved = false;
				for (var i=0; i<note_element.favs.fav_users.length; i++) already_faved = already_faved || (note_element.favs.fav_users[i] == user);
				if (already_faved) {
					note_element.favs.fav_users.splice(note_element.favs.fav_users.indexOf(user), 1);
					note_element.favs.fav_count--;
				}
			}
		}
	}
}

function update_log() {
	fs.writeFileSync('./logfile.json', JSON.stringify({"authors":authors_array, "notes":notes_array}));
}
