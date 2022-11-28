import {
	Body,
	Controller,
	Get,
	Module,
	Param,
	Patch,
	Post,
	Put,
	Query,
} from '../deps.ts';
import { assertEquals } from './test_deps.ts';
import { SwaggerModule } from '../mod.ts';
import {
	ApiProperty,
	BodyType,
	Optional,
	QueryType,
	ReturnedType, Tag,
} from '../decorators.ts';
import { Swagger } from '../swagger.ts';
import Schema = Swagger.Schema;
import Path = Swagger.Path;

class Cat {
	@ApiProperty()
	name!: string;

	@ApiProperty()
	breed!: string;

	constructor() {
	}
}

class CatSearch {
	@ApiProperty()
	name: string;

	@Optional()
	@ApiProperty()
	breed?: string;

	@Optional()
	@ApiProperty()
	age?: number;

	constructor(name: string) {
		this.name = name;
	}
}

class Todo {
	@ApiProperty()
	title!: string;

	@ApiProperty()
	description!: string;

	@ApiProperty()
	version!: number;

	@ApiProperty()
	cat!: Cat;

	constructor() {
	}
}

@Controller('my-endpoint')
class MyController {
	@ReturnedType(Cat)
	@QueryType(CatSearch)
	@Get()
	getSomething(): Cat {
		return new Cat();
	}

	@Post()
	postSomething(@Body() todo: Todo): number {
		return 1;
	}

	@Patch('somethingagain')
	patchSomething(): boolean {
		return true;
	}

	@BodyType(Todo)
	@Put('somethingagain')
	putSomething(): Todo {
		return new Todo();
	}
}

@Tag('second')
@Controller('second-endpoint')
class SecondController {
	@Get()
	getSecond() {
		return;
	}

	@Tag('third')
	@Get(':id/:name')
	getSomethingByIdAndName(@Param('id') id: string) {
	}
}

@Module({
	controllers: [MyController, SecondController],
})
class MyModule {
}

const swaggerModule = new SwaggerModule();

const controllerExpectedPaths: { [key: string]: Path } = {
	'/my-endpoint': {
		get: {
			operationId: 'getSomething',
			parameters: [{
				'name': 'name',
				'in': 'query',
				'description': '',
				'required': true,
				'type': 'string',
				'schema': {
					'type': 'string',
				},
			}, {
				'name': 'breed',
				'in': 'query',
				'description': '',
				'required': false,
				'type': 'string',
				'schema': {
					'type': 'string',
				},
			}, {
				'name': 'age',
				'in': 'query',
				'description': '',
				'required': false,
				'type': 'number',
				'schema': {
					'type': 'number',
				},
			}],
			responses: {
				200: {
					description: '',
					content: {
						'application/json': {
							schema: {
								'$ref': '#/components/schemas/Cat',
							},
						},
					},
				},
			},
		},
		post: {
			operationId: 'postSomething',
			'requestBody': {
				'description': '',
				'content': {
					'application/json': {
						'schema': {
							'$ref': '#/components/schemas/Todo',
						},
					},
				},
				'required': true,
			},
			responses: {
				200: {
					description: '',
				},
			},
		},
	},
	'/my-endpoint/somethingagain': {
		patch: {
			operationId: 'patchSomething',
			responses: {
				200: {
					description: '',
				},
			},
		},
		put: {
			operationId: 'putSomething',
			'requestBody': {
				'description': '',
				'content': {
					'application/json': {
						'schema': {
							'$ref': '#/components/schemas/Todo',
						},
					},
				},
				'required': true,
			},
			responses: {
				200: {
					description: '',
				},
			},
		},
	},
	'/second-endpoint': {
		get: {
			"tags": [
				"second"
			],
			operationId: 'getSecond',
			responses: {
				200: {
					description: '',
				},
			},
		},
	},
	'/second-endpoint/{id}/{name}': {
		get: {
			"tags": [
				"second",
				"third"
			],
			operationId: 'getSomethingByIdAndName',
			responses: {
				200: {
					description: '',
				},
			},
			parameters: [{
				'name': 'id',
				'in': 'path',
				'description': '',
				'required': true,
				'type': 'string',
				'schema': {
					'type': 'string',
				},
			}, {
				'name': 'name',
				'in': 'path',
				'description': '',
				'required': true,
				'type': 'string',
				'schema': {
					'type': 'string',
				},
			}],
		},
	},
};

const expectedSchemas: { [key: string]: Schema } = {
	Todo: {
		properties: {
			title: {
				type: 'string',
			},
			description: {
				type: 'string',
			},
			version: {
				type: 'number',
			},
			cat: {
				'$ref': '#/components/schemas/Cat',
			},
		},
	},
	Cat: {
		properties: {
			name: {
				type: 'string',
			},
			breed: {
				type: 'string',
			},
		},
	},
	CatSearch: {
		properties: {
			name: {
				type: 'string',
			},
			breed: {
				type: 'string',
			},
			age: {
				type: 'number',
			},
		},
	},
};

Deno.test('Generate a module open api definition', async (ctx) => {
	const moduleDefinition = await swaggerModule.generateModuleDefinition(
		MyModule,
	);

	await ctx.step('create schemas for returned type', () => {
		assertEquals((moduleDefinition.schemas as any).Todo, expectedSchemas.Todo);
	});

	await ctx.step('create requestBody from @Body decorator', () => {
		assertEquals(
			moduleDefinition.paths['/my-endpoint'].post,
			controllerExpectedPaths['/my-endpoint'].post,
		);
	});

	await ctx.step('create requestBody from @BodyType decorator', () => {
		assertEquals(
			moduleDefinition.paths['/my-endpoint/somethingagain'].put,
			controllerExpectedPaths['/my-endpoint/somethingagain'].put,
		);
	});

	await ctx.step('Does not create responses content if there is none', () => {
		assertEquals(moduleDefinition.paths['/second-endpoint'].get?.responses, {
			200: {
				description: '',
			},
		});
	});

	await ctx.step('create paths from controllers', () => {
		assertEquals(moduleDefinition.paths, controllerExpectedPaths);
	});

	await ctx.step('create all schema from controllers', () => {
		assertEquals(moduleDefinition.schemas, expectedSchemas);
	});
});
