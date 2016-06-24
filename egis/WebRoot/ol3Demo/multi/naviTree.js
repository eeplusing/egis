var pureCoverage = false;
      // if this is just a coverage or a group of them, disable a few items,
      // and default to jpeg format
      var format = 'image/png';
      //地图的显示边界
      var bounds = [-2602176.5, 2347015.25,2115408.5, 6405411.5];
      if (pureCoverage) {
        document.getElementById('filterType').disabled = true;
        document.getElementById('filter').disabled = true;
        document.getElementById('antialiasSelector').disabled = true;
        document.getElementById('updateFilterButton').disabled = true;
        document.getElementById('resetFilterButton').disabled = true;
        document.getElementById('jpeg').selected = true;
        format = "image/jpeg";
      }

      //鼠标位置处的坐标
      var mousePositionControl = new ol.control.MousePosition({
        className: 'custom-mouse-position',
        target: document.getElementById('location'),
        coordinateFormat: ol.coordinate.createStringXY(5),
        undefinedHTML: '&nbsp;'
      });
      
      //定义矢量图层
      var untiled = new ol.layer.Image({
        source: new ol.source.ImageWMS({
			ratio: 1,
			url: 'http://localhost:9000/geoserver/china/wms',
			params: {
				'FORMAT': format,
			    'VERSION': '1.1.1',  
			     STYLES: '',
			     LAYERS: 'china:provience',
          }
        })
      });
      
      //定义瓦片图层
      var tiled = new ol.layer.Tile({
    	  visible: false,
    	  source: new ol.source.TileWMS({
    		  url: 'http://localhost:8989/geoserver/china/wms',
    		  params: {
    			  'FORMAT': format,
    			  'VERSION': '1.1.1',tiled: true,
    			   STYLES: '',
    			   LAYERS: 'china:riverlayer',
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
          //投影视图设置
          view: new ol.View({
	           projection: projection
	      })
      });
      
      //添加全屏控件
      map.addControl(new ol.control.FullScreen());
      
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
      
      //地图大小适应
      map.getView().fit(bounds, map.getSize());
      
      //map对象绑定单击事件
      map.on('singleclick', function(evt){
    	  document.getElementById('nodelist').innerHTML = "Loading... please wait...";
    	  var view = map.getView();
    	  var viewResolution = view.getResolution();
    	  var source = untiled.get('visible') ? untiled.getSource() : tiled.getSource();
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
        
        //定义地图上的右键
        $(map.getViewport()).on("contextmenu", function(event){
        	//默认的右键行为  
        	//e.preventDefault();
        	  // 书写事件触发后的函数
        	  var coordinate = map.getEventCoordinate(event);
        });
        
        
        /**********************导航树**********************/ 
        map.getLayerGroup().set('name', 'Root');
        
        /**
         * Build a tree layer from the map layers with visible and opacity 
         * options.
         * 
         * @param {type} layer
         * @returns {String}
         */
        function buildLayerTree(layer) {
            var elem;
            var name = layer.get('name') ? layer.get('name') : "Group";
            var div = "<li data-layerid='" + name + "'>" +
                    "<span><i class='glyphicon glyphicon-file'></i> " + layer.get('name') + "</span>" +
                    "<i class='glyphicon glyphicon-check'></i> " +
                    "<input style='width:80px;' class='opacity' type='text' value='' data-slider-min='0' data-slider-max='1' data-slider-step='0.1' data-slider-tooltip='hide'>";
            if (layer.getLayers) {
                var sublayersElem = ''; 
                var layers = layer.getLayers().getArray(),
                        len = layers.length;
                for (var i = len - 1; i >= 0; i--) {
                    sublayersElem += buildLayerTree(layers[i]);
                }
                elem = div + " <ul>" + sublayersElem + "</ul></li>";
            } else {
                elem = div + " </li>";
            }
            return elem;
        }

        /**
         * Initialize the tree from the map layers
         * @returns {undefined}
         */
        function initializeTree() {

            var elem = buildLayerTree(map.getLayerGroup());
            $('#layertree').empty().append(elem);

            $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
            $('.tree li.parent_li > span').on('click', function(e) {
                var children = $(this).parent('li.parent_li').find(' > ul > li');
                if (children.is(":visible")) {
                    children.hide('fast');
                    $(this).attr('title', 'Expand this branch').find(' > i').addClass('glyphicon-plus').removeClass('glyphicon-minus');
                } else {
                    children.show('fast');
                    $(this).attr('title', 'Collapse this branch').find(' > i').addClass('glyphicon-minus').removeClass('glyphicon-plus');
                }
                e.stopPropagation();
            });
        }
        
        /**
         * Finds recursively the layer with the specified key and value.
         * @param {ol.layer.Base} layer
         * @param {String} key
         * @param {any} value
         * @returns {ol.layer.Base}
         */
        function findBy(layer, key, value) {

            if (layer.get(key) === value) {
                return layer;
            }

            // Find recursively if it is a group
            if (layer.getLayers) {
                var layers = layer.getLayers().getArray(),
                        len = layers.length, result;
                for (var i = 0; i < len; i++) {
                    result = findBy(layers[i], key, value);
                    if (result) {
                        return result;
                    }
                }
            }

            return null;
        }
        
        $(document).ready(function() {
        	alert("初始化");
            initializeTree();

            // Handle opacity slider control
            $('input.opacity').on('slide', function(ev) {
                var layername = $(this).closest('li').data('layerid');
                var layer = findBy(map.getLayerGroup(), 'name', layername);

                layer.setOpacity(ev.value);
            });

            // Handle visibility control
            $('i').on('click', function() {
                var layername = $(this).closest('li').data('layerid');
                var layer = findBy(map.getLayerGroup(), 'name', layername);

                layer.setVisible(!layer.getVisible());

                if (layer.getVisible()) {
                    $(this).removeClass('glyphicon-unchecked').addClass('glyphicon-check');
                } else {
                    $(this).removeClass('glyphicon-check').addClass('glyphicon-unchecked');
                }
            });

        });