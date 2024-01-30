import path from 'path'
import prompts from 'prompts'

import MTProto from '@mtproto/core';
import { sleep } from "@mtproto/core/src/utils/common";
import client, { getKey } from "../utils/cache"
import runAlgo from '../algo';

const { MYSTIC_CHANNEL_ID, TELEGRAM_API_ID, TELEGRAM_API_HASH } = process.env

const api_id = TELEGRAM_API_ID; // insert api_id here
const api_hash = TELEGRAM_API_HASH; // insert api_hash here


const mtproto = new MTProto({
  api_id,
  api_hash,
  storageOptions: {
    path: path.resolve(__dirname, './data/1.json'),
  },
});

async function getPhone() {
  return (await prompts({
    type: 'text',
    name: 'phone',
    message: 'Enter your phone number:'
  })).phone
}

async function getCode() {
  // you can implement your code fetching strategy here
  return (await prompts({
    type: 'text',
    name: 'code',
    message: 'Enter the code sent:',
  })).code
}

async function getPassword() {
  return (await prompts({
    type: 'text',
    name: 'password',
    message: 'Enter Password:',
  })).password
}

// Function to get messages history of a channel
async function getChannelMessages(channelId: string, limit = 10) {
  try {
    const result = await mtproto.call('channels.getHistory', {
      _: {},
      channel: channelId,
      limit: limit,
    });

    return result.messages;
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    return [];
  }
}

// Function to continuously listen to messages of a channel
async function listenToChannelMessages(interval = 10000) {

  while (true) {
    try {
      const messages = await getChannelMessages(MYSTIC_CHANNEL_ID!);
      console.log('Messages:', messages);
    } catch (error) {
      console.error('Error listening to channel messages:', error);
    }

    await sleep(interval); // Wait for the specified interval before fetching messages again
  }
}

function startListener() {
  console.log('[+] starting listener')
  mtproto.updates.on('updates', async ({ updates }) => {
    const newChannelMessages = updates
      // .filter(msg => msg !== undefined)
      .filter((update: any) => update._ === 'updateNewChannelMessage')
      // .filter((update: any) => update.message?.peer_id?.channel_id === MYSTIC_CHANNEL_ID)
      .map(({ message }: any) => message)
      .filter((message: any) => message.peer_id?.channel_id === MYSTIC_CHANNEL_ID) // filter `updateNewChannelMessage` types only and extract the 'message' object

    console.log("message: ", newChannelMessages)

    for (const message of newChannelMessages) {
      // printing new channel messages
      const key = getKey(MYSTIC_CHANNEL_ID!)
      await client.rpush(key, message.message)

      // run algo
      runAlgo()
    }
  });
}

mtproto
  .call('users.getFullUser', {
    id: {
      _: 'inputUserSelf',
    },
  })
  .then(startListener)
  .catch(async error => {

    // The user is not logged in
    console.log('[+] You must log in')
    const phone_number = "+919729343885"

    mtproto.call('auth.sendCode', {
      phone_number: phone_number,
      settings: {
        _: 'codeSettings',
      },
    })
      .catch(error => {
        if (error.error_message.includes('_MIGRATE_')) {
          const [type, nextDcId] = error.error_message.split('_MIGRATE_');

          mtproto.setDefaultDc(+nextDcId);

          return sendCode(phone_number);
        }
      })
      .then(async result => {
        return mtproto.call('auth.signIn', {
          phone_code: await getCode(),
          phone_number: phone_number,
          phone_code_hash: result.phone_code_hash,
        });
      })
      .catch(error => {
        if (error.error_message === 'SESSION_PASSWORD_NEEDED') {
          return mtproto.call('account.getPassword').then(async result => {
            const { srp_id, current_algo, srp_B } = result;
            const { salt1, salt2, g, p } = current_algo;

            const { A, M1 } = await getSRPParams({
              g,
              p,
              salt1,
              salt2,
              gB: srp_B,
              password: await getPassword(),
            });

            return mtproto.call('auth.checkPassword', {
              password: {
                _: 'inputCheckPasswordSRP',
                srp_id,
                A,
                M1,
              },
            });
          });
        }
      })
      .then(result => {
        console.log('[+] successfully authenticated');
        // start listener since the user has logged in now
        listenToChannelMessages()
      });
  })

