// Netlify Serverless Function for OpenAI Chat
// Environment variables (set in Netlify dashboard):
// - OPENAI_API_KEY: Your OpenAI API key (server-side only, NOT exposed to client)
// - ACCESS_CODE: Password users must enter to use the shared key

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { messages, model, accessCode, userApiKey, webSearch } = body;

  // Determine which API key to use
  let apiKey;

  if (userApiKey) {
    // User provided their own API key
    apiKey = userApiKey;
  } else if (accessCode) {
    // User wants to use shared key - validate access code
    const validAccessCode = process.env.ACCESS_CODE;
    if (accessCode !== validAccessCode) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid access code' }),
      };
    }
    apiKey = process.env.OPENAI_API_KEY;
  } else {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'No API key or access code provided' }),
    };
  }

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'API key not configured' }),
    };
  }

  try {
    let response;
    let assistantContent;

    if (webSearch) {
      // Use Responses API with web_search tool
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          tools: [{ type: 'web_search' }],
          tool_choice: 'auto',
          input: messages[messages.length - 1].content,
        }),
      });

      const responseText = await response.text();
      console.log('OpenAI web search response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'OpenAI API request failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);

      // Extract text from response - output_text is the direct property
      assistantContent = data.output_text;
      if (!assistantContent && data.output) {
        for (const item of data.output) {
          if (item.type === 'message' && item.content) {
            for (const content of item.content) {
              if (content.type === 'output_text' && content.text) {
                assistantContent = content.text;
                break;
              }
            }
          }
          if (assistantContent) break;
        }
      }

      if (!assistantContent) {
        throw new Error('No response from web search');
      }
    } else {
      // Use standard Chat Completions API
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          max_tokens: 4096,
          messages: messages,
        }),
      });

      const responseText = await response.text();
      console.log('OpenAI response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'OpenAI API request failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected response structure:', data);
        throw new Error('Unexpected response from OpenAI');
      }
      assistantContent = data.choices[0].message.content;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: assistantContent }),
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Failed to get response from OpenAI' }),
    };
  }
};
