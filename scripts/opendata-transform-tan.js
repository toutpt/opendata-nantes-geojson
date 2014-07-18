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
		type: 'FeatureCollection',
		features: []
	};

	for (var i = 0; i < data.length; i++) {
		var row = data[i];
		GEOJSON.features.push({
			type:'Feature',
			properties:{
				id: row.stop_id,
				name: row.stop_name,
				popupContent: '<h4>'+row.stop_name + '</h4>',
				icon: 'busstop'
			},
			geometry:{type:'Point',coordinates:[row.stop_lon,row.stop_lat]}
		});
	}
	fs.writeFile('static/geojson/mobilite-tanstops.geo.json', JSON.stringify(GEOJSON));//, [encoding], [callback])
});

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
		if (TRIPS[trip.route_id] === undefined){
			TRIPS[trip.route_id] = [];
		}
		TRIPS[trip.route_id].push(trip);
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

					var GEOJSON, route, routeId, tripId, _stopTimes,stop, stops, i, j, fname;
					//get the stop
					//get the trip -> route
					for (i = 0; i < ROUTES_LIST.length; i++) {
						console.log('start working on '+i);
						routeId = ROUTES_LIST[i];
						route = ROUTES[routeId];
						GEOJSON = {
							type: 'FeatureCollection',
							properties:{
								name: route.route_short_name
							},
							features: []
						};
						trips = TRIPS[routeId];
						stops = {};
						for (var k = 0; k < trips.length; k++) {
							tripId = trips[k].trip_id;
							_stopTimes = STOP_TIMES[tripId];

							for (j = 0; j < _stopTimes.length; j++) {
								stops[_stopTimes[j].stop_id] = STOPS[_stopTimes[j].stop_id];
							}
						}
						for (var property in stops) {
							stop = stops[property];
							GEOJSON.features.push({
								type:'Feature',
								properties:{
									id: stop.stop_id,
									name: stop.stop_name
								},
								geometry:{type:'Point',coordinates:[
									stop.stop_lon,stop.stop_lat
								]}
							});
						}
						fname = 'static/geojson/mobilite-tanstops-'+ route.route_short_name + '.geo.json';
						fs.writeFile(fname, JSON.stringify(GEOJSON));
						console.log('save as '+fname);
					}
				});
			});
		});
	});
};
tanStopsByLines();