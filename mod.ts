import { MetadataHelper, trimSlash, ModuleConstructor, moduleMetadataKey } from './deps.ts';
import { Swagger } from './swagger.ts';
import DataType = Swagger.DataType;
import { RETURNED_TYPE_KEY } from './decorators.ts';
import Schema = Swagger.Schema;
import { BODY_TYPE_KEY } from '../Danet/src/router/controller/params/decorators.ts';
import Path = Swagger.Path;
import Operation = Swagger.Operation;
export type Constructor<T = unknown> = new (...args: any[]) => T;

export class SwaggerModule {

  async generateModuleDefinition(Module: ModuleConstructor) {
    const { controllers } = MetadataHelper.getMetadata<any>(
      moduleMetadataKey,
      Module,
    );
    let definition: {paths: { [key: string]: Path}, schemas: { [key: string]: Schema} } = { paths: {}, schemas: {}};
    for (const controller of controllers) {
      const {paths, schemas} = await this.generateControllerDefinition(controller);
      definition.paths = {
        ...definition.paths,
        ...paths,
      }
      definition.schemas = {
        ...definition.schemas,
        ...schemas
      }
    }
    return definition;
  }

  private async generateControllerDefinition(Controller: Constructor) {
      let pathKey = trimSlash(MetadataHelper.getMetadata('endpoint', Controller) as string);
      let paths: {[key:string]: Swagger.Path} = {};
      let schemas: {[key: string]: Schema} = {};
      const propertyNames = Object.getOwnPropertyNames(Controller.prototype);
      for (const methodName of propertyNames) {
        if (methodName !== 'constructor') {
          const newDefinition = this.addMethodDataToPathAndSchema(Controller, methodName, pathKey, paths);
          schemas = {
            ...schemas,
            ...newDefinition.schemas
          };
          paths = newDefinition.paths;
        }
      }
      return { paths, schemas };
  }

  private addMethodDataToPathAndSchema(Controller: Constructor, methodName: string, pathKey: string, paths: { [p: string]: Swagger.Path }) {
    const urlPath = trimSlash(MetadataHelper.getMetadata('endpoint', Controller.prototype[methodName]) as string);
    const httpMethod = MetadataHelper.getMetadata('method', Controller.prototype[methodName]) as string;


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
            }
          }
        }
      }
    }
    const responseSchema = this.createResponseAndSchemaFromReturnType(Controller, methodName, paths, pathUrl, httpMethod);
    const bodySchema = this.addRequestBodyAndGetSchema(Controller, methodName, paths, pathUrl, httpMethod);
    return {
      schemas : {
        ...responseSchema,
        ...bodySchema,
      },
      paths};
  }

  private createResponseAndSchemaFromReturnType(Controller: Constructor<unknown>, methodName: string, paths: { [p: string]: Swagger.Path }, pathUrl: string, httpMethod: string) {
    const returnedValue = MetadataHelper.getMetadata(RETURNED_TYPE_KEY, Controller.prototype, methodName) as Constructor;

    if (returnedValue) {
      const returnedValueSchema = this.generateTypeSchema(returnedValue);
      (paths[pathUrl][httpMethod?.toLowerCase() as keyof Path] as Operation).responses[200].content = {
        'application/json': {
          schema: {
            '$ref': `#/components/schemas/${returnedValue.name}`,
          }
        }
      };
      return returnedValueSchema;
    }
    return null;
  }

  private addRequestBodyAndGetSchema(Controller: Constructor<unknown>, methodName: string, paths: { [p: string]: Swagger.Path }, pathUrl: string, httpMethod: string) {
    const bodyType = MetadataHelper.getMetadata(BODY_TYPE_KEY, Controller.prototype, methodName) as Constructor;
    let requestBody;
    if (bodyType) {
      requestBody = {
        'description': '',
        'content': {
          'application/json': {
            'schema': {
              '$ref': `#/components/schemas/${bodyType.name}`
            }
          },
        },
        'required': true
      };
      (paths[pathUrl][httpMethod?.toLowerCase() as keyof Path] as Operation).requestBody = requestBody;
      return this.generateTypeSchema(bodyType);
    }
    return null;
  }


  private generateTypeSchema(Type: Constructor<any>) {
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

}