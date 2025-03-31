const { SlashCommandBuilder } = require('discord.js');
const scraper = require('ao3scraper');
const Database = require("@replit/database")
const db = new Database()
const { IsAO3Work, IsReZeroWork, GetIDsFromWork, GetWorkInfo } = require("../../AO3.js")
const { addFavoriteFic, getFavoriteFromList } = require("../../DBHelper.js")
const { admins } = require("../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('favorite')
		.setDescription('Favorite this work and get notified when it updates!')
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
        
        if (hasFic == false) {
          await addFavoriteFic(interaction.user.id, workId);

          interaction.editReply({content: "Added to your favorites list!"});
        } else {
          interaction.editReply({content: "You've already favorited this fic?"});
        }
      } else {
        interaction.editReply({content: "This is from ANOTHER WORLD! (Not a Re:Zero fic)"});
      }
    } else {
      interaction.editReply({content: "Ottoto, don't grab another bottle! (Not an Ao3 link)"});
    }
    
	},
}