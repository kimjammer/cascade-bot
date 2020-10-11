module.exports = {
	name: 'look',
	aliases: ["see","examine"],
	description: 'Look around. (Get the dialogue again)',
	usage: `look`,
	category:"General",
	possibleDescriptors:[],
	execute(message,args,client,gameData) {
		let reply ="";
		reply = client.levelDialogue[`${gameData.level}`][gameData.xpos][gameData.ypos];
		message.channel.send(reply);
	}
};
