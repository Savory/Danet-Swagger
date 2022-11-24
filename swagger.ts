// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Swagger {
	export type DataType =
		| 'integer'
		| 'number'
		| 'boolean'
		| 'string'
		| 'array'
		| 'object'
		| 'file'
		| 'undefined';

	export type DataFormat =
		| 'int32'
		| 'int64'
		| 'float'
		| 'double'
		| 'byte'
		| 'binary'
		| 'date'
		| 'date-time'
		| 'password';

	export type Protocol = 'http' | 'https' | 'ws' | 'wss';

	export type SupportedSpecMajorVersion = 3;

	export interface Spec {
		info: Info;
		tags?: Tag[];
		externalDocs?: ExternalDocs;
		openapi: '3.0.0';
		servers: Server[];
		components: Components;
		paths: { [name: string]: Path };
	}

	export interface Components {
		callbacks?: { [name: string]: unknown };
		examples?: { [name: string]: Example | string };
		headers?: { [name: string]: unknown };
		links?: { [name: string]: unknown };
		parameters?: { [name: string]: Parameter };
		requestBodies?: { [name: string]: unknown };
		responses?: { [name: string]: Response };
		schemas?: { [name: string]: Schema };
		securitySchemes?: { [name: string]: SecuritySchemes };
	}

	export interface Server {
		url: string;
	}

	export interface Info {
		title: string;
		version?: string;
		description?: string;
		termsOfService?: string;
		contact?: Contact;
		license?: License;
	}

	export interface Contact {
		name?: string;
		email?: string;
		url?: string;
	}

	export interface License {
		name: string;
		url?: string;
	}

	export interface ExternalDocs {
		url: string;
		description?: string;
	}

	export interface Tag {
		name: string;
		description?: string;
		externalDocs?: ExternalDocs;
	}

	export interface Example {
		value: unknown;
		summary?: string;
		description?: string;
	}

	export interface BaseParameter extends Omit<Schema, 'required'> {
		name: string;
		in: 'query' | 'header' | 'path' | 'formData' | 'body';
		required?: boolean;
		description?: string;
		example?: unknown;
		examples?: { [name: string]: Example | string };
		schema: Schema;
		type: DataType;
		format?: DataFormat;
		deprecated?: boolean;
	}

	export interface BodyParameter extends BaseParameter {
		in: 'body';
	}

	export interface QueryParameter extends BaseParameter {
		in: 'query';
		allowEmptyValue?: boolean;
		collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
	}

	export function isQueryParameter(
		parameter: BaseParameter,
	): parameter is QueryParameter {
		return parameter.in === 'query';
	}

	export interface PathParameter extends BaseParameter {
		in: 'path';
	}

	export interface HeaderParameter extends BaseParameter {
		in: 'header';
	}

	export interface FormDataParameter extends BaseParameter {
		in: 'formData';
		collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
	}

	export type Parameter =
		| BodyParameter
		| FormDataParameter
		| QueryParameter
		| PathParameter
		| HeaderParameter;

	export interface Path {
		$ref?: string;
		get?: Operation;
		put?: Operation;
		post?: Operation;
		delete?: Operation;
		options?: Operation;
		head?: Operation;
		patch?: Operation;
		parameters?: Parameter[];
	}

	export interface Operation {
		tags?: string[];
		summary?: string;
		description?: string;
		externalDocs?: ExternalDocs;
		operationId: string;
		consumes?: string[];
		parameters?: Parameter[];
		responses: { [name: string]: Response };
		schemes?: Protocol[];
		deprecated?: boolean;
		security?: Security[];
		requestBody?: RequestBody;

		[ext: `x-${string}`]: unknown;
	}

	export interface RequestBody {
		content: { [requestMediaType: string]: MediaType };
		description?: string;
		required?: boolean;
	}

	export interface MediaType {
		schema?: Schema;
		example?: unknown;
		examples?: { [name: string]: Example | string };
		encoding?: { [name: string]: unknown };
	}

	export interface Response {
		description: string;
		content?: {
			[responseMediaType: string]: {
				schema: Schema;
				examples?: { [name: string]: Example | string };
			};
		};
		headers?: { [name: string]: Header };
	}

	export class Schema {
		type?: DataType;
		nullable?: boolean;
		anyOf?: Schema[];
		allOf?: Schema[];
		deprecated?: boolean;
		format?: DataFormat;
		additionalProperties?: boolean | Schema;
		properties?: { [propertyName: string]: Schema };
		discriminator?: string;
		readOnly?: boolean;
		xml?: XML;
		externalDocs?: ExternalDocs;
		example?: unknown;
		required?: string[];
		$ref?: string;
		title?: string;
		description?: string;
		default?: string | boolean | number | unknown;
		multipleOf?: number;
		maximum?: number;
		exclusiveMaximum?: number;
		minimum?: number;
		exclusiveMinimum?: number;
		maxLength?: number;
		minLength?: number;
		pattern?: string;
		maxItems?: number;
		minItems?: number;
		uniqueItems?: boolean;
		maxProperties?: number;
		minProperties?: number;
		enum?: Array<boolean | string | number | null>;
		'x-enum-varnames'?: string[];
		items?: Schema;
		[ext: `x-${string}`]: unknown;
	}

	export interface Header extends Omit<Schema, 'required'> {
		required?: boolean;
		description?: string;
		example?: unknown;
		examples?: {
			[name: string]: Example | string;
		};
		schema: Schema;
		type?: DataType;
		format?: DataFormat;
	}

	export interface XML {
		type?: string;
		namespace?: string;
		prefix?: string;
		attribute?: string;
		wrapped?: boolean;
	}

	interface BaseSecurity {
		description?: string;
	}

	interface BaseOAuthSecurity extends BaseSecurity {
		scopes?: OAuthScope;
	}

	export interface BasicSecurity extends BaseSecurity {
		type: 'http';
		scheme: 'basic';
	}

	export interface ApiKeySecurity extends BaseSecurity {
		type: 'apiKey';
		name: string;
		in: 'query' | 'header';
	}

	export interface OAuth2Security3 extends BaseSecurity {
		type: 'oauth2';
		flows: OAuthFlow;
	}

	export interface OAuth2SecurityFlow3 extends BaseSecurity {
		tokenUrl?: string;
		authorizationUrl?: string;
		scopes?: OAuthScope;
	}

	export interface OAuth2ImplicitSecurity extends BaseOAuthSecurity {
		type: 'oauth2';
		description?: string;
		flow: 'implicit';
		authorizationUrl: string;
	}

	export interface OAuth2PasswordSecurity extends BaseOAuthSecurity {
		type: 'oauth2';
		flow: 'password';
		tokenUrl: string;
	}

	export interface OAuth2ApplicationSecurity extends BaseOAuthSecurity {
		type: 'oauth2';
		flow: 'application';
		tokenUrl: string;
	}

	export interface OAuth2AccessCodeSecurity extends BaseOAuthSecurity {
		type: 'oauth2';
		flow: 'accessCode';
		tokenUrl: string;
		authorizationUrl: string;
	}

	export interface OAuthScope {
		[scopeName: string]: string;
	}

	export type OAuthFlow = {
		[flowName in OAuth2FlowTypes]?: OAuth2SecurityFlow3;
	};
	export type OAuth2FlowTypes =
		| 'authorizationCode'
		| 'implicit'
		| 'password'
		| 'clientCredentials';
	export type SecuritySchemes =
		| BasicSecurity
		| BasicSecurity
		| ApiKeySecurity
		| OAuth2AccessCodeSecurity
		| OAuth2ApplicationSecurity
		| OAuth2ImplicitSecurity
		| OAuth2PasswordSecurity
		| OAuth2Security3;
	export interface Security {
		[key: string]: string[];
	}
}
