'use strict';

angular.module('salon.home', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/home', {
            title: 'Home',
            templateUrl: 'modules/home/home.html',
            controller: 'HomeCtrl'
        });
        $routeProvider.when('/home/:payment', {
            title: 'Home',
            templateUrl: 'modules/home/home.html',
            controller: 'HomeCtrl'
        });
}])
    .controller('HomeCtrl', ['$scope', 'Backand', '$location', '$http', '$routeParams', '$timeout', '$localStorage', function ($scope, Backand, $location, $http, $routeParams, $timeout, $localStorage) {

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
                url: Backand.getApiUrl() + '/1/objects/Settings?exclude=metadata,totalRows'
            }).then(function successCallback(response) {
                $localStorage.settings = response.data.data;
            }, function errorCallback(response) {

            });
        }

        getEmployees();

        function getEmployees() {
            $scope.getEmployeePromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/Employees/',
                //                params: {
                //                    pageSize: 20,
                //                    pageNumber: 1,
                //                    filter: [],
                //                    sort: ''
                //                }
            }).then(function successCallback(response) {
                $scope.employees = response.data.data;
            }, function errorCallback(response) {
                $scope.employees = "error";
            });
        };

        if ($routeParams.payment != undefined && $routeParams.payment != null) {
            $scope.paymentSucceeded = true;
            $timeout(function () {
                $scope.paymentSucceeded = false
            }, 5000);
        }

        $scope.openBill = function (employeeId) {
            if (employeeId == -1) {
                $location.path('/bills/open/multiple/0');
            } else {
                $location.path('/bills/open/specific/' + employeeId);
            }
        }

        $scope.addExpense = function () {
            $scope.getEmployeePromise = $http({
                method: 'POST',
                url: Backand.getApiUrl() + '/1/objects/Expenses?returnObject=true',
                data: {
                    description: $scope.newExpense.description,
                    cost: $scope.newExpense.price,
                    date: new Date()
                }
            }).then(function successCallback(response) {
                $scope.registerExpenseSucceeded = true;
                $timeout(function () {
                    $scope.registerExpenseSucceeded = false
                }, 5000);
            }, function errorCallback(response) {
                console.log('error');
            });
        }
        
        $scope.addCashBase = function () {
            var date = new Date();
            date.setHours(date.getHours() + 24);
            date.setHours(5,0,0,0,0);
            $scope.getEmployeePromise = $http({
                method: 'POST',
                url: Backand.getApiUrl() + '/1/objects/CashBase?returnObject=true',
                data: {
                    amount: $scope.newCashBase.ammount,
                    date: date
                }
            }).then(function successCallback(response) {
                $scope.registerExpenseSucceeded = true;
                $timeout(function () {
                    $scope.registerExpenseSucceeded = false
                }, 5000);
            }, function errorCallback(response) {
                console.log('error');
            });
        }
}]);