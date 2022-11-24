import { MetadataHelper, BODY_TYPE_KEY, QUERY_TYPE_KEY } from './deps.ts';
import { Constructor } from './mod.ts';

export const ApiProperty = () => (
  // deno-lint-ignore ban-types
  target: Object,
  propertyKey: string | symbol,
) => {
};

export const OPTIONAL_KEY = 'optional';

export const Optional = () => (
  // deno-lint-ignore ban-types
  target: Object,
  propertyKey: string | symbol,
) => {
  MetadataHelper.setMetadata(OPTIONAL_KEY, true, target, propertyKey);
};

export const RETURNED_TYPE_KEY = 'returntype';

export const ReturnedType = (returnedType: unknown) => (
  target: Object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  MetadataHelper.setMetadata(RETURNED_TYPE_KEY, returnedType, target, propertyKey);
}

export const BodyType = (type: Constructor) => (
  target: Object,
  propertyKey: string | symbol
) => {
  MetadataHelper.setMetadata(BODY_TYPE_KEY, type, target, propertyKey);
};


export const QueryType = (type: Constructor) => (
  target: Object,
  propertyKey: string | symbol
) => {
  MetadataHelper.setMetadata(QUERY_TYPE_KEY, type, target, propertyKey);
};