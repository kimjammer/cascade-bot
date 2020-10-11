module.exports = {
	name: 'equip',
	aliases: ["wear","hold"],
	description: 'Equip a specific weapon or other item.',
	usage: `equip [item name]`,
	category:"Combat",
	possibleDescriptors:[],
	execute(message,args,client,gameData) {
		let itemName = "";
		let item;
		let previousEquippedItem;

		//If no item was specified, tell them they need to
		if (!args[0]) {
			message.channel.send("You need to specify an item to equip!");
		}else{
			//Stitch all arguments together into the name for the item
			for (let i=0;i<args.length;i++) {
				itemName += args[i]+" "
			}

			itemName = itemName.trim();

			//Try to find the item
			item = gameData.inventory.find(item => item.name.toLowerCase() == itemName);

			//if found, equip it.
			if (item != undefined) {
				//Try to find the previously equippped item.
				previousEquippedItem = gameData.inventory.find(item => item.equipped != "0");
				if (previousEquippedItem != undefined) {
					//If the item that they are trying to equip is already equipped, tell them
					if (item.name == previousEquippedItem.name) {
						message.channel.send("That item is already equipped!");
						return;
					}

					//If previously equippped item was found, make it not equipped.
					previousEquippedItem.equipped = "0";
				}

				//Then, set the item that need to be equipped as equipped.
				item.equipped = item.type;

				message.channel.send(`Equipped ${item.name}`);

				client.setGameData.run(
					{
						id: gameData.locationId - message.author.id,
						userId: message.author.id,
						guildId: gameData.locationId,
						gameData: JSON.stringify(gameData)
					});
			}else {
				message.channel.send("That's not an item you have!");
			}
		}
	}
};
