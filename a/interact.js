module.exports = {
	name: 'interact',
	aliases: ["press"],
	description: 'Interacts with whatever is in the room, like a button.',
	usage: `interact`,
	category:"General",
	possibleDescriptors:[
		{
			names: []
		}
	],
	execute(message,args,client,gameData) {
		let reply;
		let interactables =[];
		let signalSender;
		let itemBox;

		//Check if there is anything to interact with
		if (client.levelMap[`${gameData.level}`][gameData.xpos][gameData.ypos] == 5) {
			interactables = client.levelInteractable[`${gameData.level}`][gameData.xpos][gameData.ypos]

			//This block of code looks for all the different types of things the player might interact with.
			signalSender = interactables.find(element => element.type === "signalSender");
			itemBox = interactables.find(element => element.type === "itemBox");

			if (signalSender) {
				//If the signal sender hasn't been used yet, let them use it. If it has been used, tell them.
				if (gameData.triggeredSignals.find(element => element === signalSender.target)) {
					message.channel.send(`You remember you already used this ${signalSender.name}! It does nothing new.`);
				}else {
					//If it's a signal sender, like a button or lever, send that signal by adding it to the list of triggered signals.
					gameData.triggeredSignals.push(`${signalSender.target}`);
					message.channel.send(signalSender.dialogue);
				}
			}else if (itemBox) {
				//If it's a itemBox, like a chest or drawer, then check if it needs a key, then if requirments are met, grant its contents to the player.

				//Has the itemBox already been opened and used? If so, tell the player and exit out of the function.
				if (gameData.usedItemBoxes.find(element => element === itemBox.id)) {
					message.channel.send(`You remember that you already opened this ${itemBox.name}. There's nothing left in here.`);
					return;
				}

				//If a key is needed
				if(itemBox.keyId) {
					//If the key needed is in inventory
					if (gameData.inventory.find(itemBox.keyId)) {
						reply = `You open the ${itemBox.name}. You got: `;
						itemBox.contents.forEach((element) => {
							gameData.inventory.push(element);
							reply += `a ${element.name}, `;
						});
						reply += `and that's it!`

						gameData.usedItemBoxes.push(itemBox.id);
					}else{
						reply =`${itemBox.name} is locked! You need a ${itemBox.keyId}.`;
					}
				}else{
					reply = `You open the ${itemBox.name}. You got: `;
					itemBox.contents.forEach((element) => {
						gameData.inventory.push(element);
						reply += `a ${element.name}, `;
					});
					reply += `and that's it!`
					gameData.usedItemBoxes.push(itemBox.id);
				}

				//Send the message to the player
				message.channel.send(reply);
			}else {
				message.channel.send(`You can't interact with anything here.`)
			}

			//Save everything
			client.setGameData.run(
				{
					id: gameData.locationId - message.author.id,
					userId: message.author.id,
					guildId: gameData.locationId,
					gameData: JSON.stringify(gameData)
				});
		}else {
			message.channel.send(`There is nothing to interact with!`);
		}

	}
};
