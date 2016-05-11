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
      
      //定义矢量图层
      var untiled = new ol.layer.Image({
        source: new ol.source.ImageWMS({
			ratio: 1,
			url: 'http://localhost:8989/geoserver/china/wms',
			params: {
				'FORMAT': format,
			    'VERSION': '1.1.1',  
			     STYLES: '',
			     LAYERS: 'china:provience',
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
	          untiled
          ],
          //投影视图设置
          view: new ol.View({
	           projection: projection
	      })
      });
      
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
      
      
     // var point_div1 = document.getElementById(css_animation);
      //var point_div1 = document.createElement("div");
      var point_div = document.createElement("div");
      point_div.setAttribute("id", "css_animation");
      var point_overlay = new ol.Overlay({
          element: point_div,
          positioning: 'center-center'
      });
      map.addOverlay(point_overlay);
      point_overlay.setPosition([350000,4160000]);



