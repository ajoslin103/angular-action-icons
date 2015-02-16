# angular-action-icons
AngularJS action icons directive that sends click events to your code as promises 

## see it

add 'angularActionIcons' as dependency to your app

inject the service 'actionIcons' where you need it

use an actionIconSet 

	<action-icon-set data-entity-id="42" actions="trash"/>
	
set an icons dataStructure into your scope

	$scope.icons = {
		trash: {
			name: 'trash',				// the icon name
			event: 'item.delete',		// namespace your events
			title: 'delete this item',	// the hover title
			family: 'glyhpicon'			// the icon family
		}
	}

tell angularActionIcons service actionIcons service about any icons you want to track

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
	
## want more ?

there are four kinds of action icons

###action-icon-single-state : one click, one icon

	$scope.icons = {
		trash: {
			name: 'trash',
			event: 'item.delete', // namespace your events
			title: 'delete this item',
			family: 'glyhpicon'
		}
	}

	<action-icon-set data-entity-id="42" actions="trash"/>

###action-icon-cycle-state : each click advances thru the group

#####Note: the icon will only advance if/when the event resolves

	$scope.icons = {
		zmIn: {
			name: 'zoom-in',
			event: 'item.zoomIn', // namespace your events
			title: 'zoom in on this item',
			family: 'glyhpicon'
		},
		zmOut: {
			name: 'zoom-out',
			event: 'item.zoomOut', // namespace your events
			title: 'zoom away from this item',
			family: 'glyhpicon'
		}
	}
	
	// the 1st one is the default, use the delim: > -- use as many icons as you want
	<action-icon-set data-entity-id="42" actions="zmIn>zmOut"/> 


###action-icon-radio-state : only one in a group can be on at a time

#####Note: the 'off' event will fire, and must resolve before the 'on' event will fire
#####Note: the icon will only change if/when the pertinent events resolve

	$scope.icons = {
		silent: {
			name: 'volume-off',
			event: 'item.mute', // namespace your events
			title: 'silence this item',
			family: 'glyhpicon'
		},
		loud: {
			name: 'volume-up',
			event: 'item.loud', // namespace your events
			title: 'hear this item',
			family: 'glyhpicon'
		}
	}
	
	// the 1st one is the default, use the delim: : -- pass a unique class so we can find the group
	<action-icon-set data-entity-id="42" actions="silent:loud:radio42"/> 

###action-icon-radio-off-state : only one can be on, and you can turn that one off

#####Note: the 'off' event will fire, and must resolve before the 'on' event will fire
#####Note: the icon will only change if/when the pertinent events resolve

	$scope.icons = {
		close: {
			name: 'lock',
			event: 'item.write', // namespace your events
			title: 'save this item',
			family: 'glyhpicon'
		},
		open: {
			name: 'unlocked',
			event: 'item.read', // namespace your events
			title: 'edit this item',
			family: 'glyhpicon'
		}
	}
	
	// the 1st one is the default, use the delim: ; -- pass a unique class so we can find the group
	<action-icon-set data-entity-id="42" actions="close;open;radio42"/> 


## understand it

AngularActionIcons uses the root scope as an application bus.  

It sets your event handler to listen for the events (as defined in your icons structure)

It emits your event and a promise on the $rootScope, you resolve or reject it depending upon your success

## install it

this is coming soon!

	bower install --save angular-action-icons   