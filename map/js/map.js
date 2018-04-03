
var mymap = L.map('dm4ym');

// Add title layer.
var mapNik = L.tileLayer.provider('OpenStreetMap.Mapnik');
var blackAndWhiteLayer = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');
var stamenTonerLayer = L.tileLayer.provider('Stamen.Toner');
var WImagEsriLayer = L.tileLayer.provider('Esri.WorldImagery');


mymap.setView([51.43555, 5.48055], 17); 
mymap.addLayer(stamenTonerLayer);

var baseMaps = {
  "Mapnik": mapNik,
  "BlackAndWhite": blackAndWhiteLayer,
  "StamenToner": stamenTonerLayer,
  "WImagEsriLayer": WImagEsriLayer
};

var happyIcon = L.icon({
  iconUrl: 'img/happy_f.png'
});

var sadIcon = L.icon({
  iconUrl: 'img/sad_f.png'
});

var angryIcon = L.icon({
  iconUrl: 'img/angry_f.png'
});

var categories = {},
category;

var overlays = {},
categoryName,
categoryArray;

var geojsonLayer = new L.GeoJSON.AJAX("test-eindhoven.geojson", {
  pointToLayer: function (feature, latlng) {
    switch (feature.properties.Emotion) {
      case 'happy': return L.marker(latlng, {icon: happyIcon});
      case 'sad': return L.marker(latlng, {icon: sadIcon});
      case 'angry': return L.marker(latlng, {icon: angryIcon});
    }
  },
  onEachFeature(feature, layer) {
    var classNameInfoWindow = emotionCategoryInfoWindowStyle(feature);
    var customOptions = {
      'className' : classNameInfoWindow
    };

    layer.bindPopup(definePopup(feature),customOptions);

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
    overlays[categoryName] = L.layerGroup(categoryArray);
  }

  overlays['happy'].addTo(mymap);
  overlays['sad'].addTo(mymap);
  overlays['angry'].addTo(mymap);

  L.control.layers(baseMaps, overlays).addTo(mymap);
});

 function definePopup(feature) {
   var props = feature.properties;
   var emotion = props.Emotion;
   var popupText = `
    <div class="containerinfo">
      <div class= "box-logoandemotion">
        <div class= "logo sqre">
          <img src="img/logodm4ym.png">
        </div>
        <div class= "emotion sqre">` +
'         <img src="svg/'+ emotion+ '.svg" /> ' +
'         <p class="emotion-name">'+emotion +'</p> '+
`       </div>
      </div>
      <div class= "box-text">
        <!--get from table description --> ` +
'        <p><b>date:</b> ' + props.Date + ' ' + props.Time + '</p> ' +
'        <p><b>description:</b>'+ ' ' + props.Notes +'</p> ' +
`     </div>
      <div class= "box-img"> ` +
        "<img src='"+ props.SourceFile +"' />" +             
`     </div>      
    </div>
`;
   return popupText;
}

function emotionCategoryInfoWindowStyle(feature) {
  return feature.properties.Emotion + "-bg";
}