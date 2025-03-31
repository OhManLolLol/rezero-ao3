const Database = require('@replit/database');
const axios = require('axios');
const cheerio = require('cheerio');
const pretty = require('pretty');
const Keyv = require('keyv');

const db = new Keyv(); // for in-memory storage

function IsDBEmpty(key) {
  return db.get(key).then(value => {
    if (typeof(value) !== "undefined") {
      return false;
    } else {
      return true;
    }
  });
}

async function getGuildData(guildId) {
  const empty = await IsDBEmpty(guildId);

  if (empty == true) {
    return setupServerData(guildId).then(() => {
      return db.get(guildId);
    });
  } else {
    return db.get(guildId);
  }
}

async function getUserData(userId) {
  const empty = await IsDBEmpty(`User_${userId}`);

  if (empty == true) {
    return setupUserData(userId).then(() => {
      return db.get(`User_${userId}`);
    });
  } else {
    return db.get(`User_${userId}`);
  }
}

async function getAo3Feed() {
  try {
    const { data } = await axios.get(
      'https://archiveofourown.org/tags/Re:%E3%82%BC%E3%83%AD%E3%81%8B%E3%82%89%E5%A7%8B%E3%82%81%E3%82%8B%E7%95%B0%E4%B8%96%E7%95%8C%E7%94%9F%E6%B4%BB%20%7C%20Re:Zero%20Starting%20Life%20in%20Another%20World%20(Anime)/works/'
    );
    const $ = cheerio.load(data);
    const works = [];

    $('li.work.blurb.group').each((_idx, el) => {
      const workInfo = {
        id: "",
        link: ""
      }
      
      const order = $(el).index();
      let id = $(el).attr("id");
      id = id.slice(5);

      workInfo.id = id;
      workInfo.link = `https://archiveofourown.org/works/${id}`;

      //console.log(order, `https://archiveofourown.org/works/${id}`);

      works.splice(order, 0, workInfo);
    });

    return works;
  } catch (error) {
    console.log(`Error grabbing fic feed, error: ${error}`)
  }
}

// TODO: make this fix any undefined lastFeed data
async function updateFeed(guildId, feed) {
  const data = await getGuildData(guildId);

  if (feed != undefined) {
    data.lastFeed = feed;
  }

  return db.set(guildId, data).then(() => {
    //console.log(`RSS updated for guild ${guildId}`);

    return true;
  }).catch((err) => {
    console.log(`Feed update failed for guild ${guildId}, Error: ${err}`);

    return false;
  });
}

async function setupServerData(guildId) {
  const rss = await getAo3Feed();

  let serverTable = {
    ficList: {},
    blockList: {},
    feedChannel: "None",
    updateChannel: "None",
    lastFeed: rss
  };

  return db.set(guildId, serverTable).then(() => {
    console.log(`Server data set up for guild ${guildId}`);

    return true;
  }).catch((err) => {
    console.log(`Server data for guild ${guildId}, Error: ${err}`);

    return false;
  });
}

async function setupUserData(userId) {
  let userTable = {
    favoritesList: {},
    followingList: {}
  };

  return db.set(`User_${userId}`, userTable).then(() => {
    console.log(`User data set up for user ${userId}`);

    return true;
  }).catch((err) => {
    console.log(`User data for user ${userId}, Error: ${err}`);

    return false;
  });
}

async function addFicToList(guildId, workKey, link) {
  const data = await getGuildData(guildId);

  data.ficList[workKey] = {
    id: workKey,
    work: link,
  }

  db.set(guildId, data).then(() => {
    console.log(`Fic added to list for guild ${guildId}`);
  }).catch((err) => {
    console.log(`Fic added to list for guild ${guildId}, Error: ${err}`);
  });
}

async function addFavoriteFic(userId, workKey) {
  const data = await getUserData(userId);

  if (typeof (data.favoritesList[workKey]) == 'undefined') {
    data.favoritesList[workKey] = {
      id: workKey
    };

    return db.set(`User_${userId}`, data).then(() => {
      console.log(`Favorite fic added for user ${userId}`);

      return true;
    }).catch((err) => {
      console.log(`Favorite fic failed to add to user ${userId}, Error: ${err}`);

      return false;
    });
  } else {
    return false;
  }
}

async function removeFavoriteFic(userId, workKey) {
  const data = await getUserData(userId);

  if (typeof (data.favoritesList[workKey]) != 'undefined') {
    delete data.favoritesList[workKey];

    return db.set(`User_${userId}`, data).then(() => {
      console.log(`Favorite fic deleted for user ${userId}`);

      return true;
    }).catch((err) => {
      console.log(`Favorite fic failed to delete for user ${userId}, Error: ${err}`);

      return false;
    });
  } else {
    return false;
  }
}

async function followAuthor(userId, author) {
  const data = await getUserData(userId);

  if (typeof (data.followingList[author]) == 'undefined') {
    data.followingList[author] = true;

    return db.set(`User_${userId}`, data).then(() => {
      console.log(`Author followed for user ${userId}`);

      return true;
    }).catch((err) => {
      console.log(`Author failed to follow for user ${userId}, Error: ${err}`);

      return false;
    });
  } else {
    return false;
  }
}

async function unfollowAuthor(userId, author) {
  const data = await getUserData(userId);

  if (typeof (data.followingList[author]) != 'undefined') {
    delete data.followingList[author];

    return db.set(`User_${userId}`, data).then(() => {
      console.log(`Author unfollowed for user ${userId}`);

      return true;
    }).catch((err) => {
      console.log(`Author failed to unfollow for user ${userId}, Error: ${err}`);

      return false;
    });
  } else {
    return false;
  }
}

async function getFicFromList(guildId, workKey) {
  const data = await getGuildData(guildId);

  if (typeof (data.ficList[workKey]) != 'undefined') {
    return data.ficList[workKey];
  } else {
    return false;
  }
}

async function getFavoriteFromList(userId, workKey) {
  const data = await getUserData(userId);

  if (typeof (data.favoritesList[workKey]) != 'undefined') {
    return data.favoritesList[workKey];
  } else {
    return false;
  }
}

async function isFollowingAuthors(userId, authors) {
  const data = await getUserData(userId);
  let isFollowing = false;

  for (let i = 0; i < authors.length; i++) {
    const author = authors[i];

    if (typeof (data.followingList[author]) != "undefined") {
      isFollowing = true;
      break;
    }
  }

  return isFollowing;
}

db.on('error', err => console.error('Keyv connection error:', err));

module.exports = { IsDBEmpty, addFicToList, addFavoriteFic, removeFavoriteFic, followAuthor, unfollowAuthor, getFicFromList, getFavoriteFromList, isFollowingAuthors, getGuildData, getUserData, getAo3Feed, updateFeed };