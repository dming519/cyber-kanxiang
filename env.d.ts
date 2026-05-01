// Cloudflare Workers env bindings.
// Run `pnpm cf-typegen` after editing wrangler.jsonc to regenerate fully.
interface CloudflareEnv {
  NEWCLI_API_KEY: string;
  NEWCLI_BASE_URL: string;
}
