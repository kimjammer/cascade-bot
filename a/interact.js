module.exports = {
	name: 'interact',
	aliases: ["press"],
	description: 'Interacts with whatever is in the room, like a button.',
	usage: `interact`,
	possibleDescriptors:[
		{
			names: []
		}
	],
	execute(message,args,client,gameData) {
		let interactables =[];
		let signalSender;

		//Check if there is anything to interact with
		if (client.levelMap[`${gameData.level}`][gameData.xpos][gameData.ypos] == 5) {
			interactables = client.levelInteractable[`${gameData.level}`][gameData.xpos][gameData.ypos]

			signalSender = interactables.find(element => element.type == "signalSender");
			if (signalSender) {
				gameData.triggeredSignals.push(`${signalSender.target}`);
				message.channel.send(signalSender.dialogue);

				client.setGameData.run(
					{
						id: gameData.locationId - message.author.id,
						userId: message.author.id,
						guildId: gameData.locationId,
						gameData: JSON.stringify(gameData)
					});
			}else {
				message.channel.send(`You can't interact with anything here.`)
			}
		}else {
			message.channel.send(`There is nothing to interact with!`);
		}

	}
};
