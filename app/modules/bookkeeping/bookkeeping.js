'use strict';

angular.module('salon.bookkeeping', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/bookkeeping', {
            title: 'Cuentas',
            templateUrl: 'modules/bookkeeping/bookkeeping.html',
            controller: 'BookkeepingCtrl'
        });
}])
    .controller('BookkeepingCtrl', ['$scope', 'Backand', '$location', '$http', function ($scope, Backand, $location, $http) {

        $scope.sectionSummaryToday = true;
        $scope.sectionSalesReport = false;
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

        function getEmployees() {
            $scope.loadingBillsPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/Employees/?exclude=metadata,totalRows',
                //                                params: {
                //                                    pageSize: 20,
                //                                    pageNumber: 1,
                //                                    filter: [],
                //                                    sort: ''
                //                                }
            }).then(function successCallback(response) {
                $scope.employees = response.data.data;
                delete $scope.employees.__metadata;
                angular.forEach($scope.employees, function (employee, index) {
                    employee.plist = [];
                    var ids = employee.bills.split(",");
                    angular.forEach(ids, function (id, indez) {
                        $scope.getProductsFromBillWithId(id, employee.plist, $scope.todaysBills);
                    })
                })
            }, function errorCallback(response) {
                $scope.employees = "error";
            });
        };

        getProducts();

        function getProducts() {
            $scope.loadingBillsPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/Products/?exclude=metadata,totalRows'
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

        //-----------------------------------------------------------------------
        //--------------------- SECTION TODAY -----------------------------------
        //-----------------------------------------------------------------------

        getBillsToday();

        function getBillsToday() {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            $scope.loadingBillsPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/objects/Bills?exclude=metadata,totalRows',
                params: {
                    filter: [
                        {
                            fieldName: 'creationDate',
                            operator: 'greaterThanOrEqualsTo',
                            value: today
                        }
                    ]
                }
            }).then(function successCallback(response) {
                $scope.todaysBills = [];
                $scope.todaysLazyBills = response.data.data;
                $scope.getTodaysBillsError = false;
                if ($scope.todaysLazyBills.length == 0) {
                    getEmployees();
                }
                var i = 0;
                angular.forEach($scope.todaysLazyBills, function (lazyBill, index) {
                    $scope.loadingBillsPromise = $http({
                        method: 'GET',
                        url: Backand.getApiUrl() + '/1/objects/Bills/' + lazyBill.id + '?deep=true&exclude=metadata,totalRows'
                    }).then(function successCallback(response) {
                        $scope.todaysBills.push(response.data);
                        $scope.getTodaysBillsError = false;
                        if (i == $scope.todaysLazyBills.length) {
                            getEmployees();
                        }
                    }, function errorCallback(response) {
                        $scope.getTodaysBillsError = true;
                    });
                    i++;
                })
            }, function errorCallback(response) {
                $scope.getTodaysBillsError = true;
            });
        };

        function getEmployeesReport(initDate, finalDate) {
            if(initDate == null) {
                initDate = new Date();
                initDate.setHours(0,0,0,0);
                finalDate = new Date();
                finalDate.setHours(initDate.getHours() + 24);
            }
            $scope.reportEmployees = [];
            $scope.reportTotals = {
                subtotal: 0,
                discount: 0,
                total: 0,
                employeeCut: 0,
                earnings: 0
            };
            angular.forEach($scope.employees, function (employee, index) {
                $scope.loadingBillsPromise = $http({
                    method: 'GET',
                    url: Backand.getApiUrl() + '/1/query/data/SalesReportPerEmployeeId',
                    params: {
                        parameters: {
                            employeeId: employee.id,
                            initDate: initDate,
                            finalDate: finalDate
                        }
                    }
                }).then(function successCallback(response) {
                    $scope.reportEmployees.push(response.data[0]);
                    $scope.reportTotals.subtotal += response.data[0].subtotal;
                    $scope.reportTotals.discount += response.data[0].discount;
                    $scope.reportTotals.total += response.data[0].total;
                    $scope.reportTotals.employeeCut += response.data[0].employeeCut;
                    $scope.reportTotals.earnings += response.data[0].earnings;
                    $scope.employeesReportError = false;
                }, function errorCallback(response) {
                    $scope.employeesReportError = true;
                });
            })
        }

        //-----------------------------------------------------------------------
        //---------------------   UTILITIES   -----------------------------------
        //-----------------------------------------------------------------------

        $scope.getProductListFromBills = function (bills, list) {
            angular.forEach(bills, function (bill, index) {
                var productsId = bill.products.split(",");
                angular.forEach(productsId, function (id, i) {
                    $scope.getProductWithId(id, list);
                });
            });
        }

        $scope.getBillsFromListWithIds = function (idList, resultList) {
            angular.forEach(idList, function (idFromList, index) {
                angular.forEach($scope.todaysBills, function (bill, i) {
                    if (bill.id == idFromList) {
                        resultList.push(bill);
                    }
                })
            })
        }

        $scope.getEmployeeListFromBills = function (bills, list) {
            angular.forEach(bills, function (bill, index) {
                var employeesId = bill.employees.split(",");
                angular.forEach(employeesId, function (id, i) {
                    $scope.getEmployeeWithId(id, list);
                });
            });
        }

        $scope.getBillWithId = function (id, list) {
            angular.forEach($scope.todaysBills, function (bill, index) {
                if (bill.id == id) {
                    list.push(bill);
                }
            });
        };

        $scope.getProductsFromBillWithId = function (id, list, bills) {
            angular.forEach($scope.todaysBills, function (bill, index) {
                if (bill.id == id) {
                    angular.forEach(bill.products, function (relation, indez) {
                        list.push(relation.product);
                    })
                }
            });
        };

        $scope.getEmployeeWithId = function (id, list) {
            angular.forEach($scope.employees, function (employee, index) {
                if (employee.id == id) {
                    list.push(employee);
                }
            });
        };

        $scope.getProductWithId = function (id, list) {
            angular.forEach($scope.products, function (product, index) {
                if (product.id == id) {
                    list.push(product);
                }
            });
        }

        //-----------------------------------------------------------------------
        //------------------------   ESTRAS   -----------------------------------
        //-----------------------------------------------------------------------

        $scope.onSectionSummaryToday = function () {
            $scope.sectionSummaryToday = true;
            $scope.sectionSalesReport = false;
            getBillsToday();
        }

        $scope.onSectionSalesReport = function () {
            $scope.sectionSummaryToday = false;
            $scope.sectionSalesReport = true;
            getEmployeesReport(null, null);
        }
}]);