'use strict';

angular.module('salon.version', [
  'salon.version.interpolate-filter',
  'salon.version.version-directive'
])

.value('version', '0.1');
