'use strict';

// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement, fromIndex) {

    var k;

    // 1. Let O be the result of calling ToObject passing
    //    the this value as the argument.
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }

    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get
    //    internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If len is 0, return -1.
    if (len === 0) {
      return -1;
    }

    // 5. If argument fromIndex was passed let n be
    //    ToInteger(fromIndex); else let n be 0.
    var n = +fromIndex || 0;

    if (Math.abs(n) === Infinity) {
      n = 0;
    }

    // 6. If n >= len, return -1.
    if (n >= len) {
      return -1;
    }

    // 7. If n >= 0, then Let k be n.
    // 8. Else, n<0, Let k be len - abs(n).
    //    If k is less than 0, then let k be 0.
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    // 9. Repeat, while k < len
    while (k < len) {
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the
      //    HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      //    i.  Let elementK be the result of calling the Get
      //        internal method of O with the argument ToString(k).
      //   ii.  Let same be the result of applying the
      //        Strict Equality Comparison Algorithm to
      //        searchElement and elementK.
      //  iii.  If same is true, return k.
      if (k in O && O[k] === searchElement) {
        return k;
      }
      k++;
    }
    return -1;
  };
}

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

	// call for icons to be enabled/disabled
	function enableIcon (_iconType, _iconTagArray, _enabled, _idList) {
		var envelope = { 
			tagArray: _iconTagArray, 
			action: 'enabling',
			enable: _enabled, 
			typ: _iconType, 
			ids: _idList 
		};
		$rootScope.$broadcast(controlEventPrefix()+_iconType,envelope); 
	}

	// call for icons to be changed
	function setIcon (_iconType, _iconTag, _idList) {
		var envelope = { 
			action: 'tagging',
			typ: _iconType, 
			tag: _iconTag, 
			ids: _idList 
		};
		$rootScope.$broadcast(controlEventPrefix()+_iconType,envelope); 
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

	// remove our styles
	function removeIconStyles(){
		angular.element('#actionIconHoverStyle').remove();
		angular.element('#actionIconDisabledStyle').remove();
	}

	// add our styles, only once
	function addIconStyles(){
		if (! angular.element('#actionIconHoverStyle').length) {
			if ((typeof document.body.style.filter !== 'undefined') && 
				(typeof document.body.style.webkitFilter !== 'undefined')) {
				injectStyles('.action-icon:hover { filter: invert(100%); -webkit-filter: invert(100%); }','actionIconHoverStyle'); 
			} else {
				injectStyles('.action-icon:hover { color: white; background-color: black; }','actionIconHoverStyle'); 
			}
		}
		if (! angular.element('#actionIconDisabledStyle').length) {
			if ((typeof document.body.style.filter !== 'undefined') && 
				(typeof document.body.style.webkitFilter !== 'undefined')) {
				injectStyles('.action-icon.disabled { filter: invert(100%); -webkit-filter: invert(100%) !important; }','actionIconDisabledStyle'); 
			} else {
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

	// add a radio button icon set, default will be off -- adds a class to find the one's that are on
	function addActionIconAltRadio(off,on,clas) { // the ALT versions turn on the new one before turning off the old one
		var options = [];
		options.push(off);
		options.push(on);
		clas = clas || Math.floor(1000000 * Math.random()); //uuid.v4().replace('-',''); // default to a compact uuid
		options.push(clas);
		return options.join(getAltRadioDelim());
	}

	// add a radio-off button icon set, default will be off, allows turning off an on -- adds a class to find the one's that are on
	function addActionIconAltRadioOff(off,on,clas) { // the ALT versions turn on the new one before turning off the old one
		var options = [];
		options.push(off);
		options.push(on);
		clas = clas || Math.floor(1000000 * Math.random()); //uuid.v4().replace('-',''); // default to a compact uuid
		options.push(clas);
		return options.join(getAltRadioOffDelim());
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

	// get the separator for _alt_ radio icons -- please keep in sync with the backend
	function getAltRadioDelim() { return '#'; } // the ALT versions turn on the new one before turning off the old one

	// get the separator for _alt_ radio-off icons, allows to turn off an on radio -- please keep in sync with the backend
	function getAltRadioOffDelim() { return '%'; } // the ALT versions turn on the new one before turning off the old one

	function getIconDelimRegEx() { return new RegExp('[>:;#%]'); }

	function controlEventPrefix () { return 'actionIcons.'; }

	// add our icon styles
	addIconStyles();

	var iconDefs = {};

	return {
		registerActionIconEventHandler: registerActionIconEventHandler,
		listenToTheseActionIcons: listenToTheseActionIcons,
		emitActionIconEvent: emitActionIconEvent,
		addActionIconInfo: addActionIconInfo,
		addActionIconSingle: addActionIconSingle,
		addActionIconCycle: addActionIconCycle,
		addActionIconRadio: addActionIconRadio,
		addActionIconRadioOff: addActionIconRadioOff,
		addActionIconAltRadio: addActionIconAltRadio,
		addActionIconAltRadioOff: addActionIconAltRadioOff,
		registerLogResultFn: registerLogResultFn,
		getGroupDelim: getGroupDelim,
		getCycleDelim: getCycleDelim,
		getRadioDelim: getRadioDelim,
		getRadioOffDelim: getRadioOffDelim,
		getAltRadioDelim: getAltRadioDelim,
		getAltRadioOffDelim: getAltRadioOffDelim,
		nameTheIcon: nameTheIcon,
		iconOffNdx: iconOffNdx,
		iconOnNdx: iconOnNdx,
		iconOnClass: iconOnClass,
		radiosInMotion: radiosInMotion,
		logTheResult: logTheResult,
		setIcon: setIcon,
		addIconStyles: addIconStyles,
		removeIconStyles: removeIconStyles,
		enableIcon: enableIcon,
		controlEventPrefix: controlEventPrefix,
		getIconDelimRegEx: getIconDelimRegEx,
		icons: iconDefs,
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
				radioAltDelim = new RegExp(actionIcons.getAltRadioDelim()),
				radioAltOffDelim = new RegExp(actionIcons.getAltRadioOffDelim()),
				groups = attrs.actions.split(actionIcons.getGroupDelim());
			scope.icons = actionIcons.icons;
			for (var x=0; x<groups.length; x++) {
				var eType = 'action-icon-single-state';
				if ( cycleDelim.test(groups[x]) ) { eType = 'action-icon-cycle-state'; }
				if ( radioDelim.test(groups[x]) ) { eType = 'action-icon-radio-state'; }
				if ( radioOffDelim.test(groups[x]) ) { eType = 'action-icon-radio-off-state'; }
				if ( radioAltDelim.test(groups[x]) ) { eType = 'action-icon-alt-radio-state'; }
				if ( radioAltOffDelim.test(groups[x]) ) { eType = 'action-icon-alt-radio-off-state'; }
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

	var $listeners = []; // add to these the $on's
	$scope.$on('$destroy', function() {
		$listeners.forEach(function(e){ e(); });
	});

	$scope.enabled = true;
	$scope.disabled = '';
	
	$scope.aiIconInfos = {};
	$scope.aiItemType = $element.attr('data-item-type'); 
	$scope.aiItemClump = $element.attr('data-icon'); 
	$scope.aiIconTagList = $scope.aiItemClump.split(actionIcons.getIconDelimRegEx());

	for (var ndx = 0; ndx < $scope.aiIconTagList.length; ndx++) {
		var eachTag = $scope.aiIconTagList[ndx];
		$scope.aiIconInfos[eachTag] = actionIcons.icons[eachTag];
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

	function iconEventListener ( event, envelope ){ 
		if ((envelope.ids === '*') || (envelope.ids.indexOf($scope.controller.getItemId() * 1.0) !== -1)) {
			switch (envelope.action) {
				case 'enabling': {
					if (envelope.tagArray.indexOf($scope.label) !== -1) {
						$scope.enabled = envelope.enable;
						if ($scope.enabled) {
							$scope.disabled = '';
						} else {
							$scope.disabled = 'disabled';
						}
					}
					break;
				}
				case 'tagging': {
					var allegedTag = envelope.tag;
					if (isFinite(envelope.tag)) { 
						allegedTag = $scope.aiIconTagList[envelope.tag];
					}
					if ($scope.aiIconInfos.hasOwnProperty((allegedTag))) {
						$scope.clas = '';
						if ($scope.aiIconType.indexOf('Radio') !== -1) {
							if ($scope.aiIconTagList.length > (actionIcons.iconOnClass)) {
								if ($scope.aiIconTagList.indexOf(allegedTag) === actionIcons.iconOnNdx) {
									$scope.clas = $scope.aiIconTagList[actionIcons.iconOnClass];
								}
							}
						}
						$scope.label = allegedTag;
						$scope.aiCurrentTag = allegedTag;
						$scope.name = $scope.aiIconInfos[allegedTag].name;
						$scope.title = $scope.aiIconInfos[allegedTag].title;
						$scope.event = $scope.aiIconInfos[allegedTag].event;
						$scope.family = $scope.aiIconInfos[allegedTag].family;
						$scope.className = $scope.aiIconInfos[allegedTag].family +'-'+ $scope.aiIconInfos[allegedTag].name;
					}
					break;
				}
			}
		}
	}

	// $listeners.push(
		$scope.$on(actionIcons.controlEventPrefix()+$scope.aiItemType,iconEventListener);
	// );

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

	this.enableMyIcon = function(allegedTagArray,enableIcon){ // jshint ignore:line
		if (allegedTagArray.indexOf($scope.label) !== -1) {
			$scope.enabled = enableIcon;
			if ($scope.enabled) {
				$scope.disabled = '';
			} else {
				$scope.disabled = 'disabled';
			}
		}
	};

	this.getIconControlEvent = function(){ // jshint ignore:line
		return actionIcons.controlEventPrefix()+$scope.aiItemType;
	};

	this.getItemType = function(){ // jshint ignore:line
		return $scope.aiItemType;
	};

	this.getItemId = function(){ // jshint ignore:line
		return $element.attr('data-item-id');
	};

	this.setMyIcon(actionIcons.iconOffNdx); // jshint ignore:line
}

function actionIconSingleStateDirectiveFn ($compile, $rootScope, actionIcons) {

	var tmpl = '<span ng-click="clicked($event)" title="{{title}}" class="action-icon single-state-icon {{family}} {{className}} {{disabled}}"/>';

	return {
		restrict: 'EA',
		scope: {},
		controller: 'actionIconDirectiveCtrl',
		link: function postLink(scope, element, attrs, myController) {
			scope.aiIconType = 'actionIconSingleState';
			scope.controller = myController;
			scope.clicked = function( $event ) { 
				$event.stopPropagation();
				if (! scope.enabled) { return; }
				actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
					.then(
						function(data){ // resolved, action was successful
							actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
						},
						function(err){ // rejected, action was NOT successful
							actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
						},
						function(msg){ // notification, action had something to say
							actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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

	var tmpl = '<span ng-click="clicked($event)" title="{{title}}" class="action-icon cycle-state-icon {{family}} {{className}} {{disabled}}"/>';

	return {
		restrict: 'EA',
		scope: {},
		controller: 'actionIconDirectiveCtrl',
		link: function postLink(scope, element, attrs, myController) {
			scope.aiIconType = 'actionIconCycleState';
			scope.controller = myController;
			scope.clicked = function( $event ) { 
				$event.stopPropagation();
				if (! scope.enabled) { return; }
				actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
					.then(
						function(data){ // resolved, action was successful
							actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
							myController.setNextIcon();
						},
						function(err){ // rejected, action was NOT successful
							actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
						},
						function(msg){ // notification, action had something to say
							actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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

	var tmpl = '<span ng-click="clicked($event)" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}} {{disabled}}"/>';

	return {
		restrict: 'EA',
		scope: {},
		controller: 'actionIconDirectiveCtrl',
		link: function postLink(scope, element, attrs, myController) {
			scope.aiIconType = 'actionIconRadioState';
			scope.controller = myController;
			scope.clicked = function( $event ) { 
				$event.stopPropagation();
				if (! scope.enabled) { return; }
				// if we clicked on one that is on 
				if (scope.aiIconTagList.indexOf(scope.aiCurrentTag) === actionIcons.iconOnNdx) { 
					// then bail - you can't turn off a radio icon
					actionIcons.logTheResult('info',actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' discarded, you cannot turn off a radio icon [use a radio-off icon]');
				} else {
					// if any one of these radios [by class] is in motion, 
					if (actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]]) {
						// then bail
						actionIcons.logTheResult('info',actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' discarded, already processing an event for this group');
					} else {
						// set up a blocker while we process this click, we don't want any interleaved actions
						actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]] = new Date().getTime();
						// find the previously 'on' one (having more than one is an error)
						var theOn = document.getElementsByClassName(scope.aiIconTagList[actionIcons.iconOnClass]);
						if (theOn.length) {
							// and try to turn it off
							var theOnScope = angular.element(theOn[0]).scope();
							actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.controller.getItemId())
								.then(
									function(data){ // resolved, action was successful
										actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(data || '[none returned]'));
										// so change to the off icon
										theOnScope.controller.setMyIcon(actionIcons.iconOffNdx);
										// if the one we turned off is not the one we want to turn on
										if (theOnScope.controller.getItemId() !== scope.controller.getItemId()) {
											// then turn on the one they clicked on
											actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
												.then(
													function(data){ // resolved, action was successful
														actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
														// change to the on icon
														myController.setMyIcon(actionIcons.iconOnNdx);
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
													},
													function(err){ // rejected, action was NOT successful
														actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
														// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
														delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
													},
													function(msg){ // notification, action had something to say
														actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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
										actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(err || '[none reported]'));
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
									},
									function(msg){ // notification, action had something to say
										actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */msg);
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
									}
								);

							// otherwise there was no other icon in the On state
							} else { 

								// then turn on the one they clicked on
								actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
									.then(
										function(data){ // resolved, action was successful
											actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
											// change to the on icon
											myController.setMyIcon(actionIcons.iconOnNdx);
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										},
										function(err){ // rejected, action was NOT successful
											actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
											// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
											delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
										},
										function(msg){ // notification, action had something to say
											actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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
		}
	};
}

function actionIconRadioStateOffDirectiveFn ($compile, $rootScope, actionIcons) {

	var tmpl = '<span ng-click="clicked($event)" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}} {{disabled}}"/>';

	return {
		restrict: 'EA',
		scope: {},
		controller: 'actionIconDirectiveCtrl',
		link: function postLink(scope, element, attrs, myController) {
			scope.aiIconType = 'actionIconRadioStateOff';
			scope.controller = myController;
			scope.clicked = function( $event ) { 
				$event.stopPropagation();
				if (! scope.enabled) { return; }
				// if any one of these radio-offs [by class] is in motion, 
				if (actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]]) {
					// then bail
					actionIcons.logTheResult('info',actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' discarded, already processing an event for this group');
				} else {
					// set up a blocker while we process this click, we don't want any interleaved actions
					actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]] = new Date().getTime();
					// find the previously 'on' one (having more than one is an error)
					var theOn = document.getElementsByClassName(scope.aiIconTagList[actionIcons.iconOnClass]);
					if (theOn.length) {
						// and try to turn it off
						var theOnScope = angular.element(theOn[0]).scope();
						actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.controller.getItemId())
							.then(
								function(data){ // resolved, action was successful
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(data || '[none returned]'));
									// so change to the off icon
									theOnScope.controller.setMyIcon(actionIcons.iconOffNdx);
									// if the one we turned off is not the one we want to turn on
									if (theOnScope.controller.getItemId() !== scope.controller.getItemId()) {
										// then turn on the one they clicked on
										actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
											.then(
												function(data){ // resolved, action was successful
													actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
													// change to the on icon
													myController.setMyIcon(actionIcons.iconOnNdx);
													// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
													delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
												},
												function(err){ // rejected, action was NOT successful
													actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
													// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
													delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
												},
												function(msg){ // notification, action had something to say
													actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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
									actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(err || '[none reported]'));
									// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
									delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
								},
								function(msg){ // notification, action had something to say
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */msg);
									// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
									delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
								}
							);

						// otherwise there was no other icon in the On state
						} else { 

							// then turn on the one they clicked on
							actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
								.then(
									function(data){ // resolved, action was successful
										actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
										// change to the on icon
										myController.setMyIcon(actionIcons.iconOnNdx);
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
									},
									function(err){ // rejected, action was NOT successful
										actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
										// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
										delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
									},
									function(msg){ // notification, action had something to say
										actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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
		}
	};
}

// the ALT versions turn on the new one before turning off the old one
function actionIconAltRadioStateDirectiveFn ($compile, $rootScope, actionIcons) {

	var tmpl = '<span ng-click="clicked($event)" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}} {{disabled}}"/>';

	return {
		restrict: 'EA',
		scope: {},
		controller: 'actionIconDirectiveCtrl',
		link: function postLink(scope, element, attrs, myController) {
			scope.aiIconType = 'actionIconAltRadioState';
			scope.controller = myController;
			scope.clicked = function( $event ) { 
				$event.stopPropagation();
				if (! scope.enabled) { return; }
				// if we clicked on one that is on 
				if (scope.aiIconTagList.indexOf(scope.aiCurrentTag) === actionIcons.iconOnNdx) { 
					// then bail - you can't turn off a radio icon
					actionIcons.logTheResult('info',actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' discarded, you cannot turn off a radio icon [use a radio-off icon]');
				} else {
					// if any one of these radios [by class] is in motion, 
					if (actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]]) {
						// then bail
						actionIcons.logTheResult('info',actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' discarded, already processing an event for this group');
					} else {
						// set up a blocker while we process this click, we don't want any interleaved actions
						actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]] = new Date().getTime();

						// turn on the one they clicked on
						actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
							.then(
								function(data){ // resolved, action was successful
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
									// change to the on icon
									myController.setMyIcon(actionIcons.iconOnNdx);

									// find the previously 'on' one 
									var theOn = document.getElementsByClassName(scope.aiIconTagList[actionIcons.iconOnClass]);
									if (theOn.length) {
										// and try to turn it off
										var theOnScope = angular.element(theOn[0]).scope();
										actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.controller.getItemId())
											.then(
												function(data){ // resolved, action was successful
													actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(data || '[none returned]'));
													// so change to the off icon
													theOnScope.controller.setMyIcon(actionIcons.iconOffNdx);
												},
												function(err){ // rejected, action was NOT successful
													actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(err || '[none reported]'));
												},
												function(msg){ // notification, action had something to say
													actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */msg);
												}
											);
										}

									// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
									delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
								},
								function(err){ // rejected, action was NOT successful
									actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
									// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
									delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
								},
								function(msg){ // notification, action had something to say
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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
		}
	};
}

// the ALT versions turn on the new one before turning off the old one
function actionIconAltRadioStateOffDirectiveFn ($compile, $rootScope, actionIcons) {

	var tmpl = '<span ng-click="clicked($event)" title="{{title}}" class="action-icon radio-state-icon {{clas}} {{family}} {{className}} {{disabled}}"/>';

	return {
		restrict: 'EA',
		scope: {},
		controller: 'actionIconDirectiveCtrl',
		link: function postLink(scope, element, attrs, myController) {
			scope.aiIconType = 'actionIconAltRadioStateOff';
			scope.controller = myController;
			scope.clicked = function( $event ) { 
				$event.stopPropagation();
				if (! scope.enabled) { return; }
				// if any one of these radio-offs [by class] is in motion, 
				if (actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]]) {
					// then bail
					actionIcons.logTheResult('info',actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' discarded, already processing an event for this group');
				} else {
					// set up a blocker while we process this click, we don't want any interleaved actions
					actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]] = new Date().getTime();

					// if we clicked on one that is on 
					if (scope.aiIconTagList.indexOf(scope.aiCurrentTag) === actionIcons.iconOnNdx) { 

						actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
							.then(
								function(data){ // resolved, action was successful
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
									// so change to the off icon
									scope.controller.setMyIcon(actionIcons.iconOffNdx);
								},
								function(err){ // rejected, action was NOT successful
									actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
								},
								function(msg){ // notification, action had something to say
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
								}
							);
					}  else {

						// turn on the one they clicked on
						actionIcons.emitActionIconEvent(scope.event,scope.controller.getItemId())
							.then(
								function(data){ // resolved, action was successful
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(data || '[none returned]'));
									// change to the on icon
									myController.setMyIcon(actionIcons.iconOnNdx);

									// find the previously 'on' one 
									var theOn = document.getElementsByClassName(scope.aiIconTagList[actionIcons.iconOnClass]);
									if (theOn.length) {
										// and try to turn it off
										var theOnScope = angular.element(theOn[0]).scope();
										actionIcons.emitActionIconEvent(theOnScope.event,theOnScope.controller.getItemId())
											.then(
												function(data){ // resolved, action was successful
													actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(data || '[none returned]'));
													// so change to the off icon
													theOnScope.controller.setMyIcon(actionIcons.iconOffNdx);
												},
												function(err){ // rejected, action was NOT successful
													actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */(err || '[none reported]'));
												},
												function(msg){ // notification, action had something to say
													actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(theOnScope.event,theOnScope.controller.getItemId())+' '+ */msg);
												}
											);
										}

									// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
									delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
								},
								function(err){ // rejected, action was NOT successful
									actionIcons.logTheResult('warn',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */(err || '[none reported]'));
									// remove the blocker, we are done processing this click - (.finally has requirements our user might not meet.)
									delete actionIcons.radiosInMotion[scope.aiIconTagList[actionIcons.iconOnClass]];
								},
								function(msg){ // notification, action had something to say
									actionIcons.logTheResult('info',/* actionIcons.nameTheIcon(scope.event,scope.controller.getItemId())+' '+ */msg);
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
	.directive('actionIconAltRadioState', [ '$compile', '$rootScope', 'actionIcons', actionIconAltRadioStateDirectiveFn ])
	.directive('actionIconAltRadioOffState', [ '$compile', '$rootScope', 'actionIcons', actionIconAltRadioStateOffDirectiveFn ])
	.controller('actionIconDirectiveCtrl', actionIconDirectiveControllerFn)
	;

