import discordJs, { Message, TextChannel, GuildMember } from 'discord.js';
import SecretHitlerService from '../services/secret-hitler-service';

const COMMANDS_TEXT_CHANNEL = '594662666853810177';
const MEMBERS_WHITE_LIST = [
	'180644941398016010', // Jendalar
	'166243972660854784', // Leopard
	'166212864191758337', // merstik
	'166205132499976192', // wag
	'161245900365103104', // Abziz
	'159300491367546880', // Izzy
	'161159040221577216', // DLF,
	'155359990884990976', // RealGigex,
];
const errorCodes = {
	ARGS: 1,
	TIMEOUT: 2,
	BUSY: 3
}
export class SecretHitlerBot extends discordJs.Client {
	private readonly prefix = '!sh';
	private service: SecretHitlerService;
	public constructor() {
		super();
		this.on('message', this.handleCommands);
	}
	public setupService(username: string, password: string) {
		this.service = new SecretHitlerService(username, password);
		return this;
	}
	private isWhiteListed(member: GuildMember): boolean {
		return MEMBERS_WHITE_LIST.includes(member.user.id);
	}
	private async handleCommands({ channel, member, author, content }: Message) {
		if (!(channel instanceof TextChannel)
			|| channel.id !== COMMANDS_TEXT_CHANNEL
			|| !member
			|| author.bot
			|| !this.isWhiteListed(member)
			|| content.indexOf(this.prefix) !== 0) {
			return;
		}
		const args = content.trim().split(/ +/g);
		const command = args.shift().toLowerCase()

		try {
			if (command !== this.prefix || args.length === 0 || isNaN(+args[0])) { throw errorCodes.ARGS; }
			if (this.service.busy) { throw errorCodes.BUSY; }
			let players = +args[0]
			let rebalance = args[1] === "-r" || args[1] === "--rebalance";
			let msg = await channel.send("Creating game, please wait...") as discordJs.Message;
			const url = await this.service.createGame({ password: "420", players, rebalance });
			await msg.delete(1000);
			await channel.send(`${url}\nEnter the game im waiting`);
		} catch (error) {
			switch (error) {
				case errorCodes.ARGS:
					return await channel.send(`Commands for secret himler:\n${"`"}${this.prefix} #players [-r,--rebalance]${"`"}`);
				case errorCodes.BUSY:
					return await channel.send(`I'm allready creating a room.`);
				default:
					console.error(error);
			}
		}
	}
}