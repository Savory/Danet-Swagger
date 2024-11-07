import {
	ApiBasicAuth, ApiBearerAuth, ApiCookieAuth, ApiOAuth2,
	ApiProperty, ApiSecurity,
	BodyType,
	Optional,
	QueryType,
	ReturnedType,
	Tag,
} from '../decorators.ts';
import {
	Controller,
	Get,
	Patch,
	Post,
	Put,
} from '@danet/core';
import {
	Body,
	Param,
	Query,
} from '@danet/core';
import { Module } from '@danet/core';
import { DanetApplication } from '@danet/core';
import { Query as ZodQuery, Body as ZodBody, ReturnedSchema } from '@danet/zod';
import { z } from 'zod';
import { extendZodWithOpenApi } from 'zod-openapi';

extendZodWithOpenApi(z);

const ZodCat = z.object({
	name: z.string(),
	breed: z.string(),
	dob: z.date(),
	isHungry: z.boolean().optional(),
	hobbies: z.array(z.any())
}).openapi({
	title: 'ZodCat'
})

type ZodCat = z.infer<typeof ZodCat>;

class Cat {
	@ApiProperty()
	name!: string;

	@ApiProperty()
	breed!: string;

	@ApiProperty()
	dob!: Date;

	@Optional()
	@ApiProperty()
	isHungry?: boolean;

	@ApiProperty()
	color?: any;

	@ApiProperty()
	hobbies?: any[];

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

	nonDecoratedProperty!: string;

	constructor(name: string) {
		this.name = name;
	}
}


const ZodTodo = z.object({
	title: z.string(),
	description: z.string(),
	version: z.number(),
	cat: ZodCat,
}).openapi({
	title: 'ZodTodo'
})

type ZodTodo = z.infer<typeof ZodTodo>;
class Todo {
	@ApiProperty({
		description: 'my description'
	})
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

const NameSearch = z.object({
	name: z.string(),
}).openapi(
	{
		title: 'NameSearch'
	}
);

type NameSearch = z.infer<typeof NameSearch>;

@Controller('hello')
class HelloController {
	@Get()
	hello(@ZodQuery(NameSearch) search: NameSearch) {
		return `Hello ${search.name}`;
	}
}

@Controller('zod')
class ZodController {
	@Post()
	posZodSomething(@ZodBody(ZodTodo) todo: ZodTodo): number {
		return 1;
	}

	@ReturnedSchema(ZodCat, true)
	@Get()
	getZodSomething() {
		return [new Cat()]
	}
}

@Controller('my-endpoint')
class MyController {

	@ApiBearerAuth()
	@ReturnedType(Cat, true)
	@QueryType(CatSearch)
	@Get()
	getSomething(): Cat[] {
		return [new Cat()];
	}

	@ApiOAuth2(['my-permission:all'])
	@ReturnedType(Todo)
	@Post()
	postSomething(@Body() todo: Todo): number {
		return 1;
	}

	@ApiCookieAuth()
	@ReturnedType(Boolean)
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



@ApiBasicAuth()
@Tag('second')
@Controller('second-endpoint')
class SecondController {
	@ApiSecurity('basic')
	@Get()
	getSecond() {
		return 'hello';
	}

	@Tag('third')
	@Get(':id/:name')
	getSomethingByIdAndName(@Param('id') id: string) {
	}
}

@Module({
	controllers: [SecondController, HelloController, ZodController],
})
class SecondModule {
}

@Module({
	imports: [SecondModule],
	controllers: [MyController],
})
class MyModule {
}

export const app = new DanetApplication();
await app.init(MyModule);
