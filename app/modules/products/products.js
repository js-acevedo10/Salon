'use strict';

angular.module('salon.products', ['ngRoute'])

.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/products', {
            title: 'Products',
            templateUrl: 'modules/products/products.html',
            controller: 'ProductsCtrl'
        });
}])
    .controller('ProductsCtrl', ['$scope', 'Backand', '$location', '$http', function ($scope, Backand, $location, $http) {

        $scope.currentUser = {};
        $scope.userIsAdmin = false;
        $scope.selectedProductId = -1;
        $scope.selectedProductCategoryId = -1;
        $scope.updateProductError = false;
        $scope.addProductError = false;
        $scope.deleteProductError = false;
        $scope.getProductError = false;

        getUserDetails();

        function getUserDetails() {
            return Backand.getUserDetails()
                .then(function (data) {
                    $scope.currentUser.details = data;
                    if (data !== null) {
                        $scope.currentUser.name = data.username;
                        $scope.currentUser.role = data.role;
                        if (data.role == 'Admin') {
                            $scope.userIsAdmin = true;
                        }
                    }
                });
        };

        getProducts();

        function getProducts() {
            $http({
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
            }, function errorCallback(response) {
                $scope.getProductError = false;
            });
        };

        getCategorias();

        function getCategorias() {
            $http({
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
            }, function errorCallback(response) {
                $scope.categories = "error";
            });
        };

        $scope.addProduct = function () {
            var newName = $scope.addForm.name;
            var newPrice = $scope.addForm.price;
            var newSalesmanPercentage = $scope.addForm.sPercentage;
            var newFixedCost = $scope.addForm.fixedCost;
            var newDiscount = $scope.addForm.discount;
            $http({
                method: 'POST',
                url: Backand.getApiUrl() + '/1/objects/Products?returnObject=true',
                data: {
                    name: newName,
                    price: newPrice,
                    salesmanPercentage: newSalesmanPercentage,
                    fixedCost: newFixedCost,
                    discount: newDiscount,
                    category: $scope.selectedProductCategoryId
                }
            }).then(function successCallback(response) {
                $scope.products.push(response.data);
                $scope.addProductError = false;
            }, function errorCallback(response) {
                $scope.addProductError = true;
            });
        }

        $scope.updateProduct = function () {
            var newName = $scope.modifyForm.name;
            var newPrice = $scope.modifyForm.price;
            var newSalesmanPercentage = $scope.modifyForm.sPercentage;
            var newFixedCost = $scope.modifyForm.fixedCost;
            var newDiscount = $scope.modifyForm.discount;
            $http({
                method: 'PUT',
                url: Backand.getApiUrl() + '/1/objects/Products/' + $scope.selectedProductId + '?returnObject=true',
                data: {
                    name: newName,
                    price: newPrice,
                    salesmanPercentage: newSalesmanPercentage,
                    fixedCost: newFixedCost,
                    discount: newDiscount
                }
            }).then(function successCallback(response) {
                getProducts();
                $scope.updateProductError = false;
            }, function errorCallback(response) {
                $scope.updateProductError = true;
            });
        }

        $scope.deleteProduct = function (idProduct) {
            $http({
                method: 'DELETE',
                url: Backand.getApiUrl() + '/1/objects/Products/' + idProduct
            }).then(function successCallback(response) {
                $scope.deleteProductError = false;
                getProducts();
            }, function errorCallback(response) {
                $scope.deleteProductError = true;
            });
        };
        
        $scope.validateClass = function (validity) {
            if(!validity) return 'has-danger';
        }
        
        $scope.checkPrice = function (price) {
            if(price == 0) {
                return 'A convenir';
            } else return '$' + price;
        }

        $scope.showModifyVals = function (product) {
            $scope.selectedProductId = product.id;
            angular.element(document.querySelector("#modifyModal .modal-title")).text('Modificar ' + product.name);
            angular.element(document.querySelector("#modifyModal .modifyForm #name")).val(product.name);
            angular.element(document.querySelector("#modifyModal .modifyForm #price")).val(product.price);
            angular.element(document.querySelector("#modifyModal .modifyForm #sPercentage")).val(product.salesmanPercentage);
            angular.element(document.querySelector("#modifyModal .modifyForm #fixedCost")).val(product.fixedCost);
            angular.element(document.querySelector("#modifyModal .modifyForm #discount")).val(product.discount);
        };

        $scope.showAddVals = function (category) {
            $scope.selectedProductCategoryId = category.id;
            angular.element(document.querySelector("#addModal .modal-title")).text('Agregar Producto a ' + category.name);
            angular.element(document.querySelector("#addModal .addForm #category")).val(category.name);
            $scope.addProductForm.name = "";
            $scope.addProductForm.price = "";
            $scope.addProductForm.sPercentage = "";
            $scope.addProductForm.fixedCost = ""
            $scope.addProductForm.discount = "";
        }
}]);