module.exports = {
	channels: ['discord.botcommands'],

	execute(channel, message, depend) {
		const {
			config,
			discord_client: client,
			log,
		} = depend;

		log.console('[BOT CMD] ' + message);

		// try {
		let commandObj = JSON.parse(message);

		if (commandObj.command === 'setuser') {
			client.guilds.cache.get(config.guild_id).members.fetch(commandObj.id).then((member) => {
				if (member.displayName !== commandObj.nick) member.setNickname(commandObj.nick);
			});

		} else if (commandObj.command === 'setgroup') {
			const role_ids = config.in_game_ranks;

			client.guilds.cache.get(config.guild_id).members.fetch(commandObj.id).then((member) => {

				// step 0: don't promote a muted player
				if (member.roles.cache.get(config.special_ranks['muted']) !== undefined) {
					return;
				}

				//step 1: don't promote player which already has role
				if (member.roles.cache.get(role_ids[commandObj.group]) !== undefined) {
					return;
				}

				// step 2: add new role
				member.roles.add(role_ids[commandObj.group]).then(() => {
					// step 3: remove all other in game roles
					for (const in_game_role in role_ids) {
						if (in_game_role !== commandObj.group) {
							member.roles.remove(role_ids[in_game_role]);
						}
					}
					// step 4: add staff role if applicable
					if (config.staff_ranks.includes(commandObj.group)) {
						member.roles.add(config.special_ranks.staff);
					} else {
						member.roles.remove(config.special_ranks.staff);
					}
				});
			});
		} else if (commandObj.command === 'unlink') {
			const oldId = commandObj.oldId;
			const newId = commandObj.newId;

			if (oldId === newId) {
				client.users.fetch(newId).then((user) => {
					user.createDM().then((dm) => {
						dm.send('This Discord account has already been linked to your in-game account.');
					}).catch(() => {
						log.warn('[BOT CMD] Failed to send message user');
						const support_chan = client.channels.fetch(config.support_channel_id);
						support_chan.then(chan => {
							chan.send(`<@${user.id}>, your punishment has expired, so you have been unmuted from the Discord server. You will need to rejoin the Minecraft server to regain your Discord rank.`);
						});
					});
				});
			} else {
				client.users.fetch(oldId).then((user) => {
					// remove all roles from old account
					client.guilds.cache.get(config.guild_id).members.fetch(oldId).then((member) => {
						member.roles.set([]);
					});

					user.createDM().then((dm) => {
						dm.send('Your account has been demoted on Discord because you linked another account from in game.\n' +
							'If this was not you, your Minecraft account may have been compromised.\n' +
							'New account id: `' + newId + '`');
					});
				}).catch(() => {
					log.warn('[BOT CMD] Failed to send message to old account, they probably left the server.');
					const support_chan = client.channels.fetch(config.support_channel_id);
					support_chan.then(chan => {
						chan.send(`<@${oldId}>, Your account has been demoted on Discord because you linked another account from in game.\n` + 
						'If this was not you, your Minecraft account may have been compromised.');
					});
				});
			}
		} else {
			log.error('[BOT CMD] Recieved invalid command!');
			log.error(commandObj['command']);
		}

		// } catch (e) { // when not a json object, message is supposed to be directly sent
		//     log.error('[BOT CMD] Error executing bot command:');
		//     log.error(message);
		//        log.error(e);
		// }
	}
};