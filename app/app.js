'use strict';

// Declare app level module which depends on views, and components
angular.module('salon', [
    'ngRoute',
    'salon.login',
    'salon.home',
    'salon.version',
    'salon.employees',
    'salon.products',
    'salon.openbill',
    'backand',
    'ngStorage',
    'cgBusy'
]).config(function (BackandProvider) {
    BackandProvider.setAppName('salon');
    BackandProvider.setSignUpToken('3afd489a-4488-4857-a208-96c39fe22f4a');
}).config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');
    $routeProvider.otherwise({
        redirectTo: '/login'
    });
}]).controller('IndexCtrl', ['$scope', '$localStorage', '$location', 'Backand', function ($scope, $localStorage, $location, Backand) {
    $scope.$storage = $localStorage;
    $scope.getNavClass = function () {
        if ($location.path() == "/login") {
            return 'disabled';
        } else {
            return 'enabled';
        }
    }
    $scope.logout = function () {
        Backand.signout();
        $location.path('/login');
    };
}]);