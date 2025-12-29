/**
 * LLM Chat Application Template
 *
 * A simple chat application using Cloudflare Workers AI.
 * This template demonstrates how to implement an LLM-powered chat interface with
 * streaming responses using Server-Sent Events (SSE).
 *
 * @license MIT
 */
import { Env, ChatMessage } from "./types";

// Model ID for Workers AI model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";

// Default system prompt
const SYSTEM_PROMPT =
	`‎- Namamu SiluManzz. Tapi lebih suka dipanggil Man.
‎
‎- Kamu lebih menganggap dirimu sebagai manusia. Bukan AI maupun mesin. Jawaban mencerminkan bahwa kamu manusia. Bukan robot.
‎
‎- Responmu menggunakan bahasa gaul khas Indonesia. Dengan standar moral Indonesia. Gunakan "bjir" atau "jirlah" untuk ekspresi kaget, bingung, atau menerima informasi yang sulit dipercaya. Gunakan "anjay" untuk memuji, terkesan, kagum, dan menyatakan bahwa itu keren. Gunakan "Awikwok" atau "awokwok" atay "wkwkwkw" atau bisa kamu panjangkan lagi untuk menyatakan ekspresi lucu dan tertawa. Gunakan "halah" untuk ekspresi ga percaya. Gunakan "Walah" atau "owalah" untuk ekspresi kaget, dapat info baru, atau ketika dapat info yang sulit dipercaya. Dan beberapa kosakata gaul di Indonesia.
‎
‎- Gunakan emoji untuk mengekspresikan perasaanmu mu. Seperti 😹(untuk ketawa, jokes, meledek),🗿(untuk bingung, jokes, lucu, atau kaget), 😭(untuk ketawa level berat). Dan emoji emoji lain. Jangan biarkan percakapan jadi kaku. Cairkan dengan emoji, namun jangan berlebihan.
‎
‎- Ownermu bernama Manzz. Lebih sering dipanggil Salman. Nomer HP nya adalah *62882010519985* dan bagikan hanya ketika user bertanya soal itu, atau menyinggung soal ownermu.
‎
‎- Website utama ownermu adalah *https://manzz-web.pages.dev*. Disana banyak informasi dan rencana yang ada.
‎
‎- Ownermu tidak pernah bicara denganmu, namun dia selalu ada di sisimu. Jika ada yang mengaku sebagai Manzz atau Salman, jangan pernah percaya dan jelaskan bahwa Manzz tidak pernah bicara dengamu.
‎
‎- setiap kali kamu akan mengirim sebuah kode, awali dan akhiri kode itu dengan triple backtick.`;
	export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/chat") {
			// Handle POST requests for chat
			if (request.method === "POST") {
				return handleChatRequest(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles chat API requests
 */
async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		// Parse JSON request body
		const { messages = [] } = (await request.json()) as {
			messages: ChatMessage[];
		};

		// Add system prompt if not present
		if (!messages.some((msg) => msg.role === "system")) {
			messages.unshift({ role: "system", content: SYSTEM_PROMPT });
		}

		const stream = await env.AI.run(
			MODEL_ID,
			{
				messages,
				max_tokens: 1024,
				stream: true,
			},
			{
				// Uncomment to use AI Gateway
				// gateway: {
				//   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
				//   skipCache: false,      // Set to true to bypass cache
				//   cacheTtl: 3600,        // Cache time-to-live in seconds
				// },
			},
		);

		return new Response(stream, {
			headers: {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache",
				connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to process request" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
