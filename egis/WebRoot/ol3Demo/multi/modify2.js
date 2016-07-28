var controlMousePos = new ol.control.MousePosition({
		coordinateFormat: ol.coordinate.createStringXY(4),
	});

var popup = document.getElementById('popup');
var overlayPopup = new ol.Overlay({
	element: popup
});

$('#popup-closer').on('click', function() {
	overlayPopup.setPosition(undefined);
});

var format = 'image/png';
//地图的显示边界
var bounds = [487714.15625,5454708.5,495299.84375,5461727.0];

var sourceVector = new ol.source.Vector({
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
        	sourceVector.addFeatures(new ol.format.GeoJSON().readFeatures(response));
        });
    }
});

var layerVector = new ol.layer.Vector({
		source: sourceVector
	});

//hover highlight
var selectPointerMove = new ol.interaction.Select({
		condition: ol.events.condition.pointerMove,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#FFB900',
				width: 1
			}),
			fill: new ol.style.Fill({  
                color: '#E84850'  
            })  
		})
	});

//定义坐标
var projection = new ol.proj.Projection({
	    code: 'EPSG:26910',
	    units: 'm',
	    axisOrientation: 'neu'
	});


var map = new ol.Map({
	target: 'map',
	overlays: [overlayPopup],
	controls: [controlMousePos],
	layers: [layerVector],
	view: new ol.View({
          projection: projection
     	})
	});

map.getView().fit(bounds, map.getSize());

map.addInteraction(selectPointerMove);

//function getCenterOfExtent(extent){
//	x = extent[0] + (extent[2] - extent[0]) / 2;
//	y = extent[1] + (extent[3] - extent[1]) / 2;
//	return [x, y];
//	}

var interaction;
var select = new ol.interaction.Select({
	style: new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#FF2828'
		})
	})
});

//wfs-t
var dirty = {};
var formatWFS = new ol.format.WFS();
var formatGML = new ol.format.GML({
	 featureNS: 'http://www.eplusing.com/china', //geoserver中工作区设置的命名空间，Required
     featurePrefix:'china', //Required
     featureType: 'wfst_test', //Required
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
	str = s.serializeToString(node);//对xml文件进行处理
	alert(str);
	//out(str);
	
	//$.ajax('http://localhost:9000/geoserver/china/wfs',{
	$.ajax('http://localhost:9000/geoserver/china/wfs',{
		type: 'POST',
		dataType: 'xml',
		processData: false,
		contentType: 'text/xml',
		data: str
		}).done(); 
};

$('.btn-floating').hover(
		function() {
			$(this).addClass('darken-2');},
		function() {
			$(this).removeClass('darken-2');}
);

$('.btnMenu').on('click', function(event) {
	$('.btnMenu').removeClass('orange');
	$(this).addClass('orange');
	map.removeInteraction(interaction);
	select.getFeatures().clear();
	map.removeInteraction(select);
	switch($(this).attr('id')) {
	
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
				coord = $('.ol-mouse-position').html().split(',');
				overlayPopup.setPosition(coord);
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
			interaction.on('drawend', function(e){
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