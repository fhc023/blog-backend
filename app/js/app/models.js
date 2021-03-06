'use strict';

// 与服务端交互的数据资源对象
angular.module('app.models', [])
	.factory('Articles', ['$resource', 'BackendUrl', function($resource, BackendUrl) {
		return $resource(BackendUrl + '/com/articles', null, {
			'query': 	{ method: 'GET', isArray: true }
		});
	}])
	.factory('Tag', ['$resource', 'BackendUrl', function($resource, BackendUrl) {
		return $resource(BackendUrl + '/tags', null, {
			'query':	{ method: 'GET', isArray: true }
		});
	}])
	.factory('Article', ['$resource', 'BackendUrl', function($resource, BackendUrl) {
		return $resource(BackendUrl + '/com/article', null, {
			'get': 		{ method: 'GET' }
		});
	}])
	.factory('Dates', ['$resource', 'BackendUrl', function($resource, BackendUrl) {
		return $resource(BackendUrl + '/dates', null, {
			'query':	{ method: 'GET', isArray: true }
		});
	}])
	.factory('Count', ['$resource', 'BackendUrl', function($resource, BackendUrl) {
		return $resource(BackendUrl + '/count', null, {
			'get':	{ method: 'GET'}
		});
	}]);