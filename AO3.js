const scraper = require('ao3scraper');
const { SlashCommandBuilder, EmbedBuilder, underscore } = require('discord.js');
const Database = require("@replit/database");
const db = new Database();
const { IsDBEmpty, getAo3Feed, getGuildData, updateFeed } = require("./DBHelper.js");

function IsAO3Work(link) {
  link += "?view_adult=true";

  if (link.toLowerCase().includes(`https://archiveofourown.org/works/`) || (link.toLowerCase().includes(`archiveofourown.org/collections/`) && link.toLowerCase().includes(`/works/`))){
      return true;
    } else {
      return false;
    }
}

function GetWorkInfo(link, verbose) {
  if (IsAO3Work(link) === true) {
    return scraper(link).then(info => {
      return info
    }, true).catch(err => {
      console.log(err)

      return err
    })
  }
}

function FicPassesFilter(ficInfo) {
  const fandoms = ficInfo.fandoms
  const bannedWarnings = [ "Rape/Non-Con", "Underage Sex" ]

  if (fandoms.length > 4) {
    return false
  }

  for (let warning of bannedWarnings) {
    if (ficInfo.warnings.find((value) => value == warning)) {
      return false
    }
  }

  return true
}

function IsReZeroWork(link) {
  if (IsAO3Work(link) === true) {
    return scraper(link).then(info => {
      console.log(info);
      const fandoms = info.fandoms;
      const rztag = fandoms.find(thing => thing === "Re:ゼロから始める異世界生活 | Re:Zero Starting Life in Another World (Anime)");
      
      if (rztag !== undefined) {
        return true;
      } else {
        return false;
      }
    }).catch(err => {
      console.log(err)

      return false;
    })
  }
}

function GetIDsFromWork(link) {
  // assuming work is an AO3 link, pls check beforehand

  const ids = {
    workId: link.match(/works\/(\d+)/)[1],
    chapterId: link.match(/chapters\/(\d+)/)?.[1],
    collectionName: link.match(/collections\/(\w+)/)?.[1],
  };

  return ids
}

function GetWorkFromId(workId) {
  if (typeof(workId) === "number" || typeof(workId) === "string") {
    const link = `https://archiveofourown.org/works/${workId}`

    if (IsAO3Work(link) === true) {
      return link
    } else {
      return false
    }
  } else {
    return false
  }
}

async function CreateFicEmbed(link) {
  try {
    const workInfo = await GetWorkInfo(link);
    
    let desc = workInfo.summary;
    const authors = workInfo.authors;
    const title = workInfo.title;
    const nsfw = workInfo.sfw == true ? "No" : "Yes";
    
    let kudos = workInfo.kudosCount != undefined ? workInfo.kudosCount : "idk";
    let comments = workInfo.commentCount != undefined ? workInfo.commentCount : "idk";
    let words = workInfo.wordCount != undefined ? workInfo.wordCount : "idk";

    let authorString = ""

    authors.forEach((author) => {
      if (authorString.length >= 1) {
        authorString = authorString.concat(", ", author);
      } else {
        authorString = author;
      }
    });
    
    if (desc === '') {
      desc = "No description provided.";
    };
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`${title} by ${authorString}`)
        .setURL(link)
        .setDescription(desc)
        .setTimestamp()
        .addFields(
          {name: "❤️ Kudos", value: kudos, inline: true},
          {name: "📝 Words", value: words, inline: true},
          {name: "💬 Comments", value: comments, inline: true},
          {name: "NSFW", value: nsfw, inline: true},
        )
        .setFooter({text: "Made by ohman. :)"});

    return [embed, authors]     
  } catch (err) {
    console.log(err)

    return false
  }
}

async function CheckFanfics(guildId) {
  const guildData = await getGuildData(guildId);
  const RSS = await getAo3Feed();

  let trackedList = [];
  let feedList = [];

  // function to add fic to lists
  function pushFic(link) {
    const id =  GetIDsFromWork(link).workId
    
    if (guildData.ficList[id] != undefined) {
      trackedList.push(guildData.ficList[id].link);
    } else {
      feedList.push(link);
    }
  }

  //console.log(RSS);

  if (typeof(guildData) == "object") {
    // has guild data
    const oldRSS = guildData.lastFeed;
    
    /*
    console.log("// COMPARISON \\");
    console.log(oldRSS, RSS);
    */

    if (oldRSS === null || RSS === null) {
      return [[], []];
    }

    if (typeof(oldRSS) == "object" && typeof(RSS) == "object") {
      // has old rss feed
      let oldRSSValues = {};

      // sets up old rss feed placement list
      for (let i = 0; i < oldRSS.length; i++)       {
        oldRSSValues[oldRSS[i].id] = i;
      }

      // loop thru new rss feed
      for (let i = 0; i < RSS.length; i++) {
        let oldFic = oldRSS[i];
        let newFic = RSS[i];
      
        if (newFic.id !== oldFic.id) {
          // fic placmenet changed
          const oldPlacement = oldRSSValues[newFic.id]
          
          if (oldPlacement !== undefined) {
            // this fic was in old rss feed
              if (i < oldPlacement) {
                // at a higher rank now, means it updated
                pushFic(newFic.link);
              }
            } else {
            // this fic was not in old rss feed, prob completely new fic, updated
              pushFic(newFic.link);
            }
          }
        }

      await updateFeed(guildId, RSS);
      
      return [trackedList, feedList];
    }
  }
}

module.exports = {IsAO3Work, IsReZeroWork, GetIDsFromWork, GetWorkFromId, GetWorkInfo, CheckFanfics, CreateFicEmbed};