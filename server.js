const fastify = require('fastify')({ logger: true });
const DataSource = require('./dbo');
const dbo = new DataSource('test.db');

fastify.register(
  require('fastify-compress'),
  { global: true }
);

let schema = null;

// Declare a route
fastify.get('/', async (request, reply) => {
	return { hello: 'world' }
})
fastify.get('/dbo/:tbl', async (request, reply) => {
	fastify.log.info(request.params);
	let tbl = request.params.tbl;
	let data = await dbo.selectStar(tbl);
	return { schema: schema[tbl], data: data };
})
fastify.post('/dbo/:tbl', async (request, reply) => {
	fastify.log.info(request.body);
	fastify.log.info(request.query);

	let tbl = request.params.tbl;
	let data = request.body.data;
	let query= request.query;

	if(Object.keys(query).length > 0)
		await dbo.update(tbl, query.key, query.val, data);
	else
		data.forEach(async function(rec){
			fastify.log.info(rec);
			let rowId = rec.id;
			['id','created_at','updated_at'].forEach(function(ky){
				if(ky in rec)delete rec[ky];
			});

			if(rowId)
				await dbo.update(tbl, 'id', rowId, rec);
			else
				await dbo.insert(tbl, rec);
		});

	return { schema: schema[tbl], data: data };
})
fastify.put('/dbo/:tbl', async (request, reply) => {
	fastify.log.info(request.params);

	let tbl = request.params.tbl;
	let data = request.body.data;
	await dbo.insert(tbl, data);

	return { schema: schema[tbl], data: data };
})
fastify.delete('/dbo/:tbl', async (request, reply) => {
	fastify.log.info(request.params);

	let tbl = request.params.tbl;
	let query= request.query;
	await dbo.deleteWithKey(tbl, query.key, query.val.split(','));

	return { schema: schema[tbl], query:query };
})


// Run the server!
const start = async () => {
	try {
		await fastify.listen(3000);
		schema = await dbo.schemas();
		fastify.log.info(`server listening on ${fastify.server.address().port}`);
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
start();
