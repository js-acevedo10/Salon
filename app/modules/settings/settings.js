'use strict';

angular.module('salon.settings', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/home', {
            title: 'Home',
            templateUrl: 'modules/settings/settings.html',
            controller: 'HomeCtrl'
        });
        $routeProvider.when('/settings', {
            title: 'Settings',
            templateUrl: 'modules/settings/settings.html',
            controller: 'SettingsCtrl'
        });
}])
    .controller('SettingsCtrl', ['$scope', 'Backand', '$location', '$http', '$routeParams', '$timeout', function ($scope, Backand, $location, $http, $routeParams, $timeout) {

        $scope.currentUser = {};
        $scope.paymentSucceeded = false;
        
        getUserDetails();
        function getUserDetails() {
            return Backand.getUserDetails()
                .then(function (data) {
                    $scope.currentUser.details = data;
                    if (data !== null) {
                        $scope.currentUser.name = data.username;
                    }
                });
        };
        
        getSettings();
        function getSettings() {
            $scope.getEmployeePromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/Settings',
//                params: {
//                    pageSize: 20,
//                    pageNumber: 1,
//                    filter: null,
//                    sort: ''
//                }
            }).then(function successCallback(response) {
                $localStorage.settings = response.data;
            }, function errorCallback(response) {
                
            })
        }
}]);