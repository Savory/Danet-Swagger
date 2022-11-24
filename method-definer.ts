import { Swagger } from './swagger.ts';
import { Constructor } from './mod.ts';
import { trimSlash } from '../Danet/src/router/utils.ts';
import { MetadataHelper } from '../Danet/src/metadata/helper.ts';
import { RETURNED_TYPE_KEY } from './decorators.ts';
import { RequestBodyBuilder, ResponseBuilder } from './builder.ts';
import { BODY_TYPE_KEY } from '../Danet/src/router/controller/params/decorators.ts';
import DataType = Swagger.DataType;
import Path = Swagger.Path;
import Operation = Swagger.Operation;
import Schema = Swagger.Schema;

export class MethodDefiner {

  private pathKey: string;
  private readonly httpMethod: keyof Path;
  private urlPath: string;
  private readonly pathUrl: string;

  constructor(private Controller: Constructor, private methodName: string) {
    this.pathKey = trimSlash(MetadataHelper.getMetadata<string>('endpoint', Controller));
    this.httpMethod = MetadataHelper.getMetadata<string>('method', Controller.prototype[methodName]).toLowerCase() as keyof Path;
    this.urlPath = trimSlash(MetadataHelper.getMetadata<string>('endpoint', Controller.prototype[methodName]));
    this.pathUrl = this.urlPath ? `/${this.pathKey}/${this.urlPath}` : `/${this.pathKey}`;
  }


  public addMethodDefinitionToActual(paths: { [p: string]: Path }, schemas : { [p:string] : Schema}) {
    paths = this.addActualMethodToPath(paths)
    let actualPath = (paths[this.pathUrl][this.httpMethod] as Operation);
    const responseSchema = this.createResponseAndSchemaFromReturnType(actualPath);
    const bodySchema = this.addRequestBodyAndGetSchema(actualPath);
    schemas = {
      ...schemas,
      ...responseSchema,
      ...bodySchema,
    }

    return {
      schemas,
      paths};
  }

  private addActualMethodToPath(paths: { [p: string]: Path }) {
    return {
      ...paths,
      [this.pathUrl]: {
        ...paths[this.pathUrl],
        [this.httpMethod]: {
          operationId: this.methodName,
          responses: {
            200: {
              description: '',
            }
          }
        }
      }
    };
  }

  private createResponseAndSchemaFromReturnType(actualPath: Operation) {
    const returnedValue = MetadataHelper.getMetadata(RETURNED_TYPE_KEY, this.Controller.prototype, this.methodName) as Constructor;
    if (returnedValue) {
      const returnedValueSchema = this.generateTypeSchema(returnedValue);
      actualPath.responses[200] = new ResponseBuilder().jsonContent(  {
        '$ref': `#/components/schemas/${returnedValue.name}`,
      }).setDescription('').get();
      return returnedValueSchema;
    }
    return null;
  }

  private addRequestBodyAndGetSchema(actualPath: Operation) {
    const bodyType = MetadataHelper.getMetadata(BODY_TYPE_KEY, this.Controller.prototype, this.methodName) as Constructor;
    if (bodyType) {
      actualPath.requestBody = new RequestBodyBuilder().jsonContent({'$ref': `#/components/schemas/${bodyType.name}`}).setDescription('').get();
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
        const propertyType = typeFunction.name;
        if (['string', 'number'].includes(propertyType.toLowerCase())) {
          schema![name]!.properties![propertyName] = {
            type: propertyType.toLowerCase() as DataType
          }
        } else {
          schema![name]!.properties![propertyName] = {
            $ref: `#/components/schemas/${propertyType}`
          }
        }
      }
    });

    return schema;
  }
}