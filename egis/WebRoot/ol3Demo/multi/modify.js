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
        source: vectorSource,
        //图层可见性default为true
        visible:true
      });
      
      //定义瓦片图层
      var tiledProvienceLayer = new ol.layer.Tile({
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
      //定义瓦片图层
      var tiledLakeLayer = new ol.layer.Tile({
    	  visible: true,
    	  source: new ol.source.TileWMS({
    		  url: 'http://localhost:8989/geoserver/china/wms',
    		  params: {
    			  'FORMAT': format,
    			  'VERSION': '1.1.0',
    			  'tiled': true,
    			  'STYLES': '',
    			  'LAYERS': 'china:lakelayer',
    		  }
    	  })
      });
      //定义瓦片图层
      var tiledRiverLayer = new ol.layer.Tile({
    	  visible: true,
    	  source: new ol.source.TileWMS({
    		  url: 'http://localhost:8989/geoserver/china/wms',
    		  params: {
    			  'FORMAT': format,
    			  'VERSION': '1.1.0',
    			  'tiled': true,
    			  'STYLES': '',
    			  'LAYERS': 'china:riverlayer',
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
        		
        	//交互中加入旋转复位交互控件,使用方法：shift + 左键drag
        	interactions: ol.interaction.defaults().extend([
        	    new ol.interaction.DragRotateAndZoom()]),
        	    
            //指定地图放入位置,target的值为div的id值
            target: 'map',
            
            //指定地图中的图层,注意：图层的添加顺序对显示有影响
            layers: [
              tiledProvienceLayer,
              //tiledRiverLayer,
              tiledLakeLayer,
  	          untiled
            ],
            //投影视图设置
            view: new ol.View({
  	           projection: projection
  	      })
        });
        map.getView().fit(bounds, map.getSize());
      /**********************将map加入Div中End**********************/ 
      
  
        
        /**
         * 在地图上为singleclick事件注册监听
         */
        //将鼠标点击位置设为当前视图中心
        map.on('singleclick', function(event) {
            var animation = ol.animation.pan({
            	source:map.getView().getCenter(),
            	easing:ol.easing.inAndOut
            });
            //在渲染中加入动画
            map.beforeRender(animation);
            //将鼠标点击位置设为当前视图中心
            map.getView().setCenter(event.coordinate);
        });
        
      
      /*******************编辑Start***********************/
      /**样式选择集**/
      var styleFunction = (function() {
          var styles = {};
          var image = new ol.style.Circle({
            radius: 5,
            fill: null,
            stroke: new ol.style.Stroke({color: 'orange', width: 2})
          });
          styles['Point'] = new ol.style.Style({image: image});
          styles['Polygon'] = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'blue',
              width: 3
            }),
            fill: new ol.style.Fill({
              color: 'rgba(0, 0, 255, 0.1)'
            })
          });
          styles['MultiLinestring'] = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'green',
              width: 3
            })
          });
          styles['MultiPolygon'] = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'yellow',
              width: 1
            }),
            fill: new ol.style.Fill({
              color: 'rgba(255, 255, 0, 0.1)'
            })
          });
          styles['default'] = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'red',
              width: 3
            }),
            fill: new ol.style.Fill({
              color: 'rgba(255, 0, 0, 0.1)'
            }),
            image: image
          });
          return function(feature) {
            return styles[feature.getGeometry().getType()] || styles['default'];
          };
        })();
      
      
      /**悬浮层样式**/
      var overlayStyle = (function() {
        var styles = {};
        styles['Polygon'] = [
          new ol.style.Style({
            fill: new ol.style.Fill({
              color: [255, 255, 255, 0.5]
            })
          }),
          new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: [255, 255, 255, 1],
              width: 5
            })
          }),
          new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: [0, 153, 255, 1],
              width: 3
            })
          })
        ];
        styles['MultiPolygon'] = styles['Polygon'];

        styles['LineString'] = [
          new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: [255, 255, 255, 1],
              width: 5
            })
          }),
          new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: [0, 153, 255, 1],
              width: 3
            })
          })
        ];
        styles['MultiLineString'] = styles['LineString'];

        styles['Point'] = [
          new ol.style.Style({
            image: new ol.style.Circle({
              radius: 7,
              fill: new ol.style.Fill({
                color: [0, 153, 255, 1]
              }),
              stroke: new ol.style.Stroke({
                color: [255, 255, 255, 0.75],
                width: 1.5
              })
            }),
            zIndex: 100000
          })
        ];
        styles['MultiPoint'] = styles['Point'];

        styles['GeometryCollection'] = styles['Polygon'].concat(styles['Point']);

        return function(feature) {
          return styles[feature.getGeometry().getType()];
        };
      })();
      
      
      /**定义编辑的画布Strat**/  
      var features = new ol.Collection();
      var featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector({features: features}),
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
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
        })
      });
      featureOverlay.setMap(map);
      /**定义编辑的画布End**/ 
      
      
      //声明交互
      var selectModify = new ol.interaction.Select({
          style: overlayStyle
        });

      //选择的要素
      var modify = new ol.interaction.Modify({
          features: selectModify.getFeatures(),
          style: overlayStyle
      });
      //交互
      
  	  
      /*******************编辑End***********************/
        
        
        
      

        
      
        
        
        
        
        
        
        
        
        
        
        
      
