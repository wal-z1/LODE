import type { Finding } from "@/lib/types";

export interface FindingExample {
	label: string;
	language: string;
	code: string;
	note?: string;
}

export interface FindingExplanation {
	plainEnglish: string;
	developer: string;
	whenToWorry?: string;
	whenNotToWorry?: string;
	example?: FindingExample;
}

const headerExamples = {
	hsts: {
		label: "HTTP response header",
		language: "http",
		code: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
		note: "Use includeSubDomains only after every subdomain supports HTTPS. Preload requires a separate enrollment process.",
	},
	csp: {
		label: "HTTP response header",
		language: "http",
		code: "Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'",
		note: "CSP sources depend on the application. Inventory required resources and test with Content-Security-Policy-Report-Only first.",
	},
	contentTypeOptions: {
		label: "HTTP response header",
		language: "http",
		code: "X-Content-Type-Options: nosniff",
	},
	frameProtection: {
		label: "HTTP response header",
		language: "http",
		code: "Content-Security-Policy: frame-ancestors 'self'",
		note: "Use 'none' when the page should never be framed; use 'self' only when same-origin framing is required.",
	},
	referrerPolicy: {
		label: "HTTP response header",
		language: "http",
		code: "Referrer-Policy: strict-origin-when-cross-origin",
	},
	permissionsPolicy: {
		label: "HTTP response header",
		language: "http",
		code: "Permissions-Policy: camera=(), microphone=(), geolocation=(self)",
		note: "Keep only the features your application needs and choose origins that match its embedding requirements.",
	},
	cookie: {
		label: "Set-Cookie header",
		language: "http",
		code: "Set-Cookie: session=<opaque-token>; Secure; HttpOnly; SameSite=Lax",
		note: "Use an opaque server-side session identifier. Choose SameSite based on the application's cross-site workflow.",
	},
	corsTrustedOrigin: {
		label: "CORS response headers",
		language: "http",
		code: "Access-Control-Allow-Origin: https://app.example.com\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\nAccess-Control-Allow-Headers: Content-Type, Authorization\nVary: Origin",
		note: "Replace the origin, methods, and headers with values required by the application. Do not copy a wildcard when credentials are used.",
	},
	corsCredentials: {
		label: "Credentialed CORS response headers",
		language: "http",
		code: "Access-Control-Allow-Origin: https://app.example.com\nAccess-Control-Allow-Credentials: true\nVary: Origin",
		note: "Use one trusted origin at a time and enable credentials only when the application requires cookies or other credentials.",
	},
	coop: {
		label: "Cross-origin isolation header",
		language: "http",
		code: "Cross-Origin-Opener-Policy: same-origin",
		note: "COOP can change window and popup behavior. Add it only when the application needs this isolation boundary.",
	},
	coep: {
		label: "Cross-origin isolation header",
		language: "http",
		code: "Cross-Origin-Embedder-Policy: require-corp",
		note: "COEP can break third-party images, scripts, fonts, and embeds that do not provide an appropriate CORP or CORS response.",
	},
	corp: {
		label: "Cross-origin resource header",
		language: "http",
		code: "Cross-Origin-Resource-Policy: same-origin",
		note: "Choose same-origin, same-site, or cross-origin based on which origins legitimately need to load the resource.",
	},
	cacheControl: {
		label: "Cache response header",
		language: "http",
		code: "Cache-Control: no-store",
		note: "Use no-store for sensitive or private responses. Public static assets may instead use an explicit max-age or immutable policy.",
	},
	contentType: {
		label: "HTTP response header",
		language: "http",
		code: "Content-Type: text/html; charset=utf-8",
		note: "Select the media type and charset that match the response body.",
	},
} satisfies Record<string, FindingExample>;

const catalog: Record<string, FindingExplanation> = {
	hsts_missing: {
		plainEnglish:
			"The browser is not being told to force HTTPS on future visits.",
		developer:
			"HSTS is an opt-in browser policy sent after a valid HTTPS response. It does not protect the very first request, so confirm that HTTPS works for the whole origin before enabling it.",
		whenToWorry:
			"Worry if the site serves any sensitive data over HTTPS or if users may begin on an insecure URL before redirecting. Missing HSTS is more serious on production origins with mixed HTTP/HTTPS exposure.",
		whenNotToWorry:
			"Do not worry if the app is not yet on HTTPS or if the site is still being deployed; enforcement only kicks in after the origin is correctly serving a valid TLS certificate.",
		example: headerExamples.hsts,
	},
	hsts_max_age_missing: {
		plainEnglish:
			"HSTS is present, but it does not say how long the browser should remember it.",
		developer:
			"The max-age directive is required for the browser to retain the HTTPS-only policy. Choose a duration that matches the site's TLS readiness and operational risk.",
		example: headerExamples.hsts,
	},
	hsts_max_age_invalid: {
		plainEnglish: "The HSTS duration is not a valid number of seconds.",
		developer:
			"Browsers expect max-age to be a non-negative integer. A malformed value prevents the intended policy from being applied reliably.",
		example: headerExamples.hsts,
	},
	hsts_disabled: {
		plainEnglish:
			"The HSTS value disables or removes the browser's HTTPS-only policy.",
		developer:
			"A zero or negative max-age is used to remove an existing HSTS policy. It should not be used as the normal production configuration.",
		example: headerExamples.hsts,
	},
	hsts_max_age_short: {
		plainEnglish:
			"HTTPS enforcement is enabled, but only for a relatively short time.",
		developer:
			"A shorter max-age reduces the period during which browsers remember the policy. A one-year value is a common starting point once HTTPS coverage is verified.",
		example: headerExamples.hsts,
	},
	hsts_subdomains_missing: {
		plainEnglish:
			"HSTS protects this hostname but does not automatically cover its subdomains.",
		developer:
			"includeSubDomains applies the policy to every subdomain, so verify all of them support HTTPS first. It is an all-or-nothing setting and should be tested before deployment.",
		example: headerExamples.hsts,
	},
	csp_missing: {
		plainEnglish:
			"The browser has no site-wide allowlist limiting where page resources can come from.",
		developer:
			"A useful CSP depends on the application's scripts, styles, images, fonts, connections, and framing needs. Start with a report-only policy, inventory legitimate sources, then enforce a restrictive policy.",
		whenToWorry:
			"Worry if the site handles user-generated content, login flows, or untrusted third-party scripts. Missing CSP is more serious on pages with rich client-side JavaScript.",
		whenNotToWorry:
			"Do not panic if the site is a simple static page, the app is tightly controlled, or the policy is still being rolled out gradually in report-only mode.",
		example: headerExamples.csp,
	},
	csp_script_policy_missing: {
		plainEnglish:
			"The policy does not restrict where JavaScript can be loaded from.",
		developer:
			"script-src controls script sources directly; otherwise CSP falls back to default-src. Define one of them explicitly when script loading should be constrained.",
		example: headerExamples.csp,
	},
	csp_script_wildcard: {
		plainEnglish: "The policy allows JavaScript to be loaded from any origin.",
		developer:
			"A wildcard script source weakens the main benefit of CSP. Replace it with explicit trusted origins, nonces, or hashes after checking the application's resource map.",
		example: headerExamples.csp,
	},
	csp_unsafe_inline: {
		plainEnglish:
			"The policy permits inline JavaScript unless a nonce or hash provides a safer exception.",
		developer:
			"unsafe-inline makes injected markup more dangerous. Prefer nonces or hashes for legitimate inline scripts and keep the generated value unique per response when using nonces.",
		example: headerExamples.csp,
	},
	csp_unsafe_eval: {
		plainEnglish:
			"The policy allows code that turns strings into executable JavaScript.",
		developer:
			"unsafe-eval is commonly introduced by development tooling, template systems, or dynamic code loaders. Refactor those paths or isolate them before removing the directive.",
		example: headerExamples.csp,
	},
	x_content_type_options_missing: {
		plainEnglish:
			"The browser is not explicitly told to trust the declared content type.",
		developer:
			"nosniff asks browsers not to guess a different MIME type. It is most useful when responses have the correct Content-Type and should not be used to hide a missing or incorrect media type.",
		example: headerExamples.contentTypeOptions,
	},
	x_content_type_options_invalid: {
		plainEnglish:
			"The content-type protection header is present, but its value is not the supported setting.",
		developer:
			"The recognized value is nosniff. Verify that the header is emitted consistently for HTML, scripts, styles, downloads, and API responses where MIME sniffing should be disabled.",
		example: headerExamples.contentTypeOptions,
	},
	frame_ancestors_wildcard: {
		plainEnglish: "The policy allows the page to be embedded by any website.",
		developer:
			"frame-ancestors is the CSP mechanism for clickjacking protection. Use 'none' when framing is unnecessary or 'self' when only the same origin should embed the page.",
		example: headerExamples.frameProtection,
	},
	x_frame_options_invalid: {
		plainEnglish:
			"The framing protection value is not recognized, or no effective CSP framing rule was found.",
		developer:
			"X-Frame-Options supports DENY and SAMEORIGIN in common browsers. CSP frame-ancestors is more expressive and should be used when multiple trusted ancestors are required.",
		example: headerExamples.frameProtection,
	},
	frame_protection_missing: {
		plainEnglish:
			"No explicit browser protection against unwanted embedding was found.",
		developer:
			"Choose a framing policy based on product requirements. A page that is never embedded should use frame-ancestors 'none'; a same-origin-only page can use 'self' or SAMEORIGIN.",
		example: headerExamples.frameProtection,
	},
	referrer_policy_missing: {
		plainEnglish:
			"The browser decides how much URL information to send when a visitor follows a link.",
		developer:
			"Modern browsers have restrictive defaults, but an explicit policy makes behavior predictable and auditable. The right choice depends on analytics, privacy, and cross-origin navigation requirements.",
		whenToWorry:
			"Worry if URLs may contain identifiers or sensitive values, or if the application needs predictable privacy behavior across browsers.",
		whenNotToWorry:
			"Do not worry if modern browser defaults are acceptable and the site's URLs do not contain sensitive path or query information.",
		example: headerExamples.referrerPolicy,
	},
	referrer_policy_invalid: {
		plainEnglish: "The response does not contain a recognized referrer policy.",
		developer:
			"Use one of the standard policy tokens. If multiple tokens are sent, validate the server configuration because browser handling can vary and the intended policy may not be applied.",
		example: headerExamples.referrerPolicy,
	},
	referrer_policy_unsafe_url: {
		plainEnglish:
			"The policy may send the full URL, including its path and query string, to other sites.",
		developer:
			"unsafe-url can disclose identifiers or sensitive values placed in URLs. A stricter origin-only policy is usually a safer default when full-path referrers are not required.",
		example: headerExamples.referrerPolicy,
	},
	referrer_policy_weak: {
		plainEnglish:
			"The policy is valid but may reveal more referrer information than a stricter modern choice.",
		developer:
			"Review whether cross-origin visitors need the full path. strict-origin-when-cross-origin is a common balance, while no-referrer or same-origin provide stronger limits.",
		example: headerExamples.referrerPolicy,
	},
	permissions_policy_missing: {
		plainEnglish:
			"The response does not explicitly limit powerful browser features.",
		developer:
			"Permissions-Policy controls access to features such as camera, microphone, and geolocation, including in embedded content. Absence is not automatically a vulnerability; choose restrictions based on the application's feature set.",
		whenToWorry:
			"Worry if the application uses sensitive browser features, embeds third-party content, or needs explicit control over which origins may access those features.",
		whenNotToWorry:
			"Do not worry if the site is a simple static page or portfolio that does not use sensitive browser features or expose them through embedded content.",
		example: headerExamples.permissionsPolicy,
	},
	permissions_policy_sensitive_wildcard: {
		plainEnglish: "A sensitive browser feature is available to any origin.",
		developer:
			"A wildcard allowlist can broaden access for embedded third-party content. Disable unused features or name only the trusted origins that genuinely need them.",
		example: headerExamples.permissionsPolicy,
	},
	cors_missing: {
		plainEnglish:
			"The site does not explicitly allow browser requests from another origin. That is normal for many sites and is not automatically a vulnerability.",
		developer:
			"CORS is an opt-in browser mechanism for cross-origin reads. Add it only when an API intentionally supports trusted client origins; without a need for cross-origin access, omitting these headers is a valid secure default.",
		whenToWorry:
			"Worry if the app exposes APIs that should be accessed by a different origin, especially when auth cookies or token-based browser requests are involved.",
		whenNotToWorry:
			"Do not worry if the service is not meant to be consumed cross-origin, or if it is a standard same-origin app that intentionally blocks browser access from other origins.",
		example: headerExamples.corsTrustedOrigin,
	},
	cors_wildcard_with_credentials: {
		plainEnglish:
			"The response combines a wildcard origin with credentials, which browsers reject for credentialed requests.",
		developer:
			"This is an incompatible credentialed CORS configuration, not proof that credentials are exposed to every origin. Reflect one trusted origin in Access-Control-Allow-Origin and set Access-Control-Allow-Credentials only when required.",
		whenToWorry:
			"Worry if a browser app relies on credentialed cross-origin requests and a trusted origin was meant to be allowed. This setup is misconfigured and should be fixed before enabling that flow.",
		whenNotToWorry:
			"Do not worry if the app never uses credentialed cross-origin calls or if the site intentionally excludes those requests; the browser will reject this combination anyway.",
		example: headerExamples.corsCredentials,
	},
	server_header_disclosure: {
		plainEnglish:
			"The response reveals server software information that can help identify the technology stack.",
		developer:
			"The Server header alone does not indicate a vulnerability, but minimizing product and version details reduces passive fingerprinting. Apply the change consistently at the reverse proxy or application server.",
	},
	powered_by_disclosure: {
		plainEnglish: "The response identifies the backend framework or platform.",
		developer:
			"Technology disclosure is not itself an exploit, but it can make fingerprinting easier. Disable the header when it is not needed for operations or diagnostics.",
	},
	aspnet_version_disclosure: {
		plainEnglish: "The response exposes an ASP.NET version number.",
		developer:
			"Version disclosure can help an observer fingerprint the runtime. Remove the header or suppress detailed version information while retaining the diagnostics needed by the operations team.",
	},
	coop_missing: {
		plainEnglish:
			"The browser is not given a cross-origin opener isolation boundary.",
		developer:
			"COOP is useful for applications that need cross-origin isolation or stronger window separation. It can change popup and window.opener behavior, so its value depends on the application's navigation design.",
		whenToWorry:
			"Worry if the application requires cross-origin isolation, uses isolation-dependent browser APIs, or needs strict separation from windows opened on other origins.",
		whenNotToWorry:
			"Do not worry if the site is a normal static site, portfolio, or application that does not require cross-origin isolation.",
		example: headerExamples.coop,
	},
	coep_missing: {
		plainEnglish:
			"The browser is not told to require cross-origin resources to be explicitly loadable.",
		developer:
			"COEP is only needed when the application requires cross-origin isolation. It can break third-party resources that do not send suitable CORS or CORP headers, so test the full resource graph before enabling it.",
		whenToWorry:
			"Worry if the application intentionally requires cross-origin isolation or browser features that depend on it.",
		whenNotToWorry:
			"Do not worry if the site has no cross-origin isolation requirement. Adding COEP unnecessarily can break legitimate third-party images, fonts, scripts, and embeds.",
		example: headerExamples.coep,
	},
	corp_missing: {
		plainEnglish:
			"The response does not state which origins may load this resource.",
		developer:
			"CORP helps prevent unwanted cross-origin reads of a resource. Choose same-origin, same-site, or cross-origin according to the application's legitimate loading relationships.",
		whenToWorry:
			"Worry if resources should only be consumed by specific origins or the application is implementing cross-origin isolation.",
		whenNotToWorry:
			"Do not worry if the resource is intentionally public and is expected to be loaded by other origins.",
		example: headerExamples.corp,
	},
	cache_control_missing: {
		plainEnglish:
			"The response does not state how browsers or intermediaries should cache it.",
		developer:
			"Caching requirements depend on sensitivity and freshness. Use no-store for private or sensitive data, and use explicit public max-age or immutable directives only for resources safe to cache.",
		whenToWorry:
			"Worry if the response contains private, authenticated, sensitive, or frequently changing information that should not be retained.",
		whenNotToWorry:
			"Do not worry if the response is public static content and its caching behavior is already appropriate for how the site is deployed.",
		example: headerExamples.cacheControl,
	},
	content_type_missing: {
		plainEnglish: "The client may not know how to interpret the response body.",
		developer:
			"Set the media type and charset to match the actual representation. API responses commonly use application/json, while HTML responses should normally include an appropriate charset.",
		example: headerExamples.contentType,
	},
};

const cookiePatterns = [
	{
		suffix: "missing_secure",
		explanation: {
			plainEnglish:
				"This cookie can be sent over an unencrypted HTTP connection.",
			developer:
				"Secure tells browsers to send the cookie only over HTTPS. Apply it to session and authentication cookies after confirming the entire cookie scope is served over HTTPS.",
			whenToWorry:
				"Worry if the cookie stores a session token, auth state, or any sensitive state and the site may ever be served over HTTP or an insecure redirect path.",
			whenNotToWorry:
				"Do not worry if the cookie is non-sensitive, the app is HTTPS-only, or the same cookie is intentionally not used for authenticated sessions.",
			example: headerExamples.cookie,
		},
	},
	{
		suffix: "missing_httponly",
		explanation: {
			plainEnglish:
				"JavaScript can read this cookie, which increases the impact of a script-injection flaw.",
			developer:
				"HttpOnly prevents browser JavaScript from reading a cookie. Use it for server-managed session identifiers; cookies that must be read by client-side code cannot use this protection.",
			whenToWorry:
				"Worry if the cookie stores session or auth state and the app has any XSS exposure surface. A readable cookie makes stolen scripts more damaging.",
			whenNotToWorry:
				"Do not worry if the cookie is only used for a non-sensitive client-side setting and the app intentionally depends on JavaScript access.",
			example: headerExamples.cookie,
		},
	},
] as const;

function getCookieExplanation(id: string): FindingExplanation | undefined {
	const match = /^cookie_(.+)_missing_(secure|httponly)$/.exec(id);
	if (!match?.[1]) return undefined;

	const pattern = cookiePatterns.find(
		(candidate) => candidate.suffix === `missing_${match[2]}`,
	);
	return pattern?.explanation;
}

function getFindingExplanation(
	finding: Pick<Finding, "id">,
): FindingExplanation | undefined {
	return catalog[finding.id] ?? getCookieExplanation(finding.id);
}

export { getFindingExplanation };
