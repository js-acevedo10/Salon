'use strict';

angular.module('salon.employees', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/employees', {
            title: 'Employees',
            templateUrl: 'modules/employees/employees.html',
            controller: 'EmployeesCtrl'
        });
}])
    .controller('EmployeesCtrl', ['$scope', 'Backand', '$location', '$http', function ($scope, Backand, $location, $http) {

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

        $scope.deleteEmployee = function (idEmployee) {
            $http({
                method: 'DELETE',
                url: Backand.getApiUrl() + '/1/objects/Employees/' + idEmployee
            }).then(function successCallback(response) {
                $scope.deleteResponse = response.data;
                getEmployees();
            }, function errorCallback(response) {
                $scope.deleteResponse = response.data;
            });
        };
}]);