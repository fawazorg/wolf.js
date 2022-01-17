const { Events } = require('../../../../constants');

module.exports = async (api, body) => {
  const [group, subscriber] = await Promise.all([
    api.group().getById(body.groupId),
    api.subscriber().getById(body.subscriberId)
  ]);

  if (group.subscribers && group.subscribers.length > 0) {
    group.subscribers.push(
      {
        id: subscriber.id,
        groupId: group.id,
        capabilities: body.capabilities,
        additionalInfo: {
          hash: subscriber.hash,
          nickname: subscriber.nickname,
          privileges: subscriber.privileges,
          onlineState: subscriber.onlineState
        }
      }
    );
  }

  if (body.subscriberId === api.currentSubscriber.id) {
    group.capability = body.capabilities;
    group.inGroup = true;
    return api.emit(Events.JOINED_GROUP, group);
  }

  return api.emit(
    Events.GROUP_MEMBER_ADD,
    group,
    subscriber
  );
};
