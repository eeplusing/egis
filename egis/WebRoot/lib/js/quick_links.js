jQuery(function($){
	//创建DOM
	var 
	quickHTML = document.querySelector("div.quick_link_mian"),
	quickShell = $(document.createElement('div')).html(quickHTML).addClass('quick_links_wrap'),
	quickLinks = quickShell.find('.quick_links');
	quickPanel = quickLinks.next();
	quickShell.appendTo('.mui-mbar-tabs');
	
	//具体数据操作 
	var 
	quickPopXHR,
	popTmpl = '<a href="javascript:;" class="ibar_closebtn" title="关闭"></a><div class="ibar_plugin_title"><h3><%=title%></h3></div><div class="pop_panel"><%=content%></div><div class="arrow"><i></i></div><div class="fix_bg"></div>',
	
	quickPop = quickShell.find('#quick_links_pop'),
	quickDataFns = {
		//信息查询
		message_list: {
			title: '信息查询',
			content: 
				'<div class="ibar_plugin_content">' + 
					'<div class="ibar_cart_group ibar_cart_product"> ' + 
						'<div class=""> ' + 
							'<span class="ibar_cart_group_title">查询图层:</span><br/> ' + 
							'<select>' + 
						  		'<option>行政区域</option>' +
						  		'<option>道路</option>' +
						  		'<option>宗地</option>' +
						  		'<option>楼盘</option>' +
						  		'<option></option>' +
						  		'<option></option>' +
						  	'<select/>' + 
						'</div><br/>' +  
						'<div class=""> ' + 
							'<span class="ibar_cart_group_title">查询条件1</span> ' + 
							'<input type="text"/>' + 
						'</div>' +  
						'<div class=""> ' + 
							'<span class="ibar_cart_group_title">查询条件2</span> ' + 
							'<input type="text"/>' + 
						'</div>' + 
						'<div class=""> ' + 
							'<span class="ibar_cart_group_title">查询条件3</span> ' + 
							'<input type="text"/>' + 
						'</div><br/>' +  
						'<div class=""> ' + 
							'<input type="button" value="查询"/>' + 
						'</div>' +  
						'<ul>' + 
							'<li class="cart_item">' +  
								'<div class="cart_item_desc">' + 
									'<a href="#" class="cart_item_name">查询结果</a>' + 
									'<div class="cart_item_sku">' + 
										'<span>此处显示选中要的详细信息</span>' + 
									'</div>' +
								'</div>' + 
							'</li>' + 
						'</ul>' + 
					'</div>',
			init:$.noop
		},
		
		//测量工具
		history_list: {
			title: '测量工具',
			content: 
				'<div class="ibar_plugin_content">' + 
					'<div class="ibar_cart_group ibar_cart_product"> ' + 
						'<div class="">测量距离<br/>' + 
							'<img class="measureBtn" src="../../lib/images/length.png" title="测量距离" />' + 
						'</div><br/>' +  
						'<div class="">测量面积 <br/>' + 
							'<img class="measureBtn" src="../../lib/images/area.png" title="测量面积"/>' +  
						'</div><br/>' +  
						'<div class="">测量周长<br/> ' + 
							'<img class="measureBtn" src="../../lib/images/perimeter.png" title="测量周长"/>' +  
						'</div><br/>' +  
					'</div>',
			init:$.noop
		},
		//地图浏览
		leave_message: {
			title: '地图浏览',
			content: 
				'<div class="ibar_plugin_content">' + 
					'<div class="ibar_cart_group ibar_cart_product"> ' + 
						'<div class="ibar_cart_group_header"> ' + 
							'<span class="ibar_cart_group_title">信息查询</span> ' + 
							'<a href="#">详细信息</a>' + 
						'</div>' +  
						'<ul>' + 
							'<li class="cart_item">' +  
								'<div class="cart_item_desc">' + 
									'<a href="#" class="cart_item_name">图层信息</a>' + 
									'<div class="cart_item_sku">' + 
										'<span>显示详细信息</span>' + 
									'</div>' +
								'</div>' + 
							'</li>' + 
						'</ul>' + 
					'</div>',
			init:$.noop
		},
		//地图浏览
		mpbtn_histroy:{
			title: '地图浏览',
			content: 
				'<div class="ibar_plugin_content">' + 
					'<div class="ibar_cart_group ibar_cart_product"> ' + 
						'<div class="ibar_cart_group_header"> ' + 
							'<span class="ibar_cart_group_title">信息查询</span> ' + 
							'<a href="#">详细信息</a>' + 
						'</div>' +  
						'<ul>' + 
							'<li class="cart_item">' +  
								'<div class="cart_item_desc">' + 
									'<a href="#" class="cart_item_name">图层信息</a>' + 
									'<div class="cart_item_sku">' + 
										'<span>显示详细信息</span>' + 
									'</div>' +
								'</div>' + 
							'</li>' + 
						'</ul>' + 
					'</div>',
			init:$.noop
		},
		//编辑
		mpbtn_wdsc:{
			title: '编辑',
			content: 
				'<div class="ibar_plugin_content">' + 
					'<div class="ibar_cart_group ibar_cart_product"> ' + 
						'<div class="ibar_cart_group_header"> ' + 
							'<span class="ibar_cart_group_title">信息查询</span> ' + 
							'<a href="#">详细信息</a>' + 
						'</div>' +  
						'<ul>' + 
							'<li class="cart_item">' +  
								'<div class="cart_item_desc">' + 
									'<a href="#" class="cart_item_name">图层信息</a>' + 
									'<div class="cart_item_sku">' + 
										'<span>显示详细信息</span>' + 
									'</div>' +
								'</div>' + 
							'</li>' + 
						'</ul>' + 
					'</div>',
			init:$.noop
		},
		mpbtn_recharge:{
			title: '帮助',
			content: 
				'<div class="ibar_plugin_content">' + 
					'<div class="ibar_cart_group ibar_cart_product"> ' + 
						'<div class="ibar_cart_group_header"> ' + 
							'<span class="ibar_cart_group_title">信息查询</span> ' + 
							'<a href="#">详细信息</a>' + 
						'</div>' +  
						'<ul>' + 
							'<li class="cart_item">' +  
								'<div class="cart_item_desc">' + 
									'<a href="#" class="cart_item_name">图层信息</a>' + 
									'<div class="cart_item_sku">' + 
										'<span>显示详细信息</span>' + 
									'</div>' +
								'</div>' + 
							'</li>' + 
						'</ul>' + 
					'</div>',
			init:$.noop
		}
	};
	
	//showQuickPop
	var 
	prevPopType,
	prevTrigger,
	doc = $(document),
	popDisplayed = false,
	hideQuickPop = function(){
		if(prevTrigger){
			prevTrigger.removeClass('current');
		}
		popDisplayed = false;
		prevPopType = '';
		quickPop.hide();
		quickPop.animate({left:280,queue:true});
	},
	showQuickPop = function(type){
		if(quickPopXHR && quickPopXHR.abort){
			quickPopXHR.abort();
		}
		if(type !== prevPopType){
			var fn = quickDataFns[type];
			quickPop.html(ds.tmpl(popTmpl, fn));
			fn.init.call(this, fn);
		}
		doc.unbind('click.quick_links').one('click.quick_links', hideQuickPop);

		quickPop[0].className = 'quick_links_pop quick_' + type;
		popDisplayed = true;
		prevPopType = type;
		quickPop.show();
		quickPop.animate({left:0,queue:true});
	};
	quickShell.bind('click.quick_links', function(e){
		e.stopPropagation();
	});
	quickPop.delegate('a.ibar_closebtn','click',function(){
		quickPop.hide();
		quickPop.animate({left:280,queue:true});
		if(prevTrigger){
			prevTrigger.removeClass('current');
		}
	});

	//通用事件处理
	var 
	view = $(window),
	quickLinkCollapsed = !!ds.getCookie('ql_collapse'),
	getHandlerType = function(className){
		return className.replace(/current/g, '').replace(/\s+/, '');
	},
	showPopFn = function(){
		var type = getHandlerType(this.className);
		if(popDisplayed && type === prevPopType){
			return hideQuickPop();
		}
		showQuickPop(this.className);
		if(prevTrigger){
			prevTrigger.removeClass('current');
		}
		prevTrigger = $(this).addClass('current');
	},
	quickHandlers = {
		//购物车，最近浏览，商品咨询
		my_qlinks: showPopFn,
		message_list: showPopFn,
		history_list: showPopFn,
		leave_message: showPopFn,
		mpbtn_histroy:showPopFn,
		mpbtn_recharge:showPopFn,
		mpbtn_wdsc:showPopFn,
		//返回顶部
		return_top: function(){
			ds.scrollTo(0, 0);
			hideReturnTop();
		}
	};
	quickShell.delegate('a', 'click', function(e){
		var type = getHandlerType(this.className);
		if(type && quickHandlers[type]){
			quickHandlers[type].call(this);
			e.preventDefault();
		}
	});
	
	//Return top
	var scrollTimer, resizeTimer, minWidth = 1350;

	function resizeHandler(){
		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(checkScroll, 160);
	}
	
	function checkResize(){
		quickShell[view.width() > 1340 ? 'removeClass' : 'addClass']('quick_links_dockright');
	}
	function scrollHandler(){
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(checkResize, 160);
	}
	function checkScroll(){
		view.scrollTop()>100 ? showReturnTop() : hideReturnTop();
	}
	function showReturnTop(){
		quickPanel.addClass('quick_links_allow_gotop');
	}
	function hideReturnTop(){
		quickPanel.removeClass('quick_links_allow_gotop');
	}
	view.bind('scroll.go_top', resizeHandler).bind('resize.quick_links', scrollHandler);
	quickLinkCollapsed && quickShell.addClass('quick_links_min');
	resizeHandler();
	scrollHandler();
});