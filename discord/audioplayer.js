const { http, https } = require('follow-redirects');
const fs = require('fs');
const prism = require('prism-media');
const parsers = require('playlist-parser');
const concat2 = require('gather-stream');
const pe = require('pretty-error').start();
const Mixer = require('@rophil/audio-mixer');
const youtube = require('./youtube');
const Spotify = require('../spotify/spotify');

class AudioPlayer {
  constructor(connection) {
    this.musicVolume = 0.1;
    this.soundVolume = 0.1;

    this.connection = connection;
    this.mixer = this._buildMixer();
    this.dispatcher = this._buildDispatcher();
    this.sounds = new Map();
    this.spotify = new Spotify();
  }

  /**
   * Resume playback
   */
  play() {
    console.log('Resuming audio playback');
    this.dispatcher.resume();
  }

  /**
   * Pause playback
   */
  pause() {
    console.log('Pausing audio playback');
    this.dispatcher.pause();
  }

  /**
   * Set the volume of the music input
   */
  setMusicVolume(volume) {
    this.musicVolume = volume;

    if (this.music) this.music.volume = volume;
  }

  /**
   * Set the volume for all sound inputs
   */
  setSoundVolume(volume) {
    this.soundVolume = volume;

    this.sounds.forEach((sound) => {
      if (sound.inputStream) sound.inputStream.volume = volume;
    });
  }

  /**
   * Play audio from a url, if an id is set, it is assumed to be a sound
   */
  playUrl(url, id) {
    console.log(`Playing audio from url ${url}, id: ${id}`);

    // If url is a youtube url
    if (youtube.isYoutube(url)) {
      this.playYoutube(url, id);
      return;
    }

    // If url is a spotify track
    if (url.indexOf('spotify:track:') > -1) {
      this.playSpotify(url, id);
      return;
    }

    // Load audio from normal url
    let httpClient = http;

    if (url.toString().indexOf('https') === 0) {
      httpClient = https;
    }

    httpClient.get(url, (stream) => {
      this._playStream(stream, id);
    }).on('error', (error) => {
      this._logError(error);
    });
  }

  playYoutube(url, id) {
    console.log('Playing youtube video ...');
    const stream = youtube.getAudioStream(url);

    if (stream) this._playStream(stream, id);
    else this._logError('Could not get youtube audio stream');
  }

  playSpotify(url, id) {
    console.log('Playing spotify track ...');

    const trackId = url.replace('spotify:track:', '');

    this.spotify.api.getTrack(trackId)
      .then((track) => {
        console.log(`Track: ${track.body.name}`);

        track.body.artists.forEach((artist) => {
          console.log(`- ${artist.name}`);
        });

        let query = track.body.name;

        if (track.body.artists[0]) {
          query += ` ${track.body.artists[0].name}`;
        }

        youtube.searchVideo(query, track.body.duration_ms, ((video) => {
          if (video) {
            console.log(video);
            this.playYoutube(video.link, id);
          }
        }));
      }).catch((error) => {
        this._logError(error);
      });
  }

  /**
   * Play audio stream, if an id is set, it is assumed to be a sound
   */
  _playStream(stream, id) {
    if (id) {
      this.playSoundStream(stream, id);
    } else {
      this.playMusicStream(stream);
    }
  }

  /**
   * Play audio from a file, if an id is set, it is assumed to be a sound
   */
  playFile(filename, id) {
    console.log(`Playing audio from data: ${filename}, id: ${id}`);

    const stream = fs.createReadStream(filename);

    if (id) {
      this.playSoundStream(stream, id);
    } else {
      this.playMusicStream(stream);
    }
  }

  /**
   * Play audio from a playlist file (only used for radios)
   */
  playPlaylist(filename, id) {
    console.log(`Playing audio from playlist data: ${filename}, id: ${id}`);

    const stream = fs.createReadStream(filename);

    stream.pipe(concat2((error, buffer) => {
      if (error) {
        this._logError(error);
      } else {
        let playlist = [];

        // We don't know the type of the playlist, so we try .pls first
        try {
          playlist = parsers.PLS.parse(buffer.toString());
        } catch (plsError) {
          this._logError(plsError);
        }

        // If that did not work, try .m3u
        if (!playlist.length) {
          try {
            playlist = parsers.M3U.parse(buffer.toString());
          } catch (plsError) {
            this._logError(plsError);
          }
        }

        console.log(playlist);

        // If we found a url, play it
        if (playlist.length && playlist[0] && playlist[0].file) {
          this.playUrl(playlist[0].file);
        }
      }
    }));
  }

  /**
  * Set the music stream
  */
  playMusicStream(stream) {
    // Unpipe mixer
    if (this.mixer) this.mixer.unpipe();

    // Destroy dispatcher
    if (this.dispatcher) {
      this.dispatcher.pause();
      this.dispatcher.destroy();
    }

    // Destroy old music source stream
    if (this.musicSource) {
      this.musicSource.unpipe();
      this.musicSource.destroy();
    }

    // Destroy music input stream
    if (this.music) {
      this.mixer.removeInput(this.music);
      this.music.destroy();
    }

    // Destroy transcoder
    if (this.musicTranscoder) this.musicTranscoder.destroy();

    // Create input stream
    this.music = this._buildInputStream(this.musicVolume);

    // Decode to pcm
    this.musicTranscoder = this._buildTranscoder();

    this.musicTranscoder.on('pipe', (source) => {
      console.log('Something is piping into the transcoder.');
      this.musicSource = source;
    });

    this.musicTranscoder.pipe(this.music);

    // Pipe mp3 to transcoder and pipe resulting pcm to mixer input
    console.log('Piping new music source into transcoder ...');
    stream.pipe(this.musicTranscoder);

    console.log('Creating new dispatcher ...');
    this.dispatcher = this._buildDispatcher();
  }

  /**
  * Add a sound stream
  */
  playSoundStream(stream, id) {
    console.log(`Playing sound stream ${id}`);
    const sound = { source: stream };

    // Create input stream
    sound.inputStream = this._buildInputStream(this.soundVolume);
    sound.inputStream.on('close', () => this._removeSound(id));

    // Decode to pcm
    sound.transcoder = this._buildTranscoder();
    sound.transcoder.pipe(sound.inputStream);

    // Pipe mp3 to transcoder and pipe resulting pcm to mixer input
    console.log('Piping new sound source into transcoder ...');
    stream.pipe(sound.transcoder);

    this.sounds.set(id, sound);
  }

  /**
   * Stop a stream
   */
  stop(id) {
    if (!id) return;

    this._removeSound(id);
  }

  /**
   * Remove a sound stream
   */
  _removeSound(id) {
    console.log(`Removing sound ${id}...`);

    const sound = this.sounds.get(id);

    if (sound) {
      sound.source.unpipe();
      sound.source.destroy();

      sound.transcoder.unpipe();
      sound.transcoder.destroy();

      this.mixer.removeInput(sound.inputStream);
      sound.inputStream.destroy();

      this.sounds.delete(id);
      console.log('Removed sound.');
    } else {
      console.log('Sound was not playing.');
    }

    if (this.sounds.size) {
      console.log('\nSounds currently playing:');
      this.sounds.forEach((value, key) => {
        console.log(`- ${key}`);
      });
    } else {
      console.log('No sounds playing.');
    }

    console.log('');
  }

  _buildDispatcher() {
    const dispatcher = this.connection.play(this.mixer, { type: 'converted', highWaterMark: 1, volume: false });

    dispatcher.on('start', () => {
      console.log('started playing!');
    });

    dispatcher.on('finish', () => {
      console.log('finished playing!');
    });

    dispatcher.on('error', this._logError);

    return dispatcher;
  }

  _buildTranscoder() {
    console.log('Creating new transcoder ...');

    return new prism.FFmpeg({
      args: [
        '-loglevel', '0',
        '-acodec', 'pcm_s16le',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
      ],
    });
  }

  _buildInputStream(volume) {
    console.log('Creating new input stream ...');

    return this.mixer.input({
      sampleRate: 48000,
      channels: 2,
      bitDepth: 16,
      volume: typeof volume === 'string' ? parseFloat(volume) : volume
    });
  }

  _buildMixer() {
    return new Mixer({
      channels: 2,
      bitDepth: 16,
      clearInterval: 250,
      sampleRate: 48000,
      chunkSize: 16384
    });
  }

  _logError(error) {
    console.error(pe.render(error));
  }
}

module.exports = AudioPlayer;
