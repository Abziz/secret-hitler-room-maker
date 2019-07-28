import fetch from 'node-fetch';
import puppeteer, { Page, Browser } from 'puppeteer';
import constants from '../utils/constants'

export interface CreateGameConfig {
	password: string;
	players: number;
	rebalance: boolean;
}

export default class SecretHitlerService {

	private username: string;
	private password: string;
	private browser: Browser;
	private busy = false;

	public constructor(username: string, password: string) {
		if (!username || !password) {
			throw Error("Missing constructor parameters");
		}
		this.username = username;
		this.password = password;
	}

	public async createGame(config: CreateGameConfig = constants.DEFAULT_GAME_CONFIG) {
		if (this.busy || !this.configIsValid(config)) {
			return;
		}

		this.busy = true;
		const cookie = await this.login();
		this.browser = this.browser || await puppeteer.launch({
			defaultViewport: {
				height: 600,
				width: 951 // important for css media queries
			}
		});
		const page = await this.browser.newPage();
		try {
			await page.goto(constants.SECRET_HITLER_LOBY);
			await page.setCookie(cookie);
			await page.goto(constants.SECRET_HITLER_CREATE_GAME);
			await this.setGamePassword(page, config.password);
			await this.setNumberOfPlayers(page, config.players, config.rebalance);
			const roomUrl = await this.startGame(page);
			this.waitForPlayer(page).then(async () => await this.leaveGame(page));

			return roomUrl;
		} catch {
			console.error("hmmm");
			if (!page.isClosed()) {
				page.close()
				this.busy = false;
			}
		}
	}
	private configIsValid(config: CreateGameConfig) {
		if (!config.password) {
			return false;
		}
		if (config.players < constants.MIN_PLAYERS || config.players > constants.MAX_PLAYERS) {
			return false;
		}
		return true;
	}
	private async login() {
		const response = await fetch(constants.SECRET_HITLER_LOGIN, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: this.username,
				password: this.password
			})
		});
		const [name, value] = response.headers.get("set-cookie").split(";")[0].split("=");
		return { name, value };
	}

	private async setGamePassword(page: Page, password: string) {
		const toggle = await page.waitForSelector(".privategame .react-switch-bg", { timeout: 3000 });
		await toggle.click();
		const input = await page.waitForSelector("input.password-input", { timeout: 3000 });
		await input.focus();
		return await page.keyboard.type(password);
	}

	private async setNumberOfPlayers(page: Page, players: number, rebalance: boolean) {
		await this.clearCheckboxes(page);
		if (rebalance) {
			const rebalance = await page.$$(".rebalance input[type='checkbox']");
			await Promise.all(rebalance.map(checkbox => checkbox.click()));
		}
		const checkboxes = await page.$$(`.checkbox-container label:not(:nth-child(${players - 5 + 1})) input`)
		Promise.all(checkboxes.map(checkbox => checkbox.click()))
	}

	private async clearCheckboxes(page: Page) {
		const players = await page.$$(".checkbox-container input[type='checkbox']:not(:checked)");
		await Promise.all(players.map(checkbox => checkbox.click()));
		const rebalance = await page.$$(".rebalance input[type='checkbox']:checked");
		await Promise.all(rebalance.map(checkbox => checkbox.click()));
	}

	private async startGame(page: Page) {
		await page.waitFor(1000);
		const btn = await page.waitForSelector(".creategame > .footer > .button", { timeout: 3000 });
		await btn.click();
		await page.waitForSelector(".players-container", { timeout: 5000 });
		return page.url();
	}

	private async waitForPlayer(page: Page) {
		try {
			await page.waitForSelector(".player-container:not(:first-child)", { timeout: 60 * 1000 });
		}
		catch{
		}
	}
	private async leaveGame(page: Page) {
		await page.click(".pointing .right.menu > .item:last-child > .button");
		await page.close();
		this.busy = false;
	}
}





