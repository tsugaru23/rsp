const fs = require('fs');
const XlsxTemplate = require('xlsx-template');
const dateformat = require('dateformat');

module.exports = async function(tmplPath, data){
	return new Promise(function(resolve, reject){
		try{
			fs.readFile(tmplPath, function(err, tmpldata) {
				if(err){
					console.log(err);
					reject(err);
					return;
				}

				// Create a template
				let template = new XlsxTemplate(tmpldata);
				let sheetNumber = 1;

				// Perform substitution
				template.substitute(sheetNumber, data);

				// Get binary data
				let xlsx = template.generate({type:'nodebuffer'});
				resolve(xlsx);
			});
		}catch(ex){
			reject(ex);
		}
	});
}

