import { Controller, Get, Module, Patch, Post, Put, Body } from '../deps.ts';
import { assertEquals } from './test_deps.ts';
import { SwaggerModule } from '../mod.ts';
import { ApiProperty, ReturnedType } from '../decorators.ts';
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

@Controller('my-endpoint')
class MyController {

  @ReturnedType(Todo)
  @Get()
  getSomething(): Todo {
    return new Todo();
  }

  @Post()
  postSomething(@Body() todo: Todo): number {
    return 1;
  }

  @Patch('somethingagain')
  patchSomething(): boolean {
    return true;
  }

  @Put('somethingagain')
  putSomething(): number {
    return 1;
  }
}

@Module({
  controllers: [MyController],
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
                "$ref": "#/components/schemas/Todo"
              },
            },
          },
        },
      },
    },
    post: {
      operationId: 'postSomething',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: {
                "$ref": "#/components/schemas/undefined"
              },
            },
          },
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
          content: {
            'application/json': {
              schema: {
                "$ref": "#/components/schemas/undefined"
              },
            },
          },
        },
      },
    },
    put: {
      operationId: 'putSomething',
      responses: {
        200: {
          description: '',
          content: {
            'application/json': {
              schema: {
                "$ref": "#/components/schemas/undefined"
              },
            },
          },
        },
      },
    },
  },
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
};

Deno.test("Generate a module open api definition", async () => {
    const moduleDefinition = await swaggerModule.generateModuleDefinition(MyModule);
    assertEquals(moduleDefinition, {
      paths: controllerExpectedPaths,
      components: expectedSchemas
    })
});