const { SlashCommandBuilder } = require('discord.js');
const scraper = require('ao3scraper');
const Database = require("@replit/database")
const db = new Database()
const { unfollowAuthor, isFollowingAuthors } = require("../../DBHelper.js")
const { admins } = require("../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unfollow')
		.setDescription('Unfollow an author and no longer receive updates for their works.')
    .setDMPermission(true)
    .addStringOption(option =>
      option.setName("username")
        .setDescription("Username of the author")
        .setRequired(true)),
	async execute(interaction) {
    await interaction.deferReply();
    
    const user = interaction.options.getString("username");
    const followingAuthor = await isFollowingAuthors(interaction.user.id, [user]);
        
    if (followingAuthor == true) {
      await unfollowAuthor(interaction.user.id, user);

      interaction.editReply({content: `You've unfollowed ${user}.`});
    } else {
      interaction.editReply({content: `You're not following ${user}?`});
    }
	},
}