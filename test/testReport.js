const fs = require('fs');
const dateformat = require('dateformat');
const report = require('../xlsxreport');

async function test(){
	let data = {
		title:"30日 取りに来る分",
		datetime: dateformat(new Date(),'yyyy-mm-dd HH:MM'),
		order: [
			{	orderId:"001",
				orderDate:new Date("2019-12-30"),
				catring:false,
				customerName:"黒石 太郎",
				productName:"皿盛",
				productQuantity:3,
				orderAmount:30000,
				orderNote:""
			},
			{	orderId:"002",
				orderDate:new Date("2019-12-30"),
				catring:false,
				customerName:"黒石 花子",
				productName:"オードブル",
				productQuantity:2,
				orderAmount:10000,
				orderNote:""
			}
		]
	};

	tmplPath = 'test/OrderList_template.xlsx';
	let xlsx = await report(tmplPath, data);
	fs.writeFileSync(tmplPath + '-filled.xlsx', xlsx);
}

test();

