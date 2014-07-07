'use strict';

var fs = require('fs');
var csv = require('csv');
var AdmZip = require('adm-zip');

var dirname = 'downloads/opendata/TAN';

new AdmZip('downloads/opendata/ARRETS_HORAIRES_CIRCUITS_TAN_gtfs.zip')
	.extractAllTo(dirname);
new AdmZip('downloads/opendata/TAN/ARRETS_HORAIRES_CIRCUITS_TAN_GTFS.zip')
	.extractAllTo(dirname);

/*
Let's build all stops as geojson 'Point'

stops.txt stop_id,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station

->
{
"type":"FeatureCollection",
"features":[{
	"type":"Feature",
	"properties":{
		"id":"StopArea:ABDU",
		"name":"Abel Durand",
		"popupContent":"<h4>Abel Durand</h4>",
		"icon":"busstop"
	},
	"geometry":{
		"type":"Point",
		"coordinates":["-1.60338192","47.22019369"]
	}
}
 */

csv()
.from.path(dirname+'/stops.txt', { delimiter: ',', escape: '"' , columns: true})
.to.array(function(data){
	var GEOJSON = {
		type: "FeatureCollection",
		features: []
	};

	for (var i = 0; i < data.length; i++) {
		var row = data[i];
		GEOJSON.features.push({
			type:"Feature",
			properties:{
				id: row.stop_id,
				name: row.stop_name,
				popupContent: "<h4>"+row.stop_name + "</h4>",
				icon: "busstop"
			},
			geometry:{type:"Point",coordinates:[row.stop_lon,row.stop_lat]}
		});
	};
	fs.writeFile('static/geojson/mobilite-tanstops.geo.json', JSON.stringify(GEOJSON));//, [encoding], [callback])
});
/*
Let's build the lines

routes.txt: route_id, route_short_name, route_long_name, route_desc, route_type
shaptes.txt: shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence
trips.txt: route_id,service_id,trip_id,trip_headsign,direction_id,block_id,shape_id

-> 
{
"type":"FeatureCollection",
"features":[{
	"type":"Feature",
	"properties":{
		"id":"1-0",
		"name":"Ligne  1",
		"popupContent":"<h4>Ligne  1</h4>",
		"icon":"busline"
	},
	"geometry": {
	    "type": "LineString",
	    "coordinates": [
	        [
	            -1.61190337530101,
	            47.1747673101147,
	            0
	        ],
	        [
	            -1.61150935425942,
	            47.17521302634,
	            0
	        ],
	        [
	            -1.61050415135923,
	            47.1763533843096,
	            0
	        ]
	    ]
	}
}
 */

var tanShapes = function(){
	var ROUTES = {};
	var ROUTES_LIST = [];
	var SHAPES = {};
	var TRIPS = {};

	var transformRoutes = function(route){
		ROUTES[route.route_id] = route;
		ROUTES_LIST.push(route.route_id);
	};
	var transformShapes = function(shape){
	//	console.log(shape);
		if (SHAPES[shape.shape_id] === undefined){
			SHAPES[shape.shape_id] = [];		
		}
		SHAPES[shape.shape_id].push([shape.shape_pt_lon, shape.shape_pt_lat, 0]);
	};
	var transformTrip = function(trip){
		TRIPS[trip.route_id] = trip.shape_id;
	};

	csv()
	.from.path(dirname+'/routes.txt', { delimiter: ',', escape: '"' , columns: true})
	.to.array(function(routes){
		routes.map(transformRoutes);

		csv()
		.from.path(dirname+'/shapes.txt', { delimiter: ',', escape: '"' , columns: true})
		.to.array(function(shapes){
			shapes.map(transformShapes);

			csv()
			.from.path(dirname+'/trips.txt', { delimiter: ',', escape: '"' , columns: true})
			.to.array(function(trips){
				trips.map(transformTrip);

				var GEOJSON = {
					type: "FeatureCollection",
					features: []
				};

				for (var i = 0; i < ROUTES_LIST.length; i++) {
					var route = ROUTES[ROUTES_LIST[i]];
					var shape_id = TRIPS[route.route_id];
					var shape = SHAPES[shape_id];
					GEOJSON.features.push({
						type:"Feature",
						properties:{
							id: 'route#' + route.route_id,
							name: route.route_short_name,
							popupContent: "<h4>Ligne "+route.route_short_name + "</h4>",
						},
						geometry:{
							type:"LineString",
							coordinates:shape
						}
					});
				};
				fs.writeFile('static/geojson/mobilite-tanshapes.geo.json', JSON.stringify(GEOJSON));//, [encoding], [callback])

			});
		});
	});
};
tanShapes();

var tanStopsByLines = function(){
	var ROUTES = {};
	var ROUTES_LIST = [];
	var TRIPS = {};
	var STOPS = {};
	var STOP_TIMES = {};

	var transformRoutes = function(route){
		ROUTES[route.route_id] = route;
		ROUTES_LIST.push(route.route_id);
	};
	var transformTrip = function(trip){
		TRIPS[trip.route_id] = trip;
	};
	var transformStops = function(stop){
		STOPS[stop.stop_id] = stop;
	};
	var transformStopTimes = function(stopTime){
		if (STOP_TIMES[stopTime.trip_id] === undefined){
			STOP_TIMES[stopTime.trip_id] = [];
		}
		STOP_TIMES[stopTime.trip_id].push(stopTime);
	};
	csv()
	.from.path(dirname+'/routes.txt', { delimiter: ',', escape: '"' , columns: true})
	.to.array(function(routes){
		routes.map(transformRoutes);

		csv()
		.from.path(dirname+'/trips.txt', { delimiter: ',', escape: '"' , columns: true})
		.to.array(function(trips){
			trips.map(transformTrip);

			csv()
			.from.path(dirname+'/stops.txt', { delimiter: ',', escape: '"' , columns: true})
			.to.array(function(stops){
				stops.map(transformStops);

				console.log('start reading stop_times');
				csv()
				.from.path(dirname+'/stop_times.txt', { delimiter: ',', escape: '"' , columns: true})
				.to.array(function(stopTimes){
					stopTimes.map(transformStopTimes);

					var GEOJSON, route, routeId, tripId, _stopTimes,stop, i, j, fname;
					//get the stop
					//get the trip -> route
					for (i = 0; i < ROUTES_LIST.length; i++) {
						console.log('start working on '+i);
						routeId = ROUTES_LIST[i];
						route = ROUTES[routeId];
						GEOJSON = {
							type: "FeatureCollection",
							properties:{
								name: route.route_short_name
							},
							features: []
						};
						if (TRIPS[routeId] === undefined){
							console.log('can t find trips for '+i);
							continue;
						}
						tripId = TRIPS[routeId].trip_id;
						_stopTimes = STOP_TIMES[tripId];

						for (j = 0; j < _stopTimes.length; j++) {
							stop = STOPS[_stopTimes[j].stop_id];
							GEOJSON.features.push({
								type:"Feature",
								properties:{
									id: stop.stop_id,
									name: stop.stop_name,
									index: _stopTimes[j].stop_sequence
								},
								geometry:{type:"Point",coordinates:[
									stop.stop_lon,stop.stop_lat
								]}
							});
						}
						fname = 'static/geojson/mobilite-tanstops-'+ i + '.geo.json';
						fs.writeFile(fname, JSON.stringify(GEOJSON));
						console.log('save as '+fname);
					}
				});
			});
		});
	});
};
tanStopsByLines();