const { SlashCommandBuilder } = require('discord.js');
const scraper = require('ao3scraper');
const Database = require("@replit/database")
const db = new Database()
const { IsAO3Work, IsReZeroWork, GetIDsFromWork, GetWorkInfo } = require("../../AO3.js")
const { addFicToList, getFicFromList } = require("../../DBHelper.js")
const { admins } = require("../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('track')
		.setDescription('Track this work when it updates!')
    .setDMPermission(false)
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
        const hasFic = await getFicFromList(interaction.guild.id, workId);
        
        if (hasFic == false) {
          await addFicToList(interaction.guild.id, workId, link);

          interaction.editReply({content: "Track test successful. Added."});
        } else {
          interaction.editReply({content: "Track test successful. Already added."});
        }
      } else {
        interaction.editReply({content: "This is from ANOTHER WORLD! (Not a Re:Zero fic)"});
      }
    } else {
      interaction.editReply({content: "Ottoto, don't grab another bottle! (Not an A03 link)"});
    }
    
	},
}