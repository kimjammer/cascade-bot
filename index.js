const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');

const {token} = require('./config.json');
const prefix = "!";

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
});

//Do something when message is sent
client.on('message',message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    let msgContents = message.content.slice(prefix.length).split(/ +/);
    let commandName = msgContents.shift().toLowerCase();
    let command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    let args = msgContents.map(element => {return element.toLowerCase();});

    let reply = ''

    if (!command) return;

    try {
        command.execute(message,args,client); //message is the message object so the code can call message.channel.send() or etc
    }catch(err){
        console.log(err);
        reply = 'Something went wrong. :('
        message.channel.send(reply);
    }

});

client.login(token);

//Code to prevent the program from crashing with non-zero exit code.
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));