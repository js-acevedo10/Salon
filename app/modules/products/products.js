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
                $scope.products = "error";
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

        $scope.deleteProduct = function (idProduct) {
            $http({
                method: 'DELETE',
                url: Backand.getApiUrl() + '/1/objects/Products/' + idProduct
            }).then(function successCallback(response) {
                $scope.deleteResponse = response.data;
                getProducts();
            }, function errorCallback(response) {
                $scope.deleteResponse = response.data;
            });
        };
}]);