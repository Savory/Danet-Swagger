import { MetadataHelper } from 'https://deno.land/x/danet@1.2.0/src/metadata/helper.ts';
import { BODY_TYPE_KEY } from '../Danet/src/router/controller/params/decorators.ts';
import { Constructor } from './mod.ts';

export const ApiProperty = () => (
  // deno-lint-ignore ban-types
  target: Object,
  propertyKey: string | symbol,
) => {
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