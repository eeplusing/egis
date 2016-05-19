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
      
    //通过ajax加载geoJson格式的矢量图层数据源
      var vectorSource = new ol.source.Vector({
    		  format: new ol.format.GeoJSON(),
              loader: function(extent, resolution, projection) {
            	  //在geoserver平台预览中，选中GeoJSON格式，复制产生的链接
                  var url = 'http://localhost:8989/geoserver/china/wfs??'+
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
      map.getView().fit(bounds, map.getSize());
      //添加鹰眼总览图控件
      map.addControl( new ol.control.OverviewMap({
          collapsed: false
      }));
      //添加全屏控件
      map.addControl(new ol.control.FullScreen());
      
      //map对象绑定单击事件
      map.on('singleclick', function(evt){
    	  //单击地图时将鼠标点击文职设为视图中心Start
    	  var animation = ol.animation.pan({
          	source:map.getView().getCenter(),
          	easing:ol.easing.inAndOut
          });
          //在渲染中加入动画
          map.beforeRender(animation);
          //将鼠标点击位置设为当前视图中心
          map.getView().setCenter(evt.coordinate);
          //单击地图时将鼠标点击文职设为视图中心End
          
          
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
      
      
      var point_div = document.createElement("div");
      point_div.setAttribute("id", "css_animation");
      var point_overlay = new ol.Overlay({
          element: point_div,
          positioning: 'center-center'
      });
      map.addOverlay(point_overlay);
      point_overlay.setPosition([350000,4160000]);

      
      
      
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
      
      

      /******************交互矩形框选查询Start********************/
      // a normal select interaction to handle click
      var select = new ol.interaction.Select();
      map.addInteraction(select);
      var selectedFeatures = select.getFeatures();
      
      // a DragBox interaction used to select features by drawing boxes
      //定义矩形框
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
      //定义显示信息的DOM
      var infoBox = document.getElementById('info');
      
      /**清空选择集**/
      // clear selection when drawing a new box and when clicking on the map
      dragBox.on('boxstart', function(e) {
        selectedFeatures.clear();
        infoBox.innerHTML = '&nbsp;';
      });
      map.on('click', function() {
        selectedFeatures.clear();
        infoBox.innerHTML = '&nbsp;';
      });
      
      //绑定矩形绘制完成事件
      dragBox.on('boxend', function(e) {
        // features that intersect the box are added to the collection of
        // selected features, and their names are displayed in the "info" div
    	//数组定义格式
        var info = [];
        //获取与矩形相交得到的要素集合
        var extent = dragBox.getGeometry().getExtent();
        //遍历与矩形相交的要素集合，将要素信息加入到info div中
        vectorSource.forEachFeatureIntersectingExtent(extent, function(feature) {
          selectedFeatures.push(feature);
          info.push("名称：" + feature.get('name') + ";面积：" + feature.get('dzm') + "<br>");
        }); 
        if (info.length > 0) {
          infoBox.innerHTML = info.join(', ');
        }
      });
      /******************交互框选查询End********************/

      
      /******************点击查询Start********************/
    //定义叠加层 Overlay
      var overlay = new ol.Overlay({
          element: $('<div id="myOverlay" class="overlay"><span id="coordinate" class="label label-primary">0, 0</span></div> '),
          positioning: 'top-right',
          stopEvent: true,
          insertFirst: false
      });
      map.addOverlay(overlay);
      
    //前面以为map绑定过click事件,这里又再次绑定，说明可以绑定多个方法
      map.on('click', function(event){
    	  $('#coordinate').text("");
          var coordinate = event.coordinate;
          //Set position
          overlay.setPosition(coordinate);
       });
      
      var selectClick = new ol.interaction.Select({
    	  condition: ol.events.condition.click
      });
      map.addInteraction(selectClick);
      selectClick.on('select', function() {
    	  var pointExtentFeatures = selectClick.getFeatures().pop();
    	  // Update overlay label
          $('#coordinate').text("要素信息@名称：" + pointExtentFeatures.get('name') + 
        		  ",面积 ：" + pointExtentFeatures.get('dzm'));
          // Show overlay
          $(overlay.getElement()).show(); 
      });
      /******************点击查询End********************/
      
