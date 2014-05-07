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
var removeEntries = function(featureCollection){
    return featureCollection;
};
var addIcons = function(featureCollection){
    var newValues = [];
    var settingsIcons = settings.icons;
    var settingsIcon = settings.icon;
    var addIcon = function(entry){
        if (settingsIcons){
            var switchKey = _traverse(entry, settingsIcons['switch']);
            if (!switchKey){
                //console.log('icon : default');
                entry.properties.icon = settingsIcons.default;
            }else{
                //console.log('icon : find on switch');
                switchKey = switchKey.toLowerCase();
                for(var key in settingsIcons['case']){
                    //key === 'bicloo'                    
                    if (key === switchKey){
                    //console.log('icon : found ' + key);
                        entry.properties.icon = settingsIcons['case'][key];
                    }
                }
                if (!entry.properties.icon){
                    //console.log('default');
                    entry.properties.icon = settingsIcons['case'].default;
                }
            }
        }else if (settingsIcon){
            //console.log('set to the only icon');
            entry.properties.icon = settingsIcon;
        }
    };
    for (var i = 0; i < featureCollection.features.length; i++) {
        var entry = featureCollection.features[i];
        addIcon(entry);
        //console.log(entry.properties.icon);
        newValues.push(entry);

    }
    featureCollection.properties = newValues;
    return featureCollection;
};


var save = function(featureCollection){
    //console.log('save ' + featureCollection);
    var _handleError = function(err){
        if(err) {
            //console.log(err);
        }
    };
    var _save = function(filename, data){
        console.log('save '+filename);
        fs.writeFile(filename, JSON.stringify(data), _handleError);
    };
    _save(settings.output, featureCollection);
    //console.log('icons ' + settings.icons);
    var settingsIcons = settings.icons;
    if (!settingsIcons){
        return;
    }
    for(var key in settingsIcons['case']){
        var icon = settingsIcons['case'][key];
        var newFeatureCollection = _newFeatureCollection();
        newFeatureCollection.features = [];
        for (var i = 0; i < featureCollection.features.length; i++) {
            var feature = featureCollection.features[i];
            if (feature.properties.icon === icon){
                newFeatureCollection.features.push(feature);
            }
        }
        _save(settings.output.replace('.geo.json', '-' + icon + '.geo.json'),
            newFeatureCollection);
    }
};

if (settings.data){
    source = _traverse(source, settings.data);
}

var transformed = initGeoJSON(source);
transformed = removeEntries(transformed);
transformed = addIcons(transformed);
save(transformed);
