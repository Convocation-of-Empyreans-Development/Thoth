(function(window, angular, undefined){
    angular.module('app')
    .service('tokenSvc', [function(){
        var vm = this;
        vm.token = undefined;
        vm.user = undefined;
        
        var cachedToken = localStorage.getItem('token');
        
        
        if (cachedToken){
            vm.token = cachedToken;
        }
        
    }]);
})(window, window.angular)