import { Controller, Get, Module, Patch, Post, Put, Body } from '../deps.ts';
import { assertEquals } from './test_deps.ts';
import { SwaggerModule } from '../mod.ts';
import { ApiProperty, BodyType, ReturnedType } from '../decorators.ts';
import { Swagger } from '../swagger.ts';
import Schema = Swagger.Schema;
import Path = Swagger.Path;

class Todo {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  version!: number;

  constructor() {
  }
}

class Cat {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  breed!: string;

  constructor() {
  }
}

@Controller('my-endpoint')
class MyController {

  @ReturnedType(Cat)
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

@Controller('second-endpoint')
class SecondController {

  @Get()
  getSecond() {
    return;
  }
}

@Module({
  controllers: [MyController, SecondController],
})
class MyModule {}

const swaggerModule = new SwaggerModule();

const controllerExpectedPaths: { [key: string]: Path } = {
  '/my-endpoint': {
    get: {
      operationId: 'getSomething',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: {
                "$ref": "#/components/schemas/Cat"
              },
            },
          },
        },
      },
    },
    post: {
      operationId: 'postSomething',
      "requestBody": {
        "description": "",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Todo"
            }
          },
        },
        "required": true
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
      "requestBody": {
        "description": "",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Todo"
            }
          },
        },
        "required": true
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
      operationId: 'getSecond',
      responses: {
        200: {
          description: ''
        },
      },
    }
  }
};

const expectedSchemas: {[key: string]: Schema} = {
  Todo: {
    properties: {
      title: {
        type: 'string'
      },
      description: {
        type: 'string'
      },
      version: {
        type: 'number'
      }
    }
  },
  Cat: {
    properties: {
      name: {
        type: 'string'
      },
      breed: {
        type: 'string'
      }
    }
  },
};

Deno.test("Generate a module open api definition", async (ctx) => {
    const moduleDefinition = await swaggerModule.generateModuleDefinition(MyModule);

  await ctx.step('create schemas for returned type', () => {
    assertEquals((moduleDefinition.schemas as any).Todo, expectedSchemas.Todo);
  })

  await ctx.step('create requestBody from @Body decorator', () => {
    assertEquals(moduleDefinition.paths['/my-endpoint'].post, controllerExpectedPaths[ '/my-endpoint'].post);
  })

  await ctx.step('create requestBody from @BodyType decorator', () => {
    assertEquals(moduleDefinition.paths['/my-endpoint/somethingagain'].put, controllerExpectedPaths[ '/my-endpoint/somethingagain'].put);
  })

  await ctx.step('Does not create responses content if there is none', () => {
    assertEquals(moduleDefinition.paths['/second-endpoint'].get, {
      operationId: 'getSecond',
      responses: {
        200: {
          description: ''
        },
      },
    })
  })

  await ctx.step('create paths from controllers', () => {
    assertEquals(moduleDefinition.paths, controllerExpectedPaths);
  })

});