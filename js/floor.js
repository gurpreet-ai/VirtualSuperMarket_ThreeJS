

function floorSetup(scene) {
	var textureSource = 'images/floor_tile.jpg';
	var texture = new THREE.ImageUtils.loadTexture(textureSource);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 100, 100 );
	var settings = { map: texture, side: THREE.DoubleSide };
	var material = new THREE.MeshPhongMaterial(settings);
	var geometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add(mesh);
}