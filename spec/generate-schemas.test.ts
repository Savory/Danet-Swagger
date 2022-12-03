import {
	Body,
	Controller, DanetApplication,
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
import { SpecBuilder } from '../mod.ts';
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
	controllers: [SecondController],
})
class SecondModule {
}

@Module({
	imports: [SecondModule],
	controllers: [MyController],
})
class MyModule {
}



const controllerExpectedPaths: { [key: string]: Path } = {
	'/my-endpoint': {
		get: {
			operationId: 'getSomething',
			parameters: [{
				'name': 'name',
				'in': 'query',
				'description': '',
				'required': true,
				'schema': {
					'type': 'string',
				},
			}, {
				'name': 'breed',
				'in': 'query',
				'description': '',
				'required': false,
				'schema': {
					'type': 'string',
				},
			}, {
				'name': 'age',
				'in': 'query',
				'description': '',
				'required': false,
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
				'schema': {
					'type': 'string',
				},
			}, {
				'name': 'name',
				'in': 'path',
				'description': '',
				'required': true,
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

Deno.test('Generate app definition', async () => {
	const app = new DanetApplication();
	await app.init(MyModule);
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
	assertEquals(document, {
		info: {
			title: title,
			description: description,
			version: version
		},
		tags: [{
			name: tagName,
			description: ''
		}],
		servers: [],
		openapi: '3.0.3',
		components: {
			schemas: expectedSchemas,
		},
		paths: controllerExpectedPaths,
	})
});