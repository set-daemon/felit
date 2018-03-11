/*
 * 文件上传插件
 */
;(function($){

	var innerUploader = function(outer_wrapper, options) {
		this.outerWrapper = outer_wrapper;
		this.options = options;
	};

	innerUploader.prototype = {

		__newElem: function(tag_type, options) {
			var elem = document.createElement(tag_type);

			if (options == undefined) {
				return elem;
			}

			if (options.id != undefined) {
				$(elem).attr('id', options.id);
			}
			if (options.classes != undefined) {
				switch (typeof options.classes) {
				case 'string':
					$(elem).addClass(options.classes);
				break;
				case 'array':
					for (var seq in options.classes) {
						var cls_name = options.classes[seq];
						$(elem).addClass(cls_name);
					}
				break;
				case 'object':
					for (var seq in options.classes) {
						var cls_name = options.classes[seq];
						$(elem).addClass(cls_name);
					}
				break;
				}
			}
			if (options.datas != undefined && typeof options.datas == "object") {
				for (var data_name in options.datas) {
					var v = options.datas[data_name];
					elem.dataset[data_name] = v;
				}
			}
			if (options.attrs != undefined) {
				for (var attr_name in options.attrs) {
					var attr_val = options.attrs[attr_name];
					$(elem).attr(attr_name, attr_val);
				}
			}
			if (options.html != undefined) {
				$(elem).html(options.html);
			}
			if (options.pObj != undefined) {
				$(options.pObj).append(elem);
			}

			return elem;
		},

		__genId: function(tag_name, options) {
			var plugin = this;

			switch (tag_name) {
			case 'div': {
				var rand_id = Math.random().toString(36).substr(2);
				return plugin.options.plugin_name + "-" + tag_name + "-" + rand_id + "-" + plugin.plugin_id;
			}
			break;
			default:
				return plugin.options.plugin_name + "-" + tag_name + "-" + plugin.plugin_id;
			}
		},

		__initUiFrame: function() {
			var plugin = this;

			// 创建innerWrapper
			plugin.innerWrapper = plugin.__newElem('div', {
				id: plugin.__genId('innerWrapper'),
				pObj: plugin.outerWrapper
			});

			plugin.upload_btn = plugin.__newElem('div', {
				classes: ["upload-btn"],
				html: "<span>上传文件</span>",
				pObj: plugin.innerWrapper
			});

			plugin.previewer = plugin.__newElem('div', {
				classes: ["file-preview", "hide"],
				pObj: plugin.innerWrapper
			});

			return plugin;
		},

		__bindEvents: function() {
			var plugin = this;

			plugin.upload_btn.onclick = function(event) {
				var btn_obj = this;

				// TODO：设置文件的上传限制，默认为单文件上传
				var tmp_input = plugin.__newElem('input', {
					attrs: {type:"file", hidden:"hidden"},
				});
				if (plugin.options.maxFileNum > 1) {
					$(tmp_input).attr('multiple', 'multiple');
				}
				tmp_input.click();
				// 此处是否有必要放入到DOM中？
				//$(plugin.innerWrapper).append(tmp_input);

				tmp_input.onchange = function(event) {
					var file_inputer = this;
					if (!file_inputer.value) {
						return;
					}
					// 判断文件个数
					if (file_inputer.files.length > plugin.options.maxFileNum) {
						alert("最多不超过" + plugin.options.maxFileNum + "个文件");
						return;
					}

					if (plugin.fd == undefined) {
						plugin.fd = new FormData();
					} else {
						delete plugin.fd;
						plugin.fd = new FormData();
					}

					var upload_options = plugin.options;

					var file_num = file_inputer.files.length;
					for (var seq in file_inputer.files) {
						plugin.fd.append('file[]', file_inputer.files[seq]);
					}
					if (plugin.options.fileCategory != undefined) {
						plugin.fd.append('fileCategory', plugin.options.fileCategory);
					}
					if (plugin.options.underModule != undefined) {
						plugin.fd.append('underModule', plugin.options.underModule);
					}
					// 此时删除文件选择器是否会出问题？
					//delete file_inputer;

					// TODO 设置其它选项，用于告知服务如何处理

					if (plugin.xhr == undefined) {
						plugin.xhr = new XMLHttpRequest();
					} else {
					}
					if (upload_options.uploadUrl != undefined) {
						plugin.xhr.open('post', upload_options.uploadUrl);
					} else {
						plugin.xhr.open('post', "/fileUploader.php");
					}

					plugin.xhr.onreadystatechange = function(event) {
						if (plugin.xhr.readyState == 4) {
							//console.log('-status = ' + plugin.xhr.status);
							if (plugin.xhr.status == 200) {
								// 返回结果：{code:200, "data":[{url:"", type:""}]}
								//console.log(plugin.xhr.responseText);
								var rsp = JSON.parse(plugin.xhr.responseText);
								// 加入到预览
								plugin.__clearPreview();
								for (var seq in rsp.data) {
									plugin.__addPreview(rsp.data[seq]);
								}
								plugin.__showPreview();
								// 报告上传结果
							} else {
							}
						}
					};
					plugin.xhr.onprogress = function(event) {
						// 进度条显示，如何做到多个文件上传时，显示每个文件的进度？
					};

					plugin.xhr.send(plugin.fd);
				};
			};

			// 删除预览
			$(plugin.previewer).delegate('.delete-icon', 'click', function(event) {
				var obj = this;
				var target_id = obj.dataset.targetId;
				$('#' + target_id).remove();
			});

			return plugin;
		},

		__prepareData: function() {

		},

		__clearPreview: function() {
			var plugin = this;
			
			$(plugin.previewer).html("");

			return plugin;
		},

		__showPreview: function() {
			var plugin = this;

			$(plugin.previewer).removeClass('hide');

			return plugin;
		},

		__addPreview: function(data) {
			var plugin = this;

			if (data.url == undefined) {
				return plugin;
			}

			switch (data.type) {
			case 'image/png':
			case 'image/jpeg':
			case 'image/jpg': {
				var obj_id = plugin.__genId('div');
				var img_div = plugin.__newElem('div', {
					pObj: plugin.previewer,
					classes: ['previewer-elem'],
					id: obj_id,
					html: '<span class="delete-icon" data-target-id="' + obj_id  + '">x</span><img src="' + data.url + '"/>' + '<input type="hidden" value="' + data.url +'" name="' + plugin.options.elemName + '[]" />'
				});
			}
			break;
			case 'video/mp4':
			break;
			default:
			break;
			}

			return plugin;
		},

		init: function() {
			var plugin = this;

			plugin.plugin_id = Math.random().toString(36).substr(2);
			if (plugin.options.plugin_name == undefined) {
				plugin.options.plugin_name = "xfileUploader";
			}
			if (plugin.options.maxFileNum == undefined) {
				plugin.options.maxFileNum = 1;
			}

			plugin.__initUiFrame();
			plugin.__bindEvents();
			plugin.__prepareData();

			if (plugin.options.initData != null) {
				for (var key in plugin.options.initData) {
					var data = plugin.options.initData[key];
					plugin.__addPreview(data);
				}
				plugin.__showPreview();
			}

			return plugin;
		}
	};

	$.fn.xfileUploader = function(options) {
		var __inst = new innerUploader(this, options);

		__inst.init();

		return __inst;
	};

})(jQuery);
