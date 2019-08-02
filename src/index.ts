import { SecretHitlerBot } from './bot/secret-hitler-bot'
import dotenv from 'dotenv';
dotenv.config();

new SecretHitlerBot()
	.setupService(process.env.SECRET_HITLER_USERNAME, process.env.SECRET_HITLER_PASSWORD)
	.login(process.env.DISCORD_TOKEN);
