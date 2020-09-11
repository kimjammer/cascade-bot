const Discord = require('discord.js');
const client = new Discord.Client();

client.MessageAttachment = Discord.MessageAttachment;
client.MessageEmbed = Discord.MessageEmbed;
client.ReactionCollector = Discord.ReactionCollector;

const fs = require('fs');

const Database = require('better-sqlite3');
const db = new Database("Database.sqlite");

const {token} = require('./config.json');
client.prefix = "!";

//Creates map with all commands
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./a').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./a/${file}`);
	client.commands.set(command.name.toLowerCase(), command);
}

client.on('ready', () => {
	console.log('Cascade Bot is online');
	client.user.setActivity("!start",{type: "LISTENING"})

	const TableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='UserData';",(error,table) =>{
		if (error){
			console.log(error)
		}
		return table;
	});

	if (!TableExists.get()){
		const createTable = db.prepare("CREATE TABLE UserData (id INTEGER PRIMARY KEY NOT NULL, userId TEXT NOT NULL, guildId TEXT NOT NULL, gameData TEXT);", error => {
			console.log('Initilized!')
			if (error) {
				console.log(error)
			}
		});//end of prepare statement
		createTable.run();
	}

	client.getGameData = db.prepare("SELECT * FROM UserData WHERE userId = ? AND guildId = ? ;",(error) => {if (error){console.log(error)}});
	client.setGameData = db.prepare("INSERT OR REPLACE INTO UserData (id, userId, guildId, gameData) VALUES (@id, @userId, @guildId, @gameData);",error => {if (error){console.log(error)}});
	client.createGameData = db.prepare("INSERT INTO UserData (id, userId, guildId, gameData) VALUES (@id, @userId, @guildId, @gameData);",error => {if(error){console.log(error)}});
});

//Do something when message is sent
client.on('message',message => {
	if (!message.content.startsWith(client.prefix) || message.author.bot) return;

	let msgContents = message.content.slice(client.prefix.length).split(/ +/);
	let commandName = msgContents.shift().toLowerCase();
	let command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	let args = msgContents.map(element => {return element.toLowerCase();});
	let locationId;

	let reply = ''

	if (!command) return;

	//Find out if this is server channel or DM channel
	if (message.channel.type == "text") {
		//Set locationId to the id of the guild.
		locationId = message.guild.id;
	}else if (message.channel.type == "dm") {
		//Set locationId to the DM channel ID
		locationId = message.channel.id;
	}else {
		message.channel.send("Error. Try again in a DM or normal server text channel.");
		return
	}

	let saveData = client.getGameData.get(message.author.id,locationId);

	if (!saveData) {
		//If user doesn't have a game, tell them to make one. But if the command is make game, let them do it.
		if (command.name == "start") {
			try {
				command.execute(message,args,client)
			}catch (e) {
				console.log(e);
				reply = 'Something went wrong. :('
				message.channel.send(reply);
			}
			return;
		}else {
			message.channel.send(`You don't have a game! Create one with \`${client.prefix}start\``);
			return;
		}
	}

	try {
		command.execute(message,args,client,JSON.parse(saveData.gameData)); //message is the message object so the code can call message.channel.send() or etc
	}catch(err){
		console.log(err);
		reply = 'Something went wrong. :('
		message.channel.send(reply);
	}

});

/*
                                 West
Maps are set up like this: South      North
                                 East
 y y y y y
x
x
x
x
0=invalid space; 1=valid space; 2=move to next level; 3=End of Game; 4=Mob in space; 5=interactable (drawer,button,door).
 */
client.levelMap = {
	1: [[1,1,1,5],
		[0,5,0,0],
		[1,1,1,2]],
	2: [[1,4,1],
		[1,1,1]]
}

client.levelDialogue = {
	1: [["Welcome to the world of Cascade, you are in a dark, stone hallway with a path way to your front.","The hallway continues straight forward, but there is also a way to your right.","You can go forward or you can go backwards, and that is it.",`At first glance, there seems to be nothing here, but you find a small stone button embedded in the wall. Use \`${client.prefix}interact\``],
		["Invalid Space","The hallway continues to your right.","Invalid Space","Invalid Space"],
		["Another dead end.","You exit the hallway. You can go north or south","The staircase down is just ahead! It is dully lit up with a single torch.","You head down the stair case to the next level of the dungeon."]],
	2: [["You are in an open room.","You stumble across a big spider. Fight!","You are in an open room."],
		["You are in an open room.","You are in an open room.","You are in an open room."]]
}

//Levels can have mobs, and they are organized like this: 0=no Mob &
//[{name:"Mob1",hp:AmountOfHealth,atk:[LowEndAttack,HighEndAttack],dfs:[Chance at Defense,lowEndDefense,highEndDefense],atkName:[Names for attacks], dfsName:[Names for Defenses],loot:[{Standard Item Object. (Ex in start.js giving first weapon to player.)}]},["name":"Mob2"]]
client.levelMobs = {
	1: [[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0]],
	2: [[0,[{name:"Big Spider",hp:15,atk:[1,5],dfs:[10,2,4],atkName:["slashes","pounces"],dfsName:["dodges","jumps"],loot:[{name:"Steel Sword",description:"A nice, shiny steel sword. Powerful and sharp.",type:"weapon", equipped:"0",atk:[8,9]},{name:"xp",type:"xp",xpAmount:20}]}],0],
		[0,0,0]]
}
//Levels can have stuff to interact with - drawers with weapons, buttons to open doors, etc
client.levelInteractable = {
	1: [[0,0,0,[{name:"Stone Button",type:"signalSender",id:"stoneButton1",target:"woodenDoor1",dialogue:"You pressed the button. A door creaks open somewhere behind you."}]],
		[0,[{name:"Wooden Door",type:"door",id:"woodenDoor1"}],0,0],
		[0,0,0,0]],
	2: [[0,0,0],
		[0,0,0]]
}

client.login(token);

//Code to prevent the program from crashing with non-zero exit code.
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));