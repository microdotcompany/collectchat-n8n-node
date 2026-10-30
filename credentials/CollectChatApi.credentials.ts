import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CollectChatApi implements ICredentialType {
	name = 'collectChatApi';

	displayName = 'Collect.chat API';

	icon: Icon = 'file:../icons/collectchat.svg';

	documentationUrl = 'https://github.com/microdotcompany/collectchat-n8n-node#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Create one under Integrations → n8n in any chatbot on Collect.chat',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://dashboard.collect.chat',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}/api/integrations/n8n',
			url: '/me',
			method: 'GET',
		},
	};
}
