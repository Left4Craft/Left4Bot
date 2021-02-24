module.exports = {
	name: 'realname',
	description: 'Identifies the possible real names of a given search query',
	usage: '<nickname/username/Discord tag/Discord id/uuid>',
	aliases: ['whois'],
	example: 'realname Captain_Sisko',
	args: true,
    
	guildOnly: true,
	staffOnly: true,
	async execute(message, args, depend) {

		const {
			config,
			discord_lib: Discord,
			log,
			sql_pool: pool,
			player_util,
			redis_client,
		} = depend;


		const search = args[0];
		// step 1: try to get uuid from discord tags or perfect username match
		player_util.get_uuid(args[0], pool, log, (uuid) => {
			if(uuid === null) {
				pool.query('SELECT nick, uuid FROM nicky', (err, res) => {
					if(err) log.err(err);
					let uuids = [];
					for (let item of res) {
						const nick = item['nick'].replace(/§[0-9A-FK-ORa-fk-or]/g, '').replace(/&[0-9A-FK-ORa-fk-or]/g, ''); // strip color codes
						console.log(nick);
						if(nick.toLowerCase().startsWith(search.toLowerCase())) uuids.push(item['uuid']);
					}
					if(uuids.length === 0) {
						message.channel.send(new Discord.MessageEmbed()
							.setColor('RED')
							.setDescription(`\n❌ **Could not find player by \`${search}\`.`
                        + ' Please use a nickname, Minecraft username, Minecraft UUID, Discord tag, or Discord user id**'));   
					} else {
						show_results(message.channel, uuids, player_util, pool, redis_client, search, config, log, Discord);
					}
				});
			} else {
				show_results(message.channel, [uuid], player_util, pool, redis_client, search, config, log, Discord);
			}
		});
	}
};

function show_results(channel, uuids, player_util, pool, redis_client, search, config, log, Discord) {
	let embed = new Discord.MessageEmbed()
		.setColor(config.colour)
		.setTitle('Nickname Search')
		.setDescription(`Players matching ${search}`);

	// collect info up to 3 times, depending on how many uuids are defined.
	player_util.get_player_info(uuids[0], pool, redis_client, log, (player_data) => {
		embed.addField(player_data['username'], 'Nickname: ' + player_data['nick'])
			.addField('Online (Minecraft)', player_data['online'] ? 'Yes' : 'No', true)
			.addField('Muted', player_data['muted'] ? 'Yes' : 'No', true)
			.addField('Banned', player_data['banned'] ? 'Yes' : 'No', true);
		if(uuids[1] !== undefined) {
			// collect info up to 3 times, depending on how many uuids are defined.
			player_util.get_player_info(uuids[1], pool, redis_client, log, (player_data) => {
				embed.addField('\u200b', '\u200b')
					.addField(player_data['username'], 'Nickname: ' + player_data['nick'])
					.addField('Online (Minecraft)', player_data['online'] ? 'Yes' : 'No', true)
					.addField('Muted', player_data['muted'] ? 'Yes' : 'No', true)
					.addField('Banned', player_data['banned'] ? 'Yes' : 'No', true);
				if(uuids[2] !== undefined) {
					// collect info up to 3 times, depending on how many uuids are defined.
					player_util.get_player_info(uuids[2], pool, redis_client, log, (player_data) => {
						embed.addField('\u200b', '\u200b')
							.addField(player_data['username'], 'Nickname: ' + player_data['nick'])
							.addField('Online (Minecraft)', player_data['online'] ? 'Yes' : 'No', true)
							.addField('Muted', player_data['muted'] ? 'Yes' : 'No', true)
							.addField('Banned', player_data['banned'] ? 'Yes' : 'No', true);
						if(uuids[3] !== undefined) {
							embed.addField('\u200b', '\u200b')
								.addField('Note', `There were ${uuids.length} matches, but only the top 3 are shown.`);
							channel.send(embed);
						} else {
							channel.send(embed);
						}
					});
				} else {
					channel.send(embed);
				}
			});
		} else {
			channel.send(embed);
		}
	});

}