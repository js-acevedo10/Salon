'use strict';

angular.module('salon.bookkeeping', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/bookkeeping', {
            title: 'Cuentas',
            templateUrl: 'modules/bookkeeping/bookkeeping.html',
            controller: 'BookkeepingCtrl'
        });
}])
    .controller('BookkeepingCtrl', ['$scope', 'Backand', '$location', '$http', '$localStorage', function ($scope, Backand, $location, $http, $localStorage) {

        $scope.sectionSummaryToday = true;
        $scope.sectionSalesReport = false;
        $scope.sectionBalanceSheet = false;
        $scope.currentUser = {};

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
                $scope.getEmployeesError = false;
                if ($scope.sectionSummaryToday) {
                    getTodaysSales();
                    getTodayExpenses();
                    getTodayCashBase();
                    getEmployeesReport(null, null);
                }
            }, function errorCallback(response) {
                $scope.getEmployeesError = true;
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

        function getTodaysSales() {
            var initDate = new Date();
            initDate.setHours(0, 0, 0, 0, 0);
            var finalDate = new Date();
            finalDate.setHours(initDate.getHours() + 24);
            finalDate.setHours(0, 0, 0, 0, 0);
            $scope.loadingBillsPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/query/data/SalesByDate',
                params: {
                    parameters: {
                        initDate: initDate,
                        finalDate: finalDate
                    }
                }
            }).then(function successCallback(response) {
                $scope.sales = response.data;
                $scope.getSalesError = false;
                angular.forEach($scope.employees, function (emp, i) {
                    emp.sales = [];
                    angular.forEach($scope.sales, function (sale, j) {
                        if (sale.employeeId == emp.id) {
                            emp.sales.push(sale);
                        }
                    })
                })
            }, function errorCallback(response) {
                $scope.getSalesError = true;
            });
        }

        function getTodayExpenses() {
            $scope.todayExpenses = 0;
            var initDate = new Date();
            initDate.setHours(0, 0, 0, 0, 0);
            var finalDate = new Date();
            finalDate.setHours(initDate.getHours() + 24);
            finalDate.setHours(0, 0, 0, 0, 0);
            $scope.loadingBillsPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/query/data/ExpensesByDate',
                params: {
                    parameters: {
                        initDate: initDate,
                        finalDate: finalDate
                    }
                }
            }).then(function successCallback(response) {
                $scope.expenses = response.data;
                angular.forEach($scope.expenses, function (expense) {
                    $scope.todayExpenses += expense.cost;
                })
                $scope.getExpensesError = false;
            }, function errorCallback(response) {
                $scope.getExpensesError = true;
            });
        }

        function getTodayCashBase() {
            var initDate = new Date();
            initDate.setHours(0, 0, 0, 0, 0);
            var finalDate = new Date();
            finalDate.setHours(initDate.getHours() + 24);
            finalDate.setHours(0, 0, 0, 0, 0);
            $scope.loadingBillsPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/query/data/CashBaseByDate',
                params: {
                    parameters: {
                        initDate: initDate,
                        finalDate: finalDate
                    }
                }
            }).then(function successCallback(response) {
                $scope.baseToday = response.data[0];
                $scope.getBaseTodayError = false;
            }, function errorCallback(response) {
                $scope.getBaseTodayError = true;
            });
        }

        function getGivenDateSales(initDate, finalDate) {
            $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/query/data/SalesByDate',
                params: {
                    parameters: {
                        initDate: initDate,
                        finalDate: finalDate
                    }
                }
            }).then(function successCallback(response) {
                $scope.givenDateSales = response.data;
                $scope.getgivenDateSalesError = false;
                $scope.salesPieLabels = [];
                $scope.salesPieData = [];
                $scope.saleHoursLabels = [];
                $scope.saleHoursSeries = ["Ventas"];
                $scope.saleHoursData = [];
                $scope.saleHoursDatasetOverride = [{
                    yAxisID: 'y-axis-1'
                }];
                $scope.saleHoursOptions = {
                    scales: {
                        yAxes: [
                            {
                                id: 'y-axis-1',
                                type: 'linear',
                                display: true,
                                position: 'left'
                            }
                        ]
                    }
                };
                calcSaleHourLabels();
            }, function errorCallback(response) {
                $scope.getSalesError = true;
            });
        }

        $scope.changeEmployeesReportDate = function (days) {
            $scope.firstDate.setHours($scope.firstDate.getHours() + (24 * days));
            $scope.lastDate.setHours($scope.lastDate.getHours() + (24 * days));
            getEmployeesReport($scope.firstDate, $scope.lastDate);
        }

        function getEmployeesReport(initDate, finalDate) {
            if (initDate == null) {
                initDate = new Date();
                initDate.setHours(0, 0, 0, 0, 0);
                finalDate = new Date();
                finalDate.setHours(initDate.getHours() + 24);
                finalDate.setHours(0, 0, 0, 0, 0);
            }
            var compDate = new Date();
            if (compDate.getDate() == initDate.getDate() && compDate.getDay() == initDate.getDay() && compDate.getMonth() == initDate.getMonth()) {
                $scope.preventFuture = true;
            } else {
                $scope.preventFuture = false;
            }
            $scope.firstDate = initDate;
            $scope.firstDateLocal = initDate.toDateString();
            $scope.lastDateLocal = finalDate.toDateString();
            $scope.lastDate = finalDate;
            $scope.reportEmployees = [];
            $scope.reportTotals = {
                subtotal: 0,
                discount: 0,
                total: 0,
                cash: 0,
                cc: 0,
                employeeCut: 0,
                earnings: 0
            };
            $scope.loadingBillsPromise = $http({
                method: 'GET',
                url: Backand.getApiUrl() + '/1/query/data/SalesReportPerEmployee',
                params: {
                    parameters: {
                        initDate: initDate,
                        finalDate: finalDate
                    }
                }
            }).then(function successCallback(response) {
                $scope.reportEmployees = response.data;
                getGivenDateSales(initDate, finalDate);
                angular.forEach($scope.reportEmployees, function (emp, i) {
                    emp.total = response.data[i].subtotal - response.data[i].discount;
                    $scope.reportTotals.total += emp.total;
                    $scope.reportTotals.subtotal += response.data[i].subtotal;
                    $scope.reportTotals.discount += response.data[i].discount;
                    $scope.reportTotals.cash += response.data[i].cash;
                    $scope.reportTotals.cc += response.data[i].cc;
                    $scope.reportTotals.employeeCut += response.data[i].employeeCut;
                    $scope.reportTotals.earnings += response.data[i].earnings;
                })
                $scope.employeesReportError = false;
            }, function errorCallback(response) {
                $scope.employeesReportError = true;
            });
        }

        //-----------------------------------------------------------------------
        //---------------------   UTILITIES   -----------------------------------
        //-----------------------------------------------------------------------

        function calcSaleHourLabels() {
            var minTime = $localStorage.settings[0].startTime;
            var maxTime = $localStorage.settings[0].endTime;

            if (minTime.split(' ')[1] == 'pm') {
                var minHour = parseInt(minTime.split(' ')[0]) + 12;
            } else {
                var minHour = parseInt(minTime.split(' ')[0]);
            }

            if (maxTime.split(' ')[1] == 'pm') {
                var maxHour = parseInt(maxTime.split(' ')[0]) + 12;
            } else {
                var maxHour = parseInt(maxTime.split(' ')[0]);
            }
            for (var i = minHour; i < maxHour + 1; i++) {
                if (i < 12) {
                    $scope.saleHoursLabels.push(i + 'am');
                } else if (i == 12) {
                    $scope.saleHoursLabels.push(12 + 'm');
                } else {
                    $scope.saleHoursLabels.push((i - 12) + 'pm');
                }
                $scope.saleHoursData.push(0);
            }
            calcSalesReportGraphs(minHour);
        }

        function calcSalesReportGraphs(minHour) {
            angular.forEach($scope.givenDateSales, function (sale, k) {
                if (sale.productPrice > 0) {
                    var index = $scope.salesPieLabels.indexOf(sale.productName);
                    if (index != -1) {
                        $scope.salesPieData[index] = $scope.salesPieData[index] + 1;
                    } else {
                        $scope.salesPieLabels.push(sale.productName);
                        $scope.salesPieData.push(1);
                    }
                    var d = new Date(sale.date);
                    var dm = d.getHours();
                    if (d.getHours() < 12) {
                        var dm = d.getHours() + 'am';
                    } else if (d.getHours == 12) {
                        var dm = d.getHours() + 'm';
                    } else {
                        var dm = (d.getHours() - 12) + 'pm';
                    }
                    var index2 = $scope.saleHoursLabels.indexOf(dm);
                    if (index2 != -1) {
                        $scope.saleHoursData[index2] = $scope.saleHoursData[index2] + 1;
                    }
                }
            })
        }

        $scope.returnProduct = function (sale) {
            var ret = {};
            ret.productPrice = sale.productPrice * -1;
            ret.productFixedCost = sale.productFixedCost * -1;
            ret.productEmployeeCut = sale.productEmployeeCut * -1;
            ret.productDiscount = sale.productDiscount * -1;
            ret.productEarnings = sale.productEarnings * -1;

            $scope.loadingBillsPromise = $http({
                method: 'POST',
                url: Backand.getApiUrl() + '/1/objects/Sales?returnObject=true',
                data: {
                    date: new Date(),
                    productId: sale.productId,
                    productName: sale.productName,
                    productPrice: ret.productPrice,
                    productDiscount: ret.productDiscount,
                    productFixedCost: ret.productFixedCost,
                    productSalesmanPercentage: '0',
                    productEmployeeCut: ret.productEmployeeCut,
                    productEarnings: ret.productEarnings,
                    employeeId: sale.employeeId,
                    employeeName: sale.employeeName,
                    bill: sale.billId
                }
            }).then(function successCallback(response) {
                getTodaysSales();
            }, function errorCallback(response) {
                console.log(response);
            })
        }

        //-----------------------------------------------------------------------
        //------------------------   ESTRAS   -----------------------------------
        //-----------------------------------------------------------------------

        $scope.onSectionSummaryToday = function () {
            $scope.sectionSummaryToday = true;
            $scope.sectionSalesReport = false;
            $scope.sectionBalanceSheet = false;
            getTodaysSales();
            getTodayExpenses();
            getTodayCashBase();
        }

        $scope.onSectionSalesReport = function () {
            $scope.sectionSummaryToday = false;
            $scope.sectionSalesReport = true;
            $scope.sectionBalanceSheet = false;
            getEmployeesReport(null, null);
        }

        $scope.onSectionBalanceSheet = function () {
            $scope.sectionSummaryToday = false;
            $scope.sectionSalesReport = false;
            $scope.sectionBalanceSheet = true;

        }
}]);