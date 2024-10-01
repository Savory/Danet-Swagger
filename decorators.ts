import { BODY_TYPE_KEY, MetadataHelper, QUERY_TYPE_KEY } from './deps.ts';
import { Constructor } from './mod.ts';
import { Swagger } from "./swagger.ts";

type DecoratorFunction = (
	// deno-lint-ignore ban-types
	target: Object,
	propertyKey?: string | symbol,
	descriptor?: PropertyDescriptor,
) => void;

export const API_PROPERTY = 'api-property';

export function ApiProperty(property?: Swagger.Schema): DecoratorFunction {
	return (
		// deno-lint-ignore ban-types
		target: Object,
		propertyKey?: string | symbol,
		descriptor?: PropertyDescriptor,
	) => {
		MetadataHelper.setMetadata(API_PROPERTY, property ?? null, target, propertyKey);
	};
}

export const OPTIONAL_KEY = 'optional';

export function Optional(): DecoratorFunction {
	return (
		// deno-lint-ignore ban-types
		target: Object,
		propertyKey?: string | symbol,
		descriptor?: PropertyDescriptor,
	) => {
		MetadataHelper.setMetadata(OPTIONAL_KEY, true, target, propertyKey);
	};
}

export const RETURNED_TYPE_KEY = 'returntype';

export function ReturnedType(returnedType: unknown, isArray?: boolean): DecoratorFunction {
	return (
	target: Object,
	propertyKey?: string | symbol,
	descriptor?: any,
) => {
	MetadataHelper.setMetadata(
		RETURNED_TYPE_KEY,
		{
			returnedType,
			isArray,
		},
		target,
		propertyKey,
	);
};
}

export function BodyType(type: Constructor): DecoratorFunction {
	return (
		target: Object,
		propertyKey?: string | symbol,
		descriptor?: PropertyDescriptor,
	) => {
		MetadataHelper.setMetadata(BODY_TYPE_KEY, type, target, propertyKey);
	};
}

export function QueryType(type: Constructor) : DecoratorFunction {
return (
	target: Object,
	propertyKey?: string | symbol,
	descriptor?: PropertyDescriptor,
) => {
	MetadataHelper.setMetadata(QUERY_TYPE_KEY, type, target, propertyKey);
};
}

export const TAGS_KEY = 'tags';

export function Tag(tagName: string) : DecoratorFunction {
return (
	target: Object,
	propertyKey?: string | symbol,
	descriptor?: PropertyDescriptor,
) => {
	if (propertyKey) {
		MetadataHelper.setMetadata(TAGS_KEY, tagName, target, propertyKey);
	} else {
		MetadataHelper.setMetadata(TAGS_KEY, tagName, target);
	}
};
}

export const API_SECURITY = 'api-security';
export const API_SECURITY_DATA = 'api-security-data';

export function ApiBasicAuth(): DecoratorFunction { return ApiSecurity('basic') }
export function ApiBearerAuth(): DecoratorFunction { return ApiSecurity('bearer') }
export function ApiCookieAuth(): DecoratorFunction { return ApiSecurity('cookie') }
export function ApiOAuth2(data: string[]): DecoratorFunction { return ApiSecurity('oauth2', data) }

export function ApiSecurity(name: string, data: string[] = []) : DecoratorFunction {
	return (
		// deno-lint-ignore ban-types
		target: Object,
		propertyKey?: string | symbol,
		descriptor?: PropertyDescriptor,
	) => {
		if (propertyKey) {
			MetadataHelper.setMetadata(API_SECURITY, {
				[name]: data
			}, target, propertyKey);
		} else {
			MetadataHelper.setMetadata(API_SECURITY, {
				[name]: data
			}, target);
		}
	};
}