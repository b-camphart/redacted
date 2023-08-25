import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		stderr: 'pipe',
		stdout: 'pipe'
	},
	testDir: 'features',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	use: {
		video: {
			mode: 'on',
		}
	}
};

export default config;
