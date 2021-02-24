module.exports = {
	name: 'help',
	description: 'Displays help menu',
	usage: '[command]',
	aliases: ['command', 'commands'],
	example: 'help poll',
	args: false,
	guildOnly: true,
	adminOnly: false,
	execute(message, args, depend) {
		const client = message.client;
		const {
			config,
			discord_lib: Discord,
			log,
		} = depend;


		const commands = Array.from(client.commands.values());

		if (!args.length) {
			var cmds = [];

			for (let command of commands) {
				if (command.hide) continue;

				if ((command.permission && !message.member.hasPermission(command.permission)) || (command.staffOnly === true && !message.member.roles.cache.some(r => config.staff_ranks.includes(r.name.toLowerCase()))) || (command.adminOnly === true && !message.member.roles.cache.some(r => config.admin_roles.includes(r.name.toLowerCase())))) {
					continue;
				}

				cmds.push(`**${config.prefix}${command.name}** **·** ${command.description}`);
			}
			const embed = new Discord.MessageEmbed()
				.setTitle('Commands')
				.setColor(config.colour)
				.setDescription(`\nThe commands you have access to are listed below. Type \`${config.prefix}help [command]\` for more information about a specific command.\n\n${cmds.join('\n\n')}\n\nPlease contact a member of staff if you require assistance.`)
				.setFooter(config.name, client.user.avatarURL());


			message.channel.send(embed)
				.catch((error) => {
					log.warn('Could not send help menu');
					log.error(error);
				});

		} else {
			const name = args[0].toLowerCase();
			const command = client.commands.get(name) || client.commands.find(c => c.aliases && c.aliases.includes(name));

			if (!command) {
				const notCmd = new Discord.MessageEmbed()
					.setColor('RED')
					.setDescription(`❌ **Invalid command name** (\`${config.prefix}help\`)`);
				return message.channel.send(notCmd);
			}

			const cmd = new Discord.MessageEmbed()
				.setColor(config.colour)
				.setTitle(command.name);


			if (command.long) {
				cmd.setDescription(command.long);
			} else {
				cmd.setDescription(command.description);
			}
			if (command.aliases) cmd.addField('Aliases', `\`${command.aliases.join(', ')}\``, true);

			if (command.usage) cmd.addField('Usage', `\`${config.prefix}${command.name} ${command.usage}\``, false);

			if (command.usage) cmd.addField('Example', `\`${config.prefix}${command.example}\``, false);


			if (command.permission && !message.member.hasPermission(command.permission)) {
				cmd.addField('Required Permission', `\`${command.permission}\` :exclamation: You don't have permission to use this command`, true);
			} else {
				cmd.addField('Required Permission', `\`${command.permission || 'none'}\``, true);
			}
            
			message.channel.send(cmd);

		}

		// command ends here
	},
};