const { SlashCommandBuilder } = require('discord.js');
const scraper = require('ao3scraper');
const Database = require("@replit/database")
const db = new Database()
const { followAuthor, isFollowingAuthors } = require("../../DBHelper.js")
const { admins } = require("../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('follow')
		.setDescription('Follow your favorite author and get notified for all their fic updates!')
    .setDMPermission(true)
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Username of the author")
        .setRequired(true)),
	async execute(interaction) {
    await interaction.deferReply();
    
    const user = interaction.options.getString("username");
    const followingAuthor = await isFollowingAuthors(interaction.user.id, [user]);
        
    if (followingAuthor == false) {
      await followAuthor(interaction.user.id, user);

      interaction.editReply({content: `You're now receiving updates for all of ${user}'s Re:Zero fics!`});
    } else {
      interaction.editReply({content: `You're already following ${user}?`});
    }
	},
}