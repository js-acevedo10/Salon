'use strict';

angular.module('salon.home', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/home', {
            title: 'Home',
            templateUrl: 'modules/home/home.html',
            controller: 'HomeCtrl'
        });
}])
    .controller('HomeCtrl', ['$scope', 'Backand', '$location', '$http', function ($scope, Backand, $location, $http) {

        $scope.currentUser = {};
        
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

        getEmployees();
        function getEmployees() {
            $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/Employees/',
                params: {
                    pageSize: 20,
                    pageNumber: 1,
                    filter: [],
                    sort: ''
                }
            }).then(function successCallback(response) {
                $scope.employees = response.data.data;
            }, function errorCallback(response) {
                $scope.employees = "error";
            });
        };
        
        $scope.openBill = function (id) {
            console.log(id);
        }
}]);