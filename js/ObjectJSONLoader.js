ObjectJSONLoader.prototype = Object.create( JSONLoader.prototype );



function ObjectJSONLoader(urls, scene) {
	this.urls = urls;
	this.scene = scene;
};

var processedObjectConfigs = 0;

ObjectJSONLoader.prototype.processResult = function(json) {
	var type = json.type;
	//console.log(this.urls)
	processedObjectConfigs++;
	if (type == "cube") {
		this.loadCube(json);
	} else if (type == "cylinder") {
		this.loadCylinder(json);
	}
}

ObjectJSONLoader.prototype.config = function() {
	for (var i = 0; i < this.urls.length; i++) {
		this.load(this.urls[i]);
	}
}



function getUserDataObject(json) {
	return {"sku" : json.sku}
}

ObjectJSONLoader.prototype.baseLoadObject = function(department, quantity, width, length, height) {
	/*console.log(
		department,
		quantity,
		width,
		length,
		height
	);*/
	
	if (departmentsToShelfSpaceUsage[department] == undefined) {
		console.log("no key found for: "+department);
		departmentsToShelfSpaceUsage[department] = {
			"used" : new THREE.Vector3(0,0,0),
			"departmentIndex" : numberOfDepartments,
			"shelfIndex" : 0
		}
		numberOfDepartments++;
	}
	var departmentIndex = departmentsToShelfSpaceUsage[department]["departmentIndex"];
	var shelfIndex = departmentsToShelfSpaceUsage[department]["shelfIndex"];
	var usedVector = departmentsToShelfSpaceUsage[department]["used"];
 	var usedWidth = usedVector.x;
 	var usedLength = usedVector.z;

	var padding = getPaddingBetweenObjects();
	var widthItems = Math.floor((getShelfWidth())/(width + padding));
	var lengthItems = Math.floor((getShelfLength() - usedLength)/(length + padding));
	console.log("widthwise items: "+widthItems);
	console.log("lengthwise items: "+lengthItems);
	//console.log("heightwise items: "+getShelfDistance()/height);

	var widthIndex = 0, lengthIndex = 0;
	var heightIndex = usedVector.y;
	var pos = [];
	for (var i = 0; i < quantity; i++) {
		//console.log(i);
		pos.push(new THREE.Vector3(
			(width+padding)*widthIndex + ((departmentIndex + shelfIndex)*getAisleWidth()),
			heightIndex*getShelfDistance() + getShelfHeight(),
			usedLength + (length+padding)*lengthIndex));

		widthIndex++;
		if (widthIndex >= widthItems) {
			widthIndex = 0;
			lengthIndex++;
			if (lengthIndex >= lengthItems) {
				heightIndex++;
				console.log(heightIndex);
				usedLength = 0;
				lengthItems = Math.floor((getShelfLength() - usedLength)/(length + padding));
				widthIndex = 0;
				lengthIndex = 0;
				if (heightIndex >= getNumShelves()) {
					shelfIndex++;
					extraShelves++;
					heightIndex = 0;
					console.log("ran out of shelf space, creating new shelf");
					//break;
				}
			}
		}
	}
	//console.log(heightIndex);
	var lastPos = pos[pos.length-1];
	usedVector.x = lastPos.x + width + padding;
	usedVector.y = heightIndex;
	usedVector.z = lastPos.z + length + padding;
	departmentsToShelfSpaceUsage[department]["used"] = usedVector;
	departmentsToShelfSpaceUsage[department]["shelfIndex"] = shelfIndex;
	
	if (processedObjectConfigs == this.urls.length) {
		console.log("DONE");
		//callback for when we should have collected all
		//important object info
		shelves(scene, numberOfDepartments+extraShelves);
	}

	return pos;
}

ObjectJSONLoader.prototype.loadCube = function(json) {

	var pos = this.baseLoadObject(
		json.department,
		json.quantity,
		json.dimensions.length,
		json.dimensions.width,
		json.dimensions.height
	);

	var images = json.materials.faces;

	var materials = []
	for (var i = 0; i < images.length; i++) {
		console.log(images[i]);
		materials.push(new THREE.MeshPhongMaterial( { map: loadAndRender(images[i]) } ));
	}
	var quantity = json.quantity;
	var dims = json.dimensions;

	var cubes = new THREE.Geometry();
	var cube = new THREE.Mesh( new THREE.CubeGeometry(dims.width,dims.height,dims.length) );

	for (var i = 0; i < Math.min(pos.length, quantity); i++) {
		//cube.position.set(0,dims.height/2,-i*(dims.width*1.5));
		pos[i].x = pos[i].x + dims.length/2;
		pos[i].y = pos[i].y + dims.height/2;
		pos[i].z = pos[i].z + dims.width/2;
		cube.position = pos[i];
		cube.rotation.set(0,-Math.PI/2,0);
		THREE.GeometryUtils.merge( cubes, cube );
	}
	var cubesMesh = new THREE.Mesh(cubes, new THREE.MeshFaceMaterial(materials));
	cubesMesh.castShadow = true;
	cubesMesh.receiveShadow = true;

	cubesMesh.userData = json;
	console.log(cubesMesh);

	this.scene.add(cubesMesh);
	ALL_OBJECTS.push(cubesMesh);
}

ObjectJSONLoader.prototype.loadCylinder = function(json) {
	var radius = json.dimensions.radius;
	var height = json.dimensions.height;

	var pos = this.baseLoadObject(
		json.department,
		json.quantity,
		radius*2,
		radius*2,
		height
		);

	var sections = 60;


	var bodies = new THREE.Geometry();
	var lids = new THREE.Geometry();

	var lid = new THREE.Mesh(new THREE.CircleGeometry(radius,sections));
	var body = new THREE.Mesh( new THREE.CylinderGeometry( radius, radius, height, sections, 1, true ));
	var yRot = 0;
	for (var i = 0; i < Math.min(pos.length, json.quantity); i++) {
		//yRot = Math.random() * Math.PI;
		yRot = Math.PI/2 + Math.random() * Math.PI/6 - Math.PI/12;
		//body.position.set(0,4.5/2,-5*i);
		//console.log(pos[i])
		pos[i].x = pos[i].x + radius;
		pos[i].z = pos[i].z + radius;

		pos[i].y = pos[i].y + height/2;
		body.position = pos[i];
		body.rotation.set(0, yRot, 0);
		THREE.GeometryUtils.merge( bodies, body );

		
		pos[i].y = pos[i].y + height/2;
		lid.position = pos[i];
		lid.rotation.set(3*Math.PI/2,0,yRot + Math.PI/2 * Math.random());
		THREE.GeometryUtils.merge( lids, lid );
		/*
		pos[i].y = pos[i].y - height;
		lid.position = pos[i];
		lid.rotation.set(Math.PI/2,0,yRot);
		THREE.GeometryUtils.merge( lids, lid );*/
	}

	var lidMesh = new THREE.Mesh(lids, new THREE.MeshPhongMaterial( { map: loadAndRender(json.materials.top) } ));
	lidMesh.castShadow = true;
	lidMesh.receiveShadow = true;
	scene.add(lidMesh);
	
	var bodiesMesh = new THREE.Mesh(bodies, new THREE.MeshPhongMaterial( { map: loadAndRender(json.materials.label) } ));
	bodiesMesh.castShadow = true;
	bodiesMesh.receiveShadow = true;

	bodiesMesh.userData = json;
	console.log(bodiesMesh);
	
	scene.add(bodiesMesh);
	ALL_OBJECTS.push(bodiesMesh);
}
