import fetch from 'node-fetch';

export type AIResponse = {
  indexName: string;
  strike: number;
  ltp: number;
  type: string;
}

const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.API_KEY;

const headers = {
  'Content-Type': 'application/json',
};

const data = {
  contents: [
    {
      parts: [
        {
          text: "You are a helper for me.\nYou will receive list of messages about position to make in options segment of trading.\nThe message will contain the option buying tip with info like index name, \nstrike price, and whether it is call or put one.\nYou just need to grab all relevant info from messages in any format\nand display the output in below format:\n\nIndexName strikePrice limitPrice CE/PE\n\nNote if index is missing, then consider it as BANKNIFTY\nNote: If nothing is identified, display only NA as output\n\nMessage is:\n> Mystic Academy (PREMIUM) 🚀:\nGood morning! ✅\n\n> Mystic Academy (PREMIUM) 🚀:\nWas just observing the volatility.\n\n> Mystic Academy (PREMIUM) 🚀:\n47700 PE\n\n> Mystic Academy (PREMIUM) 🚀:\nAbove 345\n\n"
        }
      ]
    }
  ]
};

const options = {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(data),
};

function getBody(message: string) {
  return {
    contents: [
      {
        parts: [
          {
            text: `You are a helper for me.
            You will receive list of messages about position to make in options segment of trading.
            The message will contain the option buying tip with info like index name, 
            strike price, and whether it is call or put one.
            You just need to grab all relevant info from messages in any format
            and display the output in below format:
            
            IndexName strikePrice limitPrice CE/PE
            
            Also note below points:
            1. Always Capitalize the index name.
            2. Default index name is BANKNIFTY if not contain in messages.
            3. Ignore the messages if it contains the stock name or other index name like nifty, etc.
            4. If unable to identify the trade, then simply display text "NA"
            
            Example:
            Input: ghjcbvashj adwjhbahjdbkawnd dawkjln
            Output: NA
            
            Input: BANKNIFTY 46200 PE Above 380
            Output: BANKNIFTY 46200 380 PE
            
            Input: NIFTYBANK 46700 CE Above 400
            Output: BANKNIFTY 46700 400 CE
            
            Input: BANK NIFTY 46500 PE 360 ABOVE
            Output: BANKNIFTY 46500 360 PE
            
            Input:
            Good morning
            hello
            not moving
            46500 ce above 490
            Output: BANKNIFTY 46500 490 CE
            
            Input: 45600 CE
            Above 380
            Output: BANKNIFTY 45600 380 CE
            
            Your input for message is: ${message}`
          }
        ]
      }
    ]
  };
}

export const askAI = async (message: string): Promise<AIResponse | null> => {
  try {
    console.log('Asking GEMINI.......')
    const bodyData = getBody(message);
    options.body = JSON.stringify(bodyData)
    const response = await fetch(url, options);
    const responseData: any = await response.json();
    const text = responseData.candidates[0].content.parts[0].text.trim();
    console.log("AI response: ", text);

    const messages = text.split('\n');
    const [firstMessage] = messages;
    if (!firstMessage || firstMessage === "NA") {
      return null;
    }
    const [indexName, strike, ltp, type] = messages[0].split(' ')
    return {
      indexName, strike: Number(strike), ltp: Number(ltp), type

    }
  } catch (error) {
    console.error('Error:', error);
    return null
  }
};

