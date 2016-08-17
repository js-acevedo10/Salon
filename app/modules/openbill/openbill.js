'use strict';

angular.module('salon.openbill', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/bills/open/:billType/:id', {
        title: 'Openbill',
        templateUrl: 'modules/openbill/openbill.html',
        controller: 'OpenbillCtrl'
    });
}]).controller('OpenbillCtrl', ['$scope', 'Backand', '$location', '$http', '$routeParams', function ($scope, Backand, $location, $http, $routeParams) {

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
    $scope.employeeCut = 0;
    $scope.multipleBillEmployees = [];
    $scope.payWithCardVar = false;
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

    $scope.pay = function () {
        if ($scope.billTypeMultiple) {
            angular.forEach($scope.multipleBillEmployees, function (emp, indx) {

                var subtotal = 0;
                var discount = 0;
                var total = 0;
                var eCut = 0;
                var earn = 0;

                angular.forEach($scope.itemsInBill, function (item, inde) {
                    if (item.employee.id == emp.id) {
                        subtotal += item.price;
                        discount += item.discount;
                        eCut += item.employeeCut;
                        earn += item.earnings;
                    }
                })
                total = subtotal - discount;
                console.log(total);
                $scope.loadBillPromise = $http({
                    method: 'POST',
                    url: Backand.getApiUrl() + '/1/objects/Bills?returnObject=true',
                    data: {
                        creationDate: new Date(),
                        creditCard: $scope.payWithCardVar,
                        subtotalPrice: subtotal,
                        discount: discount,
                        totalPrice: total,
                        paidAmount: total,
                        employeeCut: eCut,
                        earnings: earn,
                        Buyer: ''
                    }
                }).then(function successCallback(response) {
                    $scope.createBillError = false;
                    var createdBill = response.data;
                    createEmployeeRelation(emp.id, createdBill);
                }, function errorCallback(response) {
                    $scope.createBillError = true;
                });
            })
        } else {
            var discount = 0;
            var eCut = 0;
            var earn= 0;
            var i = 0;
            
            angular.forEach($scope.itemsInBill, function (item, index) {
                i++;
                discount += item.discount;
                eCut += item.employeeCut;
                earn += item.earnings;
                if(i == $scope.itemsInBill.length) {
                    payIndividual(discount, eCut, earn);
                }
            })
        }
    }

    function payIndividual(discount, eCut, earn) {
        $scope.loadBillPromise = $http({
            method: 'POST',
            url: Backand.getApiUrl() + '/1/objects/Bills?returnObject=true',
            data: {
                creationDate: new Date(),
                creditCard: $scope.payWithCardVar,
                subtotalPrice: $scope.billSubtotal,
                discount: discount,
                totalPrice: $scope.billTotal,
                paidAmount: $scope.billTotal,
                employeeCut: eCut,
                earnings: earn,
                Buyer: ''
            }
        }).then(function successCallback(response) {
            $scope.createBillError = false;
            $scope.createdBill = response.data;
            createEmployeeRelation($scope.employeeId, $scope.createdBill);
        }, function errorCallback(response) {
            $scope.createBillError = true;
        });
    }

    function createEmployeeRelation(employeeId, bill) {
        //CREO LA RELACION MULTIPLE DE EMPLEADO A BILL
        $scope.loadBillPromise = $http({
            method: 'POST',
            url: Backand.getApiUrl() + '/1/objects/Bill_Employee?returnObject=true',
            data: {
                employee: employeeId,
                bill: bill.id
            }
        }).then(function successCallback(r2) {
            $scope.billEmployeeError = false;
            $scope.billEmployee = r2.data;
            createProductRelation(employeeId, bill);
        }, function errorCallback(r2) {
            deleteBill(bill.id, 1);
            $scope.billEmployeeError = true;
        });
    };

    function createProductRelation(employeeId, bill) {
        var i = 0;
        //CREO PARA CADA PRODUCTO SU RELACION CON LA BILL
        angular.forEach($scope.itemsInBill, function (product, index) {
            if (product.employee.id == employeeId) {
                $scope.loadBillPromise = $http({
                    method: 'POST',
                    url: Backand.getApiUrl() + '/1/objects/Bill_Product?returnObject=true',
                    data: {
                        bill: bill.id,
                        product: product.productId
                    }
                }).then(function successCallback(r3) {
                    $scope.billProductError = false;
                    if (i == $scope.itemsInBill.length) {
                        $location.path('/home/success')
                    }
                }, function errorCallback(r3) {
                    $scope.billProductError = true;
                    deleteBill(bill.id, 1);
                    if (i == $scope.itemsInBill.length) {
                        console.log("me cague");
                    }
                });
            }
            i++;
        });
    }

    function deleteBill(id, depth) {
        if (depth < 5) {
            $http({
                method: 'DELETE',
                url: Backand.getApiUrl() + '/1/objects/Bills/' + id
            }).then(function successCallback(response) {
                $scope.createdBill = null;
            }, function errorCallback(response) {
                deleteBill(id, depth + 1);
            });
        }
    }

    $scope.setCategory = function (id) {
        $scope.selectedCategory = id;
    }

    $scope.addItemToBill = function () {
        var productToAdd = {
            productId: $scope.selectedProduct.id,
            productName: $scope.selectedProduct.name,
            productDiscountPercentage: $scope.selectedProduct.discount,
            salesmanPercentage: $scope.selectedProduct.salesmanPercentage
        }

        if ($scope.selectedProduct.price == 0) {
            productToAdd.price = $scope.newItem.price;
        } else {
            productToAdd.price = $scope.selectedProduct.price;
        }

        productToAdd.discount = productToAdd.price * productToAdd.productDiscountPercentage;
        productToAdd.employeeCut = productToAdd.price * productToAdd.salesmanPercentage;
        productToAdd.earnings = productToAdd.price - productToAdd.discount - productToAdd.employeeCut;

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
        $scope.billDiscount += productToAdd.productDiscountPercentage * productToAdd.price;
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
        var index2 = $scope.multipleBillEmployees.indexOf(item.employee);
        $scope.itemsInBill.splice(index, 1);
        $scope.multipleBillEmployees.splice(index2, 1);
        $scope.billSubtotal -= item.price;
        $scope.billDiscount -= item.productDiscountPercentage * item.price;
        $scope.billTotal = $scope.billSubtotal - $scope.billDiscount;
    }

    $scope.showPayVals = function (card) {

        $scope.payWithCardVar = card;
        var title = "Pago en Efectivo";
        var body = "El monto a recibir es de $" + $scope.billTotal;
        if (card) {
            title = "Pago con Tarjeta";
            body = "La transferencia es de $" + $scope.billTotal;
        }
        body += ". Haga clic en continuar una vez haya recibido el pago y verificado el monto.";
        angular.element(document.querySelector("#payModal .modal-title")).text(title);
        angular.element(document.querySelector("#payModal .modal-body .body-text")).text(body);
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