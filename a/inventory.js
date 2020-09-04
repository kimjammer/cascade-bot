module.exports = {
	name: 'inventory',
	aliases: ["items","stuff"],
	description: 'Shows what you have.',
	usage: `inventory [optional:Item to get specific info on]`,
	possibleDescriptors:[],
	execute(message,args,client,gameData) {
		let reply =[];
		let itemName = "";
		let item;

		//If no item was specified, give list of items in inventory
		if (!args[0]) {
			for (let i=0;i<gameData.inventory.length;i++) {
				reply.push(`${i+1}. ${gameData.inventory[i].name}`);
			}
			message.channel.send(reply);
		}else{
			//Stitch all arguments together into the name for the item
			for (let i=0;i<args.length;i++) {
				itemName += args[i]+" "
			}

			itemName = itemName.trim();

			//Try to find the item
			item = gameData.inventory.find(item => item.name.toLowerCase() == itemName);

			//if found, give the detailed info on the item
			if (item != undefined) {
				reply = `${item.name} - ${item.description}`;
				//If item is weapon give attack details
				if (item.type == "weapon") {
					reply += `\nAttack Damage: Between ${item.atk[0]} and ${item.atk[1]}`
					//Find if item is equipped.
					if (item.equipped != "0") {
						reply += `\nEquipped: Yes`
					}else {
						reply += `\nEquipped: No`
					}
				}
				message.channel.send(reply);
			}else {
				message.channel.send("That's not an item you have!");
			}
		}

	}
};
