var pureCoverage = false;
      // if this is just a coverage or a group of them, disable a few items,
      // and default to jpeg format
      var format = 'image/png';
      //地图的显示边界
      var bounds = [-2602176.5, 2347015.25,2115408.5, 6405411.5];

      //鼠标位置处的坐标
      var mousePositionControl = new ol.control.MousePosition({
        className: 'custom-mouse-position',
        target: document.getElementById('location'),
        coordinateFormat: ol.coordinate.createStringXY(5),
        undefinedHTML: '&nbsp;'
      });
      
      //通过ajax加载geoJson格式的矢量图层
      var vectorSource = new ol.source.Vector({
    		  format: new ol.format.GeoJSON(),
              loader: function(extent, resolution, projection) {
            	  //在geoserver平台预览中，选中GeoJSON格式，复制产生的链接
                  var url = 'http://localhost:9000/geoserver/china/wfs??'+
                      'service=WFS&request=GetFeature&'+
                      'version=1.1.0&typename=china:provience&'+ 
                      'maxFeatures=50&outputFormat=application%2Fjson';

                  $.ajax({
                      url: url
                  }).done(function(response) {
                	  //将返回的信息添加到vectorSource中
                      vectorSource.addFeatures(new ol.format.GeoJSON().readFeatures(response));
                  });
              }
      });
      
      //定义矢量图层
      var untiled = new ol.layer.Vector({
        source: vectorSource
        
      });
      
      //定义瓦片图层
      var tiled = new ol.layer.Tile({
    	  visible: true,
    	  source: new ol.source.TileWMS({
    		  url: 'http://localhost:8989/geoserver/china/wms',
    		  params: {
    			  'FORMAT': format,
    			  'VERSION': '1.1.0',
    			  'tiled': true,
    			  'STYLES': '',
 			      'LAYERS': 'china:provience',
    		  }
          })
      });
      
      //定义坐标
      var projection = new ol.proj.Projection({
          code: 'EPSG:2380',
          units: 'm',
          axisOrientation: 'neu'
      });
      
      //定义地图
      var map = new ol.Map({
    	  //添加控件
    	  controls: ol.control.defaults({
    		  attribution: false
          }).extend([mousePositionControl]),
          //指定地图放入位置,target的值为div的id值
          target: 'map',
          //指定地图中的图层
          layers: [
	          untiled,
	          tiled
          ],
         // renderer: 'canvas',
          //投影视图设置
          view: new ol.View({
	           projection: projection
	      })
      });
      
      
      
      // a normal select interaction to handle click
      var select = new ol.interaction.Select();
      map.addInteraction(select);
      var selectedFeatures = select.getFeatures();

      // a DragBox interaction used to select features by drawing boxes
      var dragBox = new ol.interaction.DragBox({
    	  //按下shift键
    	  condition: ol.events.condition.shiftKeyOnly,
    	  style: new ol.style.Style({ 
    		  stroke: new ol.style.Stroke({
    			  color: [255, 196, 85, 1]
    		  })
    	  })
      });
      map.addInteraction(dragBox);

      var infoBox = document.getElementById('info');

      dragBox.on('boxend', function(e) {
        // features that intersect the box are added to the collection of
        // selected features, and their names are displayed in the "info"
        // div
        var info = [];
        var extent = dragBox.getGeometry().getExtent();
        vectorSource.forEachFeatureIntersectingExtent(extent, function(feature) {
          selectedFeatures.push(feature);
          info.push("名称：" + feature.get('name') + ";面积：" + feature.get('dzm') + "<br>");
        }); 
        if (info.length > 0) {
          infoBox.innerHTML = info.join(', ');
        }
      });

      // clear selection when drawing a new box and when clicking on the map
      dragBox.on('boxstart', function(e) {
        selectedFeatures.clear();
        infoBox.innerHTML = '&nbsp;';
      });
      map.on('click', function() {
        selectedFeatures.clear();
        infoBox.innerHTML = '&nbsp;';
      });
      
      //为map绑定事件响应方法
      map.getView().on('change:resolution', function(evt){
    	  var resolution = evt.target.get('resolution');
    	  var units = map.getView().getProjection().getUnits();
    	  var dpi = 25.4 / 0.28;
    	  var mpu = ol.proj.METERS_PER_UNIT[units];
    	  var scale = resolution * mpu * 39.37 * dpi;
    	  if (scale >= 9500 && scale <= 950000) {
    		  scale = Math.round(scale / 1000) + "K";
    	  } else if (scale >= 950000) {
    		  scale = Math.round(scale / 1000000) + "M";
    	  } else {
    		  scale = Math.round(scale);
          }
    	  document.getElementById('scale').innerHTML = "Scale = 1 : " + scale;
      });
      
      map.getView().fit(bounds, map.getSize());
      
      //map对象绑定单击事件
      map.on('singleclick', function(evt){
    	  document.getElementById('nodelist').innerHTML = "Loading... please wait...";
    	  var view = map.getView();
    	  var viewResolution = view.getResolution();
    	  var source = tiled.getSource();
    	  var url = source.getGetFeatureInfoUrl(
    			  evt.coordinate, viewResolution, view.getProjection(),
    			  {'INFO_FORMAT': 'text/html', 'FEATURE_COUNT': 50}
    	  );
    	  if (url){
    		  document.getElementById('nodelist').innerHTML = 
    			  '<iframe seamless src="' + url + '"></iframe>';
    	  }
      });

      // 选择 WMS version
      function setWMSVersion(wmsVersion){
    	  map.getLayers().forEach(function(lyr) {
    		  lyr.getSource().updateParams({'VERSION': wmsVersion});
        });
      }

      // Tiling mode, can be 'tiled' or 'untiled'
      function setTileMode(tilingMode){
    	  if(tilingMode == 'tiled'){
    		  untiled.set('visible', false);
    		  tiled.set('visible', true);
    	   } else {
    		   tiled.set('visible', false);
    		   untiled.set('visible', true);
    	   }
      }

      function setAntialiasMode(mode){
    	  map.getLayers().forEach(function(lyr){
    		  lyr.getSource().updateParams({'FORMAT_OPTIONS': 'antialias:' + mode});
          });
      }

      // changes the current tile format
      function setImageFormat(mime){
    	  map.getLayers().forEach(function(lyr){
    		  lyr.getSource().updateParams({'FORMAT': mime});
          });
      }

      function setStyle(style){
    	  map.getLayers().forEach(function(lyr){
    		  lyr.getSource().updateParams({'STYLES': style});
          });
      }

      function setWidth(size){
    	  var mapDiv = document.getElementById('map');
    	  var wrapper = document.getElementById('wrapper');
    	  
    	  if (size == "auto") {
    		  // reset back to the default value
    		  mapDiv.style.width = null;
    		  wrapper.style.width = null;
          }
    	  else{
    		  mapDiv.style.width = size + "px";
	          wrapper.style.width = size + "px";
	      }
    	  // notify OL that we changed the size of the map div
    	  map.updateSize();
      }

      function setHeight(size){
    	  var mapDiv = document.getElementById('map');
    	  if (size == "auto") {
    		  // reset back to the default value
    		  mapDiv.style.height = null;
    	  }else{
    		  mapDiv.style.height = size + "px";
    	  }
    	  // notify OL that we changed the size of the map div
    	  map.updateSize();
      }

      function updateFilter(){
    	  if(pureCoverage){
    		  return;
    	  }
    	  var filterType = document.getElementById('filterType').value;
    	  var filter = document.getElementById('filter').value;
    	  // by default, reset all filters
    	  var filterParams = {
    			  'FILTER': null,
    			  'CQL_FILTER': null,
    			  'FEATUREID': null
          };
    	  if(filter.replace(/^\s\s*/, '').replace(/\s\s*$/, '') != ""){
    		  if (filterType == "cql"){
    			  filterParams["CQL_FILTER"] = filter;
    		  }
    		  if (filterType == "ogc"){
    			  filterParams["FILTER"] = filter;
    		  }
    		  if (filterType == "fid"){
    			  filterParams["FEATUREID"] = filter;
    		  }
           }
    	   // merge the new filter definitions
    	   map.getLayers().forEach(function(lyr){
    		   lyr.getSource().updateParams(filterParams);
    	   });
        }

        function resetFilter(){
        	if (pureCoverage){
        		return;
        	}
        	document.getElementById('filter').value = "";
        	updateFilter();
        }

        //隐藏/显示控制面板
        function toggleControlPanel(){
        	var toolbar = document.getElementById("toolbar"); 
        	if (toolbar.style.display == "none"){
        		toolbar.style.display = "block";
            }else{
            	toolbar.style.display = "none";
            }
        	map.updateSize();
        }
        
        var point_div = document.createElement("div");
        point_div.setAttribute("id", "css_animation");
        var point_overlay = new ol.Overlay({
            element: point_div,
            positioning: 'center-center'
        });
        map.addOverlay(point_overlay);
        point_overlay.setPosition([350000,4160000]);

