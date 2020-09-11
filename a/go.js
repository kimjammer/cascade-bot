module.exports = {
	name: 'go',
	aliases: ["move","travel"],
	description: 'Moves your character',
	usage: `go [direction]`,
	possibleDescriptors:[
		{
			names: ["up","north","forward","forwards"],
			setTargetCoord: (gameData) => {
				return [gameData.xpos,gameData.ypos+1];
			}
		},
		{
			names:["right","east"],
			setTargetCoord: (gameData) => {
				return [gameData.xpos+1,gameData.ypos];
			}
		},
		{
			names:["down","south","back","backward","backwards"],
			setTargetCoord: (gameData) => {
				return [gameData.xpos,gameData.ypos-1];
			}
		},
		{
			names: ["left", "west"],
			setTargetCoord: (gameData) => {
				return [gameData.xpos-1,gameData.ypos];
			}
		}
	],
	execute(message,args,client,gameData) {
		let reply ="";
		let descriptorObj = null;
		let targetx = 0;
		let targety = 0;
		let interactables = [];
		let door;
		let signalSender;

		//Find the descriptor object by matching it to a possible alias
		descriptorObj = this.possibleDescriptors.find(dscrpt => dscrpt.names.includes(args[0]));

		//If the descriptor object has meaningful information, which it will if the argument was a valid descriptor
		if (descriptorObj) {
			//If the player is in combat, don't let them move.
			if (gameData.inCombat) {
				message.channel.send("You cannot move while in Combat!");
				return;
			}

			[targetx,targety] = descriptorObj.setTargetCoord(gameData);//Destructuring

			//Coordinates go [x][y]
			if (targetx >= 0 && targety >= 0 && targetx < client.levelMap[`${gameData.level}`].length && targety <client.levelMap[`${gameData.level}`][targetx].length && client.levelMap[`${gameData.level}`][targetx][targety] !== 0) { //1 means valid location, 0 means not valid.
				/*
				Up there, we get the level # from gameData and turn it into a string using template literals. Then, we get
				the value of the x and y coordinates the player wants to move to.
				*/

				//Check if there is an interactable(s) in their target space (locked door, or button to press)
				if (client.levelMap[`${gameData.level}`][targetx][targety] == 5) {
					//Make reply an array so we can use reply.push()
					reply = [];

					interactables = client.levelInteractable[`${gameData.level}`][targetx][targety]

					//Check if there is something that blocks them (door)
					door = interactables.find(element => element.type == "door");
					if (door){
						//Check if it is open (or can be opened)
						if (gameData.triggeredSignals.find(signal => signal == door.id)) {
							reply.push(`You pass through the ${door.name}.`);
						}else {
							reply.push(`There is a(n) ${door.name} in your way.`);
							message.channel.send(reply);
							return;
						}
					}

					//Check if there is something that sends a signal (button, lever, etc)
					signalSender = interactables.find(element => element.type == "signalSender")
					if (signalSender){
						//Do nothing - It is handled by other code.
					}
				}

				gameData.xpos = targetx;
				gameData.ypos = targety;

				//Tell the player they moved. Also, send the dialogue for their current space.
				reply = [`Moved ${descriptorObj.names[0]}!`,client.levelDialogue[`${gameData.level}`][gameData.xpos][gameData.ypos]];

				//If the player has reached the goal, transport to next level.
				if (client.levelMap[`${gameData.level}`][gameData.xpos][gameData.ypos] == 2) {
					gameData.level += 1;
					gameData.xpos = 0;
					gameData.ypos = 0;

					reply.push(client.levelDialogue[`${gameData.level}`][gameData.xpos][gameData.ypos]);

					//After arriving in new level,we set checkpointGameData to their current gameData - except for the old checkpointGameData. We clear that.
					gameData.checkpointGameData = "";
					//We store the object as text because it will not create a circular loop, and any links are broken.
					gameData.checkpointGameData = JSON.stringify(gameData);
				}

				//If the player is in a space with a mob, tell them to initiate the fight and put them in Combat mode.
				if (client.levelMap[`${gameData.level}`][gameData.xpos][gameData.ypos] == 4) {
					let mobs = client.levelMobs[`${gameData.level}`][gameData.xpos][gameData.ypos] //This is an array with all the mobs in the current space.

					//Put the player in Combat mode. (They cant move, only fight)
					gameData.inCombat = true;

					//Tell the player about each mob they must fight.
					for (let i = 0; i < mobs.length; i++) {
						reply.push(`There is a ${mobs[i].name} where you are! Use \`${client.prefix}attack\` to start the fight. (You must fight the mob)`);
					}

				}

				//If the player has reached the end of the game, wrap it all up.
				if (client.levelMap[`${gameData.level}`][gameData.xpos][gameData.ypos] == 3) {
					reply.push("You have finished Cascade. Thank you for playing Cascade.");
				}

				client.setGameData.run(
					{
						id: gameData.locationId - message.author.id,
						userId: message.author.id,
						guildId: gameData.locationId,
						gameData: JSON.stringify(gameData)
					});
			} else {
				reply = "You cannot go in that direction.";
			}
		}else{
			reply = "No Direction Specified!";
		}

		message.channel.send(reply);
	}
};

/*
possible Descriptors refers to the additional information specified by user that is essential in using the command.
EX: the direction for the go command. Description is the description of the command, and descriptor is the info needed
to run command. dscrpt is shorthand for descriptor
 */
