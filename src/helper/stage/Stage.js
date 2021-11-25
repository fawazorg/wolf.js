const BaseHelper = require('../BaseHelper');
const Manager = require('./Manager');

const validator = require('../../validator');

const { Commands } = require('../../constants');
/**
 * {@hideconstructor}
 */
module.exports = class Stage extends BaseHelper {
  constructor (api) {
    super(api);

    this._manager = new Manager(this._api);
    this._stageList = [];
  }

  async getSettings (targetGroupId) {
    return this.getGroupSettings(targetGroupId);
  }

  async getGroupSettings (targetGroupId, requestNew = false) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      if (!validator.isValidBoolean(requestNew)) {
        throw new Error('requestNew must be a valid boolean');
      }

      return (await this._api.group().getById(targetGroupId, requestNew)).audioConfig;
    } catch (error) {
      error.internalErrorMessage = `api.stage().getGroupSettings(targetGroupId=${JSON.stringify(targetGroupId)}, requestNew=${JSON.stringify(requestNew)})`;
      throw error;
    }
  }

  async getStages (requestNew = false) {
    return this.getStageList(requestNew);
  }

  async getStageList (requestNew = false) {
    try {
      if (!validator.isValidBoolean(requestNew)) {
        throw new Error('requestNew must be a valid boolean');
      }

      if (!requestNew && this._stageList.length > 0) {
        return this._stageList;
      }
      const result = await this._websocket.emit(Commands.STAGE_LIST);

      if (result.success) {
        this._stages = result.body;
      }

      return this._stageList;
    } catch (error) {
      error.internalErrorMessage = `api.stage().getStageListForGroup(requestNew=${JSON.stringify(requestNew)})`;
      throw error;
    }
  }

  async getStagesForGroup (targetGroupId, requestNew = false) {
    return this.getStageListForGroup(targetGroupId, requestNew);
  }

  async getStageListForGroup (targetGroupId, requestNew = false) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      if (!validator.isValidBoolean(requestNew)) {
        throw new Error('requestNew must be a valid boolean');
      }
      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      const group = await this._api.group().getById(targetGroupId);

      if (!requestNew && group.availableStages && group.availableStages.length > 0) {
        return group.availableStages;
      }

      const result = await this._websocket.emit(
        Commands.STAGE_GROUP_ACTIVE_LIST,
        {
          id: targetGroupId
        });

      if (result.success) {
        group.availableStages = result.body;
      }

      return group.availableStages || [];
    } catch (error) {
      error.internalErrorMessage = `api.stage().getStageListForGroup(targetGroupId=${JSON.stringify(targetGroupId)}, requestNew=${JSON.stringify(requestNew)})`;
      throw error;
    }
  }

  async getSlots (targetGroupId, requestNew = false) {
    return this.getGroupSlots(targetGroupId, requestNew);
  }

  async getGroupSlots (targetGroupId, requestNew = false) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      if (!validator.isValidBoolean(requestNew)) {
        throw new Error('requestNew must be a valid boolean');
      }
      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      const group = await this._api.group().getById(targetGroupId);

      if (!requestNew && group.slots && group.slots.length > 0) {
        return group.slots;
      }

      const result = await this._websocket.emit(
        Commands.GROUP_AUDIO_SLOT_LIST, {
          id: targetGroupId,
          subscribe: true
        }
      );

      if (result.success) {
        group.slots = result.body;
      }

      return group.slots || [];
    } catch (error) {
      error.internalErrorMessage = `api.stage().getGroupSlots(targetGroupId=${JSON.stringify(targetGroupId)}, requestNew=${JSON.stringify(requestNew)})`;
      throw error;
    }
  }

  async updateSlotMuteState (targetGroupId, slotId, isMuted) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      if (validator.isNullOrUndefined(slotId)) {
        throw new Error('slotId cannot be null or undefined');
      } else if (!validator.isValidNumber(slotId)) {
        throw new Error('slotId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(slotId)) {
        throw new Error('slotId cannot be less than or equal to 0');
      }

      if (!validator.isValidBoolean(isMuted)) {
        throw new Error('isMuted must be a valid boolean');
      }

      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      const slots = await this.getSlots(targetGroupId);

      if (slots.length === 0) {
        throw new Error('unable to retrieve slots');
      }

      const slot = slots.find((slot) => slot.id === slotId);

      if (!slot) {
        throw new Error('unable to locate slot with this id');
      }

      if (slot.occupierId !== this._api.currentSubscriber.id && !isMuted) {
        throw new Error('occupierId must be self');
      }

      return await this._websocket.emit(
        Commands.GROUP_AUDIO_BROADCAST_UPDATE,
        {
          id: targetGroupId,
          slotId,
          occupierId: slot.occupierId,
          occupierMuted: isMuted
        }
      );
    } catch (error) {
      error.internalErrorMessage = `api.stage().updateSlotMuteState(targetGroupId=${JSON.stringify(targetGroupId)}, slotId=${JSON.stringify(slotId)}, isMuted=${JSON.stringify(isMuted)})`;
      throw error;
    }
  }

  async updateSlotLockState (targetGroupId, slotId, isLocked) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      if (validator.isNullOrUndefined(slotId)) {
        throw new Error('slotId cannot be null or undefined');
      } else if (!validator.isValidNumber(slotId)) {
        throw new Error('slotId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(slotId)) {
        throw new Error('slotId cannot be less than or equal to 0');
      }

      if (!validator.isValidBoolean(isLocked)) {
        throw new Error('isLocked must be a valid boolean');
      }

      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      const slots = await this.getSlots(targetGroupId);

      if (slots.length === 0) {
        throw new Error('unable to retrieve slots');
      }

      const slot = slots.find((slot) => slot.id === slotId);

      if (!slot) {
        throw new Error('unable to locate slot with this id');
      }

      return await this._websocket.emit(
        Commands.GROUP_AUDIO_SLOT_UPDATE,
        {
          id: targetGroupId,
          slot: {
            id: slotId,
            locked: isLocked
          }
        }
      );
    } catch (error) {
      error.internalErrorMessage = `api.stage().updateSlotLockState(targetGroupId=${JSON.stringify(targetGroupId)}, slotId=${JSON.stringify(slotId)}, isLocked=${JSON.stringify(isLocked)})`;
      throw error;
    }
  }

  async leaveSlot (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      const slots = await this.getSlots(targetGroupId);

      if (slots.length === 0) {
        throw new Error('unable to retrieve slots');
      }

      const slot = slots.find((slot) => slot.occupierId && slot.occupierId === this._api.currentSubscriber.id);

      if (!slot) {
        throw new Error('bot does not occupy a slot in this group');
      }

      await this._manager.removeClient(targetGroupId);

      return await this._websocket.emit(
        Commands.GROUP_AUDIO_BROADCAST_DISCONNECT,
        {
          id: targetGroupId,
          slotId: slot.id,
          occupierId: this._api.currentSubscriber.id
        }
      );
    } catch (error) {
      error.internalErrorMessage = `api.stage().leaveSlot(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async removeSubscriberFromSlot (targetGroupId, slotId) {
    return this.kickSlot(targetGroupId, slotId);
  }

  async kickSlot (targetGroupId, slotId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }

      if (validator.isNullOrUndefined(slotId)) {
        throw new Error('slotId cannot be null or undefined');
      } else if (!validator.isValidNumber(slotId)) {
        throw new Error('slotId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(slotId)) {
        throw new Error('slotId cannot be less than or equal to 0');
      }

      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      const slots = await this.getSlots(targetGroupId);

      if (slots.length === 0) {
        throw new Error('unable to retrieve slots');
      }

      const slot = slots.find((slot) => slot.id === slotId);

      if (!slot) {
        throw new Error('unable to locate slot with this id');
      }

      if (!slot.occupierId) {
        throw new Error('no subscriber occupies slot');
      }

      return await this._websocket.emit(
        Commands.GROUP_AUDIO_BROADCAST_DISCONNECT,
        {
          id: targetGroupId,
          slotId,
          occupierId: slot.occupierId
        }
      );
    } catch (error) {
      error.internalErrorMessage = `api.stage().kickSlot(targetGroupId=${JSON.stringify(targetGroupId)}, slotId=${JSON.stringify(slotId)})`;
      throw error;
    }
  }

  async kickSubscriberFromStage (targetGroupId, subscriberId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }

      if (validator.isNullOrUndefined(subscriberId)) {
        throw new Error('subscriberId cannot be null or undefined');
      } else if (!validator.isValidNumber(subscriberId)) {
        throw new Error('subscriberId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(subscriberId)) {
        throw new Error('subscriberId cannot be less than or equal to 0');
      }

      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      const slots = await this.getSlots(targetGroupId);

      if (slots.length === 0) {
        throw new Error('unable to retrieve slots');
      }

      const slot = slots.find((slot) => slot.occupierId === subscriberId);

      if (!slot) {
        throw new Error('subscriber does not occupied any slots in this group');
      }

      return await this.kickSlot(targetGroupId, slot.id);
    } catch (error) {
      error.internalErrorMessage = `api.stage().kickSubscriberFromStage(targetGroupId=${JSON.stringify(targetGroupId)}, subscriberId=${JSON.stringify(subscriberId)})`;
      throw error;
    }
  }

  async joinSlot (targetGroupId, slotId, sdp = undefined) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }

      if (validator.isNullOrUndefined(slotId)) {
        throw new Error('slotId cannot be null or undefined');
      } else if (!validator.isValidNumber(slotId)) {
        throw new Error('slotId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(slotId)) {
        throw new Error('slotId cannot be less than or equal to 0');
      }

      const settings = await this.getSettings(targetGroupId);

      if (!settings) {
        throw new Error('unable to retrieve stage configuration');
      }

      if (!settings.enabled) {
        throw new Error('stage is disabled for requested group');
      }

      if (settings.minRepLevel > Math.floor(this._api.currentSubscriber.reputation)) {
        throw new Error(`stage is only accessible to users who are level ${settings.minRepLevel} or above`);
      }

      const slots = await this.getSlots(targetGroupId);

      if (slots.length === 0) {
        throw new Error('unable to retrieve slots');
      }

      if (slots.some((slot) => slot.occupierId === this._api.currentSubscriber.id)) {
        throw new Error('bot already occupies a slot in this group');
      }

      const slot = slots.find((slot) => slot.id === slotId);

      if (!slot) {
        throw new Error('unable to locate slot with this id');
      }

      if (slot.occupierId) {
        throw new Error('a subscriber already occupies this slot');
      }

      // If sdp exists, assume they are using a personal rtc
      if (sdp) {
        return await this._websocket.emit(
          Commands.GROUP_AUDIO_BROADCAST,
          {
            id: targetGroupId,
            slotId,
            sdp
          }
        );
      }

      const client = await this._manager.getClient(targetGroupId, true);
      const result = await this.joinSlot(targetGroupId, slotId, await client._createOffer());

      if (result.success) {
        client._setAnswer(result.body.sdp);
        client._slotId = slotId;

        return result.body.slot;
      }

      return result;
    } catch (error) {
      error.internalErrorMessage = `api.stage().joinSlot(targetGroupId=${JSON.stringify(targetGroupId)}, slotId=${JSON.stringify(slotId)}, sdp=${JSON.stringify(sdp)})`;
      throw error;
    }
  }

  async consumeSlot (targetGroupId, slotId, sdp) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        throw new Error('bot is not on stage in this group');
      }

      if (!client.isReady) {
        throw new Error('stage client is not ready to consume in this group');
      }
    } catch (error) {
      error.internalErrorMessage = `api.stage().consumeSlot(targetGroupId=${JSON.stringify(targetGroupId)}, slotId=${JSON.stringify(slotId)}, sdp=${JSON.stringify(sdp)})`;
      throw error;
    }
  }

  async play (targetGroupId, data) {
    return this.broadcast(targetGroupId, data);
  }

  async broadcast (targetGroupId, data) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        throw new Error('bot is not on stage in this group');
      }

      if (!client.isReady) {
        throw new Error('stage client is not ready to broadcast in this group');
      }

      return await client.broadcast(data);
    } catch (error) {
      error.internalErrorMessage = `api.stage().broadcast(targetGroupId=${JSON.stringify(targetGroupId)}, data=${JSON.stringify('unable to display data')})`;
      throw error;
    }
  }

  async pause (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return await client.pause();
    } catch (error) {
      error.internalErrorMessage = `api.stage().pause(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async resume (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return await client.resume();
    } catch (error) {
      error.internalErrorMessage = `api.stage().resume(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async stop (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return await client.stop();
    } catch (error) {
      error.internalErrorMessage = `api.stage().stop(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async isMuted (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return client.isMuted;
    } catch (error) {
      error.internalErrorMessage = `api.stage().isMuted(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async isPlaying (targetGroupId) {
    return this.isBroadcasting(targetGroupId);
  }

  async isBroadcasting (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return client.isBroadcasting;
    } catch (error) {
      error.internalErrorMessage = `api.stage().isBroadcasting(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async isConnected (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return client.isConnected;
    } catch (error) {
      error.internalErrorMessage = `api.stage().isConnected(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async isConnecting (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return client.isConnecting;
    } catch (error) {
      error.internalErrorMessage = `api.stage().isConnecting(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async isReady (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }
      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return false;
      }

      return client.isReady;
    } catch (error) {
      error.internalErrorMessage = `api.stage().isReady(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async hasClient (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }

      return await this._manager.getClient(targetGroupId) !== null;
    } catch (error) {
      error.internalErrorMessage = `api.stage().hasClient(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  async slotId (targetGroupId) {
    try {
      if (validator.isNullOrUndefined(targetGroupId)) {
        throw new Error('targetGroupId cannot be null or undefined');
      } else if (!validator.isValidNumber(targetGroupId)) {
        throw new Error('targetGroupId must be a valid number');
      } else if (validator.isLessThanOrEqualZero(targetGroupId)) {
        throw new Error('targetGroupId cannot be less than or equal to 0');
      }

      const client = await this._manager.getClient(targetGroupId);

      if (!client) {
        return null;
      }

      return client.slotId;
    } catch (error) {
      error.internalErrorMessage = `api.stage().slotId(targetGroupId=${JSON.stringify(targetGroupId)})`;
      throw error;
    }
  }

  // TODO: Raise Hands feature
};
