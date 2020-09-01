module.exports = {
	name: 'go',
	aliases: ["move","travel"],
	description: 'Moves your character',
	usage: `?go [direction]`,
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

		//Find the descriptor object by matching it to a possible alias
		descriptorObj = this.possibleDescriptors.find(dscrpt => dscrpt.names.includes(args[0]));

		//If the descriptor object has meaningful information, which it will if the argument was a valid descriptor
		if (descriptorObj) {

			[targetx,targety] = descriptorObj.setTargetCoord(gameData);//Destructuring

			//Coordinates go [x][y]
			if (targetx >= 0 && targety >= 0 && targetx < client.levelMap[`${gameData.level}`].length && targety <client.levelMap[`${gameData.level}`][targetx].length && client.levelMap[`${gameData.level}`][targetx][targety] !== 0) { //1 means valid location, 0 means not valid.
				/*
				Here we get the level # from gameData and turn it into a string using template literals. Then, we get
				the value of the x and y coordinates the player wants to move to.
				*/

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
