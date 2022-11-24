import { Swagger } from './swagger.ts';
import RequestBody = Swagger.RequestBody;
import Schema = Swagger.Schema;
import Response = Swagger.Response;
import Header = Swagger.Header;

export class RequestBodyBuilder {
	private requestBody: RequestBody = {
		content: {},
		required: true,
	};
	jsonContent(schema: Schema) {
		this.requestBody.content = {
			'application/json': {
				schema,
			},
		};
		return this;
	}

	setDescription(description: string) {
		this.requestBody.description = description;
		return this;
	}

	get() {
		return { ...this.requestBody };
	}
}

export class ResponseBuilder {
	private response: Response = {
		description: '',
	};

	jsonContent(schema: Schema) {
		this.response.content = {
			'application/json': {
				schema,
			},
		};
		return this;
	}

	setDescription(description: string) {
		this.response.description = description;
		return this;
	}

	setHeader(headers: { [name: string]: Header }) {
		this.response.headers = headers;
		return this;
	}

	get() {
		return this.response;
	}
}
