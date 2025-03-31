const { Events } = require('discord.js');
const { addFavoriteFic, removeFavoriteFic } = require("../DBHelper.js")

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
      }
    } else if (interaction.isButton()) {
      const id = interaction.customId;

      if (id.startsWith("favorite")) {
        const workId = id.replace("favorite_", "");
        const response = await addFavoriteFic(interaction.user.id, workId);

        if (response == true) {
          interaction.reply({content: "You now have this fic in your favorites!", ephemeral: true});
        } else {
          interaction.reply({content: "You've already favorited this fic, silly!", ephemeral: true});
        }
      } else if (id.startsWith("unfavorite")) {
        const workId = id.replace("unfavorite_", "");
        const response = await removeFavoriteFic(interaction.user.id, workId);

        if (response == true) {
          interaction.reply({content: "This fic was removed from your favorites.", ephemeral: true});
        } else {
          interaction.reply({content: "You haven't favorited this fic, silly!", ephemeral: true});
        }
      }
    }
  },
};