module.exports = {
	ci: {
		collect: {
			settings: {
				// Source the form factor from an environment variable set in the CI run
				emulatedFormFactor: process.env.EMULATE_DEVICE || "mobile",
				// Do not apply any throttling
				throttlingMethod: "provided",
				// Skipping "uses-http2" due to errors with reports see: http2 https://github.com/GoogleChrome/lighthouse/issues/6539
				// Skipping "is-crawlable" because Netlify's preview preview for PRs add `x-robots-tag: noindex`
				// Skipping "works-offline" because only the homepage is cached for offline access.
				skipAudits: ["uses-http2", "is-crawlable", "works-offline"]
			}
		},
		assert: {
			assertions: {
				"categories:performance": ["error", {"minScore": 1}],
				"categories:accessibility": ["error", {"minScore": 1}],
				"categories:best-practices": ["error", {"minScore": 1}],
                "categories:seo": ["error", {"minScore": 1}],
                "categories:pwa": ["error", {"minScore": 1}]
			}
		}
	}
};