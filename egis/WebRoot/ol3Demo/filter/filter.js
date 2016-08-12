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
$('#btnIntersectTest').on('click', function() {
	/**
	 * 以多边形是否相交查询
	 * */
	/*var requestData = 
		"<wfs:GetFeature service='WFS' version='1.1.0' " + 
		"xmlns:hanzhong='http://www.eplusing.com/hanzhong' " +
		"xmlns:wfs='http://www.opengis.net/wfs' " + 
		"xmlns='http://www.opengis.net/ogc' " + 
		"xmlns:gml='http://www.opengis.net/gml' " + 
		"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " + 
		"xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-basic.xsd' " + 
		"outputFormat='application/json'> " + 
		"<wfs:Query typeName='hanzhong:djq'> " + 
		"<wfs:PropertyName>hanzhong:djqmc</wfs:PropertyName> " + 
		"<Filter> " + 
			"<Intersects> " + 
				"<PropertyName>geometry</PropertyName> " +
				"<gml:Polygon srsName='http://www.opengis.net/gml/srs/epsg.xml#2360'> " +
					"<gml:exterior> " +
				     	"<gml:LinearRing> " +
				     		"<gml:posList>402314.93545 3684110.69228 406476.09007 3682430.96014 403345.68017 3685523.19431 402314.93545 3684110.69228</gml:posList> " +
				        "</gml:LinearRing> " +
				    "</gml:exterior> " +
			    "</gml:Polygon> " +
			"</Intersects> " +
		"</Filter> " +
		"</wfs:Query>" + 
		"</wfs:GetFeature>";*/
	var requestData = 
		"<wfs:GetFeature service='WFS' version='1.1.0' " + 
		"xmlns:hanzhong='http://www.eplusing.com/hanzhong' " +
		"xmlns:wfs='http://www.opengis.net/wfs' " + 
		"xmlns='http://www.opengis.net/ogc' " + 
		"xmlns:gml='http://www.opengis.net/gml' " + 
		"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " + 
		"xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-basic.xsd' " + 
		"outputFormat='application/json'> " + 
		"<wfs:Query typeName='hanzhong:djq'> " + 
			"<wfs:PropertyName>hanzhong:djqmc</wfs:PropertyName> " + 
			"<Filter> " + 
				"<Intersects> " +
					"<PropertyName>geometry</PropertyName> " +
					"<gml:Point srsName='http://www.opengis.net/gml/srs/epsg.xml#2360'> " +
						"<gml:coordinates>414373.61072,3673259.92710</gml:coordinates> " +
					"</gml:Point> " + 
				"</Intersects> " +
			"</Filter> " +
		"</wfs:Query>" + 
		"</wfs:GetFeature>";
	$.ajax({ 
			url:'http://localhost:9000/geoserver/wfs',
			type: 'POST',
			contentType: 'text/xml',
			dataType: 'json',
			processData: false,
			data: requestData,
			error: function(data){ //失败 
				alert('Error loading document'); 
				alert(data);
			}, 
			success: function(msg){ //成功 
				console.log(msg);
				console.log(msg.features[0].properties.fid);
				//JSON.parse(jsonstr); //可以将json字符串转换成json对象 
				//JSON.stringify(jsonobj); //可以将json对象转换成json对符串 
				//alert( "return message: " + JSON.stringify(msg) ); 
				//console.log( "return message: " + JSON.stringify(msg) );
				console.log(JSON.stringify(msg));
			} 
	}); 
});


$('#btnQueryByIDTest').on('click', function() {
	/**
	 * 以属性条件查询
	 * */
	/*var requestData = 
		"<wfs:GetFeature service='WFS' version='1.1.0' " + 
		"xmlns:hanzhong='http://www.eplusing.com/hanzhong' " +
		"xmlns:wfs='http://www.opengis.net/wfs' " + 
		"xmlns='http://www.opengis.net/ogc' " + 
		"xmlns:gml='http://www.opengis.net/gml' " + 
		"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " + 
		"xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-basic.xsd' " + 
		"outputFormat='application/json'> " + 
		"<wfs:Query typeName='hanzhong:djq'> " + 
		"<wfs:PropertyName>hanzhong:djqmc</wfs:PropertyName> " + 
		"<Filter> " + 
			"<Intersects> " + 
				"<PropertyName>geometry</PropertyName> " +
				"<gml:Polygon srsName='http://www.opengis.net/gml/srs/epsg.xml#2360'> " +
					"<gml:exterior> " +
				     	"<gml:LinearRing> " +
				     		"<gml:posList>402314.93545 3684110.69228 406476.09007 3682430.96014 403345.68017 3685523.19431 402314.93545 3684110.69228</gml:posList> " +
				        "</gml:LinearRing> " +
				    "</gml:exterior> " +
			    "</gml:Polygon> " +
			"</Intersects> " +
		"</Filter> " +
		"</wfs:Query>" + 
		"</wfs:GetFeature>";*/
	var requestData = 
		"<wfs:GetFeature service='WFS' version='1.1.0' " + 
		"xmlns:hanzhong='http://www.eplusing.com/hanzhong' " +
		"xmlns:wfs='http://www.opengis.net/wfs' " + 
		"xmlns='http://www.opengis.net/ogc' " + 
		"xmlns:gml='http://www.opengis.net/gml' " + 
		"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " + 
		"xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-basic.xsd' " + 
		"outputFormat='application/json'> " + 
		"<wfs:Query typeName='hanzhong:syqzd_db'> " + 
			//"<wfs:PropertyName>hanzhong:qlrxm</wfs:PropertyName> " + 
			"<Filter> " + 
				"<PropertyIsEqualTo>" + 
				"<PropertyName>chid</PropertyName>" + 
				"<Literal>" + "fc1b64cef9d74245a4aadd18004fc1d9" + "</Literal>" + 
				"</PropertyIsEqualTo>" + 
			"</Filter> " +
		"</wfs:Query>" + 
		"</wfs:GetFeature>";
	$.ajax({ 
			url:'http://localhost:9000/geoserver/wfs',
			type: 'POST',
			contentType: 'text/xml',
			dataType: 'json',
			processData: false,
			data: requestData,
			error: function(data){ //失败 
				alert('Error loading document'); 
				alert(data);
			}, 
			success: function(msg){ //成功 
				console.log(msg);
				console.log(msg.features.length);
				//JSON.parse(jsonstr); //可以将json字符串转换成json对象 
				//JSON.stringify(jsonobj); //可以将json对象转换成json对符串 
				//alert( "return message: " + JSON.stringify(msg) ); 
				//console.log( "return message: " + JSON.stringify(msg) );
				console.log(JSON.stringify(msg));
			} 
	}); 
});



$('#btnInsertTest').on('click', function() {
	var requestData = "<Transaction xmlns='http://www.opengis.net/wfs' service='WFS' version='1.1.0' " + 
		"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " + 
		"xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd'>" +
	"<Insert>" + 
		"<syqzd_db xmlns='http://www.eplusing.com/hanzhong'>" + 
			"<geometry>" + 
				"<MultiPolygon xmlns='http://www.opengis.net/gml'>" + 
					"<polygonMember>" + 
						"<Polygon srsName='http://www.opengis.net/gml/srs/epsg.xml#2360'>" + 
							"<exterior><LinearRing><posList>" + 
							"36427663.76193 3666473.50481 36430946.87475 3669756.61763 36421173.88775 3679147.84232 36427663.76193 3666473.50481" + 
							"</posList></LinearRing></exterior>" + 
						"</Polygon>" + 
					"</polygonMember>" + 
				"</MultiPolygon>" + 
			"</geometry>" +
			"<zdmj>2342.45</zdmj>" + 
			"<zddm>6233040</zddm>" + 
			"<bdcdyh>6233040893GB489W00</bdcdyh>" + 
			"<zdszb>北至</zdszb>" + 
			"<zdszd>东至</zdszd>" + 
			"<zdszn>南至</zdszn>" + 
			"<zdszx>西至</zdszx>" + 
			"<zdszb>北至</zdszb>" + 
		"</syqzd_db>" + 
	"</Insert>" + 
"</Transaction>";
	alert(requestData);
	$.ajax({ 
		url:'http://localhost:9000/geoserver/wfs',
		type: 'POST',
		contentType: 'text/xml',
		dataType: 'json',
		processData: false,
		data: requestData,
		error: function(data){ //失败 
			alert('Error loading document'); 
			alert(data);
		}, 
		success: function(msg){ //成功 
			console.log(msg);
			console.log(JSON.stringify(msg));
		} 
	}); 
});

$('#btnUpdateTest').on('click',function updateData(){
	var zddm = "610702500003GB00006";
	var bdcdyh = "610702500003GB00006W8888888";
	var zdtzm = "B";
	var zl = "汉台区兴元新区未知名称186";
	var zdmj = "1171.1200";
	var mjdw = "1";
	var yt = "住宅用地";
	var dj = "";
	var jg = "";
	var chid = "ae57606df8fa441c93dc541d5aca300f";
	var layerName = "syqzd_db";
	
	//更新GISDB
	var requestData = "<Transaction xmlns='http://www.opengis.net/wfs' service='WFS' version='1.1.0' " + 
		"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " + 
		"xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd'>" + 
		"<Update typeName='feature:" + layerName  + "' xmlns:feature='http://www.eplusing.com/hanzhong'>" +
			"<Property>" +   
		       	"<Name>" + "zddm" + "</Name>" + 
		       	"<Value>" + zddm + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "bdcdyh" + "</Name>" + 
		       	"<Value>" + bdcdyh + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdtzm" + "</Name>" + 
		       	"<Value>" + zdtzm + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zl" + "</Name>" + 
		       	"<Value>" + zl + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdmj" + "</Name>" + 
		       	"<Value>" + zdmj + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "mjdw" + "</Name>" + 
		       	"<Value>" + mjdw + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "yt" + "</Name>" + 
		       	"<Value>" + yt + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "dj" + "</Name>" + 
		       	"<Value>" + "</Value>" + 
			"</Property>" +  
			"<Property>" +   
		       	"<Name>" + "jg" + "</Name>" + 
		       	"<Value>" + jg + "</Value>" + 
			"</Property>" +   
			"<Filter xmlns='http://www.opengis.net/ogc'>" + 
				"<PropertyIsEqualTo>" + 
					"<PropertyName>" + "chid" +"</PropertyName>" + 
					"<Literal>" + chid + "</Literal>" + 
				"</PropertyIsEqualTo>" + 
			"</Filter>" + 
		"</Update>" + 
	"</Transaction>";
	$.ajax({ 
		url:'http://localhost:9000/geoserver/wfs',
		type: 'POST',
		contentType: 'text/xml',
		processData: false,
		data: requestData,
		error: function(data){ //失败 
			alert("更新GIS信息失败：" + data); 
		}, 
		success: function(msg){ //成功 
			alert("更新GIS信息成功:" + msg);
		} 
	});
	
	
});

//按条件更新gis
/*$('#btnUpdateTest').on('click',function updateData(){
	var requestData = "<Transaction xmlns='http://www.opengis.net/wfs' service='WFS' version='1.1.0' " + 
	"xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' " + 
	"xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd'>" + 
		"<Update typeName='feature:" + "syqzd_db"  + "' xmlns:feature='http://www.eplusing.com/hanzhong'>" +
			"<Property>" +   
		       	"<Name>" + "zddm" + "</Name>" + 
		       	"<Value>" + "610702008205GB00056" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "bdcdyh" + "</Name>" + 
		       	"<Value>" + "610702008205GB00056W00000001" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdtzm" + "</Name>" + 
		       	"<Value>" + "B" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zl" + "</Name>" + 
		       	"<Value>" + "汉台区北关街道办事处付家巷村委会汉台区前进东路南侧" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdmj" + "</Name>" + 
		       	"<Value>" + "434.000000000" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "mjdw" + "</Name>" + 
		       	"<Value>" + mjdw + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "yt" + "</Name>" + 
		       	"<Value>" + "房屋" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "dj" + "</Name>" + 
		       	"<Value>" + dj + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "jg" + "</Name>" + 
		       	"<Value>" + "0.00000000000" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "qllx" + "</Name>" + 
		       	"<Value>" + "3" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "qlxz" + "</Name>" + 
		       	"<Value>" + "102" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "qlsdfs" + "</Name>" + 
		       	"<Value>" + "2" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "rjl" + "</Name>" + 
		       	"<Value>" + "0" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "jzmd" + "</Name>" + 
		       	//"<Value>" + "0" + "</Value>" + 
		       	"<Value>" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "jzxg" + "</Name>" + 
		       	"<Value>" + "0" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdszd" + "</Name>" + 
		       	"<Value>" + "以界址点连线为界，邻久麟铭座" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdszn" + "</Name>" + 
		       	"<Value>" + "以界址点连线为界，邻久麟铭座" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdszx" + "</Name>" + 
		       	"<Value>" + "以界址点连线为界，邻久麟铭座" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdszb" + "</Name>" + 
		       	"<Value>" + "以界址点连线为界，邻久麟铭座" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zdt" + "</Name>" + 
		       	"<Value>" + "|/ODM/userfiles/09599e0cc6bb4e3f9da030923b83466e/files/reg/base/regBaseChxx/2016/07/久麟银座.rar|/ODM/userfiles/09599e0cc6bb4e3f9da030923b83466e/files/reg/base/regBaseChxx/2016/07/久麟银座-Model.jpg" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "tfh" + "</Name>" + 
		       	"<Value>" + "A0" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "djh" + "</Name>" + 
		       	"<Value>" + djh + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "zt" + "</Name>" + 
		       	"<Value>" + zt + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "qlrxm" + "</Name>" + 
		       	"<Value>" + "小明" + "</Value>" + 
			"</Property>" +   
			"<Property>" +   
		       	"<Name>" + "islogout" + "</Name>" + 
		       	"<Value>" + "0" + "</Value>" + 
			"</Property>" +   

			"<Filter xmlns='http://www.opengis.net/ogc'>" + 
				"<PropertyIsEqualTo>" + 
					"<PropertyName>chid</PropertyName>" + 
					"<Literal>" + "ae57606df8fa441c93dc541d5aca300f" + "</Literal>" + 
				"</PropertyIsEqualTo>" + 
			"</Filter>" + 
		"</Update>" + 
	"</Transaction>";
	$.ajax({ 
		url:'http://localhost:9000/geoserver/wfs',
		type: 'POST',
		contentType: 'text/xml',
		processData: false,
		data: requestData,
		error: function(data){ //失败 
			alert("更新GIS信息失败：" + data); 
		}, 
		success: function(msg){ //成功 
			alert("更新GIS成功:" + msg);
		} 
	}); 
});*/
