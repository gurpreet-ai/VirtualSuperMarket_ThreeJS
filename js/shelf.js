

//the shelf width is how deep the shelves are
function getShelfWidth() {
	return 12*2;
}

//The thickness of one shelf, 1 inch sounds reasonable
function getShelfHeight() {
	return 1;
}

//how long one shelf id
function getShelfLength() {
	return 12*6;
}

//height between shelves
function getShelfDistance() {
	return 16;
}

//space between objects on the shelf
function getPaddingBetweenObjects() {
	return 1;
}

//Shelves per single shelf tower
function getNumShelves() {
	return 4;
}

/* 	
	for each department, create a mesh for the shelf, put
	associated products "on" the shelf, then rotate the
	shelf by the interval angle associated with the 
	currently processing department and translate 
	"up" by WORLD_RADIUS units on the new y-axis of the shelf.
	This will put the shelf on the surface of the cylinder.
	Afterwards, merge all the shelf geometries and add the 
	merged mesh as a child of the cylinder
*/
function createShelves(scene, body, departmentList, config) {
	var shelfgeometries = new THREE.Geometry();
	var shelfgeometry = new THREE.CubeGeometry(
		getShelfWidth(), 
		getShelfHeight(), 
		getShelfLength());
	var shelvesMesh = new THREE.Mesh( shelfgeometry);

	var numObjects = departmentList.length;
	_numberOfDepartments = numObjects;

	//interval angle is 360 degreses divided by the number of departments
	//...so the shelves are equally spaced
	var intervalAngle = Math.PI*2/numObjects;
	_intervalAngle = intervalAngle
	for (var i = 0; i<numObjects;i++) {
		var shelfGeometries = new THREE.Geometry();
		//add the shelves for each shelf tower
		for (var j = 0; j<getNumShelves();j++) {
			shelvesMesh.position.set(
				0,
				getShelfDistance()*j, 
				0);
			THREE.GeometryUtils.merge( shelfGeometries, shelvesMesh );
		}
		
		//create the text mesh. 
		var textMesh = createText(departmentList[i]);
		
		THREE.GeometryUtils.merge( shelfGeometries, textMesh );
		var finalMesh = new THREE.Mesh( shelfGeometries )

		var department = departmentList[i];
		
		//add each object in the department to the shelf
		//shelfUsage is a vector that keeps track of how much shelf space is used,
		//so that new items do not overlap ones that are already place
		var shelfUsage = new THREE.Vector3(0,0,0);
		for (var index in config.departments[department]) {
			var object = config.departments[department][index];
			//load object loads a number of the same product
			//this number is department by the quantity attribute in the config
			shelfUsage = loadObject(object, body, i*intervalAngle, shelfUsage)
		}

		//rotate the shlef in accordance with what angle in the cylinder it will be
		finalMesh.rotation.z = i*intervalAngle

		//add the department and its associated index to the global map
		//this will make the lookup happen in constant time later
		_departmentsToIndexes[departmentList[i]] = i;

		//move the shelves and the text to the surface of the cylinder
		finalMesh.translateY(WORLD_RADIUS);

		//merge this shelf tower with the rest of them
		THREE.GeometryUtils.merge( shelfgeometries, finalMesh );
	}

	var finalMesh = new THREE.Mesh( shelfgeometries, new THREE.MeshPhongMaterial())
	finalMesh.castShadow = true;
	/*
		We previously arranged the shelves in a way that put them on the surface
		of a nonexistant cylinder that is perpendicular to our world cylinder.
		This rotation corrects this. 
	*/
	finalMesh.rotation.x = Math.PI/2;

	body.add(finalMesh)
}


/*
	loadObject() takes certain parameters that are common to all object
	types and delegates to the correct function based on the type of the
	object being load. In the future, this could be extended by adding 
	another type here, for example, "blender_model"
*/
function loadObject(object, body, angle, used) {
	var pos, width, length, height;
	var dims = object.dimensions;
	height = dims.height;
	//if the object is a cube, use loadCube, else use loadCylinder
	if (object.type == "cube") {
		width= dims.width;
		length = dims. length;
		//baseLoadObject decides the positions of the objects relative to the shelf
		//it should be called for every object type
		pos = baseLoadObject(object.quantity, width, length, height, used);
		//loadCube will take the positions returned by baseLoadObject and will
		//place object meshes at those positions
		used = loadCube(object, body, angle, pos);
	} else if (object.type == "cylinder") {
		width = dims.radius*2;
		length = dims.radius*2;
		pos = baseLoadObject(object.quantity, width, length, height, used);
		used = loadCylinder(object, body, angle, pos);
	}
	return used;
}

/*
	The algorithm for arranging objects on shelves should be the 
	same for every type of object. baseLoadObject() takes the qunaitity
	of a certain type of product, its dimensions, and used, a vector that
	contains information about how much of the shelf is already used.
	This function will use the dimensions to find positions relative
	to a shelf of 'quantity' number of objects. It will use the used 
	vector to make sure that objects are not overlapping

	TODO: stack stackable items
*/
function baseLoadObject(quantity, pwidth, plength, pheight, used) {

	var width = pwidth
	var depth = plength

	var usedVector = used;
 	var usedWidth = usedVector.z;

	var padding = getPaddingBetweenObjects();

	//the number of objects that fit on the width of the shelf
	var widthItems = Math.floor((getShelfLength() - usedWidth)/(width + padding));
	//the number of objects that fit on the depth of the shelf
	var depthItems = Math.floor((getShelfWidth())/(depth + padding));

	var widthIndex = 0, depthIndex = 0;
	var heightIndex = usedVector.y;
	var pos = [];
	for (var i = 0; i < quantity; i++) {
		//push to the position array
		pos.push(new THREE.Vector3(
			(depth+padding)*depthIndex,
			heightIndex*getShelfDistance() + getShelfHeight()/2,
			usedWidth + (width+padding)*widthIndex));

		depthIndex++;
		//if no more objects fit depthwise, go to the next row widthwise
		if (depthIndex >= depthItems) {
			depthIndex = 0;
			widthIndex++;
			//if no more objects fit heightwise, go to the shelf above the current one
			if (widthIndex >= widthItems) {
				heightIndex++;
				usedWidth = 0;
				/*
				because this is a new shelf, widthItems must be recalculated
				since usedWidth is now zero
				*/
				widthItems = Math.floor((getShelfLength() - usedWidth)/(width + padding));
				widthIndex = 0;
				depthIndex = 0;
				if (heightIndex >= getNumShelves()) {
					alert("ran out of shelf space");
					//TODO: find a better way to do this. expand the shelf, maybe. 
					break;
				}
			}
		}
	}
	//return the position array
	return pos;
}

//TODO: remove this function, as it is nothing but a wrapper at this point
function loadTexture(filename) {
	/*
	we do not need to call render here, as render is being called 
	constantly in the render loop
	*/
	return THREE.ImageUtils.loadTexture(filename, {});
}

/*
	loadnspectionObject is similar to loadObject, except it is for 
	loading a single instance of a product to the inspection view.
	It will pass less parameters to the object loading function 
	so that they know to load an inspection object.
	baseLoadObject does not need to be called because we do not 
	care about shelves. 
*/
function loadInspectionObject(object) {
	//this is the distance away from the camera that the object will be
	var inspectionZ = -30;
	if (object.type == 'cube') {
		var meshes = loadCube(object)
		for (index in meshes) {
			var mesh = meshes[index];
			//mesh.position.set(0,0,0)
			camera.add(mesh)
			mesh.position.z = inspectionZ;
			mesh.rotation.y = -Math.PI/2;
		}
		return meshes;
	} else if(object.type == 'cylinder') {
		var meshes = loadCylinder(object)
		for (index in meshes) {
			var mesh = meshes[index];
			camera.add(mesh)
			mesh.position.z = inspectionZ;
			mesh.rotation.y = -Math.PI/2;
		}
		return meshes;
	}
}

/*
	Generic function that loads a cuboid based on attributes set
	in the configuration. If body, angle, and pos are not passed in,
	this will load 1 cube and leave it with its default position (0,0,0).
	Otherwise, this will load json.quantity cubes at positions specified 
	by the position vector. The positions will be modified slightly for
	cuboid specific centering. Once the cuboid meshes are loaded, 
	put them "on" the shelf at angle and add them as children
	of the world cylinder, body
*/
function loadCube(json, body, angle, pos) {
	var inspection = false

	//theres a lack of parameters, this must be an inspection object
	if (body == null && angle == null && pos == null) {
		inspection = true
	}

	var images = json.materials.faces;
	var materials = []

	//load face textures
	for (var i = 0; i < images.length; i++) {

		var texture = THREE.ImageUtils.loadTexture(images[i], {});
		if (inspection) {
			texture.anisotropy = 16;
			materials.push(new THREE.MeshBasicMaterial( { map: texture } ));
		} else {
			materials.push(new THREE.MeshPhongMaterial( { map: texture } ));
		}

	}
	var quantity = json.quantity;
	var dims = json.dimensions;

	var cubes = new THREE.Geometry();
	var cube = new THREE.Mesh( new THREE.CubeGeometry(dims.width,dims.height,dims.length) );

	var end;
	//if this inspection, the position array will have just one member, a vector of (0,0,0)
	//we will also load just one object
	if (inspection) {
		end = 1;
		pos = [new THREE.Vector3(0,0,0)];
	} else {
		//add objects until we have no more positions or we've exceeded the quantity
		end = Math.min(pos.length, quantity);
	}

	for (var i = 0; i < end; i++) {
		if (inspection) {
			cube.position = pos[i];
		} else { 
			//we must make a copy of the vector
			//the = operator assigns a reference, not a copy
			cube.position =  new THREE.Vector3(pos[i].x,pos[i].y,pos[i].z);

			cube.position.x = cube.position.x + dims.length/2 -getShelfWidth()/2;
			cube.position.y = cube.position.y + dims.height/2;
			cube.position.z = cube.position.z + dims.width/2-getShelfLength()/2;
		}
		cube.rotation.set(0,Math.PI/2,0);
		//merge with rest of cuboids
		THREE.GeometryUtils.merge( cubes, cube );
	}

	//create a mesh of the merged geometries
	var cubesMesh = new THREE.Mesh(cubes, new THREE.MeshFaceMaterial(materials));
	cubesMesh.castShadow = true;
	cubesMesh.receiveShadow = true;

	//for inspection mode, we do not have to do anything else
	if (inspection) {
		//make this an array so we can iterate through it
		return [cubesMesh];
	}

	//set userdata for loading inspection object later
	cubesMesh.userData = json;

	//move to surface of cylinder and add as child
	cubesMesh.rotation.z = angle
	cubesMesh.rotation.x = Math.PI/2;
	cubesMesh.translateY(WORLD_RADIUS);
	body.add(cubesMesh)

	//add the mesh to ALL_OBJECTS for the click listener to work
	ALL_OBJECTS.push(cubesMesh);

	//create and return the usedVector
	var usedVector = new THREE.Vector3(0,0,0);
	var lastPos = pos[pos.length-1];
	usedVector.z = lastPos.z + dims.width + getPaddingBetweenObjects();
	usedVector.y = Math.floor((lastPos.y-getShelfHeight())/getShelfDistance()) + 1;

	return usedVector;
}

/*
	Generic function that loads a cylinder based on attributes set
	in the configuration. If body, angle, and pos are not passed in,
	this will load 1 cylinder and leave it with its default position (0,0,0).
	Otherwise, this will load json.quantity cylinders at positions specified 
	by the position vector. The positions will be modified slightly for
	cylinder specific centering. Once the cylinder meshes are loaded, 
	put them "on" the shelf at angle and add them as children
	of the world cylinder, body
*/
function loadCylinder(json, world, angle, pos) {

	var inspection = false
	if (body == null && angle == null && pos == null) {
		inspection = true
	}

	var radius = json.dimensions.radius;
	var height = json.dimensions.height;
	var width = radius*2;

	//circles and cylinders are made of 60 triangles
	//maybe reduce this number for performance
	var sections = 60;

	var bodies = new THREE.Geometry();
	var lids = new THREE.Geometry();

	var lid = new THREE.Mesh(new THREE.CircleGeometry(radius,sections));
	/*
		that last true parameter means "open ended". 
		we draw the lids ourselves using CircleGeometry 
		because the texture mapping works better.
	*/
	var body = new THREE.Mesh( new THREE.CylinderGeometry( radius, radius, height, sections, 1, true ));
	var yRot = 0;

	var end; 
	if (inspection) {
		end = 1;
		pos = [new THREE.Vector3(0,0,0)];
	} else {
		end = Math.min(pos.length, json.quantity)
	}
	for (var i = 0; i < end; i++) {
		//apply a small random rotation for natural look and feel
		yRot = -Math.PI/2 + Math.random() * Math.PI/6 - Math.PI/12;
		
		//create a copy of the position, center the mesh
		var position = new THREE.Vector3(pos[i].x, pos[i].y, pos[i].z);
		position.x = position.x + radius - getShelfWidth()/2;
		position.z = position.z + radius - getShelfLength()/2;

		position.y = position.y + height/2;
		body.position = position;
		body.rotation.set(0, yRot, 0);
		//adjust lid position for inspection mode
		if (inspection) {
			body.position = pos[i]
		}
		//merge this body geometry with the rest of the bodies
		THREE.GeometryUtils.merge( bodies, body );

		
		position.y = position.y + height/2;
		lid.position = position;
		lid.rotation.set(3*Math.PI/2,0,yRot + Math.PI/2 * Math.random());
		
		if (inspection) {
			lid.position = pos[i]
			lid.position.y = lid.position.y + height/2
		}
		//merge this lid with the rest of the lids
		THREE.GeometryUtils.merge( lids, lid );

		//adjust lid position for inspection mode
		if (inspection) {
			lid.position = pos[i]
			lid.position.y = lid.position.y - height
			lid.rotation.set(Math.PI/2,0,yRot);
			THREE.GeometryUtils.merge( lids, lid );
		}

	}
	var lidMesh;
	if (inspection) {
		lidMesh = new THREE.Mesh(lids, new THREE.MeshBasicMaterial( { map: loadTexture(json.materials.top) } ));
	} else {
		lidMesh = new THREE.Mesh(lids, new THREE.MeshPhongMaterial( { map: loadTexture(json.materials.top) } ));

	}
	lidMesh.castShadow = true;
	lidMesh.receiveShadow = true;
	var bodiesMesh;
	if (inspection) {
		bodiesMesh = new THREE.Mesh(bodies, new THREE.MeshBasicMaterial( { map: loadTexture(json.materials.label) } ));
	} else {
		bodiesMesh = new THREE.Mesh(bodies, new THREE.MeshPhongMaterial( { map: loadTexture(json.materials.label) } ));
	}
	
	bodiesMesh.castShadow = true;
	bodiesMesh.receiveShadow = true;

	//no additional work needed for inspection mode, return an array of the meshes
	if (inspection) {
		return [lidMesh, bodiesMesh]
	}

	//set the userdata for loading the inspection object later
	bodiesMesh.userData = json;

	lidMesh.rotation.z = angle
	lidMesh.rotation.x = Math.PI/2;
	lidMesh.translateY(WORLD_RADIUS);

	//add the lid as a child of the world cylinder
	world.add(lidMesh)
	
	bodiesMesh.rotation.z = angle
	bodiesMesh.rotation.x = Math.PI/2;
	bodiesMesh.translateY(WORLD_RADIUS);

	//add the cylinder body as a child of the world cylinder
	world.add(bodiesMesh)

	ALL_OBJECTS.push(bodiesMesh);

	//create and return the usedVector. 
	var usedVector = new THREE.Vector3(0,0,0);
	var lastPos = pos[pos.length-1];
	usedVector.z = lastPos.z + width + getPaddingBetweenObjects();
	usedVector.y = Math.floor((lastPos.y-getShelfHeight())/getShelfDistance())+1;
	usedVector.x = lastPos.x + width + getPaddingBetweenObjects();
	return usedVector;
}

/*
	Make the mesh that is the text above the shelf.
	Make minimal position changes (just center horizontally)--
	the reset is handled by createShelves()
*/
function createText(text) {
	var textGeo = new THREE.TextGeometry( text, {

		size: 20,
		height: 5,
		curveSegments: 4,

		//from 'helvetiker' js glyphs library
		font: "helvetiker",
		weight: "bold",
		style: "normal",

		bevelThickness: 1,
		bevelSize: 1,
		bevelEnabled: false,

		material: 0,
		extrudeMaterial: 0.1

	});
	textGeo.computeBoundingBox();
	//center the text
	var centerOffset = -( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x )/2;
	var textMesh = new THREE.Mesh(textGeo);

	//put the mesh above the shelves
	textMesh.position.y = getShelfDistance()*getNumShelves();
	textMesh.rotation.y = Math.PI/2;
	textMesh.position.z = -centerOffset;
	return textMesh;
}
