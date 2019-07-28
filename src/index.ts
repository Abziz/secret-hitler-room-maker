import secretHitlerService from "./services/secret-hitler-service";
import dotenv from 'dotenv';
dotenv.config();

async function run() {
	const username = process.env.SECRET_HITLER_USERNAME;
	const password = process.env.SECRET_HITLER_PASSWORD;
	const service = new secretHitlerService(username, password);
	const url = await service.createGame({ password: "420", players: 5, rebalance: true });
	console.log(url);
}
run();
