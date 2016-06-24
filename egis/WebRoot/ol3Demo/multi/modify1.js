      // and default to jpeg format
      var format = 'image/png';
      //地图的显示边界
      var bounds = [487714.15625,5454708.5,495299.84375,5461727.0];

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
                      'version=1.1.0&typename=china:wfst_test&'+ 
                      'outputFormat=application%2Fjson';

                  $.ajax({
                      url: url
                  }).done(function(response) {
                	  //将返回的信息添加到vectorSource中
                      vectorSource.addFeatures(new ol.format.GeoJSON().readFeatures(response));
                  });
              }
      });
      
      //定义矢量图层
      var layerVector = new ol.layer.Vector({
        source: vectorSource,
        //图层可见性default为true
        visible:true,
        //填充样式
        /*style: new ol.style.Style({  
            fill: new ol.style.Fill({  
                color: 'rgba(255, 0, 0, 0.2)'  
            }),  
            stroke: new ol.style.Stroke({  
                color: '#ffcc33',  
                width: 2  
            }),  
            image: new ol.style.Circle({  
                radius: 7,  
                fill: new ol.style.Fill({  
                    color: '#ffcc33'  
                })  
            })  
        })*/  
      });
      
      //定义坐标
      var projection = new ol.proj.Projection({
          code: 'EPSG:26910',
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
            layers: [layerVector],
            //投影视图设置
            view: new ol.View({
  	           projection: projection
  	      	}),
        });
        map.getView().fit(bounds, map.getSize());
        
        /**********************将map加入Div中End**********************/ 
        
      //wfs-t
        var dirty = {};
        var formatWFS = new ol.format.WFS();
        var formatGML = new ol.format.GML({
                featureNS: 'http://localhost:9000/geoserver', //Required
                featurePrefix:'china', //Required
                featureType: 'wfst_test' //Required
                //srsName: 'EPSG:2415'
        	});
        
        var transactWFS = function(transType, f) {
        	switch(transType) {
        	case 'insert':
        		node = formatWFS.writeTransaction([f],null,null,formatGML);
        		break;
        	case 'update':
        		node = formatWFS.writeTransaction(null,[f],null,formatGML);
        		break;
        	case 'delete':
        		node = formatWFS.writeTransaction(null,null,[f],formatGML);
        		break;
        	}
        	s = new XMLSerializer();
        	str = s.serializeToString(node);
        	var wfsUrl = 'http://localhost:9000/geoserver/china/ows?SERVICE=WFS';
            var proxyUrl = wfsUrl;//GeoServer请求WFS服务时不能跨域，因此用一个代理转发,当前不存在跨域问题；   
        	$.ajax(proxyUrl,{
        		type: 'POST',
        		dataType: 'xml',
        		processData: false,
        		contentType: 'text/xml',
        		data: str
        		}).done();
        };
        
        
        
        
        var interaction;
        var select = new ol.interaction.Select({
        	style: new ol.style.Style({
        		stroke: new ol.style.Stroke({
        			color: '#FFB900',
        			width: 2
        		})
        	})
        });

        $('.btnMenu').on('click', function(event){
        	map.removeInteraction(interaction);
        	select.getFeatures().clear();
        	map.removeInteraction(select);
        	switch($(this).attr('id')){
	        	case 'btnSelect':
	        		interaction = new ol.interaction.Select({
	        			style: new ol.style.Style({
	        				stroke: new ol.style.Stroke({color: '#FFB900', width: 2}),
	        				fill: new ol.style.Fill({  
	                            color: '#FFE6AE'  
	                        })  
	        			})
	        		});
	        		map.addInteraction(interaction);
	        		interaction.getFeatures().on('add', function(e){
	        			
	        		});
	        		break;
	        		
	        	case 'btnEdit':
	        		map.addInteraction(select);
	        		interaction = new ol.interaction.Modify({
	        			features: select.getFeatures()
	        		});
	        		map.addInteraction(interaction);
	        		
	        		snap = new ol.interaction.Snap({
	        			features: select.getFeatures(),
	        			source: layerVector.getSource()
	        		});
	        		map.addInteraction(snap);
	        		
	        		dirty = {};
	        		select.getFeatures().on('add', function(e) {
	        			e.element.on('change', function(e) {
	        				dirty[e.target.getId()] = true;
	        				});
	        			});
	        		select.getFeatures().on('remove', function(e) {
	        			f = e.element;
	        			if (dirty[f.getId()]){
	        				delete dirty[f.getId()];
	        				featureProperties = f.getProperties();
	        			    delete featureProperties.boundedBy;
	        			    var clone = new ol.Feature(featureProperties);
	        			    clone.setId(f.getId());
	        			    transactWFS('update',clone);
	        				}
	        			});
	        		break;
	        		
	        	case 'btnDrawPoint':
	        		interaction = new ol.interaction.Draw({
	        		    type: 'Point',
	        		    source: layerVector.getSource()
	        		});
	        		map.addInteraction(interaction);
	        		interaction.on('drawend', function(e) {
	        			transactWFS('insert',e.feature);
	        	    });
	        		break;
	        		
	        	case 'btnDrawLine':
	        		interaction = new ol.interaction.Draw({
	        		    type: 'LineString',
	        		    source: layerVector.getSource()
	        		});
	        		map.addInteraction(interaction);
	        		interaction.on('drawend', function(e) {
	        			transactWFS('insert',e.feature);
	        	    });
	        		break;
	        		
	        	case 'btnDrawPoly':
	        		interaction = new ol.interaction.Draw({
	        		    type: 'MultiPolygon',
	        		    source: layerVector.getSource()
	        		});
	        		map.addInteraction(interaction);
	        		interaction.on('drawend', function(e) {
	        			transactWFS('insert',e.feature);
	        	    });
	        		break;
	        		
	        	case 'btnDelete':
	        		interaction = new ol.interaction.Select();
	        		map.addInteraction(interaction);
	        		interaction.getFeatures().on('change:length', function(e) {
	        			transactWFS('delete',e.target.item(0));
	        	        interaction.getFeatures().clear();
	        	        selectPointerMove.getFeatures().clear();
	        	    });
	        		break;
	
	        	default:
	        		break;
        	}
        	});

        $('#btnZoomIn').on('click', function() {
        	var view = map.getView();
        	var newResolution = view.constrainResolution(view.getResolution(), 1);
        	view.setResolution(newResolution);
        	});

        $('#btnZoomOut').on('click', function() {
        	var view = map.getView();
        	var newResolution = view.constrainResolution(view.getResolution(), -1);
        	view.setResolution(newResolution);
        	});
        
      
      /*******************编辑End***********************/

      
        
      
        
        
        
        
      /*******************新增Start***********************/
     
     
      /*******************新增End***********************/
     
        
        
        
        
        
        
        
        
        
        
        
      
