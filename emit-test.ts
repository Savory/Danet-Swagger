import { Reflect } from 'https://deno.land/x/deno_reflect@v0.2.1/mod.ts';

export const PrintIt = () => (
  target: Object,
  propertyKey: string | symbol,
  descriptor: any
) => {
  console.log(target, propertyKey);
  console.log(Reflect.getMetadataKeys(target, propertyKey));
}

class MyController {

  @PrintIt()
  getSomething(): boolean {
    return true;
  }

  @PrintIt()
  postSomething(): number {
    return 1;
  }
}