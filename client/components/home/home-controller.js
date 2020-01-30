(function(window, angular, undefined){
    angular.module('app')
    .controller('homeCtrl', ['$scope', '$http', '$state', 'tokenSvc', 
    	function($scope, $http, $state, tokenSvc){
        
        console.log($state);


        $scope.logUserIn = function(user){
        	$http.post('/api/user/login', user).then(function(response){
        		userSvc.token = response.data.token;
        		userSvc.user = response.data.data;
                console.log("TOKEN " +  userSvc.token);
        		localStorage.setItem('token', userSvc.token);
        		localStorage.setItem('user', JSON.stringify(userSvc.user));
        		$state.go('main');
        	}, function(err){
        		console.log(err);
        	})
        }
    }])
})(window, window.angular);