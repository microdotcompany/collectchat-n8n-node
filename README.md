# @micro.company/n8n-nodes-collectchat

This is an n8n community node. It lets you start n8n workflows from [Collect.chat](https://collect.chat) chatbot responses.

Collect.chat is a no-code chatbot builder for collecting leads, bookings and survey answers on your website.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation and install `@micro.company/n8n-nodes-collectchat`.

## Operations

**Collect.chat Trigger** starts a workflow each time the chosen chatbot gets a new response. Each answer arrives keyed by its question text, along with the visitor's `page` and `ip`:

```json
{
  "What is your name?": "Jane",
  "What is your email?": "jane@example.com",
  "page": "https://example.com/pricing",
  "ip": "203.0.113.7"
}
```

## Credentials

1. In Collect.chat, open any chatbot, go to **Integrations → n8n** and click **Create API key**.
2. In n8n, create a **Collect.chat API** credential and paste the key.

The key gives access to every chatbot you can edit. Regenerating it disconnects credentials that use the old key.

The n8n integration needs a Collect.chat plan that includes integrations.

## Compatibility

Requires n8n 1.0 or later.

## Usage

Activate the workflow to start receiving responses. Deactivating it, or deleting the trigger, stops them.

If you rename a question, update any expressions in your workflow that use the old question text. New questions are picked up when you publish the chatbot.

### Example: post new leads to Slack

1. Add a **Collect.chat Trigger**, select your credential and pick the chatbot under **Chatbot Name or ID**.
2. Add a **Slack** node with **Send a message**, choose a channel and set the message text to:

   ```
   New lead from {{ $json["What is your name?"] }} ({{ $json["What is your email?"] }}) on {{ $json.page }}
   ```

3. Activate the workflow and submit a test response on your website.

Use your own question text inside `$json["..."]`. To save responses instead, swap Slack for a **Google Sheets** node with **Append row** and map each question to a column.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Collect.chat help center](https://collectchat.help.center)
