var container;
var camera, scene, renderer, mapCamera, mapWidth = window.innerWidth/4, mapHeight = window.innerHeight/4;

var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();

init();
animate();


function init() {

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
	cameraDefaults();
	scene.add(camera);

	// orthographic cameras
	mapCamera = new THREE.OrthographicCamera(
	    window.innerWidth / -4,		// Left
	    window.innerWidth / 4,		// Right
	    window.innerHeight / 4,		// Top
	    window.innerHeight / -4,	// Bottom
	    -500,            			// Near 
	    10000 );           			// Far 
	mapCamera.up = new THREE.Vector3(0,0,-1);
	mapCamera.lookAt( new THREE.Vector3(0,-1,0) );
	scene.add(mapCamera);


	//scene.fog = new THREE.Fog("black");

	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/floor_tile.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 100, 100 );
	var floorMaterial = new THREE.MeshPhongMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	//floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);

	//var cereals = new THREE.Geometry();
	//var cereal = new THREE.Mesh( new THREE.CubeGeometry(7.625,11,2.75) );


	var materials = [
	    new THREE.MeshPhongMaterial( { map: loadAndRender('images/cereal_left.jpg') } ),
	    new THREE.MeshPhongMaterial( { map: loadAndRender('images/cereal_right.jpg') } ),
	    new THREE.MeshPhongMaterial( { map: loadAndRender('images/cereal_top.jpg') } ),
	    new THREE.MeshPhongMaterial( { map: loadAndRender('images/cereal_bottom.jpg') } ),
	    new THREE.MeshPhongMaterial( { map: loadAndRender('images/cereal_front.jpg') } ),
	    new THREE.MeshPhongMaterial( { map: loadAndRender('images/cereal_back.jpg') } ) 
	];
	for (var i = 0; i < 100; i++) {
		var cereal = new THREE.Mesh( new THREE.CubeGeometry(7.625,11,2.75), new THREE.MeshFaceMaterial(materials) );

		cereal.position.set(0,11/2,-i*4);
		//THREE.GeometryUtils.merge( cereals, cereal );
		scene.add(cereal);
	}

	//var cerealsMesh = new THREE.Mesh(cereals, new THREE.MeshFaceMaterial(materials));
	//cerealsMesh.castShadow = true;
	//cerealsMesh.receiveShadow = true;
	//scene.add(cerealsMesh);

	var soupGeom = new THREE.Geometry();
	var soupLids = new THREE.Geometry();

	var soupLid = new THREE.Mesh(new THREE.CircleGeometry(2,60));
	var soup = new THREE.Mesh( new THREE.CylinderGeometry( 2, 2, 4.5, 60, 1, true ));

	var yRot = 0;
	var x = 0;
	var xoff = 7;

	for (var i = 0; i < 10; i++) {
		for (var j = 0; j < 10; j++) {
			x = xoff+j*4.5;
			for (var k =0; k<10; k++) {
				yRot = Math.random() * Math.PI;
				soup.position.set(x,4.5/2+4.5*(k),-5*i);
				soup.rotation.set(0, yRot, 0);
				THREE.GeometryUtils.merge( soupGeom, soup );

				soupLid.position.set(x,4.5*(k+1),-5*i);
				soupLid.rotation.set(3*Math.PI/2,0,yRot);
				THREE.GeometryUtils.merge( soupLids, soupLid );

				soupLid.position.set(x,4.5*(k),-5*i);
				soupLid.rotation.set(0,yRot,0);
				THREE.GeometryUtils.merge( soupLids, soupLid );
			}
		}
	}
	
	var soupLidMesh = new THREE.Mesh(soupLids, new THREE.MeshPhongMaterial( { map: loadAndRender('images/soup_top.jpg') } ));
	soupLidMesh.castShadow = true;
	soupLidMesh.receiveShadow = true;
	scene.add(soupLidMesh);
	
	var soupCanMesh = new THREE.Mesh(soupGeom, new THREE.MeshPhongMaterial( { map: loadAndRender('images/soup.jpg') } ));
	soupCanMesh.castShadow = true;
	soupCanMesh.receiveShadow = true;
	scene.add(soupCanMesh);

	var light = new THREE.AmbientLight( "white" );
	scene.add( light );
	
 	light = new THREE.SpotLight("white");
	light.position.set(-30,30,30);
	light.castShadow = true;
	scene.add(light);

	/*light = new THREE.SpotLight("white");
	light.position.set(45,30,-100);
	light.castShadow = true;
	scene.add(light);
	var light = new THREE.AmbientLight("white");
	scene.add(light);*/

	/*light = new THREE.SpotLight("white");
	light.position.set(0,50,0);
	light.target.position.set(0,0,0);
	light.castShadow = true;
	light.shadowCameraVisible = true;
	scene.add(light);*/
	

	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else 
		alert("No WebGL support detected");

	renderer.setClearColor( "black", 1 );
  	renderer.setSize( window.innerWidth, window.innerHeight );
  	renderer.shadowMapEnabled = true;
	renderer.autoClear = false;

  	container = document.getElementById( 'container' );
  	container.appendChild( renderer.domElement );
  	window.addEventListener( 'resize', onWindowResize, false );
  	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );

	var ballTexture = THREE.ImageUtils.loadTexture( 'images/up_green_arrow.png' );
	var ballMaterial = new THREE.SpriteMaterial( { map: ballTexture, useScreenCoordinates: false, color: 0xff0000 } );
	sprite = new THREE.Sprite( ballMaterial );
	sprite.position = camera.position;
	sprite.scale.set( 16, 16, 1.0 ); // imageWidth, imageHeight
	scene.add( sprite );

	//var jsonLoader = new THREE.JSONLoader();
	//jsonLoader.load( "models/android.js", addAndroidsToScene );
}

var sprite;

function cameraDefaults() {
	camera.position.x = 0;
	camera.position.y = 20;
	camera.position.z = 100;
	camera.rotation.set(0,0,0);
}

function onWindowResize() {

  	camera.aspect = window.innerWidth / window.innerHeight;
  	camera.updateProjectionMatrix();

  	renderer.setSize( window.innerWidth, window.innerHeight );
  	render();
}

function update() {
	var delta = clock.getDelta(); // seconds.
	var moveDistance = 100 * delta; // 100 pixels per second
	var rotateAngle = Math.PI / 4 * delta; 

	if ( keyboard.pressed("W") )
		camera.translateZ( -moveDistance );
	if ( keyboard.pressed("S") )
		camera.translateZ(  moveDistance );
	if ( keyboard.pressed("Q") )
		camera.translateX( -moveDistance );
	if ( keyboard.pressed("E") )
		camera.translateX(  moveDistance );	
	
	if ( keyboard.pressed("Z") )
	{
		cameraDefaults();
	}

	if ( keyboard.pressed("A") )	
		camera.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
	if ( keyboard.pressed("D") )
		camera.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
	if ( keyboard.pressed("R") )
		camera.rotateOnAxis( new THREE.Vector3(1,0,0), rotateAngle);
	if ( keyboard.pressed("F") )
		camera.rotateOnAxis( new THREE.Vector3(1,0,0), -rotateAngle);
	
	if (camera.rotation.x == Math.PI && camera.rotation.z == Math.PI) {	
		sprite.rotation = Math.PI/2+ (Math.PI/2 - camera.rotation.y);
	} else if (camera.rotation.x == -Math.PI && camera.rotation.z == -Math.PI) {
		sprite.rotation = Math.PI/2+ (Math.PI/2 - camera.rotation.y);
	} else {
		sprite.rotation = camera.rotation.y;
	}
	
	stats.update();
}

function animate() {
	requestAnimationFrame( animate );
	render();
	update();
}

function render() {
	var w = window.innerWidth, h = window.innerHeight;
	renderer.setViewport( 0, 0, w, h );
	renderer.clear();
	renderer.render( scene, camera );

	renderer.setViewport( 10, h - mapHeight - 10, mapWidth, mapHeight );
	renderer.render( scene, mapCamera );
}

function loadAndRender(filename) {
	return THREE.ImageUtils.loadTexture(filename, {}, render);
}

function addAndroidsToScene( geometry, materials ) 
{
	var androids = new THREE.Geometry();
	var android = new THREE.Mesh( geometry);
	android.scale.set(1,1,1);
	var light;
	var zOffset = -100;
	for (var i = 0; i< 10; i++) {
		for (var j = 0; j< 10; j++) {
			/*if (i%4 == 0 && j%4 == 0) {
				light = new THREE.SpotLight("white");
				light.position.set(i*10,50,-j*10+zOffset);
				light.target.position.set(i*10,0,-j*10+zOffset);
				light.castShadow = true;
				light.shadowCameraVisible = true;
				scene.add(light);
			}*/

			android.position.set(i*10,0,-j*10+zOffset);
			THREE.GeometryUtils.merge( androids, android );
		}
	}
	var androidsMesh = new THREE.Mesh(androids, new THREE.MeshFaceMaterial( materials ));
	//androidsMesh.castShadow = true;
	//androidsMesh.receiveShadow = true;
	scene.add(androidsMesh);
	
}
