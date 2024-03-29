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
} from 'https://deno.land/x/danet/src/router/controller/decorator.ts';
import {
	Body,
	Param,
	Query,
} from 'https://deno.land/x/danet/src/router/controller/params/decorators.ts';
import { Module } from 'https://deno.land/x/danet/src/module/decorator.ts';
import { DanetApplication } from 'https://deno.land/x/danet/src/app.ts';

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

export class NameSearch {
	@ApiProperty()
	name!: string;
}

@Controller('hello')
class HelloController {
	@Get()
	@QueryType(NameSearch)
	hello(@Query() search: NameSearch) {
		return `Hello ${search.name}`;
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
	controllers: [SecondController, HelloController],
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
