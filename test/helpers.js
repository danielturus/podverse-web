const SqlEngine = require('repositories/sequelize/engineFactory.js');
const registerModels = require('repositories/sequelize/models');

function configureDatabaseModels (resolve) {

  beforeEach(function (done) {

    this._sqlEngine = new SqlEngine({storagePath: ':memory:'});
    const Models = registerModels(this._sqlEngine);

    this._sqlEngine.sync()
      .then(() => {
        resolve.apply(this, [Models]);
        done();
      });
  });

  afterEach(function (done) {
    this._sqlEngine.dropAllSchemas()
      .then(() => done());
  });
}

function createTestPodcastAndEpisode (Models) {

  const {Podcast, Episode} = Models;

  return Podcast.create({'feedURL': 'http://example.com/test333'})
    .then(podcast => {

      return Promise.all([
        Promise.resolve(podcast),
        Episode.create({
          podcastId: podcast.id,
          mediaURL: 'http://example.com/test333'
        })
      ]);
    });
}

module.exports = {
  configureDatabaseModels,
  createTestPodcastAndEpisode
};