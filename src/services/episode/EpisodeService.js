const
    SequelizeService = require('feathers-sequelize').Service,
    {locator} = require('locator.js'),
    errors = require('feathers-errors');

class EpisodeService extends SequelizeService {

  constructor () {
    const Models = locator.get('Models');

    super({
      Model: Models.Episode
    });
    this.Models = Models;
  }

  get (id, params={}) {
    const {Podcast} = this.Models;

    // Retrieve podcast and its episode ids and titles only
    params.sequelize = {
      include: [Podcast]
    }

    return super.get(id, params);
  }

}

EpisodeService.prototype.find = undefined;
EpisodeService.prototype.create = undefined;
EpisodeService.prototype.update = undefined;
EpisodeService.prototype.remove = undefined;
EpisodeService.prototype.patch = undefined;

module.exports = EpisodeService;