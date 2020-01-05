var msgTagId = 'tbl';
var $ = function(id){ return document.getElementById(id); };
var setMessage = function(msg, isError){
    var divMsg = $(msgTagId);

	/*
    divMsg.innerText = msg;
    if(isError)
        divMsg.style.color = 'red';
    else
        divMsg.style.color = 'blue';
	*/
};
var clearMessage = function(msg){
    //$(msgTagId).innerText = '';
    //$('msg').innerHtml = '&nbsp;';
};

var tbl = $('tbl');
var hot = new Handsontable(tbl, {
  startRows: 2,
  startCols: 2,
  rowHeaders: true,
  colHeaders: true,
  minSpareRows: 1,
  width: 1960,
  //fixedColumnsLeft: 3,
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});

var httpRequest = function(method, url, data, headers, callback){

    setMessage('loading ...');
    var xhr = new XMLHttpRequest();
    xhr.onloadend = clearMessage;
    xhr.open(method, url, true);

    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    if(headers)
      for(head in headers)
        xhr.setRequestHeader(head, headers[head]);

	if(data)
    	xhr.send(data);
	else
    	xhr.send();

    xhr.onreadystatechange = function(e) {
        //console.log(this.readyState +',' + this.status);
        if( this.readyState == 4 && this.status == 200){
            var data = JSON.parse(xhr.responseText);
            //console.log( data );

            if(callback)
            callback( data );
        }
    };
};

var httpGet = function(url, headers, callback){

	httpRequest('GET', url, null, headers, callback);
};

var httpPost = function(url, data, headers, callback){

	httpRequest('POST', url, data, headers, callback);
};

var loadData = function(ht, callback){
	var url = '/dbo/t2';
    httpGet(url, null, function(dbo){
		console.log(dbo);

		let colmap = [];
		let colConf = {};
		for(let col in dbo.schema){
			colConf = {data:col};
			if(dbo.schema[col].type == 'int' ||
				dbo.schema[col].type == 'integer'){
				colConf.type = 'numeric';
				colConf.pattern = '0,0';
			}else if(dbo.schema[col].type == 'date'){
				colConf.type = 'date';
				colConf.dateFormat = 'YYYY-MM-DD';
			}else if(dbo.schema[col].type == 'datetime'){
				colConf.dateFormat = 'YYYY-MM-DD HH:mm';
			}else if(dbo.schema[col].type == 'timestamp'){
				colConf.dateFormat = 'YYYY-MM-DD HH:mm:ss';
				colConf.readOnly = true;
			}else if(dbo.schema[col].type == 'time'){
				colConf.type = 'time';
				colConf.dateFormat = 'HH:mm';
			}

			if(dbo.schema[col].isAutoIncrement)
				colConf.editor = false;

			colmap.push(colConf);
		}
	
		let updates = ht.getSettings().updates;
		if(updates)
			updates.sort().forEach(function(rowId){
				let columns = Object.keys(dbo.schema);
				for(let c=0; c<columns.length; c++)
					ht.removeCellMeta(rowId, c, 'className');
			});

		ht.loadData(dbo.data);
		ht.updateSettings({
            colHeaders: Object.keys(dbo.schema),
            columns: colmap,
            minSpareRows: 1,
			afterChange: function(changes){
				if(changes)
				changes.forEach(function(chg){
					let colId = ht.getColHeader().indexOf(chg[1]);
					console.log('change[',chg[0],',',colId,']', chg[2],chg[3]);

					let cellMeta = ht.getCellMeta(chg[0], colId);
					let clsName = 'notsavedyet';
					if(cellMeta.className){
						if(cellMeta.className.indexOf(clsName) > -1)
							return;
						clsName = cellMeta.className + ' ' + clsName;
					}

					ht.setCellMeta(chg[0], colId, 'className', clsName);

					let updates = ht.getSettings().updates;
					if(updates.indexOf(chg[0]) == -1)
						updates.push(chg[0]);
					//console.log(updates);
				});
				ht.render();
			},
			updates: []
        });
	});
};

var saveData = function(){
	let tblData = hot.getData();
	let header = hot.getColHeader();
	let updates = hot.getSettings().updates.sort();

	if(updates.length == 0)return;

	let data = [], rec = null;
	updates.forEach(function(rowId){
		rec = {};
		for(let c=0; c<header.length; c++)
			rec[header[c]] = tblData[rowId][c];
		data.push(rec);
	});
	console.log(JSON.stringify({data: data}));
	httpPost('/dbo/t2', JSON.stringify({data: data}), null, function(){
		loadData(hot);
	});
};
$('btnSave').addEventListener('click', saveData, false);

loadData(hot);
