/*jshint strict:false */
/*jslint node: true */
'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');

var files = [
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00022/LOC_EQUIPUB_MOBILITE_NM_STBL/content/?format=json',
    file: 'mobilite.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00003/LOC_AIRES_COV_NM_STBL/content',
    file: 'mobilite-covoiturage.json'},
    {url : 'http://data.nantes.fr/fileadmin/data/datastore/nm/mobilite/24440040400129_NM_NM_00045/LISTE_TARIFS_BICLOO_MARGUERITE_NM_csv.zip',
    file: 'mobilite-tarifs-bicloo-marguerite.csv.zip'},
    {url : 'http://data.nantes.fr/fileadmin/data/datastore/cg44/mobilite/22440002800011_CG44_MOB_09001/lignes_kmz.zip',
    file: 'mobilite-lignes-lilas.kmz.zip'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00044/LISTE_SERVICES_PKGS_PUB_NM_STBL/content/?format=json',
    file: 'mobilite-parkings.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00039/LOC_PARCS_RELAIS_NM_STBL/content/?format=json',
    file: 'mobilite-parcs-relais.json'},
    {url : 'http://data.nantes.fr/api/publication/22440002800011_CG44_TOU_04820/restaurants_STBL/content/?format=json',
    file: 'culture-tourisme-restauration.json'},
    {url : 'http://data.nantes.fr/fileadmin/data/datastore/cg44/territoires/22440002800011_CG44_TER_08008/projet_aeroport_kmz.zip',
    file: 'territoire-nddl.kmz.zip'},
    {url : 'http://data.nantes.fr/api/publication/22440002800011_CG44_ENV_06001/Localisation_eolien_STBL/content/?format=json',
    file: 'environnement-eoliens.json'},
    {url : 'http://data.nantes.fr/fileadmin/data/datastore/cg44/economie/22440002800011_CG44_ECO_11001/BD_ZA_kmz.zip',
    file: 'economie-za.kmz.zip'},
    {url : 'http://data.nantes.fr/fileadmin/data/datastore/nm/economie/LOC_ZAE_NM/LOC_ZAE_NM_kmz.zip',
    file: 'economie-zae.kmz.zip'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00019/LOC_EQUIPUB_CULTURE_NM_STBL/content/?format=json',
    file: 'culture.json'},
    {url : 'http://data.nantes.fr/api/publication/22440002800011_CG44_CLT_03001/cinema_STBL/content/?format=json',
    file: 'culture-cinema.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00020/LOC_EQUIPUB_ENSEIGNEMENT_NM_STBL/content/?format=json',
    file: 'enseignement.json'},
    {url : 'http://data.nantes.fr/api/publication/22440002800011_CG44_TOU_04804/caves_STBL/content/?format=json',
    file: 'culture-tourisme-caves.json'},
    {url : 'http://data.nantes.fr/api/publication/23440003400026_J282/implantation_lieux_publics_table/content/?format=json',
    file: 'equipub-publics.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00018/LOC_EQUIPUB_CULTE_NM_STBL/content/?format=json',
    file: 'equipub-culte.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00026/LOC_EQUIPUB_VIE_SOCIALE_NM_STBL/content/?format=json',
    file: 'equipub-viesociale.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00017/LOC_EQUIPUB_ACTION_SOCIALE_NM_STBL/content/?format=json',
    file: 'equipub-actionsociale.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00024/LOC_EQUIPUB_SPORT_NM_STBL/content/?format=json',
    file: 'equipub-sportsloisirs.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00021/LOC_EQUIPUB_JUSTICE_SECURITE_NM_STBL/content/?format=json',
    file: 'equipub-justice-securite.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00023/LOC_EQUIPUB_SERVICE_PUBLIC_NM_STBL/content/?format=json',
    file: 'equipub-service-public.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00025/LOC_EQUIPUB_VIE_PRATIQUE_NM_STBL/content/?format=json',
    file: 'equipub-vie-pratique.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_VDN_00083/JARDINS_FAMILIAUX_VDN_STBL/content/?format=json',
    file: 'equipub-jardins-familiaux.json'},
    {url : 'http://data.nantes.fr/api/publication/LOC_PARCS_JARDINS_NANTES/LOC_PARCS_JARDINS_NANTES_STBL/content/?format=json',
    file: 'equipub-parcs-jardins.json'},
    {url : 'http://data.nantes.fr/api/publication/24440040400129_NM_NM_00085/DECHETERIES_ECOPOINTS_NM_STBL/content/?format=json',
    file: 'environnement-decheteries.json'},
    {url : 'http://data.nantes.fr/fileadmin/data/datastore/nm/mobilite/24440040400129_NM_TAN_00005/ARRETS_HORAIRES_CIRCUITS_TAN_gtfs.zip',
    file: 'ARRETS_HORAIRES_CIRCUITS_TAN_gtfs.zip'},
    {url: 'http://data.nantes.fr/api/publication/24440040400129_NM_VDN_00091/AIRES_DE_LIVRAISON_VDN_STBL/content/?format=json',
    file: 'mobilite-aireslivraison.json'}
];

var download = function(url, dest) {
    var target = path.join(__dirname, '..', 'downloads', 'opendata', dest);
    if (!fs.existsSync(target)){
        var file = fs.createWriteStream(target);
        http.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();
            });
        });
    }
};
for (var i = 0; i < files.length; i++) {
    var request = download(files[i].url, files[i].file);
}

