
var mymap = L.map('dm4ym');

// Add title layer.
var stamenTonerLayer = L.tileLayer.provider('Stamen.Toner');
var WImagEsriLayer = L.tileLayer.provider('Esri.WorldImagery');

// Center map.
mymap.setView([42.567050, 1.599213], 17);

mymap.addLayer(WImagEsriLayer);

var baseMaps = {
  "StamenToner": stamenTonerLayer,
  "WImagEsriLayer": WImagEsriLayer
};

var happyIcon = L.icon({
  iconUrl: 'img/happy-f.png',
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

var markers = L.markerClusterGroup({
  maxClusterRadius: 90,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: 19,
  elementsPlacementStrategy: "original-locations",
  polygonOptions: {
    color: '#000000',
    weight: 2,
    opacity: 1,
    //dashArray: '10,5',
    lineJoin: 'miter',
    lineCap: 'butt',
    fillOpacity: 0.3
  },
  iconCreateFunction: function(cluster) {
    var count = cluster.getChildCount();
 
    // Change cluster color according to main emotion.
    var countByEmotion = [0, 0, 0];
    var classCluster = ['cluster-angry', 'cluster-happy', 'cluster-sad'];
    var e = cluster.getAllChildMarkers();
    
    e.forEach(function(m) { 
      switch (m.feature.properties.Emotion) {
        case 'angry': countByEmotion[0]++; break;    
        case 'happy': countByEmotion[1]++; break;
        case 'sad': countByEmotion[2]++; break;
      }
    });
   
    var colorCluster = countByEmotion.indexOf(Math.max.apply(null, countByEmotion));
    var digits = (count+'').length;
    return new L.divIcon({
      html: count,
      className: 'cluster digits-'+digits + ' ' + classCluster[colorCluster],
      iconSize: null
    });
  }
});

var geojsonLayer = new L.GeoJSON.AJAX("../data/2017-DM4YM.geojson", {
  pointToLayer: function (feature, latlng) {
    switch (feature.properties.Emotion) {
      case 'happy': return L.marker(latlng, {icon: happyIcon});
      case 'sad': return L.marker(latlng, {icon: sadIcon});
      case 'angry': return L.marker(latlng, {icon: angryIcon});
    }
  },
  onEachFeature(feature, layer) {
    var classNameInfoWindow = feature.properties.Emotion + "-bg";

    var customOptions = {
      'className' : classNameInfoWindow
    };

    layer.bindPopup(definePopup(feature), customOptions);

    category = feature.properties.Emotion;

    if (typeof categories[category] === "undefined") {
      categories[category] = [];
    }

    categories[category].push(layer);
  }
});

geojsonLayer.on('data:loaded', function() {
  for (categoryName in categories) {    
    categoryArray = categories[categoryName];
    //overlays[categoryName] = L.layerGroup(categoryArray);
    overlays[categoryName] = L.featureGroup.subGroup(markers, categoryArray);
    // Tick layers selected in the control.
    overlays[categoryName].addTo(mymap);
  }
  L.control.layers(baseMaps, overlays).addTo(mymap);

  markers.addLayer(geojsonLayer);
  //markers.addTo(mymap);
  mymap.addLayer(markers);  

  $( ".leaflet-control-layers-base" ).prepend( "<p class='title-layer'>Maps</p>" );
  $( ".leaflet-control-layers-overlays" ).prepend( "<p class='title-layer'>Emotions</p>" ); 

});

  
function definePopup(feature) {
  var props = feature.properties;

  var emotion = props.Emotion;
  var popupText = `
  <div class="containerinfo">
  <div class= "box-logo-and-emotion">
  <div class= "logo sqre">
  <img src="img/logodm4ym.png">
  </div>
  <div class= "emotion sqre">` +
  '            <img src="svg/'+ emotion+ '.svg"> ' +
  '            <p class="emotion-name">'+emotion +'</p> '+
  `        </div>
  </div>
  <div class= "box-text">
  <!--get from table description --> ` +
  '          <p><b>date:</b> ' + props.Date + ' ' + props.Time + '</p> ' +
  '          <p><b>description:</b>'+ ' ' + props.Notes +'</p> ' +
  `       </div>
  <div class= "box-img"> ` +
  "<img src='"+ props.SourceFile +"'"+
  ">"+"</img>" +
  `        </div>
  </div>
  `;

  return popupText;
}
