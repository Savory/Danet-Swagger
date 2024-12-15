/**
 * @module
 * Provides decorators to define metadata to generate your openAPI/Swagger documentation.
 */

import { BODY_TYPE_KEY, MetadataHelper, QUERY_TYPE_KEY } from './deps.ts';
import { Constructor } from './mod.ts';
import { Swagger } from "./swagger.ts";

type DecoratorFunction = (
	// deno-lint-ignore ban-types
	target: Object,
	propertyKey?: string | symbol,
	descriptor?: PropertyDescriptor,
) => void;

/**
 * Metadata key to store the property schema
 */
export const API_PROPERTY = 'api-property';


/**
 * Decorator to define API property metadata for a class property.
 * 
 * @param property - Optional Swagger schema to define the property metadata.
 * @returns A decorator function that sets the API property metadata.
 */
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


/**
 * Metadata key to mark a property as optional
 */
export const OPTIONAL_KEY = 'optional';

/**
 * Decorator that marks a property or method as optional.
 * 
 * @example
 * ```typescript
 * class Example {
 *   @Optional()
 *   optionalProperty?: string;
 * }
 * ```
 */
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

/**
 * Metadata key to store the returned type of a method
 */
export const RETURNED_TYPE_KEY = 'returntype';

/**
 * Decorator to set metadata for the returned type of a method.
 *
 * @param returnedType - The type of the value that the method or property returns.
 * @param isArray - Optional boolean indicating if the returned type is an array.
 */
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

/**
 * Decorator to indicate the body type of a request.
 *
 * @param type - The constructor of the type to be used as the body type.
 */
export function BodyType(type: Constructor): DecoratorFunction {
	return (
		target: Object,
		propertyKey?: string | symbol,
		descriptor?: PropertyDescriptor,
	) => {
		MetadataHelper.setMetadata(BODY_TYPE_KEY, type, target, propertyKey);
	};
}

/**
 * Decorator to indicate the query type.
 * 
 * @param type - The constructor function of the type to be set as metadata.
 */
export function QueryType(type: Constructor) : DecoratorFunction {
return (
	target: Object,
	propertyKey?: string | symbol,
	descriptor?: PropertyDescriptor,
) => {
	MetadataHelper.setMetadata(QUERY_TYPE_KEY, type, target, propertyKey);
};
}

/**
 * A constant key used to store or retrieve tags metadata.
 * This key is typically used in decorators to annotate
 * classes or methods with specific tags for documentation.
 */
export const TAGS_KEY = 'tags';

/**
 * A decorator function to add an openAPI tag to a class or a method.
 *
 * @param tagName - The name of the tag to be added.
 *
 * @example
 * ```typescript
 * @Tag('exampleTag')
 * class ExampleClass {
 *   @Tag('methodTag')
 *   exampleMethod() {
 *     // method implementation
 *   }
 * }
 * ```
 */
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

/**
 * A constant key used to store or retrieve description metadata.
 * This key is typically used in decorators to annotate
 * classes or methods with specific description for documentation.
 */
export const DESCRIPTION_KEY = 'description';

/**
 * A decorator function to add an openAPI description to a class or a method.
 *
 * @param description - The description.
 *
 * @example
 * ```typescript
 * class ExampleClass {
 *   @Description('My very cool description')
 *   exampleMethod() {
 *     // method implementation
 *   }
 * }
 * ```
 */
export function Description(description: string) : DecoratorFunction {
	return (
		target: Object,
		propertyKey?: string | symbol,
		descriptor?: PropertyDescriptor,
	) => {
		if (propertyKey) {
			MetadataHelper.setMetadata(DESCRIPTION_KEY, description, target, propertyKey);
		} else {
			MetadataHelper.setMetadata(DESCRIPTION_KEY, description, target);
		}
	};
	}



/**
 * A constant key used to store or retrieve api-security metadata.
 */
export const API_SECURITY = 'api-security';

/**
 * A constant key used to store or retrieve api-security data metadata.
 */
export const API_SECURITY_DATA = 'api-security-data';

/**
 * Indicate that the endpoint use basic authentication security.
 *
 * This function is a shorthand for applying the 'basic' security scheme using the `ApiSecurity` decorator.
 *
 */
export function ApiBasicAuth(): DecoratorFunction { return ApiSecurity('basic') }
/**
 * Indicate that the endpoint use api bearer auth security.
 *
 * This function is a shorthand for applying the 'bearer' security scheme using the `ApiSecurity` decorator.
 *
 */
export function ApiBearerAuth(): DecoratorFunction { return ApiSecurity('bearer') }
/**
 * Indicate that the endpoint use cookie security.
 *
 * This function is a shorthand for applying the 'cookie' security scheme using the `ApiSecurity` decorator.
 *
 */
export function ApiCookieAuth(): DecoratorFunction { return ApiSecurity('cookie') }
/**
 * Indicate that the endpoint use oauth2 security.
 *
 * This function is a shorthand for applying the 'oauth2' security scheme using the `ApiSecurity` decorator.
 *
 */
export function ApiOAuth2(data: string[]): DecoratorFunction { return ApiSecurity('oauth2', data) }

/**
 * Decorator that indicate that an endpoint use a security mechanism.
 *
 * @param name - The name of the security scheme.
 * @param data - An optional array of strings representing the security requirements.
 *
 */
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