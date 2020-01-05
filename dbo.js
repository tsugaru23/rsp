const sqlite3 = require('sqlite3-promisify');
const knex = require('knex')({
	client:'sqlite3',
	useNullAsDefault:true
});

module.exports = class DataSource{

	connect(conString){
		this.con = new sqlite3(conString);
	}

	constructor(conString){
		this.connect(conString);
		console.log(this.con);
	}

	async get(sql, values=[]){
		return await this.con.get(sql,values);
	}

	async query(sql, values=[]){
		console.log(sql);
		let rows = await this.con.all(sql,values);
		console.log(rows);
		return rows;
	}

	async selectStar(tbl){
		return await this.query(
			knex.select()
			.from(tbl)
			.toString()
		);
	}

	async execute(sql, values=[]){
		console.log(sql);
		return await this.con.run(sql,values)
	}

	async deleteWithKey(tbl, keyCol, keys){
		return await this.execute(
			knex(tbl)
			.whereIn(keyCol, keys)
			.del()
			.toString()
		);
	}

	async truncate(tbl){
		return await this.execute(
			knex(tbl).truncate()
			.toString()
		);
	}

	async tables(){
		return await this.con.all(
			knex.select()
			.from('sqlite_master')
			.where('type', 'table')
			.orderBy('name')
			.toString()
		);
	}

	async tableNames(){
		let tbls = [];
		let lst = await this.con.all(
			knex.select('name')
			.from('sqlite_master')
			.where('type', 'table')
			.orderBy('name')
			.toString()
		);
		lst.forEach(function(tbl){
			tbls.push(tbl.name);
		});
		return tbls;
	}

	async columns(tbl){
		let colMap = {};
		let col = null;
		let cols = await this.con.all(
			knex.raw("PRAGMA table_info(?)", [tbl])
			.toString()
		);
		let seq = await this.con.get(
			knex.select('seq')
			.from('sqlite_sequence')
			.where('name', tbl)
			.toString()
		);
		let hasSeq = (seq && Object.keys(seq).length > 0);
	
		for(let c=0; c<cols.length; c++){
			col = cols[c];
			colMap[col.name] = {
				type: col.type,
				notnull: col.notnull,
				default: col.dflt_value,
				pk: (col.pk == 1),
				isAutoIncrement: (col.pk == 1 && hasSeq)
			};
		}
		return colMap;
	}

	async schemas(){
		let tbls = await this.tableNames();
		let tblMap = {};
		for(let t=0; t<tbls.length; t++)
			tblMap[tbls[t]] = await this.columns(tbls[t]);

		return tblMap;
	}

	async countStarTbl(tbl){
		let ret = await this.con.get(
			knex(tbl).count()
			.toString()
		);
		return parseInt(ret['count(*)'], 10);
	}

	async insert(tbl, values){
		return await this.execute(
			knex(tbl).insert(values).toString()
		);
	}

	async update(tbl, keyCol, keyVal, values){
		let whereCond = {};
		whereCond[keyCol] = keyVal;

		return await this.execute(
			knex(tbl)
			.where(whereCond)
			.update(values).toString()
		);
	}

	close(){
		this.con.close();
	}
}
/*
async function main(){
	let dbo = new DataSource("test.db");
	console.log( await dbo.schemas() );
	console.log( await dbo.selectStar("t1") );
	//console.log( await dbo.truncate('t1') );
	let cnt = await dbo.countStarTbl('t1');
	console.log( cnt );
	console.log( await dbo.insert('t1',
		{id : cnt+1,
		 val: new Date().toISOString()
		}) );
	console.log( await dbo.selectStar("t1") );
	//console.log( await dbo.deleteWithKey(
	//	't1','id',[1]) );
	//console.log( await dbo.selectStar("t1") );
	dbo.close();
};

main();
*/
