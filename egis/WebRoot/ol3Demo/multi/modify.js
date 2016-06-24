	  var pureCoverage = false;
      // if this is just a coverage or a group of them, disable a few items,
      // and default to jpeg format
      var format = 'image/png';
      //地图的显示边界
      var bounds = [-2602176.5, 2347015.25,2115408.5, 6405411.5];

      //显示鼠标位置处坐标的控件
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
                  var url = 'http://localhost:9000/geoserver/china/wfs?'+
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
      
    //通过ajax加载geoJson格式的矢量图层数据源
      var lakeSource = new ol.source.Vector({
    		  format: new ol.format.GeoJSON(),
              loader: function(extent, resolution, projection) {
            	  //在geoserver平台预览中，选中GeoJSON格式，复制产生的链接
                  var url = 'http://localhost:9000/geoserver/china/wfs?'+
                      'service=WFS&request=GetFeature&'+
                      'version=1.1.0&typename=china:lakelayer&'+ 
                      'outputFormat=application%2Fjson';

                  $.ajax({
                      url: url
                  }).done(function(response){
                	  //将返回的信息添加到vectorSource中
                	  lakeSource.addFeatures(new ol.format.GeoJSON().readFeatures(response));
                  });
              }
      });
      
      //定义矢量图层
      var untiledLake = new ol.layer.Vector({
        source: lakeSource,
        //图层可见性default为true
        visible:true
      });
      
      //定义矢量图层
      var untiledProvience = new ol.layer.Vector({
        source: vectorSource,
        //图层可见性default为true
        visible:true
      });
      
      //定义瓦片图层
      var tiledProvienceLayer = new ol.layer.Tile({
    	  visible: true,
    	  source: new ol.source.TileWMS({
    		  url: 'http://localhost:9000/geoserver/china/wms',
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
      
      
      /**********************将map加入Div中Start**********************/  
      //定义地图
        var map = new ol.Map({
        	//添加控件,此处添加了全屏及显示鼠标位置控件，其中显示鼠标当前位置控件是自定义的。
        	controls: ol.control.defaults({
        		attribution: false
        		}).extend([new ol.control.FullScreen(), mousePositionControl]),
        	    
            //指定地图放入位置,target的值为div的id值
            target: 'map',
            
            //指定地图中的图层,注意：图层的添加顺序对显示有影响
            layers: [
              tiledProvienceLayer,
  	          untiledProvience,
  	          untiledLake
            ],
            //投影视图设置
            view: new ol.View({
  	           projection: projection
  	      	}),
        });
        map.getView().fit(bounds, map.getSize());
        
        //鹰眼总览图
        map.addControl( new ol.control.OverviewMap({
            collapsed: false
        }));
        /**********************将map加入Div中End**********************/ 
        
        
        /*******************编辑End***********************/
  	  
        
        
        
        //定义选择要素的交互
        var selectModify = new ol.interaction.Select({
        	//响应双击事件
        	condition:ol.events.condition.doubleClick,
            wrapX: false
        });
        //定义修改交互
        var modify = new ol.interaction.Modify({
        	//获取要修改的要素
        	features: selectModify.getFeatures()
        });
        map.addInteraction(selectModify);
        map.addInteraction(modify);
        
        
        
        
      /*******************编辑End***********************/
        
        
        
      

        
      
        
        
        
        
        
        
        
        
        
        
        
      
