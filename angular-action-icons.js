'use strict';

	function actionIconServiceFn ($q, $rootScope) {


		/*
			eventing

			to be able to emit user specified events on click -- 
				we will send your iconInfo.event & data-entity-id in the   
				as .event & .id in the promise with your iconInfo.event as the emitted 'event'
				this is done automatically via: emitActionIconEvent

			to be able to ask for icon changes via: setIcon(entityType,desiredIconTag,[iconIds])
				you will request iconInfo.tag be applied to all icons 
				identified by data-entity-type and an array of ids
				-- we will only set those icons that are valid for 
					the icons found (no action can result in a blank icon)

		*/

		// call for icons to be changed
		function enableIcon (_iconType, _enabled, _idList) {
			var envelope = { 
				typ: _iconType, 
				enable: _enabled, 
				ids: _idList 
			};
			setTimeout(function() {
				$rootScope.$emit(controlEventPrefix()+_iconType,envelope); 
			}, 1);
		}

		// call for icons to be changed
		function setIcon (_iconType, _iconTag, _idList) {
			var envelope = { 
				typ: _iconType, 
				tag: _iconTag, 
				ids: _idList 
			};
			setTimeout(function() {
				$rootScope.$emit(controlEventPrefix()+_iconType,envelope); 
			}, 1);
		}

		// tell a list of controllers to set their icons
		function SetControlledIcons( controllerArray, envelope ){ 
			var tagging = envelope.hasOwnProperty('tag');
			var enabling = envelope.hasOwnProperty('enable');
			for (var ndx=0; ndx < controllerArray.length; ndx++) {
				if (tagging) {
					controllerArray[ndx].setMyIcon(envelope.tag);
				}
				if (enabling) {
					controllerArray[ndx].enableMyIcon(envelope.enable);
				}
			}
		}

		// we listen for requests to change icons
		var actionIconControls = {};
		function listenForControl(directiveController){ 
			var iconControlEvent = directiveController.getIconControlEvent(); 
			var itemType = directiveController.getItemType();
			var itemId = directiveController.getItemId();
			if (! actionIconControls.hasOwnProperty(iconControlEvent)) { // by iconControlEvent
				actionIconControls[iconControlEvent] = {};
				actionIconControls[iconControlEvent].itemType = itemType;
				actionIconControls[iconControlEvent].controllerList = {};
				actionIconControls[iconControlEvent].listener = $rootScope.$on(iconControlEvent, function(evt,envelope) {
					if (envelope.ids === '*') {
						for (var iconNdx in actionIconControls[iconControlEvent].controllerList) {
							if (actionIconControls[iconControlEvent].controllerList.hasOwnProperty(iconNdx)) {
								SetControlledIcons(actionIconControls[iconControlEvent].controllerList[iconNdx],envelope);  // jshint ignore:line
							}
						}
					} else {
						for (var ndx=0; ndx<envelope.ids.length; ndx++) {
							if (actionIconControls[iconControlEvent].controllerList.hasOwnProperty(envelope.ids[ndx])) {
								SetControlledIcons(actionIconControls[iconControlEvent].controllerList[envelope.ids[ndx]],envelope);  // jshint ignore:line
							}
						}
					}
					$rootScope.$apply();
				});
			}
			if (! actionIconControls[iconControlEvent].controllerList.hasOwnProperty(itemId)) {
				actionIconControls[iconControlEvent].controllerList[itemId] = [];
			}
			actionIconControls[iconControlEvent].controllerList[itemId].push(directiveController); // and by entityId
		}

		// in response to an actionIcon click, emit an event on the rootscope
		function emitActionIconEvent(evt,id) { 
			var deferred = $q.defer();
			deferred.event = evt;
			deferred.id = id;
			setTimeout(function() {
				$rootScope.$emit(evt,deferred); 
			}, 1);
			return deferred.promise;
		}

		// put radioClasses in here while processing to avoid interleaving fast clicks
		var radiosInMotion = {};

		// dynamically add a style rule to the page
		function injectStyles(rule,id) {
			angular.element('<div />', { html: '&shy;<style id="'+id+'">' + rule + '</style>' })
				.appendTo('body');    
		}

		// add our hover styles, only once
		function addHoverStyles(){
			if (! angular.element('#actionIconHoverStyle').length) {
				if ((typeof document.body.style.filter !== 'undefined') && 
					(typeof document.body.style.webkitFilter !== 'undefined')) {
					injectStyles('.action-icon:hover { filter: invert(100%); -webkit-filter: invert(100%); }','actionIconHoverStyle'); 
					injectStyles('.action-icon.disabled { filter: invert(100%); -webkit-filter: invert(100%) !important; }','actionIconDisabledStyle'); 
				} else {
					injectStyles('.action-icon:hover { color: white; background-color: black; }','actionIconHoverStyle'); 
					injectStyles('.action-icon:disabled { color: white; background-color: black !important; }','actionIconDisabledStyle'); 
				}
			}
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
			addHoverStyles();
		}

		// default actionIconHandler resolve
		function defaultActionIconEventHandler (event, promise) {
			promise.resolve('[defaultActionIconEventHandler] resolved '+nameTheIcon(promise.event,promise.id));
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

		// default logging function - echo to console
		function defaultLogResultFn (tag,msg) {
			console.log(tag,msg);
		}

		// accept a replacement for the default logging function
		var registeredLogResultFn = defaultLogResultFn;
		function registerLogResultFn (newLogResultFn) {
			registeredLogResultFn = newLogResultFn;
		}

		// pass the work to the logical side
		function logTheResult (tag,msg) {
			registeredLogResultFn(tag,msg);
		}

		// name the icon event
		function nameTheIcon (event, id) {
			var eventParts = event.split('.');
			return eventParts.reverse().join(' ')+' #'+id;
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
			var names = [];
			for (var e in arguments) {
				if (arguments.hasOwnProperty(e)) {
					names.push(arguments[e]);
				}
			}
			return names.join(getCycleDelim());
		}

		// add a radio button icon set, default will be off -- adds a class to find the one's that are on
		function addActionIconRadio(off,on,clas) {
			var options = [];
			options.push(off);
			options.push(on);
			clas = clas || Math.floor(1000000 * Math.random()); //uuid.v4().replace('-',''); // default to a compact uuid
			options.push(clas);
			return options.join(getRadioDelim());
		}

		// add a radio-off button icon set, default will be off, allows turning off an on -- adds a class to find the one's that are on
		function addActionIconRadioOff(off,on,clas) {
			var options = [];
			options.push(off);
			options.push(on);
			clas = clas || Math.floor(1000000 * Math.random()); //uuid.v4().replace('-',''); // default to a compact uuid
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

		function getIconDelimRegEx() { return new RegExp('[>:;]'); }

		function controlEventPrefix () { return 'actionIcons.'; }

		return {
			registerActionIconEventHandler: registerActionIconEventHandler,
			listenToTheseActionIcons: listenToTheseActionIcons,
			emitActionIconEvent: emitActionIconEvent,
			addActionIconInfo: addActionIconInfo,
			addActionIconSingle: addActionIconSingle,
			addActionIconCycle: addActionIconCycle,
			addActionIconRadio: addActionIconRadio,
			addActionIconRadioOff: addActionIconRadioOff,
			registerLogResultFn: registerLogResultFn,
			getGroupDelim: getGroupDelim,
			getCycleDelim: getCycleDelim,
			getRadioDelim: getRadioDelim,
			getRadioOffDelim: getRadioOffDelim,
			nameTheIcon: nameTheIcon,
			iconOffNdx: iconOffNdx,
			iconOnNdx: iconOnNdx,
			iconOnClass: iconOnClass,
			radiosInMotion: radiosInMotion,
			logTheResult: logTheResult,
			listenForControl: listenForControl,
			setIcon: setIcon,
			enableIcon: enableIcon,
			controlEventPrefix: controlEventPrefix,
			getIconDelimRegEx: getIconDelimRegEx,
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
					actionables.push('<'+eType+' data-item-id="'+attrs.entityId+'" data-item-type="'+attrs.entityType+'" data-icon="'+groups[x]+'"></'+eType+'>');
				}
				var el = angular.element(actionables.join(''));
				var compiled = $compile(el);
				element.append(el);
				compiled(scope);
			}
		};
	}

	function actionIconDirectiveControllerFn ($scope, $element, $rootScope, actionIcons) { 

		$scope.aiIconInfos = {};
		$scope.aiItemId = $element.attr('data-item-id');
		$scope.aiItemType = $element.attr('data-item-type'); 
		$scope.aiItemClump = $element.attr('data-icon'); 
		$scope.aiIconTagList = $scope.aiItemClump.split(actionIcons.getIconDelimRegEx());

		for (var ndx = 0; ndx < $scope.aiIconTagList.length; ndx++) {
			var eachTag = $scope.aiIconTagList[ndx];
			$scope.aiIconInfos[eachTag] = $scope.$parent.icons[eachTag];
		}

		this.setNextIcon = function(){ // jshint ignore:line
			var actionIconNdx = $scope.aiIconTagList.indexOf($scope.aiCurrentTag);
			actionIconNdx = (actionIconNdx+1) % $scope.aiIconTagList.length;
			this.setMyIcon(actionIconNdx);
		};

		this.hasOnClass = function(){ // jshint ignore:line
			if ($scope.aiIconType.indexOf('Radio') !== -1) {
				if ($scope.aiIconTagList.length > (actionIcons.iconOnClass)) {
					return true;
				}
			}
			return false;
		};

		this.getOnClassForTagOrNdx = function(allegedTagOrNdx){ // jshint ignore:line
			if (this.hasOnClass) {
				if (! isFinite(allegedTagOrNdx)) { // force to an Ndx
					allegedTagOrNdx = $scope.aiIconTagList.indexOf(allegedTagOrNdx);
				}
				if (allegedTagOrNdx === actionIcons.iconOnNdx) {
					return $scope.aiIconTagList[actionIcons.iconOnClass];
				}
			}
			return '';
		};

		this.setMyIcon = function(allegedTagOrNdx){ // jshint ignore:line
			var allegedTag = allegedTagOrNdx;
			if (isFinite(allegedTagOrNdx)) { 
				allegedTag = $scope.aiIconTagList[allegedTagOrNdx];
			}
			if ($scope.aiIconInfos.hasOwnProperty((allegedTag))) {
				$scope.clas = this.getOnClassForTagOrNdx(allegedTagOrNdx);
				$scope.label = allegedTag;
				$scope.aiCurrentTag = allegedTag;
				$scope.name = $scope.aiIconInfos[allegedTag].name;
				$scope.title = $scope.aiIconInfos[allegedTag].title;
				$scope.event = $scope.aiIconInfos[allegedTag].event;
				$scope.family = $scope.aiIconInfos[allegedTag].family;
				$scope.className = $scope.aiIconInfos[allegedTag].family +'-'+ $scope.aiIconInfos[allegedTag].name;
			}
		};

		this.enableMyIcon = function(enableIcon){ // jshint ignore:line
			$scope.enabled = enableIcon;
			if ($scope.enabled) {
				$scope.disabled = '';
			} else {
				$scope.disabled = 'disabled';
			}
		};

		this.getIconControlEvent = function(){ // jshint ignore:line
			return actionIcons.controlEventPrefix()+$scope.aiItemType;
		};

		this.getItemType = function(){ // jshint ignore:line
			return $scope.aiItemType;
		};

		this.getItemId = function(){ // jshint ignore:line
			return $scope.aiItemId;
		};

		this.setMyIcon(actionIcons.iconOffNdx); // jshint ignore:line

		this.enableMyIcon(true); // jshint ignore:line
	}

	function actionIconSingleStateDirectiveFn ($compile, $rootScope, actionIcons) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon single-state-icon {{family}} {{className}} {{disabled}}"/>';

		return {
			restrict: 'EA',
			scope: {},
			controller: actionIconDirectiveControllerFn,
			link: function postLink(scope, element, attrs, myController) {
				scope.aiIconType = 'actionIconSingleState';
				scope.controller = myController;
				scope.clicked = function() { 
					if (! scope.enabled) { return; }
					actionIcons.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(data){ // resolved, action was successful
								actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,attrs.itemId),'success data: '+(data || '[none returned]'));
							},
							function(err){ // rejected, action was NOT successful
								actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,attrs.itemId),'failed error: '+(err || '[none reported]'));
							},
							function(msg){ // notification, action had something to say
								actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,attrs.itemId),'notification: '+msg);
							}
						);
				};
				var el = angular.element(tmpl);
				var compiled = $compile(el);
				element.html(el);
				compiled(scope);
				actionIcons.listenForControl(myController);
			}
		};
	}

	function actionIconCycleStateDirectiveFn ($compile, $rootScope, actionIcons) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon cycle-state-icon {{family}} {{className}}"/>';

		return {
			restrict: 'EA',
			scope: {},
			controller: actionIconDirectiveControllerFn,
			link: function postLink(scope, element, attrs, myController) {
				scope.aiIconType = 'actionIconCycleState';
				scope.controller = myController;
				scope.clicked = function() { 
					if (! scope.enabled) { return; }
					actionIcons.emitActionIconEvent(scope.event,attrs.itemId)
						.then(
							function(data){ // resolved, action was successful
								actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,attrs.itemId),'success data: '+(data || '[none returned]'));
								myController.setNextIcon();
							},
							function(err){ // rejected, action was NOT successful
								actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,attrs.itemId),'failed error: '+(err || '[none reported]'));
							},
							function(msg){ // notification, action had something to say
								actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,attrs.itemId),'notification: '+msg);
							}
						);
				};
				var el = angular.element(tmpl);
				var compiled = $compile(el);
				element.html(el);
				compiled(scope);
				actionIcons.listenForControl(myController);
			}
		};
	}

	function actionIconRadioStateDirectiveFn ($compile, $rootScope, actionIcons) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}}"/>';

		return {
			restrict: 'EA',
			scope: {},
			controller: actionIconDirectiveControllerFn,
			link: function postLink(scope, element, attrs, myController) {
				scope.aiIconType = 'actionIconRadioState';
				scope.controller = myController;
				scope.clicked = function() { 
					if (! scope.enabled) { return; }
					// if we clicked on one that is on 
					if (scope.aiIconTagList.indexOf(scope.aiCurrentTag) === actionIcons.iconOnNdx) { 
						// then bail - you can't turn off a radio icon
						actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'discarded, you cannot turn off a radio icon [use a radio-off icon]');
					} else {
						// if any one of these radios [by class] is in motion, 
						if (actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]]) {
							// then bail
							actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'discarded, already processing an event for this group');
						} else {
							// set up a blocker while we process this click, we don't want any interleaved actions
							actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]] = new Date().getTime();
							// find the previously 'on' one (having more than one is an error)
							var theOn = document.getElementsByClassName(scope.aiIconTagList[actionIcons.iconOnClass]);
							if (theOn.length) {
								// and try to turn it off
								var theOnScope = angular.element(theOn[0]).scope();
								actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.aiItemId)
									.then(
										function(data){ // resolved, action was successful
											actionIcons.logTheResult(actionIcons.nameTheIcon(theOnScope.event,theOnScope.aiItemId),'success data: '+(data || '[none returned]'));
											// so change to the off icon
											theOnScope.controller.setMyIcon(actionIcons.iconOffNdx);
											// if the one we turned off is not the one we want to turn on
											if (theOnScope.aiItemId !== scope.aiItemId) {
												// then turn on the one they clicked on
												actionIcons.emitActionIconEvent(scope.event,scope.aiItemId)
													.then(
														function(data){ // resolved, action was successful
															actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'success data: '+(data || '[none returned]'));
															// change to the on icon
															myController.setMyIcon(actionIcons.iconOnNdx);
															// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
															delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
														},
														function(err){ // rejected, action was NOT successful
															actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'failed error: '+(err || '[none reported]'));
															// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
															delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
														},
														function(msg){ // notification, action had something to say
															actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'notification: '+msg);
															// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
															delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
														}
													);

											// we were only turning one off 
											} else {
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
											}

										},
										function(err){ // rejected, action was NOT successful
											actionIcons.logTheResult(actionIcons.nameTheIcon(theOnScope.event,theOnScope.aiItemId),'failed error: '+(err || '[none reported]'));
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										},
										function(msg){ // notification, action had something to say
											actionIcons.logTheResult(actionIcons.nameTheIcon(theOnScope.event,theOnScope.aiItemId),'notification: '+msg);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										}
									);

								// otherwise there was no other icon in the On state
								} else { 

									// then turn on the one they clicked on
									actionIcons.emitActionIconEvent(scope.event,scope.aiItemId)
										.then(
											function(data){ // resolved, action was successful
												actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'success data: '+(data || '[none returned]'));
												// change to the on icon
												myController.setMyIcon(actionIcons.iconOnNdx);
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
											},
											function(err){ // rejected, action was NOT successful
												actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'failed error: '+(err || '[none reported]'));
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
											},
											function(msg){ // notification, action had something to say
												actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'notification: '+msg);
												// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
												delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
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
				actionIcons.listenForControl(myController);
			}
		};
	}

	function actionIconRadioStateOffDirectiveFn ($compile, $rootScope, actionIcons) {

		var tmpl = '<span ng-click="clicked()" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}}"/>';

		return {
			restrict: 'EA',
			scope: {},
			controller: actionIconDirectiveControllerFn,
			link: function postLink(scope, element, attrs, myController) {
				scope.aiIconType = 'actionIconRadioStateOff';
				scope.controller = myController;
				scope.clicked = function() { 
					if (! scope.enabled) { return; }
					// if any one of these radio-offs [by class] is in motion, 
					if (actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]]) {
						// then bail
						actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'discarded, already processing an event for this group');
					} else {
						// set up a blocker while we process this click, we don't want any interleaved actions
						actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]] = new Date().getTime();
						// find the previously 'on' one (having more than one is an error)
						var theOn = document.getElementsByClassName(scope.aiIconTagList[actionIcons.iconOnClass]);
						if (theOn.length) {
							// and try to turn it off
							var theOnScope = angular.element(theOn[0]).scope();
							actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.aiItemId)
								.then(
									function(data){ // resolved, action was successful
										actionIcons.logTheResult(actionIcons.nameTheIcon(theOnScope.event,theOnScope.aiItemId),'success data: '+(data || '[none returned]'));
										// so change to the off icon
										theOnScope.controller.setMyIcon(actionIcons.iconOffNdx);
										// if the one we turned off is not the one we want to turn on
										if (theOnScope.aiItemId !== scope.aiItemId) {
											// then turn on the one they clicked on
											actionIcons.emitActionIconEvent(scope.event,scope.aiItemId)
												.then(
													function(data){ // resolved, action was successful
														actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'success data: '+(data || '[none returned]'));
														// change to the on icon
														myController.setMyIcon(actionIcons.iconOnNdx);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
													},
													function(err){ // rejected, action was NOT successful
														actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'failed error: '+(err || '[none reported]'));
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
													},
													function(msg){ // notification, action had something to say
														actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'notification: '+msg);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
													}
												);

										// we were only turning one off 
										} else {
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										}

									},
									function(err){ // rejected, action was NOT successful
										actionIcons.logTheResult(actionIcons.nameTheIcon(theOnScope.event,theOnScope.aiItemId),'failed error: '+(err || '[none reported]'));
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
									},
									function(msg){ // notification, action had something to say
										actionIcons.logTheResult(actionIcons.nameTheIcon(theOnScope.event,theOnScope.aiItemId),'notification: '+msg);
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
									}
								);

							// otherwise there was no other icon in the On state
							} else { 

								// then turn on the one they clicked on
								actionIcons.emitActionIconEvent(scope.event,scope.aiItemId)
									.then(
										function(data){ // resolved, action was successful
											actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'success data: '+(data || '[none returned]'));
											// change to the on icon
											myController.setMyIcon(actionIcons.iconOnNdx);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										},
										function(err){ // rejected, action was NOT successful
											actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'failed error: '+(err || '[none reported]'));
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										},
										function(msg){ // notification, action had something to say
											actionIcons.logTheResult(actionIcons.nameTheIcon(scope.event,scope.aiItemId),'notification: '+msg);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										}
									);
							}
					}
				};

				var el = angular.element(tmpl);
				var compiled = $compile(el);
				element.html(el);
				compiled(scope);
				actionIcons.listenForControl(myController);
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
	.controller('actionIconDirectiveCtrl', actionIconDirectiveControllerFn)
	;
