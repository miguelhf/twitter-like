angular.module('twitterlike-client', [])
.controller('TLCCtrl', function($scope, $http, APIcall) {
	$scope.error		= false;
	// Este es el usuario por defecto. Hacer una página de login más adelante-
	$scope.user			= "ana";
	$scope.timestamp	= 0;
	$scope.author		= "";
	$scope.submit_text	= function() {APIcall.write($http,$scope);}
	$scope.fav_it		= function(favers, ts, auth) {APIcall.fav($http,$scope, favers, ts, auth);}
	$scope.read_em_all	= function(auth) {APIcall.read($http,$scope, auth);}
	$scope.search		= function(auth) {APIcall.search($http, $scope, auth);}
	$scope.fav_color	= function(favers, user) {
		if (favers)
			if (favers.indexOf($scope.user) != -1) return "red";
		else return null;
	}

})
// Este servicio sirve principalmente para separar la tarea del controlador
// de las llamadas a la API.
.service("APIcall", function(){
	var self=this;
	this.search = function($http, $scope, auth){
		self.act($http, $scope, "search", 0, auth, "");
	}
	this.write = function($http, $scope) {
		self.act($http, $scope, "write", Date.now(), $scope.user, $scope.content);
	}
	this.fav = function($http,$scope, favers, ts, auth){
		if (favers.indexOf($scope.user) == -1)
			self.act($http,$scope,"fav", ts, auth, "");
		else
			self.act($http,$scope,"unfav", ts, auth, "");
	}
	this.read = function($http,$scope, auth){
		self.act($http,$scope, "read_all", 0, auth, "");
	}

	// Esta función es la función comodín que simplifica todas las demás llamadas
	this.act = function($http, $scope, action, ts, auth, content){
		$http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
		var json = {
				"user":$scope.user,
				"action": action,
				"note":{
					"timestamp":ts,
					"author":auth,
					"content":content,
					"favs":{
						"fav_count":0,
						"fav_users":[]
					}
				}
			};
		var payload = JSON.stringify(json);
		$http({
			method: "POST",
			url: "http://localhost:8080",
			data: payload,
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		}).then(function myresponse(response){
			// Aquí actualizamos la vista en función de la acción realizada y de la respuesta del servidor.
			switch(action){
				case "read_all":
				case "read_on":
				case "get_favs":
					$scope.error = false;
					$scope.data = response.data;
					break;
				case "search":
					$scope.author = "";
					if (response.data[0].timestamp == 0) {
						$scope.error = true;
						$scope.messageheader = "¿"+auth+"?";
						$scope.message = "¡El autor que buscas no existe!";
					} else {
						$scope.error = false;
						$scope.data = response.data;
					}
					break;
				case "fav":
					$scope.error = false;
					var aux_note = $scope.data.find(function(note){return note.timestamp == ts;});
					aux_note.favs.fav_users.push($scope.user);
					aux_note.favs.fav_count++;
					break;
				case "unfav":
					$scope.error = false;
					var aux_note = $scope.data.find(function(note){return note.timestamp == ts;});
					aux_note.favs.fav_users.splice(aux_note.favs.fav_users.indexOf($scope.user),1);
					aux_note.favs.fav_count--;
					break;
				case "write":
					$scope.content="";
					$scope.error = false;
					$scope.data=[];
					$scope.data.push(json.note);
					break;
				default:
					$scope.error = false;
					break;
			}
		}, function myerror(response){
			$scope.error = true;
			$scope.messageheader = "¡Uuuuop!";
			$scope.message = "Algo salió inesperadamente mal...  ¯\\_(ツ)_/¯";
		});
	}
});
