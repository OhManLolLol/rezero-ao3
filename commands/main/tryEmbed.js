const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const scraper = require('ao3scraper');
const Database = require("@replit/database")
const db = new Database()
const { IsAO3Work, IsReZeroWork, GetIDsFromWork, GetWorkInfo, CreateFicEmbed } = require("../../AO3.js")
const { addFicToList, getFicFromList, getAo3Feed, getUserData, IsDBEmpty, isFollowingAuthors } = require("../../DBHelper.js")
const { admins } = require("../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('embed')
		.setDescription('wonder what it looks like')
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName("link")
        .setDescription("Link of the fic")
        .setRequired(true)),
	async execute(interaction) {
    await interaction.deferReply();
    
    const link = interaction.options.getString("link");
    const linkId = await GetIDsFromWork(link).workId;
    const info = await CreateFicEmbed(link);

    const embed = info[0];
    const authors = info[1];

    const read = new ButtonBuilder()
    .setLabel("Read")
    .setURL(link)
    .setStyle(ButtonStyle.Link)
    .setEmoji("📖");

    const favorite = new ButtonBuilder()
    .setCustomId(`favorite_${linkId}`)
    .setLabel("Favorite")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⭐");

    const unfavorite = new ButtonBuilder()
    .setCustomId(`unfavorite_${linkId}`)
    .setLabel("Unfavorite")
    .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
    .addComponents(read, favorite);

    const dmRow = new ActionRowBuilder()
    .addComponents(read, unfavorite);

    //const rss = await getAo3Feed();

    const members = await interaction.guild.members.fetch()

    // run it async
    setTimeout(function() {
      members.forEach((member) => {
        IsDBEmpty(`User_${member.id}`).then(result => {
          if (result == false) {
            getUserData(member.id).then(data => {
              if (typeof(data.favoritesList[linkId]) != "undefined") {
                member.send({content: "Hey! One of your favorite fics just updated!", embeds: [embed], components: [dmRow]});
              } else {
                isFollowingAuthors(member.id, authors).then(isFollowing =>{
                  if (isFollowing) {
                    let components = [];

                    if (typeof(data.favoritesList[linkId]) != "undefined") {
                      components.push(dmRow);
                    } else {
                      components.push(row);
                    }

                    member.send({content: "Hey! An author you're following just uploaded a fic!", embeds: [embed], components: components});
                  }
                })
              }
            })
          }
        })
      })
    }, 0);

    interaction.editReply({embeds: [embed], components: [row]});
	},
}