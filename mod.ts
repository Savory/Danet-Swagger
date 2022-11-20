import { MetadataHelper, ModuleConstructor, moduleMetadataKey } from './deps.ts';
import { Swagger } from './swagger.ts';
import Schema = Swagger.Schema;
import Path = Swagger.Path;
import { MethodDefiner } from './method-definer.ts';

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
      let paths: {[key:string]: Swagger.Path} = {};
      let schemas: {[key: string]: Schema} = {};
      const propertyNames = Object.getOwnPropertyNames(Controller.prototype);
      for (const methodName of propertyNames) {
        if (methodName !== 'constructor') {
          const methodDefiner = new MethodDefiner(Controller, methodName);
          const newDefinition = methodDefiner.addMethodDefinitionToActual(paths, schemas);
          paths = newDefinition.paths;
          schemas = newDefinition.schemas;
        }
      }
      return { paths, schemas };
  }


}