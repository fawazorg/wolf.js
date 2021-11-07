const patch = require('../utils/patch');

class GroupEvent {
  constructor (api, event) {
    this._api = api;

    patch(this, event);

    this.subscribers = this.subscribers || [];
  }

  async update (targetGroupId, eventId, title, startsAt, endsAt, shortDescription = undefined, longDescription = undefined, imageUrl = undefined, thumbnail = undefined) {
    return await this._api.event().update(
      targetGroupId,
      eventId,
      title,
      startsAt,
      endsAt,
      shortDescription,
      longDescription,
      imageUrl,
      thumbnail
    );
  }

  async updateThumbnail (thumbnail) {
    return await this._api.event().updateThumbnail(this.eventId, thumbnail);
  }

  async remove () {
    return await this._api.event().remove(this.eventId);
  }

  async subscribe () {
    return await this._api.event().subscribe(this.eventId);
  }

  async unsubscribe () {
    return await this._api.event().unsubscribe(this.eventId);
  }
}

module.exports = GroupEvent;
