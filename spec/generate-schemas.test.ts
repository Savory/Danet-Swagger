import { path } from '../deps.ts';
import { app } from '../example/app.ts';
import { assertEquals } from './test_deps.ts';
import { SwaggerModule } from '../mod.ts';
import { Swagger } from '../swagger.ts';
import { SpecBuilder } from '../mod.ts';

const expectedSpec = {
	'info': {
		'title': 'Cats example',
		'description': 'The cats API description',
		'version': '1.0',
	},
	'tags': [{ 'name': 'cats', 'description': '' }],
	'servers': [],
	'openapi': '3.0.3',
	'components': {
		'schemas': {
			'NameSearch': { 'properties': { 'name': { 'type': 'string' } } },
			'CatSearch': {
				'properties': {
					'name': { 'type': 'string' },
					'breed': { 'type': 'string' },
					'age': { 'type': 'number' },
				},
			},
			'Cat': {
				'properties': {
					'name': { 'type': 'string' },
					'breed': { 'type': 'string' },
				},
			},
			'Todo': {
				'properties': {
					'title': { 'type': 'string' },
					'description': { 'type': 'string' },
					'version': { 'type': 'number' },
					'cat': { '$ref': '#/components/schemas/Cat' },
				},
			},
		},
	},
	'paths': {
		'/second-endpoint': {
			'get': {
				'operationId': 'getSecond',
				'responses': { '200': { 'description': '' } },
				'tags': ['second'],
			},
		},
		'/second-endpoint/{id}/{name}': {
			'get': {
				'operationId': 'getSomethingByIdAndName',
				'responses': { '200': { 'description': '' } },
				'tags': ['second', 'third'],
				'parameters': [{
					'name': 'id',
					'in': 'path',
					'description': '',
					'required': true,
					'schema': { 'type': 'string' },
				}, {
					'name': 'name',
					'in': 'path',
					'description': '',
					'required': true,
					'schema': { 'type': 'string' },
				}],
			},
		},
		'/hello': {
			'get': {
				'operationId': 'hello',
				'responses': { '200': { 'description': '' } },
				'parameters': [{
					'name': 'name',
					'in': 'query',
					'description': '',
					'required': true,
					'schema': { 'type': 'string' },
				}],
			},
		},
		'/my-endpoint': {
			'get': {
				'operationId': 'getSomething',
				'responses': {
					'200': {
						'description': '',
						'content': {
							'application/json': {
								'schema' : {
									'type': 'array',
									'items': {
										'$ref': '#/components/schemas/Cat'
									},
								},
							},
						},
					},
				},
				'parameters': [{
					'name': 'name',
					'in': 'query',
					'description': '',
					'required': true,
					'schema': { 'type': 'string' },
				}, {
					'name': 'breed',
					'in': 'query',
					'description': '',
					'required': false,
					'schema': { 'type': 'string' },
				}, {
					'name': 'age',
					'in': 'query',
					'description': '',
					'required': false,
					'schema': { 'type': 'number' },
				}],
			},
			'post': {
				'operationId': 'postSomething',
				'responses': {
					'200': {
						'description': '',
						'content': {
							'application/json': {
								'schema' : {
										'$ref': '#/components/schemas/Todo'
								},
							},
						},
					},
				},
				'requestBody': {
					'content': {
						'application/json': {
							'schema': { '$ref': '#/components/schemas/Todo' },
						},
					},
					'required': true,
					'description': '',
				},
			},
		},
		'/my-endpoint/somethingagain': {
			'patch': {
				'operationId': 'patchSomething',
				'responses': { '200': { 'description': '' } },
			},
			'put': {
				'operationId': 'putSomething',
				'responses': { '200': { 'description': '' } },
				'requestBody': {
					'content': {
						'application/json': {
							'schema': { '$ref': '#/components/schemas/Todo' },
						},
					},
					'required': true,
					'description': '',
				},
			},
		},
	},
};

const title = 'Cats example';
const description = 'The cats API description';
const version = '1.0';
const tagName = 'cats';
const spec = new SpecBuilder()
	.setTitle(title)
	.setDescription(description)
	.setVersion(version)
	.addTag(tagName)
	.build();
const document = await SwaggerModule.createDocument(app, spec) as any;

Deno.test('Generate app definition', async () => {
	assertEquals(document, expectedSpec);
});
Deno.test('host swagger', async (ctx) => {
	const swaggerPath = '/api';
	await SwaggerModule.setup(swaggerPath, app, document);

	const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
	const filePath = `${__dirname}/../swagger.html`;
	const swaggerHtml = await Deno.readTextFile(filePath);
	await ctx.step('serve swagger html file on given endpoint', async () => {
		const listenEvent = await app.listen(0);
		const response = await fetch(
			`http://localhost:${listenEvent.port}${swaggerPath}`,
		);
		const text = await response.text();
		assertEquals(response.status, 200);
		assertEquals(text, swaggerHtml);
		await app.close();
	});
	await ctx.step('serve swagger json file on given endpoint/json', async () => {
		const listenEvent = await app.listen(0);
		const response = await fetch(
			`http://localhost:${listenEvent.port}${swaggerPath}/json`,
		);
		const returnedJson = await response.json();
		assertEquals(response.status, 200);
		assertEquals(returnedJson, document);
		await app.close();
	});
});
