'use strict';

	function actionIconServiceFn ($q, $rootScope) {

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

	function actionIconSetDirectiveFn ($compile, actionIcons) {
		return {
			// template: '<div></div>',
			restrict: 'E',
			scope: {},
			link: function postLink(scope, element, attrs) {
				var actionables = [], 
					cycleDelim = new RegExp(actionIcons.getCycleDelim()),
					radioDelim = new RegExp(actionIcons.getRadioDelim()),
					radioOffDelim = new RegExp(actionIcons.getRadioOffDelim()),
					groups = attrs.actions.split(actionIcons.getGroupDelim());
				scope.icons = scope.$parent.icons;
				for (var x=0; x<groups.length; x++) {
					var eType = 'action-icon-single-state';
					if ( cycleDelim.test(groups[x]) ) { eType = 'action-icon-cycle-state'; }
					if ( radioDelim.test(groups[x]) ) { eType = 'action-icon-radio-state'; }
					if ( radioOffDelim.test(groups[x]) ) { eType = 'action-icon-radio-off-state'; }
					// actionables.push(sprintf('<%s data-item-id="%i" data-icon="%s"></%s>',eType,attrs.entityId,groups[x],eType));
					actionables.push('<'+eType+' data-item-id="'+attrs.entityId+'" data-icon="'+groups[x]+'"></'+eType+'>');
				}
				var el = angular.element(actionables.join(''));
				var compiled = $compile(el);
				element.append(el);
				compiled(scope);
			}
		};
	}

	function actionIconSingleStateDirectiveFn ($compile, $rootScope, actionIcons) {

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
					actionIcons.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(data){ // resolved, action was successful
								console.log(actionIcons.nameTheIcon(scope.event,attrs.itemId),'success data: '+(data || '[none returned]'));
							},
							function(err){ // rejected, action was NOT successful
								console.log(actionIcons.nameTheIcon(scope.event,attrs.itemId),'failed error: '+(err || '[none reported]'));
							},
							function(msg){ // notification, action had something to say
								console.log(actionIcons.nameTheIcon(scope.event,attrs.itemId),'notification: '+msg);
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

	function actionIconCycleStateDirectiveFn ($compile, $rootScope, actionIcons) {

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
				var actionIconList = attrs.icon.split(actionIcons.getCycleDelim());
				var iconInfo = scope.$parent.icons[actionIconList[0]];
				scopeTheIcon(scope,iconInfo);
				scope.clicked = function() { 
					actionIcons.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(data){ // resolved, action was successful
								console.log(actionIcons.nameTheIcon(scope.event,attrs.itemId),'success data: '+(data || '[none returned]'));
								// move on to the next icon in the series
								var actionIconNdx = actionIconList.indexOf(scope.name);
								iconInfo = scope.$parent.icons[actionIconList[ (actionIconNdx+1)%actionIconList.length ]];
								scopeTheIcon(scope,iconInfo);
							},
							function(err){ // rejected, action was NOT successful
								console.log(actionIcons.nameTheIcon(scope.event,attrs.itemId),'failed error: '+(err || '[none reported]'));
							},
							function(msg){ // notification, action had something to say
								console.log(actionIcons.nameTheIcon(scope.event,attrs.itemId),'notification: '+msg);
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

	function actionIconRadioStateDirectiveFn ($compile, $rootScope, actionIcons) {

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
				var actionIconList = attrs.icon.split(actionIcons.getRadioDelim());
				scopeTheIcon(scope,scope.$parent.icons[actionIconList[actionIcons.iconOffNdx]]); // show the off icon to start
				scope.clicked = function() { 
					// if we clicked on one that is on 
					if (scope.radioIsOn) {
						// then bail - you can't turn off a radio icon
						console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'discarded, you cannot turn off a radio icon [use a radio-off icon]');
					} else {
						// if any one of these radios [by class] is in motion, 
						if (actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]]) {
							// then bail
							console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'discarded, already processing an event for this group');
						} else {
							// set up a blocker while we process this click, we don't want any interleaved actions
							actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]] = new Date().getTime();
							// find the previously 'on' one (having more than one is an error)
							var theOn = document.getElementsByClassName(actionIconList[actionIcons.iconOnClass]);
							if (theOn.length) {
								// and try to turn it off
								var theOnScope = angular.element(theOn[0]).scope();
								actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.itemId)
									.then(
										function(data){ // resolved, action was successful
											console.log(actionIcons.nameTheIcon(theOnScope.event,theOnScope.itemId),'success data: '+(data || '[none returned]'));
											// so change to the off icon
											scope.radioIsOn = false;
											scopeTheIcon(theOnScope,scope.$parent.icons[actionIconList[actionIcons.iconOffNdx]]); 
											// if the one we turned off is not the one we want to turn on
											if (theOnScope.itemId !== scope.itemId) {
												// then turn on the one they clicked on
												actionIcons.emitActionIconEvent(scope.event,scope.itemId)
													.then(
														function(data){ // resolved, action was successful
															console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
															// change to the on icon
															scope.radioIsOn = true;
															scopeTheIcon(scope,scope.$parent.icons[actionIconList[actionIcons.iconOnNdx]],actionIconList[actionIcons.iconOnClass]);
															// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
															delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
														},
														function(err){ // rejected, action was NOT successful
															console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
															// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
															delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
														},
														function(msg){ // notification, action had something to say
															console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
															// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
															delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
														}
													);

											// we were only turning one off 
											} else {
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
											}

										},
										function(err){ // rejected, action was NOT successful
											console.log(actionIcons.nameTheIcon(theOnScope.event,theOnScope.itemId),'failed error: '+(err || '[none reported]'));
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
										},
										function(msg){ // notification, action had something to say
											console.log(actionIcons.nameTheIcon(theOnScope.event,theOnScope.itemId),'notification: '+msg);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
										}
									);

								// otherwise there was no other icon in the On state
								} else { 

									// then turn on the one they clicked on
									actionIcons.emitActionIconEvent(scope.event,scope.itemId)
										.then(
											function(data){ // resolved, action was successful
												console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
												// change to the on icon
												scope.radioIsOn = true;
												scopeTheIcon(scope,scope.$parent.icons[actionIconList[actionIcons.iconOnNdx]],actionIconList[actionIcons.iconOnClass]);
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
											},
											function(err){ // rejected, action was NOT successful
												console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
											},
											function(msg){ // notification, action had something to say
												console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
											}
										);
								}
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

	function actionIconRadioStateOffDirectiveFn ($compile, $rootScope, actionIcons) {

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
				var actionIconList = attrs.icon.split(actionIcons.getRadioOffDelim());
				scopeTheIcon(scope,scope.$parent.icons[actionIconList[actionIcons.iconOffNdx]]); // show the off icon to start
				scope.clicked = function() { 
					// if any one of these radio-offs [by class] is in motion, 
					if (actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]]) {
						// then bail
						console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'discarded, already processing an event for this group');
					} else {
						// set up a blocker while we process this click, we don't want any interleaved actions
						actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]] = new Date().getTime();
						// find the previously 'on' one (having more than one is an error)
						var theOn = document.getElementsByClassName(actionIconList[actionIcons.iconOnClass]);
						if (theOn.length) {
							// and try to turn it off
							var theOnScope = angular.element(theOn[0]).scope();
							actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.itemId)
								.then(
									function(data){ // resolved, action was successful
										console.log(actionIcons.nameTheIcon(theOnScope.event,theOnScope.itemId),'success data: '+(data || '[none returned]'));
										// so change to the off icon
										scopeTheIcon(theOnScope,scope.$parent.icons[actionIconList[actionIcons.iconOffNdx]]); 
										// if the one we turned off is not the one we want to turn on
										if (theOnScope.itemId !== scope.itemId) {
											// then turn on the one they clicked on
											actionIcons.emitActionIconEvent(scope.event,scope.itemId)
												.then(
													function(data){ // resolved, action was successful
														console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
														// change to the on icon
														scopeTheIcon(scope,scope.$parent.icons[actionIconList[actionIcons.iconOnNdx]],actionIconList[actionIcons.iconOnClass]);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
													},
													function(err){ // rejected, action was NOT successful
														console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
													},
													function(msg){ // notification, action had something to say
														console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
													}
												);

										// we were only turning one off 
										} else {
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
										}

									},
									function(err){ // rejected, action was NOT successful
										console.log(actionIcons.nameTheIcon(theOnScope.event,theOnScope.itemId),'failed error: '+(err || '[none reported]'));
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
									},
									function(msg){ // notification, action had something to say
										console.log(actionIcons.nameTheIcon(theOnScope.event,theOnScope.itemId),'notification: '+msg);
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
									}
								);

							// otherwise there was no other icon in the On state
							} else { 

								// then turn on the one they clicked on
								actionIcons.emitActionIconEvent(scope.event,scope.itemId)
									.then(
										function(data){ // resolved, action was successful
											console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'success data: '+(data || '[none returned]'));
											// change to the on icon
											scopeTheIcon(scope,scope.$parent.icons[actionIconList[actionIcons.iconOnNdx]],actionIconList[actionIcons.iconOnClass]);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
										},
										function(err){ // rejected, action was NOT successful
											console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'failed error: '+(err || '[none reported]'));
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
										},
										function(msg){ // notification, action had something to say
											console.log(actionIcons.nameTheIcon(scope.event,scope.itemId),'notification: '+msg);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[actionIconList[actionIcons.iconOnClass]];
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
	
angular.module('angularActionIcons', [])
	.service('actionIcons', [ '$q', '$rootScope', actionIconServiceFn ])
	.directive('actionIconSet', [ '$compile', 'actionIcons', actionIconSetDirectiveFn ])
	.directive('actionIconSingleState', [ '$compile', '$rootScope', 'actionIcons', actionIconSingleStateDirectiveFn ])
	.directive('actionIconCycleState', [ '$compile', '$rootScope', 'actionIcons', actionIconCycleStateDirectiveFn ])
	.directive('actionIconRadioState', [ '$compile', '$rootScope', 'actionIcons', actionIconRadioStateDirectiveFn ])
	.directive('actionIconRadioOffState', [ '$compile', '$rootScope', 'actionIcons', actionIconRadioStateOffDirectiveFn ])
	;
