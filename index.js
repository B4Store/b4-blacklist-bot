const Discord = require('discord.js');
const {Client, Intents, MessageAttachment, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js')
const client = new Client({
	      intents: 32767
});
const config = require('./config.js');
const prefix = config.prefix;
let db = require('croxydb')
const { SlashCommandBuilder } = require('@discordjs/builders'),
  { SlashRegister } = require('slash-register');

const slashRegister = new SlashRegister();

(async () => {
	console.clear()
	console.log(`
\x1b[38;2;143;110;250m██████╗░██╗░░░░░░█████╗░░█████╗░██╗░░██╗██╗░░░░░██╗░██████╗████████╗
\x1b[38;2;157;101;254m██╔══██╗██║░░░░░██╔══██╗██╔══██╗██║░██╔╝██║░░░░░██║██╔════╝╚══██╔══╝
\x1b[38;2;172;90;255m██████╦╝██║░░░░░███████║██║░░╚═╝█████═╝░██║░░░░░██║╚█████╗░░░░██║░░░
\x1b[38;2;188;76;255m██╔══██╗██║░░░░░██╔══██║██║░░██╗██╔═██╗░██║░░░░░██║░╚═══██╗░░░██║░░░
\x1b[38;2;205;54;255m██████╦╝███████╗██║░░██║╚█████╔╝██║░╚██╗███████╗██║██████╔╝░░░██║░░░  
\x1b[38;2;222;0;255m╚═════╝░╚══════╝╚═╝░░╚═╝░╚════╝░╚═╝░░╚═╝╚══════╝╚═╝╚═════╝░░░░╚═╝░░░

\x1b[38;2;143;110;250m███╗░░░███╗░█████╗░██████╗░███████╗  ██████╗░██╗░░░██╗  ██████╗░░░██╗██╗
\x1b[38;2;157;101;254m████╗░████║██╔══██╗██╔══██╗██╔════╝  ██╔══██╗╚██╗░██╔╝  ██╔══██╗░██╔╝██║
\x1b[38;2;172;90;255m██╔████╔██║███████║██║░░██║█████╗░░  ██████╦╝░╚████╔╝░  ██████╦╝██╔╝░██║
\x1b[38;2;188;76;255m██║╚██╔╝██║██╔══██║██║░░██║██╔══╝░░  ██╔══██╗░░╚██╔╝░░  ██╔══██╗███████║
\x1b[38;2;205;54;255m██║░╚═╝░██║██║░░██║██████╔╝███████╗  ██████╦╝░░░██║░░░  ██████╦╝╚════██║
\x1b[38;2;222;0;255m╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═════╝░╚══════╝  ╚═════╝░░░░╚═╝░░░  ╚═════╝░░░░░░╚═╝

\x1b[38;2;143;110;250m██╗░░░██████╗░██╗░░██╗░░░██╗░██╗░░█████╗░
\x1b[38;2;157;101;254m██║░░░██╔══██╗╚██╗██╔╝██████████╗██╔══██╗
\x1b[38;2;172;90;255m██║░░░██║░░██║░╚███╔╝░╚═██╔═██╔═╝██║░░██║
\x1b[38;2;188;76;255m██║░░░██║░░██║░██╔██╗░██████████╗██║░░██║
\x1b[38;2;205;54;255m██║██╗██████╔╝██╔╝╚██╗╚██╔═██╔══╝╚█████╔╝
\x1b[38;2;222;0;255m╚═╝╚═╝╚═════╝░╚═╝░░╚═╝░╚═╝░╚═╝░░░░╚════╝░\x1b[0m
`);

  console.log('Starting...');

  slashRegister.login(config.token);

  [
    new SlashCommandBuilder().setName('blacklist-ch').setDescription('Set the channel for the blacklist.').addChannelOption(option => option.setName('channel').setDescription('The channel to set.').setRequired(true)),
    new SlashCommandBuilder().setName('info').setDescription('Get info about a user.').addStringOption(option => option.setName('user').setDescription('The user to get info about.').setRequired(true)),
    new SlashCommandBuilder().setName('msg').setDescription('Replies with user info!')
  ].forEach((builder) => slashRegister.addGlobalCommand(builder.toJSON()));

  console.log('Commands registered! Syncing...');

  await slashRegister.sync();
})();
client.on('ready', () => {
	console.log(`${client.user.tag} is ready!`);
	setInterval(() => {
		let d = db.get(`blacklistusers`)
		if (!d) return;
		d.forEach(async user => {
			client.guilds.cache.forEach(async guild => {
				let member = guild.members.cache.get(user)
				if (!member) return;
				member.ban({ reason: 'Blacklisted' })
			})
		})
	}, 60000)
})

client.on('guildCreate', async guild => {
	const channel = guild.channels.cache.find(channel => channel.type === 'GUILD_TEXT' && channel.permissionsFor(guild.me).has('SEND_MESSAGES'))
	guild.channels.create('blacklist', { type: 'GUILD_TEXT' }).then(channel => {
		db.push(`blacklistchannel`, channel.id)
	})
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	if (interaction.commandName === 'blacklist-ch') {
		if(!config.owner.includes(interaction.user.id)) return;
		let channel = interaction.options.getChannel('channel')
		if(!channel) return;
		db.push(`blacklistchannel`, channel.id)
		interaction.reply(`Done, I will send blacklisted users info to ${channel}`)
	} else if (interaction.commandName === 'info') {
		if(!config.owner.includes(interaction.user.id)) return;
		let user = interaction.options.getString('user')
		let data = db.get(`blacklistuser_${user}`)
		if(!data) return interaction.reply('This user is not blacklisted!')
		let embed = new Discord.MessageEmbed()
		.setThumbnail(config.thumbnail)
		.setImage(config.thumbnail2)
		.setFooter({ text: config.text , iconURL: config.thumbnail })
		.addFields(
			{ name: 'الشخص', value: `${user.tag || ''} \`[${user}]\``, inline: true },
			{ name: 'منشن', value: `<@${user}>`, inline: true },
			{ name: 'السبب', value: `${data.reason}`, inline: false },
			{ name: 'الادلة', value: `${data.evidence}`, inline: false },
		)
		.setColor(config.color)
		.setTimestamp()
		interaction.reply({embeds: [embed]})
	} else if (interaction.commandName === 'msg') {
		if(!config.owner.includes(interaction.user.id)) return;
		const row = new MessageActionRow()
		.addComponents(
			new MessageButton()
			.setCustomId('butc')
			.setLabel('Click Here')
			.setStyle('SECONDARY')
		);

		let embed = new Discord.MessageEmbed()
		.setTitle(config.title)
		.setDescription(config.discription)
		.setColor(config.color)
		.setTimestamp()

		interaction.channel.send({embeds: [embed], components: [row]})
        interaction.reply({content: "Done!", ephemeral: true})
	}
})
		


client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;

	if (interaction.customId === 'butc') {
		if(!config.roles.some(role => interaction.member.roles.cache.has(role))) return;
		let modal = new Modal()
		.setTitle(config.label1)
		.setCustomId('modal')
		const c = new TextInputComponent()
		.setCustomId('user')
		.setLabel(config.label2)
		.setStyle('SHORT')
		const b = new TextInputComponent()
		.setCustomId('reason')
		.setLabel(config.label3)
		.setStyle('PARAGRAPH')
		const d = new TextInputComponent()
		.setCustomId('evidence')
		.setLabel(config.label4)
		.setStyle('PARAGRAPH')
		const cc = new MessageActionRow().addComponents(c)
		const bb = new MessageActionRow().addComponents(b)
		const dd = new MessageActionRow().addComponents(d)
		modal.addComponents(cc, bb, dd)

		await interaction.showModal(modal)
	}
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isModalSubmit()) return;
	if (interaction.customId === 'modal') {
		const user = interaction.fields.getTextInputValue('user')
		const reason = interaction.fields.getTextInputValue('reason')
		const evidence = interaction.fields.getTextInputValue('evidence')
		let userr = client.users.cache.get(user)
		if (!userr) userr = ''
		db.push(`blacklistusers`, user)
		db.set(`blacklistuser_${user}`, { reason: reason, evidence: evidence })
		let embed = new Discord.MessageEmbed()
		.setThumbnail(config.thumbnail)
		.setImage(config.thumbnail2)
		.setFooter({ text: config.text , iconURL: config.thumbnail })
		.addFields(
			{ name: 'الشخص', value: `${userr.tag || ''} \`[${user}]\``, inline: true },
			{ name: 'منشن', value: `<@${user}>`, inline: true },
			{ name: 'السبب', value: `${reason}`, inline: false },
			{ name: 'الادلة', value: `${evidence}`, inline: false },
		)
		.setColor(config.color)
		.setTimestamp()
		
		let d = db.get(`blacklistchannel`)
		if (!d) return interaction.reply({ content: config.content1, ephemeral: true })
		await interaction.reply({ content: config.content2, ephemeral: true })
		d.forEach(async channel => {
			let ch = client.channels.cache.get(channel)
			if (!ch) return;
			ch.send({embeds: [embed]}).catch(err => {})
		})
	}
})

client.on('guildMemberAdd', async member => {
	let d = db.get(`blacklistusers`)
	if (!d) return;
	if (d.includes(member.id)) {
		member.ban({ reason: 'Blacklisted' })
	}
})

process.on('unhandledRejection', err => {
	console.log(err)
})

process.on('uncaughtException', err => {
	console.log(err)
})

client.login(config.token)
