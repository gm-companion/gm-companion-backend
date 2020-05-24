const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const pe = require('pretty-error').start();

function isYoutube(url) {
  if (ytdl.validateID(url)) return true;

  if (ytdl.validateURL(url)) return true;

  return false;
}

function getAudioStream(id) {
  try {
    const _id = ytdl.getVideoID(id);

    return ytdl(_id, { filter: 'audioonly' });
  } catch (error) {
    console.error(pe.render(error));
    return undefined;
  }
}

function searchVideo(query, duration, callback) {
  let filter;

  ytsr.getFilters(query, (filterError, filters) => {
    if (filterError) {
      console.error(pe.render(filterError));
      callback(undefined);
    } else {
      filter = filters.get('Type').find((o) => o.name === 'Video');

      const options = {
        limit: 5,
        nextpageRef: filter.ref,
      };

      ytsr(null, options, (searchError, searchResults) => {
        if (searchError) {
          console.error(pe.render(searchError));
          callback(undefined);
        } else {
          console.log(`Query: ${query}`);
          console.log(`Wanted duration: ${duration})`);

          let match;

          searchResults.items.forEach((video) => {
            const videoDuration = convertVideoDuration(video.duration);
            video.difference = Math.abs(videoDuration - duration);

            console.log(video);
            let firstDifference = 0;

            if (_isPossibleMatch(query, video.title)) {
              if (!match || !match.difference) {
                match = video;
                firstDifference = video.difference;
              } else if (firstDifference > video.difference * 2
                && match.difference > video.difference) {
                match = video;
              }
            }
          });

          callback(match);
        }
      });
    }
  });
}

function _isPossibleMatch(query, title) {
  const words = ['cover', 'tutorial', 'lesson'];

  let ok = true;

  words.forEach((word) => {
    if (query.indexOf(word) < 0) {
      if (title.indexOf(word) > -1) {
        ok = false;
      }
    }
  });

  return ok;
}

function convertVideoDuration(durationString) {
  if (durationString.split(':')[0].length === 1) {
    durationString = `0${durationString}`;
  }

  for (let i = durationString.split(':').length; i < 3; i++) {
    durationString = `00:${durationString}`;
  }

  const datetime = new Date(`1970-01-01T${durationString}Z`);

  return datetime.getTime();
}

module.exports = { isYoutube, getAudioStream, searchVideo };
