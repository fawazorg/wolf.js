import Base from './Base.js';

class GroupMessageConfig extends Base {
  constructor (client, data) {
    super(client);
    this.disableHyperlink = data?.disableHyperlink;
    this.disableImage = data?.disableImage;
    this.disableImageFilter = data?.disableImageFilter;
    this.disableVoice = data?.disableVoice;
    this.id = data?.id;
    this.slowModeRateInSeconds = data?.slowModeRateInSeconds;
  }

  toJSON () {
    return {
      disableHyperlink: this.disableHyperlink,
      disableImage: this.disableImage,
      disableImageFilter: this.disableImageFilter,
      disableVoice: this.disableVoice,
      id: this.id,
      slowModeRateInSeconds: this.slowModeRateInSeconds
    };
  }
}

export default GroupMessageConfig;
