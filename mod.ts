import {
	DanetApplication,
	MetadataHelper,
	ModuleConstructor,
	moduleMetadataKey,
	path,
	trimSlash,
} from './deps.ts';
import { Swagger } from './swagger.ts';
import Schema = Swagger.Schema;
import Path = Swagger.Path;
import { MethodDefiner } from './method-definer.ts';

export type Constructor<T = unknown> = new (...args: any[]) => T;

export class SwaggerModule {
	static async createDocument(app: DanetApplication, spec: Swagger.Spec): Promise<Swagger.Spec> {
		const definition = await this.generateModuleDefinition(app.entryModule);
		spec.paths = definition.paths;
		spec.components = {
			...spec.components,
			schemas: definition.schemas,
		};
		return spec;
	}

	private static async generateModuleDefinition(Module: ModuleConstructor) {
		const { controllers, imports } = MetadataHelper.getMetadata<any>(
			moduleMetadataKey,
			Module,
		);
		const definition: {
			paths: { [key: string]: Path };
			schemas: { [key: string]: Schema };
		} = { paths: {}, schemas: {} };
		if (imports) {
			for (const childModule of imports) {
				const childDef = await this.generateModuleDefinition(childModule);
				definition.paths = { ...definition.paths, ...childDef.paths };
				definition.schemas = { ...definition.schemas, ...childDef.schemas };
			}
		}
		if (controllers) {
			for (const controller of controllers) {
				const { paths, schemas } = this.generateControllerDefinition(
					controller,
				);
				definition.paths = {
					...definition.paths,
					...paths,
				};
				definition.schemas = {
					...definition.schemas,
					...schemas,
				};
			}
		}
		return definition;
	}

	private static generateControllerDefinition(Controller: Constructor) {
		let paths: { [key: string]: Swagger.Path } = {};
		let schemas: { [key: string]: Schema } = {};
		const propertyNames = Object.getOwnPropertyNames(Controller.prototype);
		for (const methodName of propertyNames) {
			if (methodName !== 'constructor') {
				const methodDefiner = new MethodDefiner(Controller, methodName);
				const newDefinition = methodDefiner.addMethodDefinitionToActual(
					paths,
					schemas,
				);
				paths = newDefinition.paths;
				schemas = newDefinition.schemas;
			}
		}
		return { paths, schemas };
	}

	static async setup(
		apiPath: string,
		app: DanetApplication,
		document: Swagger.Spec,
	) {
		// const url = new URL('./swagger.html', import.meta.url).href;
		// const swaggerHtml = await (await fetch(url)).text();
		apiPath = trimSlash(apiPath);
		app.router.get(`/${apiPath}`, async (context, next) => {
			return context.html(`<!doctype html>
<html>
<head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta
            name="viewport"
            content="width=device-width, initial-scale=1" />
    <style>
        body {
            margin: 0;
        }
    </style>
</head>
<body>
<script
  id="api-reference"
  type="application/json">
  ${JSON.stringify(document)}
</script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`);
		});
		app.router.get(`/${apiPath}/json`, async (context, next) => {
			return context.json(document);
		});
	}
}

export { SpecBuilder } from './builder.ts';
