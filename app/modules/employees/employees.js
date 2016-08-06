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
        $scope.addEmployeeClientError = false;
        $scope.addEmployeeServerError = false;
        $scope.deleteEmployeeServerError = false;

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

        $scope.addNewEmployee = function () {
            if ($scope.newUser != undefined && $scope.newUser.name != undefined && $scope.newUser.name != "" && $scope.newUser.url != undefined && $scope.newUser.url != "") {
                $scope.addEmployeeClientError = false;
                var newUserName = $scope.newUser.name;
                $scope.newUser.name = "";
                var newUserUrl = $scope.newUser.url;
                $scope.newUser.url = "";
                var newUserDate = new Date();

                $http({
                    method: 'POST',
                    url: Backand.getApiUrl() + '/1/objects/Employees?returnObject=true',
                    data: {
                        startDate: newUserDate,
                        picture: newUserUrl,
                        name: newUserName
                    }
                }).then(function successCallback(response) {
                    $scope.addEmployeeServerError = false;
                    $scope.nuevoUser = response.data;
                    $scope.employees.push($scope.nuevoUser);
                }, function errorCallback(response) {
                    $scope.addEmployeeServerError = true;
                });
            } else {
                $scope.addEmployeeClientError = true;
            }
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