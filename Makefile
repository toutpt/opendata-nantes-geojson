default:
	mkdir -p downloads/opendata
	node scripts/opendata-download.js
	node scripts/transform-geojson.js scripts/opendata-transform-caves.json
	node scripts/transform-geojson.js scripts/opendata-transform-culture.json
	node scripts/transform-geojson.js scripts/opendata-transform-enseignement.json
	node scripts/transform-geojson.js scripts/opendata-transform-eolien.json
	node scripts/transform-geojson.js scripts/opendata-transform-environnement-decheteries.json
	node scripts/transform-geojson.js scripts/opendata-transform-mobilite.json
	node scripts/transform-geojson.js scripts/opendata-transform-mobilite-aireslivraison.json
	node scripts/transform-geojson.js scripts/opendata-transform-restauration.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-actionsociale.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-culte.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-jardins-familiaux.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-justicesecurite.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-parcs-jardins.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-publics.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-servicepublic.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-sportsloisirs.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-viepratique.json
	node scripts/transform-geojson.js scripts/opendata-transform-equipub-viesociale.json
	node scripts/opendata-transform-tan.js

clean:
	rm -fr downloads/* static/geojson/*
