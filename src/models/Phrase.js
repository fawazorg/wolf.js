import Base from './Base.js';

class Phrase extends Base {
  constructor (client, data) {
    super(client);
    this.name = data?.name;
    this.value = data?.value;
    this.language = data?.language;
  }

  toJSON () {
    return {
      name: this.name,
      value: this.value,
      language: this.language
    };
  }
}

export default Phrase;
