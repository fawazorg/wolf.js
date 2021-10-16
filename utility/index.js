const validator = require('../validator');

const moment = require('moment');

const Achievement = require('./Achievement/Achievement');
const Array = require('./Array/Array');
const Download = require('./Download/Download');
const Group = require('./Group/Group');
const _Number = require('./Number/Number');
const _String = require('./String/String');
const Subscriber = require('./Subscriber/Subscriber');

class Utility {
  constructor (api) {
    this._api = api;

    this._achievement = new Achievement(this._api);
    this._array = new Array(this._api);
    this._download = new Download(this._api);
    this._group = new Group(this._api);
    this._number = new _Number(this._api);
    this._string = new _String(this._api);
    this._subscriber = new Subscriber(this._api);
  }

  /**
   * Exposes the achievement utilities
   * @returns {Achievement}
   */
  achievement () {
    return this._achievement;
  }

  /**
   * Exposes the array utilities
   * @returns {Array}
   */
  array () {
    return this._array;
  }

  /**
   * Exposes the download utilities
   * @returns {Download}
   */
  download () {
    return this._download;
  }

  /**
   * Exposes the group utilities
   * @returns {Group}
   */
  group () {
    return this._group;
  }

  /**
   * Exposes the number utilities
   * @returns {_Number}
   */
  number () {
    return this._number;
  }

  /**
   * Exposes the string utilities
   * @returns {_String}
   */
  string () {
    return this._string;
  }

  /**
   * Exposes the subscriber utilities
   * @returns {Subscriber}
   */
  subscriber () {
    return this._subscriber;
  }

  /**
   * Convert milliseconds into readable time (Ex: 65000 -> 1m 5s)
   * @param {String} language - The language of the phrases
   * @param {Number} milliseconds - The time to convert
   * @returns {String} formatted time
   */
  toReadableTime (language, milliseconds) {
    if (typeof (language) !== 'string') {
      throw new Error('language must be a string');
    } else if (validator.isNullOrWhitespace(language)) {
      throw new Error('language cannot be null or empty');
    }

    if (!validator.isValidNumber(milliseconds)) {
      throw new Error('milliseconds must be a valid number');
    } else if (validator.isLessThanOrEqualZero(milliseconds)) {
      throw new Error('milliseconds cannot be less than or equal to 0');
    }

    const info = moment.duration(milliseconds, 'milliseconds')._data;

    let str = '';

    if (info.years > 0) {
      str = `${info.years}${this._api.phrase().getByLanguageAndName(language, `${this._api.config.keyword}_time_type_years`)}`;
    }

    if (info.months > 0) {
      str = str + ` ${info.months}${this._api.phrase().getByLanguageAndName(language, `${this._api.config.keyword}_time_type_months`)}`;
    }

    if (info.weeks > 0) {
      str = str + ` ${info.weeks}${this._api.phrase().getByLanguageAndName(language, `${this._api.config.keyword}_time_type_weeks`)}`;
    }

    if (info.days > 0) {
      str = str + ` ${info.days}${this._api.phrase().getByLanguageAndName(language, `${this._api.config.keyword}_time_type_days`)}`;
    }

    if (info.hours > 0) {
      str = str + ` ${info.hours}${this._api.phrase().getByLanguageAndName(language, `${this._api.config.keyword}_time_type_hours`)}`;
    }

    if (info.minutes > 0) {
      str = str + ` ${info.minutes}${this._api.phrase().getByLanguageAndName(language, `${this._api.config.keyword}_time_type_minutes`)}`;
    }

    if (info.seconds > 0) {
      str = str + ` ${info.seconds}${this._api.phrase().getByLanguageAndName(language, `${this._api.config.keyword}_time_type_seconds`)}`;
    }
    return str.trim();
  }

  /**
   * Sleep a method - Equivalent to await Task.Delay(duration) in C#
   * @param {Number} duration - The time to wait
   * @returns {Promise.resolve()}
   */
  async delay (duration) {
    if (!validator.isValidNumber(duration)) {
      throw new Error('duration must be a valid number');
    } else if (validator.isLessThanOrEqualZero(duration)) {
      throw new Error('duration cannot be less than or equal to 0');
    }

    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }
}

module.exports = Utility;
