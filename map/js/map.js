
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

jQuery.get('output.csv', function(csvContents) {
  var geocsvLayer = L.geoCsv(csvContents, {
    latitudeTitle: 'GPSLatitude',
    longitudeTitle: 'GPSLongitude',
    firstLineTitles: false, 
    titles: ['SourceFile', 'GPSLatitude', 'GPSLongitude', 'Emotion'],
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
      layer.bindPopup(definePopup(feature),customOptions);
      category = feature.properties.emotion;
      if (typeof categories[category] === "undefined") {
        categories[category] = [];
      }
      categories[category].push(layer);
    }   
  });
  
  mymap.addLayer(geocsvLayer);
});

// TODO: Remove overlays if not necessary
/*geojsonLayer.on('data:loaded', function() {
  for (categoryName in categories) {
    categoryArray = categories[categoryName];
    overlays[categoryName] = L.layerGroup(categoryArray);
  }

  overlays['happy'].addTo(mymap);
  overlays['sad'].addTo(mymap);
  overlays['angry'].addTo(mymap);

  L.control.layers(baseMaps, overlays).addTo(mymap);
});
*/

function definePopup(feature) {
   
  var emotion = feature.properties.emotion;
  var sourceFile = feature.properties.sourcefile;
  
  var popupText = `
  <div class="containerinfo">
    <div class= "box-logoandemotion">
      <div class= "logo sqre">
        <img src="img/logodm4ym.png">
      </div>
      <div class= "emotion sqre">` +
  '         <img src="svg/'+ emotion + '.svg" /> ' +
  '         <p class="emotion-name">'+ emotion + '</p> '+
  `       </div>
    </div>
    <div class= "box-text">
      <!--get from table description --> ` +
  /*'        <!p><b>date:</b> ' + props.Date + ' ' + props.Time + '</p> ' +*/
  /*'        <p><b>description:</b>'+ ' ' + props.Notes +'</p> ' +*/
  `     </div>
    <div class= "box-img"> ` +
      "<img src='"+ sourceFile +"' />" +             
  `     </div>      
  </div>
  `;

  return popupText;
}
