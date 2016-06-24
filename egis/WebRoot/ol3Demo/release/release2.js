
/*********************************创建地图*****************************************/
//地图渲染格式  
var format = 'image/png';
//地图的显示边界，在geoserver预览生成的链接中找到边界
var bounds = [-2602176.5, 2347015.25,2115408.5, 6405411.5];
//通过ajax加载geoJson格式的矢量图层数据源
var vectorSource = new ol.source.Vector({
	format: new ol.format.GeoJSON(),
	loader: function(extent, resolution, projection){
		//在geoserver平台预览中，选中GeoJSON格式，复制产生的链接,
		//注意maxFeatures的大小
		var url = 'http://localhost:9000/geoserver/china/wfs??' + 
			'service=WFS&request=GetFeature&' + 
			'version=1.1.0&typename=china:provience&' +  
			'maxFeatures=50&outputFormat=application%2Fjson';
		$.ajax({
			url: url
		}).done(function(response){
			//将返回的信息添加到vectorSource中
			vectorSource.addFeatures(new ol.format.GeoJSON().readFeatures(response));
		});
	}
});
      
//定义矢量图层
var provienceLayerVector = new ol.layer.Vector({
	source: vectorSource
});
      
//定义瓦片图层
var tiled = new ol.layer.Tile({
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
  
//定义地图
var map = new ol.Map({
	//指定地图放入位置,target的值为div的id值
	target: 'map',
	//指定地图中的图层
	layers:[provienceLayerVector,tiled],
	//投影视图设置
	view: new ol.View({
		projection: projection
	})
});
//地图自适应bounds
map.getView().fit(bounds, map.getSize());
      

/*********************************操作控件*****************************************/
//鼠标位置处的坐标
var mousePositionControl = new ol.control.MousePosition({
	coordinateFormat: ol.coordinate.createStringXY(5),
});
//鹰眼总览图控件
var overviewMapControl =  new ol.control.OverviewMap({
	collapsed: false
});
//全屏控件
var fullScreenControl =  new ol.control.FullScreen();
//添加控件
map.addControl(mousePositionControl);
map.addControl(overviewMapControl);
map.addControl(fullScreenControl);
map.addControl(new ol.control.ZoomSlider());
    

/*********************************定位动画Start*****************************************/
var point_div = document.createElement("div");
point_div.setAttribute("id", "css_animation");
var point_overlay = new ol.Overlay({
	element: point_div,
	positioning: 'center-center'
});
map.addOverlay(point_overlay);
point_overlay.setPosition([350000,4160000]);
/*********************************定位动画End*****************************************/

/*********************************工具栏Start*****************************************/
$("#toolBar input").each(function(){
	$(this).click(function(){
		$("#toolBar input").each(function(){
			$(this).removeClass("activeBtn");
		});
		$(this).removeClass("unactiveBtn");
		$(this).addClass("activeBtn");
		var lid = $(this).attr("id") + "BoxCpp";
		$(".cpp-tools").each(function(){
			if($(this).attr("id") == lid){
				$(this).css("display", "block");
			}else{
				$(this).css("display", "none");
			}
		});
	});
});
/*********************************工具栏End*****************************************/	

/*********************************地图编辑Start*****************************************/	
    //wfs-t
      /*var dirty = {};
      var formatWFS = new ol.format.WFS();
      var formatGML = new ol.format.GML({
      	 featureNS: 'http://localhost:9000/geoserver', //geoserver中工作组设置的命名空间，Required
           featurePrefix:'china', //Required
           featureType: 'provience', //Required
           //srsName: 'EPSG:26910'
      	});
      var transactWFS = function(p,f) {
      	switch(p) {
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
      	//alert(str);
      	$.ajax('http://localhost:9000/geoserver/china/wfs',{
      		type: 'POST',
      		dataType: 'xml',
      		processData: false,
      		contentType: 'text/xml',
      		data: str
      		}).done(); 
      };
      
      
      var popup = document.getElementById('popup');
      var overlayPopup = new ol.Overlay({
      	element: popup
      });

      
      var interaction;
      var select = new ol.interaction.Select({
      	style: new ol.style.Style({
      		stroke: new ol.style.Stroke({
      			color: '#FF2828'
      		})
      	})
      });*/

      /*$('.btnMenu').on('click', function(event){
    		$('.btnMenu').removeClass('orange');
    		$(this).addClass('orange');
    		map.removeInteraction(interaction);
    		select.getFeatures().clear();
    		map.removeInteraction(select);
    		switch($(this).attr('id')){
    		
    			case 'btnSelect':
    				interaction = new ol.interaction.Select({
    					style: new ol.style.Style({
    						stroke: new ol.style.Stroke({color: '#f50057', width: 2})
    						})
    				});
    				map.addInteraction(interaction);
    				interaction.getFeatures().on('add', function(e) {
    					props = e.element.getProperties();
    					if (props.status){$('#popup-status').html(props.status);}else{$('#popup-status').html('n/a');}
    					if (props.tiendas){$('#popup-tiendas').html(props.tiendas);}else{$('#popup-tiendas').html('n/a');}
    					//coord = $('.ol-mouse-position').html().split(',');
    					overlayPopup.setPosition(e);
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
    					source: provienceLayerVector.getSource()
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
    				    source: provienceLayerVector.getSource()
    				});
    				map.addInteraction(interaction);
    				interaction.on('drawend', function(e) {
    					transactWFS('insert',e.feature);
    			    });
    				break;
    				
    			case 'btnDrawLine':
    				interaction = new ol.interaction.Draw({
    				    type: 'LineString',
    				    source: provienceLayerVector.getSource()
    				});
    				map.addInteraction(interaction);
    				interaction.on('drawend', function(e) {
    					transactWFS('insert',e.feature);
    			    });
    				break;
    				
    			case 'btnDrawPoly':
    				interaction = new ol.interaction.Draw({
    				    type: 'MultiPolygon',
    				    source: provienceLayerVector.getSource()
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
    	});*/

/*********************************地图编辑End*****************************************/	

/******************交互矩形框选查询Start********************/
// a normal select interaction to handle click
var select = new ol.interaction.Select({
	style: new ol.style.Style({
		stroke: new ol.style.Stroke({color: '#FFB900',width: 1
		}),
		fill: new ol.style.Fill({
			color: '#E84850'
		})
	})
});
map.addInteraction(select);
var selectedFeatures = select.getFeatures();
  
// a DragBox interaction used to select features by drawing boxes
//定义矩形框
var dragBox = new ol.interaction.DragBox({
	//按下shift键
	condition: ol.events.condition.shiftKeyOnly,
	style: new ol.style.Style({
		stroke: new ol.style.Stroke({color: [255, 196, 85, 1]})
	})
});
  
map.addInteraction(dragBox);
//定义显示信息的DOM
var infoBox = document.getElementById('info');
  
/**清空选择集**/
// clear selection when drawing a new box and when clicking on the map
dragBox.on('boxstart', function(e){
	selectedFeatures.clear();
	infoBox.innerHTML = '&nbsp;';
});
map.on('click', function() {
	selectedFeatures.clear();
	infoBox.innerHTML = '&nbsp;';
});
  
//绑定矩形绘制完成事件
dragBox.on('boxend', function(e){
	// features that intersect the box are added to the collection of 
	//selected features, and their names are displayed in the "info" div
	//数组定义格式
	var info = [];
	//获取与矩形相交得到的要素集合
	var extent = dragBox.getGeometry().getExtent();
	//遍历与矩形相交的要素集合，将要素信息加入到info div中
	vectorSource.forEachFeatureIntersectingExtent(extent, function(feature){
		selectedFeatures.push(feature);
		info.push("名称：" + feature.get('name') + ";面积：" + feature.get('area'));
	}); 
	if (info.length > 0){
		infoBox.innerHTML = info.join('<br>');
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
selectClick.on('select', function(){
	var pointExtentFeature = selectClick.getFeatures().pop();
	// Update overlay label
	$('#coordinate').text("名称：" + pointExtentFeature.get('name') + 
			",面积 ：" + pointExtentFeature.get('area'));
	// Show overlay
	$(overlay.getElement()).show(); 
});
/******************点击查询End********************/
 
/******************条件查询Start********************/
function searchDetail(){
	$('#coordinate').text("");
	var provienceName = $("#searchContent").val();
	var targetFeature = null;
	//alert(provienceName);
	vectorSource.forEachFeature(function(feature){
			if(provienceName == feature.get('name')){
				targetFeature = feature;
				selectedFeatures.clear();
				selectedFeatures.push(feature);
			}
	  	},
	  	this
  );
  var info = [];
  info.push("名称：" + targetFeature.get('name') + ";拼音：" + targetFeature.get('nameen') + ";面积：" + targetFeature.get('area'));
  infoBox.innerHTML = "&nbsp;";
  infoBox.innerHTML = info.join('<br>');
};
/******************条件查询End********************/
      
      
      
      
      
      
      
      