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
        $scope.multipleBillEmployees = [];
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

        $scope.payWithCash = function (cash) {
            //CREO LA BILL
            $http({
                method: 'POST',
                url: Backand.getApiUrl() + '/1/objects/Bills?returnObject=true',
                data: {
                    creationDate: new Date(),
                    creditCard: !cash,
                    subtotalPrice: $scope.billSubtotal,
                    discount: $scope.billDiscount,
                    totalPrice: $scope.billTotal,
                    paidAmount: $scope.billTotal,
                    Buyer: ''
                }
            }).then(function successCallback(r1) {
                $scope.createBillError = false;
                $scope.createdBill = r1.data;

                //SI LA FACTURA ES A CARGO DE UN SOLO EMPLEADO
                if (!$scope.billTypeMultiple) {
                    createEmployeeRelation($scope.employeeId);
                } else {
                    var i = 0;
                    angular.forEach($scope.multipleBillEmployees, function (employeex, index) {
                        $http({
                            method: 'POST',
                            url: Backand.getApiUrl() + '/1/objects/Bill_Employee?returnObject=true',
                            data: {
                                employee: employeex.id,
                                bill: $scope.createdBill.id
                            }
                        }).then(function successCallback(r3) {
                            i++;
                            $scope.billEmployeeError = true;
                            if (i == $scope.itemsInBill.length) {
                                createProductRelation();
                            }
                        }, function errorCallback(r3) {
                            i++;
                            $scope.billEmployeeError = true;
                        });
                    })
                }
            }, function errorCallback(r1) {
                $scope.createBillError = true;
            });
        }

        function createEmployeeRelation(employeeId) {
            //CREO LA RELACION MULTIPLE DE EMPLEADO A BILL
            $http({
                method: 'POST',
                url: Backand.getApiUrl() + '/1/objects/Bill_Employee?returnObject=true',
                data: {
                    employee: employeeId,
                    bill: $scope.createdBill.id
                }
            }).then(function successCallback(r2) {
                $scope.billEmployeeError = false;
                $scope.billEmployee = r2.data;
                createProductRelation();

            }, function errorCallback(r2) {
                $scope.billEmployeeError = true;
            });
        };

        function createProductRelation() {
            var i = 0;
            //CREO PARA CADA PRODUCTO SU RELACION CON LA BILL
            angular.forEach($scope.itemsInBill, function (product, index) {
                $http({
                    method: 'POST',
                    url: Backand.getApiUrl() + '/1/objects/Bill_Product?returnObject=true',
                    data: {
                        bill: $scope.createdBill.id,
                        product: product.productId
                    }
                }).then(function successCallback(r3) {
                    $scope.billProductError = false;
                    i++;
                    if (i == $scope.itemsInBill.length) {
                        console.log("termine");
                    }
                }, function errorCallback(r3) {
                    i++;
                    $scope.billProductError = true;
                    if (i == $scope.itemsInBill.length) {
                        console.log("me cague");
                    }
                });
            });
        }

        $scope.setCategory = function (id) {
            $scope.selectedCategory = id;
        }

        $scope.addItemToBill = function () {
            var productToAdd = {
                productId: $scope.selectedProduct.id,
                productName: $scope.selectedProduct.name,
                productDiscount: $scope.selectedProduct.discount
            }

            if ($scope.selectedProduct.price == 0) {
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
                if ($scope.multipleBillEmployees.indexOf(productToAdd.employee) == -1) {
                    $scope.multipleBillEmployees.push(productToAdd.employee);
                }
            } else {
                productToAdd.employee = $scope.currentEmployee;
            }
            $scope.itemsInBill.push(productToAdd);
            $scope.billSubtotal += productToAdd.price;
            $scope.billDiscount += productToAdd.productDiscount * productToAdd.price;
            $scope.billTotal = $scope.billSubtotal - $scope.billDiscount;
        }

        $scope.billTypeMultipleOrPriceIsCero = function (price) {
            if (price == 0 || $scope.billTypeMultiple) {
                return true;
            }
            return false;
        }

        $scope.deleteFromBill = function (item) {
            var index = $scope.itemsInBill.indexOf(item);
            $scope.itemsInBill.splice(index, 1);
            $scope.billSubtotal -= item.price;
            $scope.billDiscount -= item.productDiscount * item.price;
            $scope.billTotal = $scope.billSubtotal - $scope.billDiscount;
        }

        $scope.showAddVals = function (product) {
            $scope.selectedProduct = product;
            $scope.selectedProductId = product.id;
            $scope.newItem.price = undefined;
            $scope.billTypeMultiple ? $scope.newItem.employee = undefined : $scope.newItem.employee = $scope.currentEmployee.id;
            if (!$scope.billTypeMultiple && $scope.selectedProduct.price != 0) {
                $scope.addItemToBill();
            } else {
                angular.element(document.querySelector("#addModal .modal-title")).text('Agregar ' + product.name);
            }
        }
}]);