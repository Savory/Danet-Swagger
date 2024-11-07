import { path } from '../deps.ts';
import { app } from '../example/app.ts';
import { assertEquals } from './test_deps.ts';
import { SwaggerModule } from '../mod.ts';
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
		"securitySchemes":{
			"basic":{"type":"http","scheme":"basic"},
			"bearer":{"bearerFormat": "JWT","type":"http","scheme":"bearer"},
			"oauth2": { "flows": { "implicit": { "scopes": {},},}, "type": "oauth2"},
			"cookie": { "in": "cookie", "name": "wonderfulCookieName", "type": "apiKey"},
},
		'schemas': {
			'NameSearch': {
				'required': ['name'],
				'properties': { 'name': { 'type': ['string'] } },
				'type': ['object'],
				'title': 'NameSearch',
			},
			'CatSearch': {
				'required': ['name'],
				'properties': {
					'name': { 'type': 'string' },
					'breed': { 'type': 'string' },
					'age': { 'type': 'number' },
				},
			},
			'Cat': {
				'required': ['name', 'breed', 'dob', 'color', 'hobbies'],
				'properties': {
					'name': { 'type': 'string' },
					'breed': { 'type': 'string' },
					'dob': { 'type': 'string', 'format': 'date-time' },
					'isHungry': { 'type': 'boolean' },
					'color': { 'type': 'object' },
					'hobbies': { 'type': 'array' },
				},
			},
			'Todo': {
				'required': ['title', 'description', 'version', 'cat'],
				'properties': {
					'title': { 'type': 'string', 'description': 'my description' },
					'description': { 'type': 'string' },
					'version': { 'type': 'number' },
					'cat': { '$ref': '#/components/schemas/Cat' },
				},
			},
			'ZodCat': {
				'required': ['name', 'breed', 'dob', 'hobbies'],
				'properties': {
					'name': { 'type': ['string'] },
					'breed': { 'type': ['string'] },
					'dob': { 'type': ['string'], 'format': 'date-time' },
					'isHungry': { 'type': ['boolean'] },
					'hobbies': { items: {}, 'type': ['array'] },
				},
				title: 'ZodCat',
				type: [ 'object' ]
			},
			'ZodTodo': {
				'required': ['title', 'description', 'version', 'cat'],
				'properties': {
					'title': { 'type': ['string'] },
					'description': { 'type': ['string'] },
					'version': { 'type': ['number'] },
					'cat': { '$ref': '#/components/schemas/ZodCat' },
				},
				title: 'ZodTodo',
				type: [ 'object' ]
			},
		},
	},
	'paths': {
		'/second-endpoint': {
			'get': {
				'operationId': 'getSecond',
				'responses': { '200': { 'description': '' } },
				'tags': ['second'],
				'security': [{
					'basic': [],
				}]
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
				'security': [{
					'basic': [],
				}]
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
					'schema': { 'type': ['string'] },
				}],
			},
		},
		'/zod': {
			'post': {
				'operationId': 'posZodSomething',
				'responses': { '200': { 'description': '' } },
				'requestBody': {
					'content': {
						'application/json': {
							'schema': { '$ref': '#/components/schemas/ZodTodo' },
						},
					},
					'required': true,
					'description': '',
				},
			},
			'get': {
				'operationId': 'getZodSomething',
				'responses': {
					'200': {
						'description': '',
						'content': {
							'application/json': {
								'schema': {
									'type': 'array',
									'items': {
										'$ref': '#/components/schemas/ZodCat',
									},
								},
							},
						},
					},
				},
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
								'schema': {
									'type': 'array',
									'items': {
										'$ref': '#/components/schemas/Cat',
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
				'security': [{
					'bearer': [],
				}]
			},
			'post': {
				'operationId': 'postSomething',
				'responses': {
					'200': {
						'description': '',
						'content': {
							'application/json': {
								'schema': {
									'$ref': '#/components/schemas/Todo',
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
				'security': [{
					'oauth2': ['my-permission:all'],
				}]
			},
		},
		'/my-endpoint/somethingagain': {
			'patch': {
				'operationId': 'patchSomething',
				'responses': {
					'200': {
						'description': '',
						'content': {
							'application/json': {
								'schema': {
									'type': 'boolean',
								},
							},
						},
					},
				},
				'security': [{
					'cookie': [],
				}]
			},
			'put': {
				'operationId': 'putSomething',
				'responses': {
					'200': {
						'description': '',
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
	.addBasicAuth()
	.addBearerAuth()
	.addOAuth2()
	.addCookieAuth('wonderfulCookieName')
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
		assertEquals(text, swaggerHtml.replace('%definition%', JSON.stringify(document)));
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
