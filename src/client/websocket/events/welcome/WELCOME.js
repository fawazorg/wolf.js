import { Command, Event } from '../../../../constants/index.js';
import { Welcome } from '../../../../models/index.js';
const subscribeToSubscriptionType = async (client, type) => {
  switch (type) {
    case 'groupMessages':
      return await client.messaging._subscribeToGroup();
    case 'privateMessages':
      return await client.messaging._subscribeToPrivate();
    case 'groupTipping':
      return await client.tipping._subscribeToGroup();
    default:
      throw new Error('invalid subscription type');
  }
};
const fininaliseConnection = async (client, resume = false) => {
  await Promise.all([
    client.group.list(),
    client.subscriber.getById(client.currentSubscriber.id)
  ]);
  const subscriptions = Object.entries(client.config.get('app.messageSettings.subscriptions')).filter((entry) => entry[1]).map((entry) => entry[0]);
  for (const subscription of subscriptions) {
    await subscribeToSubscriptionType(client, subscription);
  }
  return client.emit(resume ? Event.RESUME : Event.READY);
};
const login = async (client) => {
  const { email: username, password, loginType: type, onlineState } = client.config.get('app.login');
  const response = await client.websocket.emit(Command.SECURITY_LOGIN, {
    headers: {
      version: 2
    },
    body: {
      type,
      onlineState,
      username,
      password
    }
  });
  if (!response.success) {
    client.emit(Event.LOGIN_FAILED, response);
    // Check if code is greater than 1 if so, bot is barred, attempt reconnect
    if (!(response?.headers?.subCode ?? -1 > 1)) {
      return Promise.resolve();
    }
    await client.utility().delay(90000);
    return await login(client);
  }
  client.currentSubscriber = response.body.subscriber;
  client.emit(Event.LOGIN_SUCCESS, client.currentSubscriber);
  return await fininaliseConnection(client, false);
};
export default async (client, body) => {
  const welcome = new Welcome(client, body);
  client.endpointConfig = welcome.endpointConfig;
  if (!welcome.subscriber) {
    return await login(client);
  }
  client.currentSubscriber = welcome.subscriber;
  return await fininaliseConnection(client, true);
};