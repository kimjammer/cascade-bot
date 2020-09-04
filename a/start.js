module.exports = {
	name: 'start',
	aliases: ["begin","travel"],
	description: 'Creates a game for those who don\'t have an existing game',
	usage: `start`,
	possibleDescriptors:[
		{
			names: []
		}
	],
	execute(message,args,client) {
		let reply ="";
		let attachment = "";

		let saveData = {
			playerId: "",
			locationId: "",
			level: 1,
			xpos: 0,
			ypos: 0,
			inventory: [{name:"Old Sword",description:"An old sword you got for free on the side of the road." ,type:"weapon", equipped:"weapon",atk:[6,7],atkName:["slash across","stab"]}],//Equippped is like saying equipped as. It shows what "slot" its equipped in, if any. 0 if not equipped
			health: 100,
			inCombat: false,
			combatSituation: {},
			xp:0,
			xpLevel:1,
			checkpointGameData:"" //This stringyfied object holds the entire saveData, from the beginning of their level. If they die, they get reset to this.
		};//LocationId is like guild.id but since the game can be played in DM channels, it can be a DM channel ID too.

		saveData.playerId = message.author.id;

		//Find out if this is server channel or DM channel
		if (message.channel.type == "text") {
			//Set locationId to the id of the guild.
			saveData.locationId = message.guild.id;
		}else if (message.channel.type == "dm") {
			//Set locationId to the DM channel ID
			saveData.locationId = message.channel.id;
		}else {
			message.channel.send("Error. Try again in a DM or normal server text channel.");
			return
		};


		//If user doesn't have a game in current location, make one.
		if(!client.getGameData.get(message.author.id,saveData.locationId)) {
			//Before we create the database entry, set checkpointGameData to the default saveData. We clear checkpointGameData, so its contents don't get copied into the new one.
			saveData.checkpointGameData = {};
			saveData.checkpointGameData = JSON.stringify(saveData);

			client.createGameData.run(
				{
					id: saveData.locationId - message.author.id,
					userId: message.author.id,
					guildId: saveData.locationId,
					gameData: JSON.stringify(saveData)
				});
			reply = new client.MessageEmbed()
				.setTitle("Welcome to Cascade")
				.setDescription("Created by: AJZ")
				.addField("Tips & Tricks",`1. Note that you don't "turn" in Cascade. Imagine that you are always facing north when you move.`)

			attachment = new client.MessageAttachment('img/Cascade.png');

			message.channel.send(reply);
			message.channel.send(attachment);
			message.channel.send(client.levelDialogue[`${saveData.level}`][saveData.xpos][saveData.ypos]);
		}else {
			reply = "You already have a game!";
			message.channel.send(reply);
		}


	}
};

/*
possible Descriptors refers to the additional information specified by user that is essential in using the command.
EX: the direction for the go command. Description is the description of the command, and descriptor is the info needed
to run command. dscrpt is shorthand for descriptor
 */
