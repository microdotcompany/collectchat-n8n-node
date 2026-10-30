import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type IHttpRequestMethods,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';

async function collectChatRequest(
	this: IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	path: string,
	{ body, allowNotFound = false }: { body?: IDataObject; allowNotFound?: boolean } = {},
) {
	const credentials = await this.getCredentials('collectChatApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
	let response;
	try {
		response = await this.helpers.httpRequestWithAuthentication.call(this, 'collectChatApi', {
			method,
			url: `${baseUrl}/api/integrations/n8n${path}`,
			body,
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}

	if (response.statusCode === 404 && allowNotFound) return null;
	if (response.statusCode >= 400) {
		throw new NodeApiError(this.getNode(), (response.body ?? {}) as JsonObject, {
			httpCode: String(response.statusCode),
		});
	}
	return response.body;
}

export class CollectChatTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Collect.chat Trigger',
		name: 'collectChatTrigger',
		icon: 'file:../../icons/collectchat.svg',
		group: ['trigger'],
		version: 1,
		subtitle: 'New response',
		description: 'Starts the workflow when a chatbot gets a new response',
		defaults: {
			name: 'Collect.chat Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'collectChatApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Chatbot Name or ID',
				name: 'botId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBots',
				},
				required: true,
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
		],
	};

	methods = {
		loadOptions: {
			async getBots(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const bots = (await collectChatRequest.call(this, 'GET', '/list-bots')) as Array<{
					id: string;
					name: string;
				}>;
				return bots.map((bot) => ({ name: bot.name || bot.id, value: bot.id }));
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) return false;

				const path = `/webhooks/${webhookData.webhookId}`;
				const hook = (await collectChatRequest.call(this, 'GET', path, {
					allowNotFound: true,
				})) as IDataObject | null;
				if (
					hook &&
					hook.hookUrl === this.getNodeWebhookUrl('default') &&
					hook.botId === this.getNodeParameter('botId')
				) {
					return true;
				}
				// the chatbot was changed since the hook was created
				if (hook) await collectChatRequest.call(this, 'DELETE', path, { allowNotFound: true });
				delete webhookData.webhookId;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const { id } = (await collectChatRequest.call(this, 'POST', '/webhooks', {
					body: {
						botId: this.getNodeParameter('botId') as string,
						hookUrl: this.getNodeWebhookUrl('default') as string,
					},
				})) as { id: string };
				webhookData.webhookId = id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId !== undefined) {
					await collectChatRequest.call(this, 'DELETE', `/webhooks/${webhookData.webhookId}`, {
						allowNotFound: true,
					});
					delete webhookData.webhookId;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		return {
			workflowData: [this.helpers.returnJsonArray(this.getBodyData())],
		};
	}
}
