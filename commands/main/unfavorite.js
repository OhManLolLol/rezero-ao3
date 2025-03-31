const { SlashCommandBuilder } = require('discord.js');
const scraper = require('ao3scraper');
const Database = require("@replit/database")
const db = new Database()
const { IsAO3Work, IsReZeroWork, GetIDsFromWork, GetWorkInfo } = require("../../AO3.js")
const { getFavoriteFromList, removeFavoriteFic } = require("../../DBHelper.js")
const { admins } = require("../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unfavorite')
		.setDescription('Unfavorite this work if it is on your favorites list!')
    .setDMPermission(true)
    .addStringOption(option =>
      option.setName("link")
        .setDescription("Link of the fic")
        .setRequired(true)),
	async execute(interaction) {
    await interaction.deferReply();
    
    const link = interaction.options.getString("link");
    
    if (IsAO3Work(link) === true) {
      if (await IsReZeroWork(link) === true) {
        const workId = GetIDsFromWork(link).workId;
        const hasFic = await getFavoriteFromList(interaction.user.id, workId);
        
        if (hasFic != false) {
          await removeFavoriteFic(interaction.user.id, workId);

          interaction.editReply({content: "Removed from your favorites list."});
        } else {
          interaction.editReply({content: "You don't have this favorited?"});
        }
      } else {
        interaction.editReply({content: "This is from ANOTHER WORLD! (Not a Re:Zero fic)"});
      }
    } else {
      interaction.editReply({content: "Ottoto, don't grab another bottle! (Not an Ao3 link)"});
    }
    
	},
}