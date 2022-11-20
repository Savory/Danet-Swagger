import { MetadataHelper, trimSlash, ModuleConstructor, moduleMetadataKey } from './deps.ts';
import { Swagger } from './swagger.ts';
import DataType = Swagger.DataType;
import { RETURNED_TYPE_KEY } from './decorators.ts';
import Schema = Swagger.Schema;
export type Constructor<T = unknown> = new (...args: any[]) => T;

export class SwaggerModule {

  async generateModuleDefinition(Module: ModuleConstructor) {
    const { controllers } = MetadataHelper.getMetadata<any>(
      moduleMetadataKey,
      Module,
    );
    let schema = { paths: {}, components: {}};
    for (const controller of controllers) {
      const {paths, schemas} = await this.generateControllerDefinition(controller);
      schema.paths = {
        ...schema.paths,
        ...paths,
      }
      schema.components = {
        ...schema.components,
        ...schemas
      }
    }
    return schema;
  }

  async generateTypeSchema(Type: Constructor<any>) {
    const emptyInstance = Reflect.construct(Type, []);
    const name = Type.name;
    const schema: {
      [key: string]: Swagger.Schema
    } = {
      [Type.name]: {
        properties: {
        }
      }
    };
      Object.getOwnPropertyNames(emptyInstance).forEach((propertyName) => {
        if (schema && schema[name] && schema[name].properties) {
          let typeFunction = MetadataHelper.getMetadata('design:type', Type.prototype, propertyName) as Function;
          const propertyType = typeFunction.name.toLowerCase() as DataType;
          schema![name]!.properties![propertyName] = {
            type: propertyType
          }
        }
      });

    return schema;
  }

  async generateControllerDefinition(Controller: Constructor) {
      let pathKey = trimSlash(MetadataHelper.getMetadata('endpoint', Controller) as string);
      let paths: {[key:string]: Swagger.Path} = {};
      let schemas: {[key: string]: Schema} = {};
      const propertyNames = Object.getOwnPropertyNames(Controller.prototype);
      for (const methodName of propertyNames) {
        if (methodName !== 'constructor') {
          const newDefinition = await this.addMethodDataToPathAndSchema(Controller, methodName, schemas, pathKey, paths);
          schemas = newDefinition.schemas;
          paths = newDefinition.paths;
        }
      }
      return { paths, schemas };
  }

  private async addMethodDataToPathAndSchema(Controller: Constructor, methodName: string, schemas: { [p: string]: Swagger.Schema }, pathKey: string, paths: { [p: string]: Swagger.Path }) {
    const urlPath = trimSlash(MetadataHelper.getMetadata('endpoint', Controller.prototype[methodName]) as string);
    const httpMethod = MetadataHelper.getMetadata('method', Controller.prototype[methodName]) as string;
    const returnedValue = MetadataHelper.getMetadata(RETURNED_TYPE_KEY, Controller.prototype, methodName) as Constructor;

    if (returnedValue) {
      const returnedValueSchema = await this.generateTypeSchema(returnedValue);
      schemas = {
        ...schemas,
        ...returnedValueSchema,
      }
    }

    const pathUrl = urlPath ? `/${pathKey}/${urlPath}` : `/${pathKey}`;
    paths = {
      ...paths,
      [pathUrl]: {
        ...paths[pathUrl],
        [httpMethod?.toLowerCase()]: {
          operationId: methodName,
          responses: {
            200: {
              description: '',
              content: {
                'application/json': {
                  schema: {
                    '$ref': `#/components/schemas/${returnedValue?.name}`,
                  }
                }
              }
            }
          }
        }
      }
    }
    return {schemas, paths};
  }
}