import { app } from './app.ts';
import { SpecBuilder } from '../builder.ts';
import { SwaggerModule } from '../mod.ts';

const title = 'Cats example';
const description = 'The cats API description';
const version = '1.0';
const tagName = 'cats';
const spec = new SpecBuilder()
	.setTitle(title)
	.setDescription(description)
	.setVersion(version)
	.addTag(tagName)
	.addBasicAuth()
	.addBearerAuth()
	.addCookieAuth('wonderfulCookieName')
	.addOAuth2()
	.build();
const swaggerPath = '/api';
const document = await SwaggerModule.createDocument(app, spec) as any;
await SwaggerModule.setup(swaggerPath, app, document);

await app.listen(3000);
