import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

const app = new Hono<{ Bindings: Env }>();

const defaultMessage = [
	{ role: 'system', content: 'You are a friendly assistant' },
	{
		role: 'user',
		content: 'What is the origin of the phrase Hello, World',
	},
];

// Stream response that can be handled in browsers with EventSource.
// cf: https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct
app.post('/v1/chat/completions', async (c) =>
	streamSSE(c, async (stream) => {
		const { model, messages } = await c.req.json();

		const chatStream = await c.env.AI.run(
			model || '@cf/meta/llama-3.1-8b-instruct',
			{ messages: messages || defaultMessage, stream: true },
			{ gateway: { id: c.env.AI_GATEWAY_ID, skipCache: false, cacheTtl: 3360 } }
		);

		await stream.pipe(chatStream as ReadableStream);
	})
);

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
