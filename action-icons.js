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

		// put radioClasses in here while processing to avoid interleaving fast clicks
		var radiosInMotion = {};

		// in response to an actionIcon click, emit an event on the rootscope
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
						actionIconListeners[iconInfo.event] = $rootScope.$on(iconInfo.event, actionIconEventQueue);
					}
				}
			}
		}

		// default actionIconHandler echo to console, reject 25% of the time
		function defaultActionIconEventHandler (event, promise) {
			if (Math.random() > 0.25) {
				promise.resolve('[defaultActionIconEventHandler] resolved '+nameTheIcon(promise.event,promise.id));
			} else {
				promise.reject('[defaultActionIconEventHandler] rejected '+nameTheIcon(promise.event,promise.id));
			}
		}

		// accept a replacement for the default event handler (should be a list of handlers)
		var registeredActionIconEventHandler = defaultActionIconEventHandler;
		function registerActionIconEventHandler (newActionIconEventHandler) {
			registeredActionIconEventHandler = newActionIconEventHandler;
		}

		// pass the work to the logical side
		function actionIconEventQueue (event, promise) {
			registeredActionIconEventHandler(event,promise);
		}

		// name the icon
		function nameTheIcon (event, id) {
			var eventParts = event.split('.');
			return eventParts[1]+' '+eventParts[0]+' #'+id;
		}

		// create an icon info record
		function addActionIconInfo(name,event,title,family) {
			return {
				name: name,		 // ex: iconName
				event: event,	 // ex: entity.action
				title: title,	 // ex: click here to do something
				family:family	 // ex: iconProductName
			};
		}

		// add a single action icon
		function addActionIconSingle(name) {
			return name;
		}

		// add a cycling set, the first one will be the default
		function addActionIconCycle() {
			return arguments.join(getCycleDelim());
		}

		// add a radio button icon set, default will be off -- adds a class to find the one's that are on
		function addActionIconRadio(off,on,clas) {
			var options = [];
			options.push(off);
			options.push(on);
			clas = clas || uuid.v4().replace('-',''); // default to a compact uuid
			options.push(clas);
			return options.join(getRadioDelim());
		}

		// add a radio-off button icon set, default will be off, allows turning off an on -- adds a class to find the one's that are on
		function addActionIconRadioOff(off,on,clas) {
			var options = [];
			options.push(off);
			options.push(on);
			clas = clas || uuid.v4().replace('-',''); // default to a compact uuid
			options.push(clas);
			return options.join(getRadioOffDelim());
		}

		 // index into the radio & radio-off icon group [off:on:clas]
		var iconOffNdx = 0, iconOnNdx = 1, iconOnClass = 2;

		// get the separator for icon groups -- please keep in sync with the backend
		function getGroupDelim() { return ','; }

		// get the separator for cycle icons -- please keep in sync with the backend
		function getCycleDelim() { return '>'; }

		// get the separator for radio icons -- please keep in sync with the backend
		function getRadioDelim() { return ':'; }

		// get the separator for radio-off icons, allows to turn off an on radio -- please keep in sync with the backend
		function getRadioOffDelim() { return ';'; }

		return {
			registerActionIconEventHandler: registerActionIconEventHandler,
			listenToTheseActionIcons: listenToTheseActionIcons,
			emitActionIconEvent: emitActionIconEvent,
			addActionIconInfo: addActionIconInfo,
			addActionIconSingle: addActionIconSingle,
			addActionIconCycle: addActionIconCycle,
			addActionIconRadio: addActionIconRadio,
			addActionIconRadioOff: addActionIconRadioOff,
			getGroupDelim: getGroupDelim,
			getCycleDelim: getCycleDelim,
			getRadioDelim: getRadioDelim,
			getRadioOffDelim: getRadioOffDelim,
			nameTheIcon: nameTheIcon,
			iconOffNdx: iconOffNdx,
			iconOnNdx: iconOnNdx,
			iconOnClass: iconOnClass,
			radiosInMotion: radiosInMotion
		};
		
	}

	function actionIconSet_directiveFn ($compile, apjActionIcons_eventHandler, sprintf) {
		return {
			template: '<div></div>',
			restrict: 'E',
			scope: {},
			link: function postLink(scope, element, attrs) {
				var actionables = [], 
					cycleDelim = new RegExp(apjActionIcons_eventHandler.getCycleDelim()),
					radioDelim = new RegExp(apjActionIcons_eventHandler.getRadioDelim()),
					radioOffDelim = new RegExp(apjActionIcons_eventHandler.getRadioOffDelim()),
					groups = attrs.actions.split(apjActionIcons_eventHandler.getGroupDelim());
				scope.icons = scope.$parent.icons;
				for (var x=0; x<groups.length; x++) {
					var eType = 'single-state-icon';
					if ( cycleDelim.test(groups[x]) ) { eType = 'cycle-state-icon'; }
					if ( radioDelim.test(groups[x]) ) { eType = 'radio-state-icon'; }
					if ( radioOffDelim.test(groups[x]) ) { eType = 'radio-off-state-icon'; }
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

		function scopeTheIcon (scope,iconInfo) {
			scope.name = iconInfo.name;
			scope.title = iconInfo.title;
			scope.event = iconInfo.event;
			scope.family = iconInfo.family;
			scope.className = iconInfo.family +'-'+ iconInfo.name;
		}

		return {
			restrict: 'EA',
			scope: { itemId: '@' },
			link: function postLink(scope, element, attrs) {
				var iconInfo = scope.$parent.icons[attrs.icon];
				scopeTheIcon(scope,iconInfo);
				scope.clicked = function() { 
					apjActionIcons_eventHandler.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(data){ // resolved, action was successful
								console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,attrs.itemId),'success data: '+(data || '[none returned]'));
							},
							function(err){ // rejected, action was NOT successful
								console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,attrs.itemId),'failed error: '+(err || '[none reported]'));
							},
							function(msg){ // notification, action had something to say
								console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,attrs.itemId),'notification: '+msg);
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
			restrict: 'EA',
			scope: { itemId: '@' },
			link: function postLink(scope, element, attrs) {
				var actionIconList = attrs.icon.split(apjActionIcons_eventHandler.getCycleDelim());
				var iconInfo = scope.$parent.icons[actionIconList[0]];
				scopeTheIcon(scope,iconInfo);
				scope.clicked = function() { 
					apjActionIcons_eventHandler.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(data){ // resolved, action was successful
								console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,attrs.itemId),'success data: '+(data || '[none returned]'));
								// move on to the next icon in the series
								var actionIconNdx = actionIconList.indexOf(scope.name);
								iconInfo = scope.$parent.icons[actionIconList[ (actionIconNdx+1)%actionIconList.length ]];
								scopeTheIcon(scope,iconInfo);
							},
							function(err){ // rejected, action was NOT successful
								console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,attrs.itemId),'failed error: '+(err || '[none reported]'));
							},
							function(msg){ // notification, action had something to say
								console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,attrs.itemId),'notification: '+msg);
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

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}}"/>';

		function scopeTheIcon (scope,iconInfo,_clas) {
			scope.clas = _clas;
			scope.name = iconInfo.name;
			scope.title = iconInfo.title;
			scope.event = iconInfo.event;
			scope.family = iconInfo.family;
			scope.className = iconInfo.family +'-'+ iconInfo.name;
		}

		return {
			restrict: 'EA',
			scope: { itemId: '@' },
			link: function postLink(scope, element, attrs) {
				var actionIconList = attrs.icon.split(apjActionIcons_eventHandler.getRadioDelim());
				scopeTheIcon(scope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOffNdx]]); // show the off icon to start
				scope.clicked = function() { 
					// if any one of these radios [by class] is in motion, 
					if (apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]]) {
						// then bail
						console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'discarded, already processing an event for this group');
					} else {
						// set up a blocker while we process this click, we don't want any interleaved actions
						apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]] = new Date().getTime();
						// find the previously 'on' one (having more than one is an error)
						var theOn = document.getElementsByClassName(actionIconList[apjActionIcons_eventHandler.iconOnClass]);
						if (theOn.length) {
							// and try to turn it off
							var theOnScope = angular.element(theOn[0]).scope();
							apjActionIcons_eventHandler.emitActionIconEvent(theOnScope.event,theOnScope.itemId)
								.then(
									function(data){ // resolved, action was successful
										console.log(apjActionIcons_eventHandler.nameTheIcon(theOnScope.event,theOnScope.itemId),'success data: '+(data || '[none returned]'));
										// so change to the off icon
										scopeTheIcon(theOnScope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOffNdx]]); 
										// if the one we turned off is not the one we want to turn on
										if (theOnScope.itemId !== scope.itemId) {
											// then turn on the one they clicked on
											apjActionIcons_eventHandler.emitActionIconEvent(scope.event,scope.itemId)
												.then(
													function(data){ // resolved, action was successful
														console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
														// change to the on icon
														scopeTheIcon(scope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOnNdx]],actionIconList[apjActionIcons_eventHandler.iconOnClass]);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
													},
													function(err){ // rejected, action was NOT successful
														console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
													},
													function(msg){ // notification, action had something to say
														console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
													}
												);

										// we were only turning one off 
										} else {
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										}

									},
									function(err){ // rejected, action was NOT successful
										console.log(apjActionIcons_eventHandler.nameTheIcon(theOnScope.event,theOnScope.itemId),'failed error: '+(err || '[none reported]'));
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
									},
									function(msg){ // notification, action had something to say
										console.log(apjActionIcons_eventHandler.nameTheIcon(theOnScope.event,theOnScope.itemId),'notification: '+msg);
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
									}
								);

							// otherwise there was no other icon in the On state
							} else { 

								// then turn on the one they clicked on
								apjActionIcons_eventHandler.emitActionIconEvent(scope.event,scope.itemId)
									.then(
										function(data){ // resolved, action was successful
											console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
											// change to the on icon
											scopeTheIcon(scope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOnNdx]],actionIconList[apjActionIcons_eventHandler.iconOnClass]);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										},
										function(err){ // rejected, action was NOT successful
											console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										},
										function(msg){ // notification, action had something to say
											console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										}
									);
							}
					}
				};

				var el = angular.element(tmpl);
				var compiled = $compile(el);
				element.html(el);
				compiled(scope);
			}
		};
	}

	function actionIconRadioStateOff_directiveFn ($compile, $rootScope, apjActionIcons_eventHandler) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}}"/>';

		function scopeTheIcon (scope,iconInfo,_clas) {
			scope.clas = _clas;
			scope.name = iconInfo.name;
			scope.title = iconInfo.title;
			scope.event = iconInfo.event;
			scope.family = iconInfo.family;
			scope.className = iconInfo.family +'-'+ iconInfo.name;
		}

		return {
			restrict: 'EA',
			scope: { itemId: '@' },
			link: function postLink(scope, element, attrs) {
				var actionIconList = attrs.icon.split(apjActionIcons_eventHandler.getRadioOffDelim());
				scopeTheIcon(scope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOffNdx]]); // show the off icon to start
				scope.clicked = function() { 
					// if any one of these radio-offs [by class] is in motion, 
					if (apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]]) {
						// then bail
						console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'discarded, already processing an event for this group');
					} else {
						// set up a blocker while we process this click, we don't want any interleaved actions
						apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]] = new Date().getTime();
						// find the previously 'on' one (having more than one is an error)
						var theOn = document.getElementsByClassName(actionIconList[apjActionIcons_eventHandler.iconOnClass]);
						if (theOn.length) {
							// and try to turn it off
							var theOnScope = angular.element(theOn[0]).scope();
							apjActionIcons_eventHandler.emitActionIconEvent(theOnScope.event,theOnScope.itemId)
								.then(
									function(data){ // resolved, action was successful
										console.log(apjActionIcons_eventHandler.nameTheIcon(theOnScope.event,theOnScope.itemId),'success data: '+(data || '[none returned]'));
										// so change to the off icon
										scopeTheIcon(theOnScope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOffNdx]]); 
										// if the one we turned off is not the one we want to turn on
										if (theOnScope.itemId !== scope.itemId) {
											// then turn on the one they clicked on
											apjActionIcons_eventHandler.emitActionIconEvent(scope.event,scope.itemId)
												.then(
													function(data){ // resolved, action was successful
														console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
														// change to the on icon
														scopeTheIcon(scope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOnNdx]],actionIconList[apjActionIcons_eventHandler.iconOnClass]);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
													},
													function(err){ // rejected, action was NOT successful
														console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
													},
													function(msg){ // notification, action had something to say
														console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
													}
												);

										// we were only turning one off 
										} else {
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										}

									},
									function(err){ // rejected, action was NOT successful
										console.log(apjActionIcons_eventHandler.nameTheIcon(theOnScope.event,theOnScope.itemId),'failed error: '+(err || '[none reported]'));
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
									},
									function(msg){ // notification, action had something to say
										console.log(apjActionIcons_eventHandler.nameTheIcon(theOnScope.event,theOnScope.itemId),'notification: '+msg);
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
									}
								);

							// otherwise there was no other icon in the On state
							} else { 

								// then turn on the one they clicked on
								apjActionIcons_eventHandler.emitActionIconEvent(scope.event,scope.itemId)
									.then(
										function(data){ // resolved, action was successful
											console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
											// change to the on icon
											scopeTheIcon(scope,scope.$parent.icons[actionIconList[apjActionIcons_eventHandler.iconOnNdx]],actionIconList[apjActionIcons_eventHandler.iconOnClass]);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										},
										function(err){ // rejected, action was NOT successful
											console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										},
										function(msg){ // notification, action had something to say
											console.log(apjActionIcons_eventHandler.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete apjActionIcons_eventHandler.radiosInMotion[actionIconList[apjActionIcons_eventHandler.iconOnClass]];
										}
									);
							}
					}
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
	.directive('apjActionIcons_radioStateOff', [ actionIconRadioStateOff_directiveFn ])
	.service('apjActionIcons_eventHandler', [ actionIcon_serviceFn ])
	;
