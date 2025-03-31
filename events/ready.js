const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { CheckFanfics, CreateFicEmbed, GetIDsFromWork } = require("../AO3.js")
const { addFicToList, getFicFromList, getAo3Feed, getUserData, IsDBEmpty, isFollowingAuthors } = require("../DBHelper.js")

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    const ficUpdates = "1213073631727591525";
    const ficFeed = "1127773498576740492";
    const serverId = "988143466221559818";

    console.log("Ready!");

    async function postUpdate(link, channel, guild) {
      console.log("Update being posted");
      const info = await CreateFicEmbed(link);
      const linkId = await GetIDsFromWork(link).workId;

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

      const members = await guild.members.fetch();

      // run it async
      setTimeout(function () {
        members.forEach((member) => {
          IsDBEmpty(`User_${member.id}`).then(result => {
            if (result == false) {
              getUserData(member.id).then(data => {
                if (typeof (data.favoritesList[linkId]) != "undefined") {
                  member.send({ content: "Hey! One of your favorite fics just updated!", embeds: [embed], components: [dmRow] });
                } else {
                  isFollowingAuthors(member.id, authors).then(isFollowing => {
                    if (isFollowing) {
                      let components = [];

                      if (typeof (data.favoritesList[linkId]) != "undefined") {
                        components.push(dmRow);
                      } else {
                        components.push(row);
                      }

                      member.send({ content: "Hey! An author you're following just uploaded a fic!", embeds: [embed], components: components });
                    }
                  })
                }
              })
            }
          })
        })
      }, 0);
      console.log("sending to channels");
      channel.send({ content: "**An update appeared! Subaru-kun, where are you!?**", embeds: [embed], components: [row] })
        .then((message) => message.crosspost());
    }

    client.guilds.fetch(serverId).then((guild) => {
      function doUpdates() {
        CheckFanfics(serverId).then((lists) => {
          if (typeof (lists) !== "undefined") {
            const trackedList = lists[0];
            const feedList = lists[1];

            if (typeof (trackedList) !== "undefined" && typeof (feedList) !== "undefined") {
              console.log("// FINAL LIST \\");
              console.log(trackedList, feedList);

              guild.channels.fetch(ficUpdates).then(channel => {
                const postPromise = new Promise((resolve, reject) => {
                  trackedList.forEach((fic, index, array) => {
                    postUpdate(fic, channel, guild);

                    if (index === array.length - 1) resolve();
                  });
                });

                postPromise.then(() => {
                  console.log('All tracked fics posted.');
                });
              });

              guild.channels.fetch(ficFeed).then(channel => {
                const postPromise = new Promise((resolve, reject) => {
                  feedList.forEach((fic, index, array) => {
                    postUpdate(fic, channel, guild);

                    if (index === array.length - 1) resolve();
                  });
                });

                postPromise.then(() => {
                  console.log('All feed fics posted.');
                });
              });
            }
          }
        });

        setTimeout(doUpdates, 600000);
      }

      doUpdates();
    });
  }
};