/*jshint strict:false */
/*jslint node: true */
'use strict';

/*
   $ transform-geojson -f filter.json -o my.geo.json my.json
*/
var opt = require('optimist')
        .usage('Usage: $0 SETTINGS')
        .boolean('version').describe('version','display software version')
        .boolean('help').describe('help','print this help message'),
    argv = opt.argv,
    fs = require('fs');

var settings = require('../'+argv._[0]);
var source = require(settings.source);

var _traverse = function(obj, path){
    var succeed = true;
    if (typeof path !== 'object'){
        path = [path];
    }
    for (var j = 0; j < path.length; j++) {
        var splited = path[j].split('.');
        var traversed = obj;
        for (var i = 0; i < splited.length; i++) {
            if (traversed.hasOwnProperty(splited[i])){
                traversed = traversed[splited[i]];
                succeed = true;
            }else{
                succeed = false;
                break;
            }
        }
        if (succeed){
            if (traversed){
                return traversed;
            }
        }
    }
};
var _newFeatureCollection = function(){
    var featureCollection = {type: 'FeatureCollection'};
    featureCollection.features = [];
    return featureCollection;
};
var initGeoJSON = function(values){
    var featureCollection = _newFeatureCollection();
    //detect if it's already a geojson
    if (values[0].type && values[0].properties && values[0].geometry){
        featureCollection.features = values;
        return featureCollection;
    }
    for (var i = 0; i < values.length; i++) {
        var entry = values[i];
        var feature = {
            type: 'Feature',
            properties: entry,
            geometry: {
                type: 'Point',
                coordinates: [
                    eval('entry.' + settings.geometry.lat),
                    eval('entry.' + settings.geometry.lng)
                ]
            }
        };
        featureCollection.features.push(feature);
    }
    return featureCollection;
};
var addSplitOn = function(featureCollection){
    var newValues = [];
    var splitOn = settings.splitOn;
    var addSplitOnProperty = function(entry){
        if (splitOn){
            var switchKey = _traverse(entry, splitOn['switch']);
            if (!switchKey){
//                console.log('switchOn : default');
                entry.properties.splitOn = splitOn.default;
            }else{
                switchKey = switchKey.toLowerCase();
                for(var key in splitOn['case']){
                    //key === 'bicloo'
                    if (key === switchKey){
                    //console.log('icon : found ' + key);
                        entry.properties.splitOn = splitOn['case'][key];
                    }
                }
                if (!entry.properties.splitOn){
                    //console.log('default');
                    entry.properties.splitOn = splitOn['case'].default;
                }
            }
        }
    };
    for (var i = 0; i < featureCollection.features.length; i++) {
        var entry = featureCollection.features[i];
        addSplitOnProperty(entry);
        newValues.push(entry);
    }
    featureCollection.properties = newValues;
    return featureCollection;
};


var save = function(featureCollection){
    //console.log('save ' + featureCollection);
    var _handleError = function(err){
        if(err) {
            console.error(err);
        }
    };
    var _save = function(filename, data){
        console.log('save '+filename);
        fs.writeFile(filename, JSON.stringify(data), _handleError);
    };
    var splitOn = settings.splitOn;
    if (splitOn){
        var splitedFeatures = {};
        var splitedOn, feature;
        for (var i = 0; i < featureCollection.features.length; i++) {
            feature = featureCollection.features[i];
            splitedOn = feature.properties.splitOn;
            if (splitedOn){
                if (splitedFeatures[splitedOn] === undefined){
                    splitedFeatures[splitedOn] = _newFeatureCollection();
                }
                delete feature.properties.splitOn;
                splitedFeatures[splitedOn].features.push(feature);
            }
        }
        for (var property in splitedFeatures) {
            _save(
                settings.output.replace('.geo.json', '-' + property + '.geo.json'),
                splitedFeatures[property]
            );
        }
    }
    _save(settings.output, featureCollection);
};

if (settings.data){
    source = _traverse(source, settings.data);
}

var transformed = initGeoJSON(source);
transformed = addSplitOn(transformed);
save(transformed);
