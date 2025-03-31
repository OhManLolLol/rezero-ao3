const { UserSelectMenuBuilder } = require("discord.js");
const { GetWorkInfo, GetWorkFromId } = require("./AO3.js");
const axios = require('axios');
const cheerio = require('cheerio');
const scraper = require('ao3scraper');

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
      
      const order = $(el).index()
      let id = $(el).attr("id");
      id = id.slice(5);

      workInfo.id = id;
      workInfo.link = `https://archiveofourown.org/works/${id}`;

      //console.log(order, `https://archiveofourown.org/works/${id}`)

      works.splice(order, 0, workInfo);
    });

    return works;
  } catch (error) {
    console.log(`Error grabbing fic feed, error: ${error}`)
  }
}


(async () => {
  console.log(null == undefined);
  process.exit();
})();