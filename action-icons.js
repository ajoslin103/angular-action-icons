/**
@toc

@param {Object} scope (attrs that must be defined on the scope (i.e. in the controller) - they can't just be defined in the partial html). REMEMBER: use snake-case when setting these on the partial!
TODO

@param {Object} attrs REMEMBER: use snake-case when setting these on the partial! i.e. my-attr='1' NOT myAttr='1'
TODO

@dependencies
TODO

@usage
partial / html:
TODO

controller / js:
TODO

//end: usage
*/

'use strict';

	function actionIcon_serviceFn ($q, $rootScope) {

		// in response to an actionIcon click, emit and event on the rootscope
		function emitActionIconEvent(evt,id) { 
			var deferred = $q.defer();
			deferred.event = evt;
			deferred.id = id;
			setTimeout(function() {
				$rootScope.$emit(evt,deferred); 
			}, 1000);
			return deferred.promise;
		}

		// bottleneck all the events we are given to one handler
		var actionIconListeners = {};
		function listenToTheseActionIcons (iconInfoList) {
			for (var ndx in iconInfoList) {
				if (iconInfoList.hasOwnProperty(ndx)) {
					var iconInfo = iconInfoList[ndx];
					if (! actionIconListeners.hasOwnProperty(iconInfo.event)) {
						actionIconListeners[iconInfo.event] = $rootScope.$on(iconInfo.event, actionIconEventHandler);
					}
				}
			}
		}

		// default actionIconHandler echo to console, reject 25% of the time
		function defaultActionIconEventHandler (event, promise) {
			var eventParts = promise.event.split('.');
			if (Math.random() > 0.25) {
				promise.resolve(console.log('[defaultActionIconEventHandler] resolved',eventParts[1]+' '+eventParts[0]+' #'+promise.id));
			} else {
				promise.reject(console.log('[defaultActionIconEventHandler] rejected',eventParts[1]+' '+eventParts[0]+' #'+promise.id));
			}
		}

		// accept a replacement for the default event handler (should be a list of handlers)
		var registeredActionIconEventHandler = defaultActionIconEventHandler;
		function registerActionIconEventHandler (newActionIconEventHandler) {
			registeredActionIconEventHandler = newActionIconEventHandler;
		}

		// pass the work to the logical side
		function actionIconEventHandler (event, promise) {
			registeredActionIconEventHandler(event,promise);
		}

		// get the separator for icon groups -- please keep in sync with the backend
		function getGroupDelim() { return ','; }

		// get the separator for cycle icons -- please keep in sync with the backend
		function getCycleDelim() { return '>'; }

		// get the separator for radio icons -- please keep in sync with the backend
		function getRadioDelim() { return ':'; }

		return {
			registerActionIconEventHandler: registerActionIconEventHandler,
			listenToTheseActionIcons: listenToTheseActionIcons,
			emitActionIconEvent: emitActionIconEvent,
			getGroupDelim: getGroupDelim,
			getCycleDelim: getCycleDelim,
			getRadioDelim: getRadioDelim
		};
		
	}

	function actionIconSet_directiveFn ($compile, apjActionIcons_eventHandler, sprintf) {
		return {
			template: '<div></div>',
			restrict: 'E',
			scope: {},
			link: function postLink(scope, element, attrs) {
				var radioDelim = new RegExp(apjActionIcons_eventHandler.getRadioDelim()), cycleDelim = new RegExp(apjActionIcons_eventHandler.getCycleDelim());
				var actionables = [], groups = attrs.actions.split(apjActionIcons_eventHandler.getGroupDelim());
				scope.icons = scope.$parent.icons;
				for (var x=0; x<groups.length; x++) {
					var eType = 'single-state-icon';
					if ( radioDelim.test(groups[x]) ) { eType = 'radio-state-icon'; }
					if ( cycleDelim.test(groups[x]) ) { eType = 'cycle-state-icon'; }
					actionables.push(sprintf('<%s data-item-id="%i" data-icon="%s"></%s>',eType,attrs.entityId,groups[x],eType));
				}

				var el = angular.element(actionables.join(''));
				var compiled = $compile(el);
				element.append(el);
				compiled(scope);
			}
		};
	}

	function actionIconSingleState_directiveFn ($compile, $rootScope, apjActionIcons_eventHandler) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon single-state-icon {{family}} {{className}}"/>';

		return {
			template: '<div></div>',
			restrict: 'E',
			scope: { itemId: '@' },
			link: function postLink(scope, element, attrs) {
				var iconInfo = scope.$parent.icons[attrs.icon];
				scope.title = iconInfo.title;
				scope.event = iconInfo.event;
				scope.family = iconInfo.family;
				scope.className = iconInfo.family +'-'+ iconInfo.name;
				scope.clicked = function() { 
					apjActionIcons_eventHandler.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(){ // resolved, action was successful
							},
							function(){ // resolved, action was NOT successful
							},
							function(msg){ // notification, action had something to say
								console.log('single-state-icon',msg);
							}
						);
				};
				var el = angular.element(tmpl);
				var compiled = $compile(el);
				element.html(el);
				compiled(scope);
			}
		};
	}

	function actionIconCycleState_directiveFn ($compile, $rootScope, apjActionIcons_eventHandler) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon cycle-state-icon {{family}} {{className}}"/>';

		function scopeTheIcon (scope,iconInfo) {
			scope.name = iconInfo.name;
			scope.title = iconInfo.title;
			scope.event = iconInfo.event;
			scope.family = iconInfo.family;
			scope.className = iconInfo.family +'-'+ iconInfo.name;
		}

		return {
			template: '<div></div>',
			restrict: 'E',
			scope: { itemId: '@' },
			link: function postLink(scope, element, attrs) {
				var actionIconList = attrs.icon.split(apjActionIcons_eventHandler.getCycleDelim());
				var iconInfo = scope.$parent.icons[actionIconList[0]];
				scopeTheIcon(scope,iconInfo);
				scope.clicked = function() { 
					apjActionIcons_eventHandler.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(){ // resolved, action was successful
								var actionIconNdx = actionIconList.indexOf(scope.name);
								iconInfo = scope.$parent.icons[actionIconList[ (actionIconNdx+1)%actionIconList.length ]];
								scopeTheIcon(scope,iconInfo);
							},
							function(){ // resolved, action was NOT successful
							},
							function(msg){ // notification, action had something to say
								console.log('cycle-state-icon',msg);
							}
						);
				};
				var el = angular.element(tmpl);
				var compiled = $compile(el);
				element.html(el);
				compiled(scope);
			}
		};
	}

	function actionIconRadioState_directiveFn ($compile, $rootScope, apjActionIcons_eventHandler) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon radio-state-icon {{family}} {{className}}"/>';

		return {
			template: '<div></div>',
			restrict: 'E',
			scope: { itemId: '@' },
			link: function postLink(scope, element, attrs) {
				var actionIconList = attrs.icon.split(apjActionIcons_eventHandler.getRadioDelim());
				var iconInfo = scope.$parent.icons[actionIconList[0]];
				scope.name = iconInfo.name;
				scope.title = iconInfo.title;
				scope.event = iconInfo.event;
				scope.family = iconInfo.family;
				scope.className = iconInfo.family +'-'+ iconInfo.name;
				scope.clicked = function() { 
					apjActionIcons_eventHandler.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(){ // resolved, action was successful
								var actionIconNdx = actionIconList.indexOf(scope.name);
								iconInfo = scope.$parent.icons[actionIconList[ (actionIconNdx+1)%actionIconList.length ]];
								scope.name = iconInfo.name;
								scope.title = iconInfo.title;
								scope.event = iconInfo.event;
								scope.family = iconInfo.family;
								scope.className = iconInfo.family +'-'+ iconInfo.name;
							},
							function(){ // resolved, action was NOT successful
							},
							function(msg){ // notification, action had something to say
								console.log('radio-state-icon',msg);
							}
						);
				};
				var el = angular.element(tmpl);
				var compiled = $compile(el);
				element.html(el);
				compiled(scope);
			}
		};
	}

angular.module('ajoslin103.angular-action-icons', [])
	.directive('apjActionIcons', [ actionIconSet_directiveFn ])
	.directive('apjActionIcons_singleState', [ actionIconSingleState_directiveFn ])
	.directive('apjActionIcons_cycleSatate', [ actionIconCycleState_directiveFn ])
	.directive('apjActionIcons_radioState', [ actionIconRadioState_directiveFn ])
	.service('apjActionIcons_eventHandler', [ actionIcon_serviceFn ])
	;
