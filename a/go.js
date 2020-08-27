module.exports = {
    name: 'go',
    aliases: ["move","travel"],
    description: 'Moves your character',
    usage: `?go [direction]`,
    possibleDescriptors:[
        {
            names: ["up","north"]
        },
        {
            names:["right","east"]
        },
        {
            names:["down","south"]
        },
        {
            names: ["left", "west"]
        }
    ],
    execute(message,args,client) {
        let reply =""
        let descriptorObj = null;

        //Find the descriptor object by matching it to a possible alias
        descriptorObj = this.possibleDescriptors.find(dscrpt => dscrpt.names.includes(args[0]));

        //If the descriptor object has meaningfull information, which it will if the argument was a valid descriptor
        if (descriptorObj) {
            reply = `Moving ${descriptorObj.names[0]}!`
        }else{
            reply = "No Direction Specified!"
        }

        message.channel.send(reply);
    }
};

/*
possible Descriptors refers to the additional information specified by user that is essential in using the command.
EX: the direction for the go command. Description is the description of the command, and descriptor is the info needed
to run command. dscrpt is shorthand for descriptor
 */
