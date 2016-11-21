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
        $scope.addEmployeeServerError = false;
        $scope.deleteEmployeeServerError = false;
        $scope.modifyEmployeeError = false;
        $scope.getEmployeeError = false;
        $scope.userIsAdmin = false;
        $scope.selectedEmployeeId = -1;

        getUserDetails();

        function getUserDetails() {
            return Backand.getUserDetails()
                .then(function (data) {
                    $scope.currentUser.details = data;
                    if (data !== null) {
                        $scope.currentUser.name = data.username;
                        $scope.currentUser.role = data.role;
                        if (data.role == 'Admin' || data.role == 'Owner') {
                            $scope.userIsAdmin = true;
                        }
                    }
                });
        };

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
                $scope.getEmployeeError = false;
            }, function errorCallback(response) {
                $scope.getEmployeeError = true;
            });
        };

        $scope.addNewEmployee = function () {
            $scope.addEmployeeClientError = false;
            var newEmployeeName = $scope.newEmployee.name;
            $scope.newEmployee.name = "";
            var newEmployeeUrl = $scope.newEmployee.url;
            $scope.newEmployee.url = "";
            var newEmployeeDate = new Date();

            $http({
                method: 'POST',
                url: Backand.getApiUrl() + '/1/objects/Employees?returnObject=true',
                data: {
                    startDate: newEmployeeDate,
                    picture: newEmployeeUrl,
                    name: newEmployeeName
                }
            }).then(function successCallback(response) {
                $scope.addEmployeeServerError = false;
                $scope.nuevoUser = response.data;
                $scope.employees.push($scope.nuevoUser);
            }, function errorCallback(response) {
                $scope.addEmployeeServerError = true;
            });
        };

        $scope.modifyEmployee = function () {
            var modifyEmployeeName = $scope.modifyEmployee.nname;
            var modifyEmployeePicture = $scope.modifyEmployee.url;
            return $http({
                method: 'PUT',
                url: Backand.getApiUrl() + '/1/objects/Employees/' + $scope.selectedEmployeeId + '?returnObject=true',
                data: {
                    name: modifyEmployeeName,
                    picture: modifyEmployeePicture
                }
            }).then(function successCallback(response) {
                getEmployees();
                $scope.modifyEmployeeError = false;
            }, function errorCallback(response) {
                $scope.modifyEmployeeError = true;
            });
        };

        $scope.deleteEmployee = function () {
            $http({
                method: 'PUT',
                url: Backand.getApiUrl() + '/1/objects/Employees/' + $scope.selectedEmployeeId + '?returnObject=true',
                data: {
                    active: !$scope.selectedEmployeeToDelete.active
                }
            }).then(function successCallback(response) {
                getEmployees();
                $scope.deleteEmployeeServerError = false;
            }, function errorCallback(response) {
                $scope.deleteEmployeeServerError = true;
            });
        };

        $scope.showModifyVals = function (employee) {
            $scope.selectedEmployeeId = employee.id;
            angular.element(document.querySelector("#modifyModal .modal-title")).text('Modificar a ' + employee.name);
            $scope.modifyEmployee.nname = employee.name;
            $scope.modifyEmployee.url = employee.picture;
        };

        $scope.showDeleteVals = function (employee) {
            $scope.selectedEmployeeId = employee.id;
            $scope.selectedEmployeeToDelete = employee;
            if (employee.active) {
                angular.element(document.querySelector("#deleteModal .modal-title")).text('Eliminar a ' + employee.name);
                angular.element(document.querySelector("#deleteModal .modal-body")).html('<p>¿Realmente deseas eliminar a ' + employee.name + '?</p>');
            } else {
                angular.element(document.querySelector("#deleteModal .modal-title")).text('Restaurar a ' + employee.name);
                angular.element(document.querySelector("#deleteModal .modal-body")).html('<p>¿Realmente deseas restaurar a ' + employee.name + '?</p>');
                angular.element(document.querySelector("#deleteModal .actionButton")).text('Restaurar');
            }
        }
}]);