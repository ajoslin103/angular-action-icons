# angular-action-icons

AngularJS action icons directive that sends click events to your code as promises 

(See the end of this Read Me for the change log)

## see it

add 'angularActionIcons' as dependency to your app

inject the service 'actionIcons' where you need it

use an actionIconSet 

	<action-icon-set data-entity-id="42" actions="trash"/>
	
set an icons dataStructure into your scope
NOTE: prior to version 2.x use $scope.icons instead of actionIcons.icons

	angularIcons.icons = {
		trash: {
			name: 'trash',				// the icon name
			event: 'item.delete',		// namespace your events
			title: 'delete this item',	// the hover title
			family: 'glyphicon'			// the icon family
		}
	}

tell the angularActionIcons service actionIcons service about any icons you want to track
NOTE: you can of course catch these events locally, just don't make this call.

	actionIcons.listenToTheseActionIcons($scope.icons);

watch the console when you click on it

	delete item #42 success data: [defaultActionIconEventHandler] resolved:delete item #42

## use it

define your own event handler, (it should distinguish between your events...)

	function handleEvent (event, promise) {
		if (Math.random() > 0.25) { // reject 25% of the requests
			promise.resolve('entityAdmin resolved:'+actionIcons.nameTheIcon(promise.event,promise.id));
		} else {
			promise.reject('entityAdmin rejected:'+actionIcons.nameTheIcon(promise.event,promise.id));
		}
	}

ask the angularActionIcons service actionIcons to call it

	actionIcons.registerActionIconEventHandler(handleEvent);

watch the console when you click on it

	delete item #42 success data: entityAdmin resolved:delete item #42
	
## watch it

add your own promise logging so that you can keep track of interal results

define your own logging Fn

	function showResult (tag,msg) { // just display it for now...
		angular.element('#iconResult').text(tag+msg);
	}

ask the angularActionIcons service actionIcons to call it

	actionIcons.registerLogResultFn(showResult);

## want more ?

there are six kinds of action icons

###action-icon-single-state : one click, one icon
NOTE: prior to version 2.x use $scope.icons instead of actionIcons.icons

	angularIcons.icons = {
		trash: {
			name: 'trash',
			event: 'item.delete', // namespace your events
			title: 'delete this item',
			family: 'glyphicon'
		}
	}

	<action-icon-set data-entity-id="42" actions="trash"/>

###action-icon-cycle-state : each click advances thru the group

#####Note: the icon will only advance if/when the event resolves
NOTE: prior to version 2.x use $scope.icons instead of actionIcons.icons

	angularIcons.icons = {
		zmIn: {
			name: 'zoom-in',
			event: 'item.zoomIn', // namespace your events
			title: 'zoom in on this item',
			family: 'glyphicon'
		},
		zmOut: {
			name: 'zoom-out',
			event: 'item.zoomOut', // namespace your events
			title: 'zoom away from this item',
			family: 'glyphicon'
		}
	}
	
	// the 1st one is the default, use the delim: > -- use as many icons as you want
	<action-icon-set data-entity-id="42" actions="zmIn>zmOut"/> 


###action-icon-radio-state : only one in a group can be on at a time, events: off then on
###action-icon-alt-radio-state : only one in a group can be on at a time, events: on then off

#####Note: the first event will fire, and must resolve before the second event will fire
#####Note: the icon will only change if/when the pertinent events resolve
NOTE: prior to version 2.x use $scope.icons instead of actionIcons.icons

	angularIcons.icons = {
		silent: {
			name: 'volume-off',
			event: 'item.mute', // namespace your events
			title: 'silence this item',
			family: 'glyphicon'
		},
		loud: {
			name: 'volume-up',
			event: 'item.loud', // namespace your events
			title: 'hear this item',
			family: 'glyphicon'
		}
	}
	
	// the 1st one is the default, use the delim: : -- pass a unique class so we can find the group
	<action-icon-set data-entity-id="42" actions="silent:loud:radio42"/> 
	
	// the 1st one is the default, use the ALT delim: # -- pass a unique class so we can find the group
	<action-icon-set data-entity-id="42" actions="silent#loud#radio42"/> 

###action-icon-radio-off-state : only one can be on, and you can turn that one off, events: off then on
###action-icon-alt-radio-off-state : only one can be on, and you can turn that one off, events: on then off

#####Note: the first event will fire, and must resolve before the second event will fire
#####Note: the icon will only change if/when the pertinent events resolve
NOTE: prior to version 2.x use $scope.icons instead of actionIcons.icons

	angularIcons.icons = {
		close: {
			name: 'eye-close',
			event: 'item.write', // namespace your events
			title: 'stop watching this item',
			family: 'glyphicon'
		},
		open: {
			name: 'eye-open',
			event: 'item.read', // namespace your events
			title: 'watch this item',
			family: 'glyphicon'
		}
	}
	
	// the 1st one is the default, use the delim: ; -- pass a unique class so we can find the group
	<action-icon-set data-entity-id="42" actions="close;open;radio42"/> 
	
	// the 1st one is the default, use the ALT delim: % -- pass a unique class so we can find the group
	<action-icon-set data-entity-id="42" actions="close%open%radio42"/> 


## mix and match

Use them however you want
NOTE: prior to version 2.x use $scope.icons instead of actionIcons.icons

	angularIcons.icons = {
		trash: {
			name: 'trash',
			event: 'item.delete', // namespace your events
			title: 'delete this item',
			family: 'glyphicon'
		},
		zmIn: {
			name: 'zoom-in',
			event: 'item.zoomIn', // namespace your events
			title: 'zoom in on this item',
			family: 'glyphicon'
		},
		zmOut: {
			name: 'zoom-out',
			event: 'item.zoomOut', // namespace your events
			title: 'zoom away from this item',
			family: 'glyphicon'
		},
		silent: {
			name: 'volume-off',
			event: 'item.mute', // namespace your events
			title: 'silence this item',
			family: 'glyphicon'
		},
		loud: {
			name: 'volume-up',
			event: 'item.loud', // namespace your events
			title: 'hear this item',
			family: 'glyphicon'
		},
		close: {
			name: 'eye-close',
			event: 'item.write', // namespace your events
			title: 'stop watching this item',
			family: 'glyphicon'
		},
		open: {
			name: 'eye-open',
			event: 'item.read', // namespace your events
			title: 'watch this item',
			family: 'glyphicon'
		}
	}
	
	// use a comma to delim between icon groups
	<action-icon-set data-entity-id="42" actions="trash,zmIn>zmOut,silent:loud:radio42,close;open;radio43"/> 

## understand it

AngularActionIcons uses the root scope as an application bus.  

It sets listeners for all the events you ask for, and emits the events on the $rootScope

If you give it an eventHandler it will call it with the event and the promise

## set them

Add a data-entity-type to your action icon sets

	<action-icon-set data-entity-type="volume" data-entity-id="42" actions="silent:loud:radio42"/> 
	<action-icon-set data-entity-type="volume" data-entity-id="142" actions="silent:loud:radio42"/> 
	<action-icon-set data-entity-type="volume" data-entity-id="242" actions="silent:loud:radio42"/> 

	<action-icon-set data-entity-type="access" data-entity-id="43" actions="close;open;radio43"/> 
	<action-icon-set data-entity-type="access" data-entity-id="143" actions="close;open;radio43"/> 
	<action-icon-set data-entity-type="access" data-entity-id="243" actions="close;open;radio43"/> 

Call actionIcons.setIcon( 'volume' , 'silent' ,[ 42, 142,242 ]) -- to turn all volume's to silent

Call actionIcons.setIcon( 'access' , 'close' ,[ 143 ]) -- to close access to 143


## enable/disable them

Add a data-entity-type to your action icon sets

	<action-icon-set data-entity-type="record" data-entity-id="42" actions="trash"/>

Call actionIcons.enableIcon( 'record' , 'trash', false ,[ 42 ]) -- to disable the trash icon # 42


## install it

	bower install --save angular-action-icons   
	
## change log

	2.0.2	- moved storage of icon data from the local $scope to the actionIcons service -- this is an easy fix for your code, but it is a breaking change.
	So prior to version 2.x use $scope.icons to store the icon data
	And from version 2.0 on use actionIcons.icons (and don't intialize it)

	1.3.3  - bugfix to dynamically determined data-item-ids

	1.3.2  - dynamically determine the icon data-item-id to cover those cases where the icon id changes after it's interpolated

	1.3.1  - added ALT versions of the Radio and RadioOff icons, these turn ON the new one before turning OFF the old one

	1.3.0  - rewrote event based icon control, removed listenForControl from service interface

	1.2.8  - version bump for readme

	1.2.7  - stop event propagation after iconClick

	1.2.6  - bug fix to enable/disable

	1.2.5	- icons can now be disabled/enabled via enableIcon which functions like setIcon

	1.2.4	- bugfix in evented icons: $apply() was not high enough on the call stack

	1.2.3	- bugfix in radio class handling, brings clicked & evented icons to parity
	
	1.2.2	- bugfix in evented setMyIcon to show icon changes 

	1.2.1	- bugfix in radio icon logic

	1.2.0	- added actionIcons.setIcon() to allow you to set the icons to a desired state
			- changed attribute data-item-id to data-entity-id
			- added attribute data-entity-type
