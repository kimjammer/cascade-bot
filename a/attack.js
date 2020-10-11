module.exports = {
	name: 'attack',
	aliases: ["atk","slash"],
	description: 'Attacks a mob',
	usage: `attack [optional:Mob Number]`,
	category:"Combat",
	possibleDescriptors:[
		{
			names: ["1","one","first"],
			findMobIndex: () => {
				return 1;
			}
		},
		{
			names: ["2","two","second"],
			findMobIndex: () => {
				return 2;
			}
		},
		{
			names: ["3","three","third"],
			findMobIndex: () => {
				return 3;
			}
		}
	],
	execute(message,args,client,gameData) {
		let descriptorObj;
		let mobs;
		let deadMobs = [];
		let weaponsGained = [];
		let xpGained = 0;
		let xpLevelsGained = 0;
		let reply=[];
		let mobIndex;
		let equippedWeapon;
		let atkDamage;
		let dfsDamage;


		//Function for getting random Integers. Used later. Outputs from min-max, both inclusive. Inputting 1,3 will give 1, 2, or 3
		function getRndInteger(min, max) {
			return Math.floor(Math.random() * (max - min + 1) ) + min;
		}

		//if the player is not in Combat mode, don't let them do anything.
		if (!gameData.inCombat) {
			message.channel.send("You did nothing. (Nothing to attack)");
			return;
		}

		//Check if player has attacked this/these mob(s) before
		if (!gameData.combatSituation == {}) {
			//if yes, load current situation (mob(s) health, etc)
			mobs = gameData.combatSituation
		}else {
			//if no, load mob stats from client.levelMobs

			//We use Object.Assign so it copies the contents of client.levelMaps to an empty variable so when we change the
			//properties of the mobs here, it doesn't affect the original level Mob Map.
			let changeableLevelMobs = Object.assign({},client.levelMobs)

			mobs = changeableLevelMobs[`${gameData.level}`][gameData.xpos][gameData.ypos] //This is an array with all the mobs in the current space.
		}

		//If player specified mob to attack, get it's index.
		if (args[0]) {
			//Find the descriptor object by matching it to a possible alias
			descriptorObj = this.possibleDescriptors.find(dscrpt => dscrpt.names.includes(args[0]));

			//Check if specified index is valid. (If there's only 1 mob but specified mob number 2)
			if (args[0] > mobs.length || descriptorObj === undefined) {
				message.channel.send("Not a valid mob! Attack Canceled");
				return;
			}

			mobIndex = descriptorObj.findMobIndex()
		}else {
			//If they didn't specify, choose first mob.
			mobIndex = 1;
		}

		//Get player's currently equipped weapon
		equippedWeapon = gameData.inventory.filter(weapon => weapon.equipped == "weapon")[0]

		//See if mob succeeds in defending the attack
		if (mobs[mobIndex-1].dfs[0] >= getRndInteger(1,100)) {
			//If yes, take less damage.
			dfsDamage = getRndInteger(mobs[mobIndex-1].dfs[1],mobs[mobIndex-1].dfs[2])
			//player attacks. (mobIndex-1 because player puts in a number where 1 is first mob, 2 is second, but arrays start at 0)
			atkDamage = getRndInteger(equippedWeapon.atk[0],equippedWeapon.atk[1])-dfsDamage;
			if (atkDamage < 0) {
				//If the mob defends more hp than player attacked, set atkDamage to 0 instead of a negative number
				atkDamage = 0;
			}
			mobs[mobIndex-1].hp -= atkDamage;
			//Announce Player Attack
			reply.push(`You ${equippedWeapon.atkName[getRndInteger(0,equippedWeapon.atkName.length - 1)]} the ${mobs[mobIndex-1].name} but it ${mobs[mobIndex-1].dfsName[getRndInteger(0,mobs[mobIndex-1].dfsName.length-1)]}! It lost ${atkDamage} hp!`);

		}else {
			//player attacks. (mobIndex-1 because player puts in a number where 1 is first mob, 2 is second, but arrays start at 0)
			atkDamage = getRndInteger(equippedWeapon.atk[0],equippedWeapon.atk[1]);
			mobs[mobIndex-1].hp -= atkDamage;
			//Announce Player Attack
			reply.push(`You ${equippedWeapon.atkName[getRndInteger(0,equippedWeapon.atkName.length - 1)]} the ${mobs[mobIndex-1].name}! It lost ${atkDamage} hp!`);
		}


		//If mob dies delete it from the array and move it to deadMobs array
		if (mobs[mobIndex-1].hp <= 0) {
			deadMobs.push(mobs.splice([mobIndex-1],1)[0]);

			//If there are no mobs left to fight -- COMBAT WON
			if (mobs.length == 0) {
				//Exit Combat mode
				gameData.inCombat = false;
				//Clear combatsituation
				gameData.combatSituation = {};

				reply.push(`You\'ve defeated all the mobs!`);
				//For every mob defeated (all mobs have some loot)
				for (let i=0;i<deadMobs.length;i++) {
					//For every loot that mob has
					for (let j=0;j<deadMobs[i].loot.length;j++) {
						//Sort and place loot in correct location
						if (deadMobs[i].loot[j].type == "weapon") {
							//If weapon add to inventory
							gameData.inventory.push(deadMobs[i].loot[j]);
							weaponsGained.push(deadMobs[i].loot[j].name);
						}else if (deadMobs[i].loot[j].type == "xp") {
							//If xp add xp to gameData
							gameData.xp += deadMobs[i].loot[j].xpAmount;
							xpGained += deadMobs[i].loot[j].xpAmount;
						}
					}
				}

				//Tell player about all loot gotten
				reply.push(`You got:`);
				reply.push(weaponsGained);
				reply.push(`You gained ${xpGained} experience `);

				//if xp is greater than needed to level up, do so. 100xp for level 1 to 2, 110xp for level 2 to 3. Xp reset every level
				while (xpGained >= 100 + ((gameData.level-1)*10)) {
					gameData.level += 1;
					xpLevelsGained++;
					gameData.xp = 0;
					xpGained = xpGained - 100 + ((gameData.level-1)*10); //Subtract xp put into leveling up from xp gained in this fight.
					gameData.xp += xpGained //Add remaining xp towards next level
				}//Since this is while, it will loop until player cannot level up.

				//Add second part to last element of the replies array (the first part of telling the experience gathered.)
				reply[reply.length-1] += `and went up ${xpLevelsGained} levels!`;
				message.channel.send(reply);
				return;
			}
		}

		//Mob(s) attack
		for (let i=0;i < mobs.length;i++) {
			atkDamage = getRndInteger(mobs[i].atk[0],mobs[i].atk[1]);
			gameData.health -= atkDamage;
			//Announce Mob Attacking
			reply.push(`The ${mobs[mobIndex-1].name} ${mobs[mobIndex-1].atkName[getRndInteger(0,mobs[mobIndex-1].atkName.length - 1)]} you! You lost ${atkDamage} hp!`);
		}

		//If player dies -- COMBAT LOST
		if (gameData.health < 1) {
			gameData = JSON.parse(gameData.checkpointGameData);
			reply.push(`You Died. You are at the start of the level. Your inventory and stats have been reset to what it was. Use \`!look\` to see where you are again.`);
			message.channel.send(reply);
		}else {
			//Since they're not dead, tell them their remaining health.
			reply.push(`You have ${gameData.health} hp remaining.`);
			message.channel.send(reply)
		}

		//save results
		gameData.combatSituation = mobs;

		client.setGameData.run({
			id: gameData.locationId - message.author.id,
			userId: message.author.id,
			guildId: gameData.locationId,
			gameData: JSON.stringify(gameData)
		})
	}
};
//This code handles fighting mobs