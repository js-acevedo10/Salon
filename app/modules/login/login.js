'use strict';

angular.module('salon.login', ['ngRoute', 'ngStorage'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {
      title: 'Login',
      templateUrl: 'modules/login/login.html',
      controller: 'LoginCtrl'
  });
}])
.controller('LoginCtrl', ['$scope', 'Backand', '$location', '$localStorage', function($scope, Backand, $location, $localStorage) {
    
    $scope.currentUser = {};
    
    $scope.login = function () {
        var username = $scope.login.username;
        var password = $scope.login.password;
        Backand.signin(username, password)
        .then(function (response) {
            getUserDetails();
            return response;
        });
    };
    
    function getUserDetails() {
        return Backand.getUserDetails()
        .then(function (data) {
            $scope.currentUser.details = data;
            if(data !== null) {
                $scope.currentUser.name = data.username;
                $localStorage.auth = {auth: true};
                $location.path('/home');
            }
        });
    };
}]);