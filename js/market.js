//some globals that are needed through the application

var camera, scene, renderer, container, projector, keyboard;
var _worldCylinder;
var _wallMesh;
var _foreground_meshes = [];
var _inHud = false;
var _rotationMouseDown = false;
var _mouseX = 0
var _mouseY = 0;
var _currentObject;
var CUR_INDEX = 0;
var TWEENING = false
var departmentsToShelfSpaceUsage = {};
var _numberOfDepartments = 0;
var _departmentsToIndexes = {}
var _intervalAngle;
var ALL_OBJECTS = []
var WORLD_RADIUS = 1000;

init();
animate();

/*
	init() is the entrypoint, the first function called when all of the 
	javascript is executed. This is includes setup for the renderer, the
	camera, the scene, and some event listeners-- boilerplate as far as
	three.js is concerned. The most important call inside this function
	is the initializiation and subsequent config() of the ConfigLoader,
	where the "world" is created and added to the scene. 
*/
function init() {
	container = document.getElementById( 'container' );
	scene = new THREE.Scene();
	projector = new THREE.Projector();
	keyboard = new THREEx.KeyboardState();

	rendererSetup();
	cameraSetup();
	inspectionWallSetup();

	new ConfigLoader("config.json", scene).config();

	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	window.addEventListener( 'resize', onWindowResize, false );
}

/*
	Because of the way THREEx.KeyboardState() works, we are forced to 
	prevent multiple tweens from happening when the user hits 'n' (next) 
	or 'p' (previous). The flag that prevents this is called TWEENING.
	tweenCallback() is set as the onComplete() for those tweens. 
	TODO: use a different method of detected key presses, that doesnt
	update the state in the render loop. That will eliminate the need 
	for this callback.
*/
function tweenCallback() {
	TWEENING = false;
}

/*
	update() is called during each animation frame. Here we trigger 
	TWEEN.update(), and also detect the key presses for next and previous.
	If n or p are pressed, we animate to the next or previous shelf,
	respectively.
*/
function update() {

	TWEEN.update();

	if (_inHud) {
		return;
	}

	if ( keyboard.pressed("N") ) {
		if (!TWEENING) {
			TWEENING = true;
			CUR_INDEX++;
			if (CUR_INDEX >= _numberOfDepartments) {
				CUR_INDEX = 0;
			}
			animateToIndex(CUR_INDEX, tweenCallback);
		}
	} else if ( keyboard.pressed("P") ) {
		if (!TWEENING) {
			TWEENING = true;
			CUR_INDEX--;
			if (CUR_INDEX < 0) {
				CUR_INDEX = _numberOfDepartments-1;
			}
			animateToIndex(CUR_INDEX, tweenCallback);
		}
	}	
}
/*
	Standard renderer setup. Note, however, the renderedshadowMapEnabled
	setting. This tells the renderer to render shadows.
*/
function rendererSetup() {
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(window.innerWidth, window.innerHeight);
  	renderer.shadowMapEnabled = true;
	renderer.setClearColor( "black", 1 );
	container.appendChild(renderer.domElement);
}

/*
	The render/animation loop. Called as often as possible, with a 
	ceiling value of 60 times per second. 
*/
function animate() {
	requestAnimationFrame( animate );
	update();
	render();
}

/*
	Put the camera at a certain height above the apex of the cylinder. Also place
	a spotlight that points at the apex above and behind the camera. This provides
	sufficient lighting for the ground as well the shelf currently in view.
*/
function cameraSetup() {
	var camHeight = 25;
	camera = new THREE.PerspectiveCamera(30, getAspect(), 1, WORLD_RADIUS);
	var y =  WORLD_RADIUS + camHeight;
	camera.position.set(0, y, 0)

	var lightOffset = 200;
	var spotLight = new THREE.SpotLight( 0xffffff );
	spotLight.position.set( 0, WORLD_RADIUS+lightOffset, -lightOffset );
	spotLight.target.position.set( 0, WORLD_RADIUS, 0 );

	spotLight.castShadow = true;
	spotLight.intensity = 2;
	scene.add(spotLight)

	camera.lookAt( new THREE.Vector3(0,y,1) );
	scene.add(camera);
}

function getAspect() {
	return window.innerWidth/window.innerHeight;
}

function onWindowResize() {
  	camera.aspect = getAspect();
  	camera.updateProjectionMatrix();
  	renderer.setSize( window.innerWidth, window.innerHeight );
  	render();
}

function render() {
	renderer.render( scene, camera );
}

function onDocumentMouseDown( event ) {

	event.preventDefault();
	if (_inHud) {
        _rotationMouseDown = true;
        _mouseX = event.clientX;
        _mouseY = event.clientY;
	} else {
		//the four lines below this are an exact copy from a three js example. 
		//...this seems to be the three.js way of detecting clicks on 3d objects
		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
		projector.unprojectVector( vector, camera );
		var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
		var intersects = raycaster.intersectObjects( ALL_OBJECTS );

		if ( intersects.length > 0 ) {
			/*
				get the object config json from the clicked object and 
				draw a new one in front of the camera. Then show the 
				inspection hud.
			*/
			_currentObject = intersects[ 0 ].object.userData;
			_foreground_meshes = loadInspectionObject(_currentObject);
			showInspectionHud(_currentObject)
		}
	}
}

/*
	rotates each of the meshes representing the inspection object.
*/
function rotateInspectionMeshes(dx, dy) {
	for (index in _foreground_meshes) {
	    _foreground_meshes[index].rotation.y += dx / 100;
    	_foreground_meshes[index].rotation.x += dy / 100;
	}
}
/*
	override default click behavor, then rotate the
	inspection object by a certain mouse delta. 
	...but only do this if the mouse is being presses
	and we're in the inspection hud
*/
function onDocumentMouseMove(event) {
	if (_inHud && _rotationMouseDown) {
		event.preventDefault();
        var deltaX = event.clientX - _mouseX;
        var deltaY = event.clientY - _mouseY;
        _mouseX = event.clientX;
        _mouseY = event.clientY;
        rotateInspectionMeshes(deltaX, deltaY);
	}
}

function onDocumentMouseUp(event) {
	if (_inHud) {
		event.preventDefault();
        _rotationMouseDown = false;
	}
}

/*
	depending on the boolean param, these either adds a black plane
	as a child of the camera and tweens its opacity from 0 to nearly
	opaque, or does the opposite. This has the effect of dimming the 
	background when the user is in inspection view. 

*/
function tweenBlackWall(toOpaque) {
	TWEEN.removeAll();
	var dark = 0.85;
	var start = { opacity : 0 };
	var finish = { opacity : dark }

	if (!toOpaque) {
		start.opacity = dark;
		finish.opacity = 0;
	} 
	var tween = new TWEEN.Tween(start).to(finish, 1500);
	tween.easing(TWEEN.Easing.Exponential.Out)
	tween.onUpdate(function(){
	    _wallMesh.material.opacity = start.opacity
	});
	if (toOpaque) {
		camera.add(_wallMesh);
	} else {
		tween.onComplete(function() { camera.remove(_wallMesh)});
	}
	tween.start();
}

/*
	Dim the background and show the html portion of the inspection hud.
	Also populate the html with the current inspection object's info.
*/
function showInspectionHud(object) {
	_inHud = true;
	tweenBlackWall(true);
	_wallMesh.position.z = -75;
	var hud = $('.inspectionHud')
	hud.find('#itemName').text(object.name)
	var price = "$"+parseFloat(object.price).toFixed(2);
	hud.find('#itemPrice').text(price)
	hud.show();
}

/*
	The black plane that is used for dimming the background is created once
	and its mesh is stored is a global variable. 
*/
function inspectionWallSetup() {
	var wallGeo = new THREE.PlaneGeometry(WORLD_RADIUS,WORLD_RADIUS,1,1);
	var wallMaterial = new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.75, color : "black" } );
	_wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
}

/*
	Tween the black wall plane to perfectly transparent, remove it
	from the camera, and hide the inspection hud html.
*/
function hideInspectionHud() {
	$('.inspectionHud').hide()
	for (index in _foreground_meshes) {
		camera.remove(_foreground_meshes[index]);
	}
	tweenBlackWall(false);
	_foreground_meshes = []
	_inHud = false;
}

/*
	turn a department name into an index for the shelf,
	then animate to that index.
*/
function animateToDepartment(s) {
	var index = _departmentsToIndexes[s]
	animateToIndex(index);
}

/*
	Flies the user over the shelf at index by rotating the
	world cylinder until the shelf is in view. The angle to 
	which to rotate is figured out by multiplying the index
	by the angle between any two shelves, and stepping back
	a fraction of the interval angle.
	Uses tween.js to aniamte from the current angle to the
	desired one. 
	TODO: investigate to figure out why the additional 
	translation of -Math.PI/2 is necessary. 
*/
function animateToIndex(index, callback) {
	CUR_INDEX = index;

	//calculate the "stepback" angle
	var stepBack = _intervalAngle/3
	//calculate the angle to rotate to
	var angle = -Math.PI/2-index*_intervalAngle + stepBack

	var start = { x : _worldCylinder.rotation.x };

	var tween = new TWEEN.Tween(start).to({x:angle}, 2000);
	tween.easing(TWEEN.Easing.Quartic.InOut)
	tween.onUpdate(function(){
	    _worldCylinder.rotation.x = start.x
	});

	if(callback != null) {
		tween.onComplete(callback);
	}

	tween.start();	
}

/*
	Callback for the "Add To Cart" button.
	Adds the current inspection object to the cart.
	This involves modifying some html. 
*/
function addToCart() {
	var total = parseFloat($('#cartTotal').html())

	var list = $($(".cartList")[0])

	list.prepend(
    		$('<li/>', {
		        'class': 'cartListItem',
		        html: _currentObject.name,
		        'onClick' : 'departmentClick(this.id)'
    		})
		);
	total+=parseFloat(_currentObject.price);
	$('#cartTotal').html(total.toFixed(2))

}

/*
	Callback for the listitems in the html department list.
	If we're not in the inspection hud, fly us over to the appropriate
	department. 
	TODO: make a ui change that hints at the fact that we cant actually 
	click on a department while we're in the inspection hud.
*/
function departmentClick(s) {
	if (!_inHud) {
		animateToDepartment(s);
	}
}
