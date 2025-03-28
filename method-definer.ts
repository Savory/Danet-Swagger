import { Swagger } from './swagger.ts';
import { Constructor } from './mod.ts';
import { API_PROPERTY, API_SECURITY, DESCRIPTION_KEY, OPTIONAL_KEY, RETURNED_TYPE_KEY, TAGS_KEY } from './decorators.ts';
import { RequestBodyBuilder, ResponseBuilder } from './builder.ts';
import DataType = Swagger.DataType;
import DataFormat = Swagger.DataFormat;
import Path = Swagger.Path;
import Operation = Swagger.Operation;
import Schema = Swagger.Schema;
import {
	BODY_TYPE_KEY,
	MetadataHelper,
	parse,
	type Token,
	QUERY_TYPE_KEY,
	trimSlash,
} from './deps.ts';
import Parameter = Swagger.Parameter;
import { zodQuerySchemaKey, zodBodySchemaKey, RETURNED_SCHEMA_KEY } from '@danet/zod';
import { ZodSchema } from 'zod';
import { generateSchema, type OpenApiZodAny } from 'zod-openapi';

const primitiveTypes = [
	'string',
	'number',
	'boolean',
	'date',
	'object',
	'array',
];

function isPrimitive(type: string) {
	return primitiveTypes.includes(type);
}

export class MethodDefiner {
	private pathKey: string;
	private readonly httpMethod: keyof Path;
	private readonly pathUrl: string;
	private pathTokens: Token[] = [];
	private containsUrlParams = false;
	private schemas: { [key: string]: Schema } = {};
	constructor(private Controller: Constructor, private methodName: string) {
		this.pathKey = trimSlash(
			MetadataHelper.getMetadata<string>('endpoint', Controller),
		);
		this.httpMethod = MetadataHelper.getMetadata<string>(
			'method',
			Controller.prototype[methodName],
		).toLowerCase() as keyof Path;
		const urlPath = trimSlash(
			MetadataHelper.getMetadata<string>(
				'endpoint',
				Controller.prototype[methodName],
			),
		);
		this.pathUrl = urlPath ? `/${this.pathKey}/${urlPath}` : `/${this.pathKey}`;
		this.pathUrl = this.getPathTokenAndTransformUrl(this.pathUrl);
	}

	public addMethodDefinitionToActual(
		paths: { [p: string]: Path },
		schemas: { [p: string]: Schema },
	) {
		paths = this.addActualMethodPath(paths);
		const actualPath = (paths[this.pathUrl][this.httpMethod] as Operation);
		this.addTags(actualPath);
		this.addUrlParams(actualPath);
		this.addQueryParams(actualPath);
		this.addResponse(actualPath);
		this.addRequestBody(actualPath);
		this.addSecurity(actualPath);
		this.addDescription(actualPath);
		schemas = {
			...schemas,
			...this.schemas,
		};

		return {
			schemas,
			paths,
		};
	}

	private addSecurity(actualPath: Operation) {
		const controllerSecurity = MetadataHelper.getMetadata<Record<string, string[]>>(
			API_SECURITY,
			this.Controller,
		);
		const methodSecurity = MetadataHelper.getMetadata<Record<string, string[]>>(
			API_SECURITY,
			this.Controller.prototype,
			this.methodName,
		);
		if (methodSecurity || controllerSecurity) {
			actualPath.security = [];
			if (methodSecurity) {
				actualPath.security.push(methodSecurity)
			}
			if (controllerSecurity) {
				actualPath.security.push(controllerSecurity)
			}
			actualPath.security = [...new Map(actualPath.security.map(v => [JSON.stringify(v), v])).values()]
		}
	}
	private addTags(actualPath: Operation) {
		const controllerTag = MetadataHelper.getMetadata<string>(
			TAGS_KEY,
			this.Controller,
		);
		const methodTag = MetadataHelper.getMetadata<string>(
			TAGS_KEY,
			this.Controller.prototype,
			this.methodName,
		);
		if (controllerTag || methodTag) {
			actualPath.tags = [controllerTag, methodTag].filter((t) => !!t);
		}
	}

	private addDescription(actualPath: Operation) {
		const methodDescription = MetadataHelper.getMetadata<string>(
			DESCRIPTION_KEY,
			this.Controller.prototype,
			this.methodName,
		);
		if (methodDescription) {
			actualPath.description = methodDescription;
		}
	}

	private addUrlParams(actualPath: Operation) {
		if (this.containsUrlParams && !actualPath.parameters) {
			actualPath.parameters = [];
		}
		for (const item of this.pathTokens) {
			if (typeof item === 'string') continue;
			actualPath.parameters!.push({
				name: `${item.name}`,
				in: 'path',
				description: '',
				required: true,
				schema: {
					type: 'string',
				},
			});
		}
	}

	private addQueryParams(actualPath: Operation) {
		const queryType = MetadataHelper.getMetadata(
			QUERY_TYPE_KEY,
			this.Controller.prototype,
			this.methodName,
		) as Constructor;
		if (queryType) {
			if (!actualPath.parameters) {
				actualPath.parameters = [];
			}
			this.generateTypeSchema(queryType);
			const emptyInstance = Reflect.construct(queryType, []);
			Object.getOwnPropertyNames(emptyInstance).forEach((propertyName) => {
				const typeFunction = MetadataHelper.getMetadata(
					'design:type',
					queryType.prototype,
					propertyName,
				) as Constructor<any>;
				const isRequired = !MetadataHelper.getMetadata(
					OPTIONAL_KEY,
					queryType.prototype,
					propertyName,
				) as boolean;
				if (typeFunction) {
					const propertyType = typeFunction;
					const propertyTypeName = propertyType.name;
					const paramToAdd: Partial<Parameter> = {
						name: `${propertyName}`,
						in: 'query',
						description: '',
						required: isRequired,
					};
					if (isPrimitive(propertyTypeName.toLowerCase())) {
						paramToAdd.schema = this.getPropertyType(
							propertyTypeName.toLowerCase(),
						);
					} else {
						this.generateTypeSchema(propertyType);
						paramToAdd.schema = {
							$ref: `#/components/schemas/${propertyTypeName}`,
						};
					}
					actualPath.parameters!.push(paramToAdd as Parameter);
				}
			});
			return;
		}
		const zodSchema = MetadataHelper.getMetadata<ZodSchema>(
			zodQuerySchemaKey,
			this.Controller,
			this.methodName
		);
		if (zodSchema) {
			if (!actualPath.parameters) {
				actualPath.parameters = [];
			}
			const openApiSchema = this.generateZodSchema(zodSchema);
			Object.getOwnPropertyNames(openApiSchema.properties).forEach((propertyName) => {
				const property = (openApiSchema.properties as any)![propertyName]!;
				const paramToAdd: Partial<Parameter> = {
					name: `${propertyName}`,
					in: 'query',
					description: '',
					required: openApiSchema.required?.includes(propertyName),
					schema: property
				};
				actualPath.parameters!.push(paramToAdd as Parameter);
			});
		}
	}

	private getPropertyType(propertyType: string) {
		if (propertyType === 'date') {
			return {
				type: 'string' as DataType,
				format: 'date-time' as DataFormat,
			};
		} else {
			return {
				type: propertyType as DataType,
			};
		}
	}

	private getPathTokenAndTransformUrl(urlPath: string) {
		let pathWithParams = '';
		this.pathTokens = parse(urlPath);
		for (const item of this.pathTokens) {
			if (typeof item === 'string') {
				pathWithParams += item;
			} else {
				this.containsUrlParams = true;
				pathWithParams += `${item.prefix}{${item.name}}`;
			}
		}
		return pathWithParams;
	}

	private addActualMethodPath(paths: { [p: string]: Path }) {
		return {
			...paths,
			[this.pathUrl]: {
				...paths[this.pathUrl],
				[this.httpMethod]: {
					operationId: this.methodName,
					responses: {
						200: {
							description: '',
						},
					},
				},
			},
		};
	}

	private addResponse(actualPath: Operation) {
		let returnedValue = MetadataHelper.getMetadata<{
			returnedType: Constructor;
			isArray: boolean | undefined;
		}>(
			RETURNED_TYPE_KEY,
			this.Controller.prototype,
			this.methodName,
		);
		const returnedSchema = MetadataHelper.getMetadata<{
			returnedSchema: OpenApiZodAny;
			isArray: boolean | undefined;
		}>(
			RETURNED_SCHEMA_KEY,
			this.Controller.prototype,
			this.methodName
		);
		if (!returnedValue && !returnedSchema) {
			const returnedType = MetadataHelper.getMetadata<Constructor>(
				'design:returntype',
				this.Controller.prototype,
				this.methodName,
			);
			if (returnedType) {
				returnedValue = {
					returnedType,
					isArray: false,
				};
			}
		}
		if (returnedValue) {
			if (isPrimitive(returnedValue.returnedType.name.toLowerCase())) {
				if (returnedValue.isArray) {
					actualPath.responses[200] = new ResponseBuilder().jsonContent({
						type: 'array',
						items: {
							type: returnedValue.returnedType.name.toLowerCase() as DataType,
						},
					}).setDescription('').get();
					return;
				}
				actualPath.responses[200] = new ResponseBuilder().jsonContent({
						type: returnedValue.returnedType.name.toLowerCase() as DataType,
					}).setDescription('').get();
				return;
			}
			if (returnedValue.isArray) {
				actualPath.responses[200] = new ResponseBuilder().jsonContent({
					type: 'array',
					items: {
						'$ref': `#/components/schemas/${returnedValue.returnedType.name}`,
					},
				}).setDescription('').get();
			} else {
				actualPath.responses[200] = new ResponseBuilder().jsonContent({
					'$ref': `#/components/schemas/${returnedValue.returnedType.name}`,
				}).setDescription('').get();
			}
			this.generateTypeSchema(returnedValue.returnedType);
			return;
		}

		if (returnedSchema) {
			const openApiSchema = this.generateZodSchema(returnedSchema.returnedSchema);
			if (returnedSchema.isArray) {
				actualPath.responses[200] = new ResponseBuilder().jsonContent({
					type: 'array',
					items: {
						'$ref': `#/components/schemas/${openApiSchema.title}`,
					},
				}).setDescription('').get();
			} else {
				actualPath.responses[200] = new ResponseBuilder().jsonContent({
					'$ref': `#/components/schemas/${openApiSchema.title}`,
				}).setDescription('').get();
			}
			return;
		}

		return null;
	}

	private addRequestBody(actualPath: Operation) {
		const bodyType = MetadataHelper.getMetadata(
			BODY_TYPE_KEY,
			this.Controller.prototype,
			this.methodName,
		) as Constructor;
		if (bodyType) {
			actualPath.requestBody = new RequestBodyBuilder().jsonContent({
				'$ref': `#/components/schemas/${bodyType.name}`,
			}).setDescription('').get();
			this.generateTypeSchema(bodyType);
			return null;
		}
		const zodSchema = MetadataHelper.getMetadata<ZodSchema>(
			zodBodySchemaKey,
			this.Controller,
			this.methodName
		);
		if (zodSchema) {
			const openApiSchema = this.generateZodSchema(zodSchema);
			actualPath.requestBody = new RequestBodyBuilder().jsonContent({
				'$ref': `#/components/schemas/${openApiSchema.title}`,
			}).setDescription('').get();
		}
		return null;
	}

	private generateZodSchema(zodSchema: OpenApiZodAny) {
		const openApiSchema = generateSchema(zodSchema);
		Object.getOwnPropertyNames(openApiSchema.properties).forEach((propertyName) => {
			const property = structuredClone((openApiSchema.properties as any)![propertyName]!);

			if (Object.hasOwn(property, 'properties') && Object.hasOwn(property, 'title')) {
				let schemaTitle = property.title;
				this.schemas = {
					...this.schemas,
					[schemaTitle]: property,
				};
				(openApiSchema.properties as any)![propertyName] = { "$ref": `#/components/schemas/${schemaTitle}` }
			}
		})
		const schema: {
			[key: string]: Swagger.Schema;
		} = {
			[openApiSchema.title!]: openApiSchema as any,
		};
		this.schemas = {
			...this.schemas,
			...schema,
		};
		return openApiSchema;
	}
	private generateTypeSchema(Type: Constructor<any>) {
		const emptyInstance = Reflect.construct(Type, []);
		const name = Type.name;
		const schema: {
			[key: string]: Swagger.Schema;
		} = {
			[Type.name]: {
				properties: {},
			},
		};
		Object.getOwnPropertyNames(emptyInstance).forEach((propertyName) => {
			if (schema && schema[name] && schema[name].properties) {
				const typeFunction = MetadataHelper.getMetadata(
					'design:type',
					Type.prototype,
					propertyName,
				) as Function;
				const isOptional = !!(MetadataHelper.getMetadata(
					OPTIONAL_KEY,
					Type.prototype,
					propertyName,
				) as boolean);
				const attributesProperties = MetadataHelper.getMetadata(
					API_PROPERTY,
					Type.prototype,
					propertyName,
				);
				if (typeFunction) {
					const propertyType = typeFunction.name;
					if (isPrimitive(propertyType.toLowerCase())) {
						schema![name]!.properties![propertyName] = this.getPropertyType(
							propertyType.toLowerCase(),
						);
					} else {
						schema![name]!.properties![propertyName] = {
							$ref: `#/components/schemas/${propertyType}`,
						};
					}
					if (!isOptional) {
						if (!(schema![name]!.required)) {
							schema![name]!.required = [];
						}
						schema![name]!.required!.push(propertyName);
					}
					if (attributesProperties) {
						schema![name]!.properties![propertyName] = {
							...schema![name]!.properties![propertyName],
							...attributesProperties,
						}
					}
				}
			}
		});

		this.schemas = {
			...this.schemas,
			...schema,
		};
	}
}
