'use strict';

angular.module('salon.openbill', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/bills/open/:billType/:id', {
            title: 'Openbill',
            templateUrl: 'modules/openbill/openbill.html',
            controller: 'OpenbillCtrl'
        });
}])
    .controller('OpenbillCtrl', ['$scope', 'Backand', '$location', '$http', '$routeParams', function ($scope, Backand, $location, $http, $routeParams) {

        $scope.currentUser = {};
        $scope.getProductError = false;
        $scope.getEmployeesError = false;
        $scope.getCategoriesError = false;
        $scope.billType = $routeParams.billType;
        $scope.billTypeMultiple = true;
        $scope.itemsInBill = [];
        $scope.newItem = {};
        $scope.billSubtotal = 0;
        $scope.billDiscount = 0;
        $scope.billTotal = 0;
        $scope.todaysDate = new Date().toLocaleDateString();
        if ($scope.billType != 'multiple') {
            $scope.employeeId = $routeParams.id;
            $scope.billTypeMultiple = false;
        }

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
            $scope.loadBillPromise = $http({
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
                $scope.getEmployeesError = false;
                if ($scope.employeeId != undefined && $scope.employeeId != null) {
                    angular.forEach($scope.employees, function (currentEmployee, index) {
                        if (currentEmployee.id == $scope.employeeId) {
                            $scope.currentEmployee = currentEmployee;
                        }
                    });
                }
            }, function errorCallback(response) {
                $scope.getEmployeesError = true;
            });
        };

        function getProducts() {
            $scope.loadBillPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/Products/'
                    //                ,
                    //                params: {
                    //                    pageSize: 20,
                    //                    pageNumber: 1,
                    //                    filter: [],
                    //                    sort: ''
                    //                }
            }).then(function successCallback(response) {
                $scope.products = response.data.data;
                $scope.getProductError = false;
            }, function errorCallback(response) {
                $scope.getProductError = true;
            });
        };

        getCategorias();

        function getCategorias() {
            $scope.loadBillPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/ProductCategories/'
                    //                ,
                    //                params: {
                    //                    pageSize: 20,
                    //                    pageNumber: 1,
                    //                    filter: [],
                    //                    sort: ''
                    //                }
            }).then(function successCallback(response) {
                $scope.categories = response.data.data;
                $scope.getCategoriesError = false;
                $scope.selectedCategory = $scope.categories[0].id;
                getProducts();
            }, function errorCallback(response) {
                $scope.getCategoriesError = true;
            });
        };

        $scope.setCategory = function (id) {
            $scope.selectedCategory = id;
        }

        $scope.addItemToBill = function () {
            var productToAdd = {
                productId: $scope.selectedProduct.id,
                productName: $scope.selectedProduct.name,
                productDiscount: $scope.selectedProduct.discount
            }
            
            if($scope.selectedProduct.price == 0) {
                productToAdd.price = $scope.newItem.price;
            } else {
                productToAdd.price = $scope.selectedProduct.price;
            }
            
            if ($scope.billTypeMultiple) {
                angular.forEach($scope.employees, function (currentEmployee, index) {
                    if (currentEmployee.id == $scope.newItem.employee) {
                        productToAdd.employee = currentEmployee;
                    }
                });
            } else {
                productToAdd.employee = $scope.currentEmployee;
            }
            $scope.itemsInBill.push(productToAdd);
            $scope.billSubtotal += productToAdd.price;
            $scope.billDiscount += productToAdd.productDiscount*productToAdd.price;
            $scope.billTotal = $scope.billSubtotal - $scope.billDiscount;
            console.log(productToAdd);
        }
        
        $scope.billTypeMultipleOrPriceIsCero = function (price) {
            if(price == 0 || $scope.billTypeMultiple) {
                return true;
            }
            return false;
        }

        $scope.showAddVals = function (product) {
            $scope.selectedProduct = product;
            $scope.selectedProductId = product.id;
            $scope.newItem.price = undefined;
            $scope.billTypeMultiple? $scope.newItem.employee = undefined : $scope.newItem.employee = $scope.currentEmployee.id;
            if (!$scope.billTypeMultiple && $scope.selectedProduct.price != 0) {
                $scope.addItemToBill();
            } else {
                angular.element(document.querySelector("#addModal .modal-title")).text('Agregar ' + product.name);
            }
        }
}]);