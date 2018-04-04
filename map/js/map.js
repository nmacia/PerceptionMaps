
var mymap = L.map('dm4ym');

// Add title layer.
var mapNik = L.tileLayer.provider('OpenStreetMap.Mapnik');
var blackAndWhiteLayer = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');
var stamenTonerLayer = L.tileLayer.provider('Stamen.Toner');
var WImagEsriLayer = L.tileLayer.provider('Esri.WorldImagery');

//mymap.setView([42.567050, 1.599213], 17); // Andorra
mymap.setView([51.43555, 5.48055], 17); 
mymap.addLayer(stamenTonerLayer);

var baseMaps = {
  "Mapnik": mapNik,
  "BlackAndWhite": blackAndWhiteLayer,
  "StamenToner": stamenTonerLayer,
  "WImagEsriLayer": WImagEsriLayer
};

var happyIcon = L.icon({
  iconUrl: 'img/happy-f.png'
});

var sadIcon = L.icon({
  iconUrl: 'img/sad-f.png'
});

var angryIcon = L.icon({
  iconUrl: 'img/angry-f.png'
});

var categories = {},
category;

var overlays = {},
categoryName,
categoryArray;

var geocsvLayer;

jQuery.get('output.csv', function(csvContents) {
    geocsvLayer = L.geoCsv(csvContents, {
    latitudeTitle: 'GPSLatitude',
    longitudeTitle: 'GPSLongitude',
    firstLineTitles: false, 
    titles: ['SourceFile', 'GPSLatitude', 'GPSLongitude', 'Emotion', 'Date'],
    fieldSeparator: ',',
    pointToLayer: function (feature, latlng) {
      switch (feature.properties.emotion) {
        case 'happy': return L.marker(latlng, {icon: happyIcon});
        case 'sad': return L.marker(latlng, {icon: sadIcon});
        case 'angry': return L.marker(latlng, {icon: angryIcon});
      }
    },
    onEachFeature(feature, layer) {
      var classNameInfoWindow = feature.properties.emotion + "-bg";
      var customOptions = {
        'className' : classNameInfoWindow
      };
      layer.bindPopup(definePopup(feature), customOptions);
      category = feature.properties.emotion;
      if ( typeof categories[category] === "undefined" ) {
        categories[category] = [];
      }
      categories[category].push(layer);
    }   
  });
  
  mymap.addLayer(geocsvLayer);
  
});

var markers = L.markerClusterGroup({
  maxClusterRadius: 90,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: 20,
  elementsPlacementStrategy: "original-locations",
  polygonOptions: {
    color: '#2d84c8',
    weight: 4,
    opacity: 1,
    fillOpacity: 0.5
  },
  iconCreateFunction: function(cluster) {
    var count = cluster.getChildCount();
    var digits = (count+'').length;
    return new L.divIcon({
      html: count,
      className: 'cluster digits-'+digits,
      iconSize: null
    });
  }
});
  
// Add overlay controls. 
window.onload = function () { 
  
  for (categoryName in categories) {    
    categoryArray = categories[categoryName];
    //overlays[categoryName] = L.layerGroup(categoryArray);
    overlays[categoryName] = L.featureGroup.subGroup(markers, categoryArray);
    // Tick layers selected in the control.
    overlays[categoryName].addTo(mymap);
  }

  markers.addTo(mymap);
 
  L.control.layers(baseMaps, overlays).addTo(mymap);
    
}

function definePopup(feature) {
   
  var emotion = feature.properties.emotion;
  var sourceFile = feature.properties.sourcefile;
  sourceFile = sourceFile.replace(/\.\/uploads/g, "\.\./uploads");
  var date = (feature.properties.date != '' ? feature.properties.date : "--");
  
  var popupText = `
  <div class="containerinfo">
    <div class= "box-logoandemotion">
      <div class= "logo sqre">
        <img src="img/logodm4ym.png">
      </div>
      <div class= "emotion sqre">` +
  '     <img src="svg/'+ emotion + '.svg" /> ' +
  '     <p class="emotion-name">'+ emotion + '</p> '+
  `   </div>
    </div>
    <div class= "box-text">
      <!--get from table description --> ` +
  '   <p><b>date:</b> ' + date + '</p> ' +
  /*'        <p><b>description:</b>'+ ' ' + props.Notes +'</p> ' +*/
  ` </div>
    <div class= "box-img"> ` +
      "<img src='"+ sourceFile +"' />" +             
  ` </div>      
  </div>
  `;

  return popupText;
}



