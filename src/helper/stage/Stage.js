import WOLFAPIError from '../../models/WOLFAPIError.js';
import Base from '../Base.js';
import Request from './Request.js';
import Slot from './Slot.js';
import StageClient from '../../client/stage/Client.js';
import { Event, StageBroadcastState, StageConnectionState } from '../../constants/index.js';
import validator from '../../validator/index.js';
import models from '../../models/index.js';

class Stage extends Base {
/**
 *
 * @param {import('../../client/WOLF')} client
 */
  constructor (client) {
    super(client);

    this.request = new Request(this.client);
    this.slot = new Slot(this.client);

    this.clients = {};

    this.client.on('groupAudioCountUpdate', (oldCount, newCount) => {
      if (!this.clients[newCount.id]) {
        return Promise.resolve();
      }

      return this.client.emit(
        Event.STAGE_CLIENT_VIEWER_COUNT_CHANGED,
        {
          targetGroupId: oldCount.id,
          oldCount: oldCount.consumerCount,
          newCount: newCount.consumerCount
        }
      );
    });

    this.client.on('groupAudioSlotUpdate', (oldSlot, newSlot) => {
      const client = this.clients[newSlot.id];

      if (client && client.slotId === newSlot.slot.id) {
        return client.handleSlotUpdate(newSlot.slot, newSlot.sourceSubscriberId);
      }

      return Promise.resolve();
    });
  }

  _getClient (targetGroupId, createIfNotExists = false) {
    if (this.clients[targetGroupId]) {
      return this.clients[targetGroupId];
    }

    if (createIfNotExists) {
      const client = new StageClient();

      client.on(Event.STAGE_CLIENT_CONNECTING, (data) => this.client.emit(Event.STAGE_CLIENT_CONNECTING, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_CONNECTED, (data) => this.client.emit(Event.STAGE_CLIENT_CONNECTED, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_DISCONNECTED, async (data) => {
        this._deleteClient(targetGroupId);
        this.client.emit(Event.STAGE_CLIENT_DISCONNECTED, { ...data, targetGroupId });
      });
      client.on(Event.STAGE_CLIENT_KICKED, async (data) => {
        this._deleteClient(targetGroupId);
        this.client.emit(Event.STAGE_CLIENT_KICKED, { ...data, targetGroupId });
      });
      client.on(Event.READY, (data) => this.client.emit(Event.READY, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_ERROR, (data) => this.client.emit(Event.STAGE_CLIENT_ERROR, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_END, (data) => this.client.emit(Event.STAGE_CLIENT_END, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_STOPPED, (data) => this.client.emit(Event.STAGE_CLIENT_STOPPED, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_MUTED, (data) => this.client.emit(Event.STAGE_CLIENT_MUTED, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_UNMUTED, (data) => this.client.emit(Event.STAGE_CLIENT_UNMUTED, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_START, (data) => this.client.emit(Event.STAGE_CLIENT_START, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_READY, (data) => this.client.emit(Event.STAGE_CLIENT_READY, { ...data, targetGroupId }));
      client.on(Event.STAGE_CLIENT_DURATION, (data) => this.client.emit(Event.STAGE_CLIENT_DURATION, { ...data, targetGroupId }));

      this.clients[targetGroupId] = client;
    }

    return this.clients[targetGroupId];
  }

  _deleteClient (targetGroupId) {
    this.clients[targetGroupId]?.stop();

    Reflect.deleteProperty(this.clients, targetGroupId);
  }

  async getSettings (targetGroupId) {
    if (validator.isNullOrUndefined(targetGroupId)) {
      throw new models.WOLFAPIError('targetGroupId cannot be null or undefined', { targetGroupId });
    } else if (!validator.isValidNumber(targetGroupId)) {
      throw new models.WOLFAPIError('targetGroupId must be a valid number', { targetGroupId });
    } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
      throw new models.WOLFAPIError('targetGroupId cannot be less than or equal to 0', { targetGroupId });
    }

    const group = await this.client.group.getById(targetGroupId);

    if (!group.exists) {
      throw new models.WOLFAPIError('Group does not exist', { targetGroupId });
    }

    return group.audioConfig;
  }

  async play (targetGroupId, data) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].play(data);
  }

  async stop (targetGroupId) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].stop();
  }

  async pause (targetGroupId) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].pause();
  }

  async resume (targetGroupId) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].resume();
  }

  async getBroadcastState (targetGroupId) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].broadcastState;
  }

  async onStage (targetGroupId) {
    return !!this.clients[targetGroupId];
  }

  async isReady (targetGroupId) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].connectionState === StageConnectionState.READY;
  }

  async isPlaying (targetGroupId) {
    return await this.getBroadcastState(targetGroupId) === StageBroadcastState.PLAYING;
  }

  async isPaused (targetGroupId) {
    return await this.getBroadcastState(targetGroupId) === StageBroadcastState.PAUSED;
  }

  async isIdle (targetGroupId) {
    return await this.getBroadcastState(targetGroupId) === StageBroadcastState.PAUSED;
  }

  async duration (targetGroupId) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].duration;
  }

  async getVolume (targetGroupId) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].volume;
  }

  async setVolume (targetGroupId, volume) {
    if (!this.clients[targetGroupId]) {
      throw new WOLFAPIError('bot is not on stage', { targetGroupId });
    }

    return await this.clients[targetGroupId].setVolume(volume);
  }

  _cleanUp (reconnection = false) {
    this.request._cleanUp(reconnection);
    this.slot._cleanUp(reconnection);
  }
}

export default Stage;
