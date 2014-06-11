/*
	important: this line allows ConfigLoader to "extend" 
	JSONLoader. Later in this file, JSONLoader's processResult
	is overwritten and a few methods are added. 
*/
ConfigLoader.prototype = Object.create( JSONLoader.prototype );

/*
	Constructor. We need the url from which to fetch the JSON
	as well as a referance to the scene. 
*/
function ConfigLoader(url, scene) {
	this.url = url;
	this.scene = scene;
};

/*
	get a list of departments from the json (that is used quite often
	further down the call stack). Then call worlditizeMe.
*/
ConfigLoader.prototype.processResult = function(config) {
	var departmentList = []
	var departments = config.departments;
	//create a list of departments for convenience
	for (department in departments) {
		departmentList.push(department)
	}
	this.worlditizeMe(config,departmentList);
}

/*
	Modify the department list html to add all the departments 
	that we loaded from the configuration json. 
*/
function addDepartmentsToHud(departmentList) {
	var list = $($(".list")[0])
	for (var index in departmentList) {
		var department = departmentList[index]
		list.append(
    		$('<li/>', {
		        'class': 'listItem',
		        html: department,
		        'onClick' : 'departmentClick(this.id)',
		        'id' : department
    		})
		);
	}
}

/*
	Create the giant cylinder that is our world. Call createShelves to 
	create shelves, populate them with objects, and add those objects as 
	well as the shelves as children of the cylinder. Add the cylinder to 
	the scene. Animate to the first department. 
*/
ConfigLoader.prototype.worlditizeMe = function(config, departmentList) {
	var radius = WORLD_RADIUS
	var width = 200
	var circ = 2*radius*Math.PI

	var textureSource = 'images/floor_ceramic.jpg';
	var texture = new THREE.ImageUtils.loadTexture(textureSource);
	var repeatNumCirc = 200;
	var repeatNumWidth = repeatNumCirc * (width / circ)
	texture.repeat.set( repeatNumCirc, repeatNumWidth);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.anisotropy = 4;

	var body = new THREE.Mesh( new THREE.CylinderGeometry( radius, radius, width, 500, 1, true ), new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide } ));
	body.rotation.z = Math.PI/2

	departmentList.sort();
	addDepartmentsToHud(departmentList);

	//shelf and object models are created and added to the scene here
	createShelves(this.scene, body, departmentList, config);

	body.receiveShadow=true;

	scene.add(body);
	_worldCylinder = body;

	animateToIndex(0);
}

/*
	Call the load function that this object inherited 
	from JSONLoader. Pass it our url.
*/
ConfigLoader.prototype.config = function() {
	this.load(this.url);
}




