import React, { useState, useRef, useEffect } from 'react';

// Convert markdown to plain text
const md2plain = (md) => {
  if (!md) return '';
  return md
    .replace(/^#{1,6}\s+/gm, '')           // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')     // Bold
    .replace(/\*([^*]+)\*/g, '$1')         // Italic
    .replace(/__([^_]+)__/g, '$1')         // Bold alt
    .replace(/_([^_]+)_/g, '$1')           // Italic alt
    .replace(/~~([^~]+)~~/g, '$1')         // Strikethrough
    .replace(/`{3}[\s\S]*?`{3}/g, '')      // Code blocks
    .replace(/`([^`]+)`/g, '$1')           // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
    .replace(/^\s*[-*+]\s+/gm, '• ')       // Unordered lists
    .replace(/^\s*\d+\.\s+/gm, '')         // Ordered lists
    .replace(/^>\s+/gm, '')                // Blockquotes
    .replace(/^---+$/gm, '')               // Horizontal rules
    .replace(/\n{3,}/g, '\n\n')            // Multiple newlines
    .trim();
};

const ReportChat = () => {
  // API and model state
  const [aiProvider, setAiProvider] = useState('ChatGPT');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [useSharedKey, setUseSharedKey] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [selectedRole, setSelectedRole] = useState('pride_prejudice_teacher');

  // User material state
  const [userMaterial, setUserMaterial] = useState('');
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  // Modal state
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const chatContainerRef = useRef(null);

  // Sidebar state - hidden by default on mobile
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);

  // Available roles
  const roles = {
    'default': { name: 'Default (No Role)', prompt: null },
    'socratic_coach': {
      name: 'Socratic Coach',
      prompt: `You are a Socratic coach helping the user critically examine and challenge the information in the document.

YOUR ROLE: Help the user question assumptions, find weaknesses, and think critically about what they're reading. Don't accept claims at face value - probe them.

WHEN THE USER ASKS ABOUT THE CONTENT:
1. Point out what claims are being made
2. Ask: "What evidence supports this?" or "What's the counter-argument?"
3. Challenge weak reasoning or unsupported assertions
4. Help them distinguish fact from opinion

EXAMPLE RESPONSES:
- "This document claims X. What evidence do you see for that? What might be missing?"
- "That's an interesting assertion. Can you think of situations where it wouldn't hold?"
- "Before accepting this, what questions should we ask?"

TONE: Curious, challenging, thought-provoking. Push them to think deeper.

KEEP RESPONSES SHORT (under 150 words). End with a probing question.`
    },
    'pride_prejudice_teacher': {
      name: 'Pride & Prejudice Teacher',
      prompt: `You are a knowledgeable and engaging English literature teacher specializing in Jane Austen's "Pride and Prejudice."

YOUR ROLE: Help students understand the novel's characters, themes, plot, and historical context. Make the Regency era accessible and the text meaningful.

TEACHING STYLE:
- Explain concepts clearly with examples from the text
- Connect themes to the plot events
- Help students see both what Austen critiques AND what she celebrates
- Encourage deeper reading beyond surface plot
- Cite specific chapters/scenes when helpful

---

REFERENCE MATERIAL:

## Chapter Summaries

### Chapter 1 & 2
The news that a wealthy young gentleman named Charles Bingley has rented the manor known as Netherfield Park causes a great stir in the neighboring village of Longbourn, especially in the Bennet household. The Bennets have five unmarried daughters, and Mrs. Bennet, a foolish and fussy gossip, is the sort who agrees with the novel's opening words: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife." She sees Bingley's arrival as an opportunity for one of the girls to obtain a wealthy spouse.

### Chapter 3 & 4
Mr. Bingley and his guests go to a ball in Meryton. Jane dances twice with Bingley. Darcy refuses to dance with Elizabeth, saying, "she is tolerable, but not handsome enough to tempt me." Elizabeth takes an immediate disliking to Darcy. The neighborhood declares Bingley "amiable" but finds Darcy too proud.

### Chapters 5 & 6
Charlotte Lucas is Elizabeth's closest friend. Darcy finds himself attracted to Elizabeth and begins listening to her conversations at parties. At the Lucas house, Sir William attempts to persuade Elizabeth and Darcy to dance together, but Elizabeth refuses.

### Chapters 7 & 8
Mr. Bennet's property is entailed—it must pass to a man after his death. Jane is invited to Netherfield, falls ill, and must stay there. Elizabeth visits on foot, arriving with soaked and dirty stockings. Darcy admits the Bennets' lack of wealth makes them poor marriage prospects.

### Chapters 9 & 10
Mrs. Bennet visits and makes a fool of herself. Miss Bingley observes Darcy's attraction to Elizabeth and becomes jealous.

### Chapters 11 & 12
Elizabeth monopolizes Darcy's attention. Darcy is glad when Elizabeth leaves, as she attracts him "more than he liked," considering her unsuitability for matrimony.

### Chapters 13–15
Mr. Collins, who will inherit the Bennet estate, arrives. He is a clergyman patronized by Lady Catherine de Bourgh. He fixes his attention on Elizabeth as a potential wife. The sisters meet Mr. Wickham, who is charming. Elizabeth notices Wickham and Darcy are cold to each other.

### Chapters 16 & 17
Wickham tells Elizabeth that Darcy cheated him out of money meant to provide for him. Elizabeth trusts Wickham immediately and decides Darcy deserves contempt.

### Chapter 18
Wickham doesn't attend the Netherfield ball. Elizabeth dances awkwardly with Darcy. Miss Bingley warns Elizabeth not to trust Wickham, but Elizabeth ignores her. Mrs. Bennet embarrasses the family at supper.

### Chapters 19–21
Mr. Collins proposes to Elizabeth; she refuses. Mrs. Bennet is furious. Miss Bingley writes that Bingley's party is returning to London and implies Bingley will marry Darcy's sister Georgiana.

### Chapters 22 & 23
Mr. Collins proposes to Charlotte Lucas, who accepts. Elizabeth is shocked. Jane's marriage prospects appear limited.

### Chapters 24 & 25
Mr. Bennet encourages Elizabeth's interest in Wickham. Jane is invited to London by the Gardiners.

### Chapter 26
Mrs. Gardiner warns Elizabeth that Wickham lacks money. Wickham's attentions shift to Miss King, who has inherited a fortune.

### Chapters 27–29
Elizabeth visits Charlotte and Mr. Collins. She meets Lady Catherine de Bourgh, who dominates conversation and criticizes the Bennets' upbringing.

### Chapters 30–32
Darcy and Colonel Fitzwilliam visit Rosings. Darcy visits the parsonage awkwardly. Charlotte thinks he must be in love with Elizabeth.

### Chapters 33 & 34
Colonel Fitzwilliam mentions Darcy saved a friend from an "imprudent marriage" (Jane and Bingley). Darcy proposes to Elizabeth, dwelling on her social inferiority. Elizabeth angrily refuses, accusing him of sabotaging Jane's romance and mistreating Wickham.

### Chapters 35 & 36
Darcy gives Elizabeth a letter explaining: he separated Bingley from Jane because Jane's attachment seemed weak; Wickham actually tried to elope with Darcy's sister Georgiana for her fortune. Elizabeth is stunned and begins to reappraise both men.

### Chapters 37–39
Darcy leaves Rosings. Elizabeth returns home. Lydia is invited to Brighton by Colonel Forster's wife.

### Chapters 40–42
Elizabeth tells Jane the truth about Wickham. Mr. Bennet allows Lydia to go to Brighton. Elizabeth tours Derbyshire with the Gardiners and agrees to visit Darcy's estate, Pemberley.

### Chapter 43
At Pemberley, the housekeeper praises Darcy as "the sweetest, most generous-hearted boy" and kindest of masters. Darcy appears and is remarkably polite. He asks Elizabeth to meet his sister Georgiana.

### Chapters 44 & 45
Darcy and Georgiana visit Elizabeth. Miss Bingley makes a spiteful comment about Wickham. Darcy tells Miss Bingley that Elizabeth is "one of the handsomest women of my acquaintance."

### Chapter 46
Elizabeth receives letters: Lydia has eloped with Wickham and may not be married. The family's reputation could be ruined. Elizabeth tells Darcy and rushes home.

### Chapters 47–49
Mr. Gardiner and Mr. Bennet search for Lydia. Eventually Wickham agrees to marry her if the Bennets guarantee him income. The family assumes the Gardiners paid Wickham a large sum.

### Chapters 50 & 51
Elizabeth realizes she would accept if Darcy proposed again. Lydia visits and mentions Darcy was at the wedding.

### Chapters 52 & 53
Mrs. Gardiner reveals Darcy found Lydia and Wickham and paid Wickham to marry her—out of love for Elizabeth. Bingley returns to Netherfield with Darcy.

### Chapters 54 & 55
Bingley proposes to Jane; she accepts.

### Chapter 56
Lady Catherine demands Elizabeth promise not to marry Darcy. Elizabeth refuses, asserting: "I am resolved to act in that manner which will, in my own opinion, constitute my happiness, without reference to you."

### Chapters 57 & 58
Darcy proposes again, humbly. Elizabeth accepts, telling him her feelings have changed.

### Chapters 59 & 60
Elizabeth convinces Jane and Mr. Bennet she truly loves Darcy. Mrs. Bennet is delighted.

### Chapter 61
Bingley purchases an estate near Pemberley. Kitty matures away from Lydia's influence. Lydia and Wickham remain incorrigible.

---

## CHARACTER LIST

**Elizabeth Bennet** - Protagonist, second eldest daughter. Intelligent, witty, independent-minded, but initially prejudiced against Darcy.

**Fitzwilliam Darcy** - Wealthy gentleman (£10,000/year), master of Pemberley. Initially proud and class-conscious; learns humility.

**Jane Bennet** - Eldest, most beautiful sister. Reserved, gentle, sees the best in everyone.

**Charles Bingley** - Darcy's wealthy friend (£4-5,000/year). Genial, easygoing. Renting Netherfield Park.

**Mr. Bennet** - Sarcastic, intelligent but irresponsible father. Prefers his library to dealing with problems.

**Mrs. Bennet** - Foolish, noisy mother obsessed with marrying off her daughters.

**Lydia Bennet** - Youngest. Immature, reckless. Elopes with Wickham.

**George Wickham** - Charming but deceitful officer. Tried to elope with Georgiana Darcy for her fortune.

**Mr. Collins** - Pompous clergyman who will inherit Bennet estate. Patronized by Lady Catherine.

**Charlotte Lucas** - Elizabeth's pragmatic friend. Marries Collins for security.

**Miss Bingley** - Bingley's snobbish sister. Pursues Darcy, disdains Elizabeth.

**Lady Catherine de Bourgh** - Darcy's domineering aunt. Epitomizes class snobbery.

**Mr. and Mrs. Gardiner** - Mrs. Bennet's sensible brother and wife. Help resolve the Lydia crisis.

---

## KEY THEMES

**Pride and Prejudice**: Darcy's pride in his status; Elizabeth's prejudiced first impressions. Both must overcome these flaws.

**Class and Social Status**: The rigid hierarchy from aristocracy (Darcy) to gentry (Bennets) to trade (Bingleys). The entailment threatens the daughters' futures.

**Marriage and Money**: Charlotte marries for security; Elizabeth holds out for love. The novel validates romantic idealism while acknowledging economic realities.

**Gender Constraints**: Women's limited options—marry well or face poverty and social scorn.

**Personal Growth**: Both protagonists undergo genuine transformation through self-examination.

---

## KEY TURNING POINTS

1. **Meryton Ball** - First impressions: Darcy snubs Elizabeth
2. **Darcy's First Proposal (Ch. 34)** - He insults her family; she refuses angrily
3. **Darcy's Letter (Ch. 35-36)** - Reveals truth about Wickham; begins Elizabeth's self-examination
4. **Pemberley Visit (Ch. 43)** - Elizabeth sees Darcy's true character
5. **Lydia's Elopement (Ch. 46)** - Crisis that proves Darcy's love
6. **Lady Catherine's Confrontation (Ch. 56)** - Elizabeth asserts her independence
7. **Second Proposal (Ch. 58)** - Both have matured; happy resolution`
    },
  };

  // Available models
  const anthropicModels = {
    'Claude 3.5 Haiku': 'claude-3-5-haiku-20241022',
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-20241022',
    'Claude Sonnet 4': 'claude-sonnet-4-20250514',
    'Claude Opus 4.5': 'claude-opus-4-5-20251101',
  };

  const openaiModels = {
    'GPT-4o': 'gpt-4o',
    'GPT-4o Mini': 'gpt-4o-mini',
    'GPT-4 Turbo': 'gpt-4-turbo',
    'GPT-3.5 Turbo': 'gpt-3.5-turbo',
    'o1': 'o1',
    'o1 Mini': 'o1-mini',
  };

  const models = aiProvider === 'ChatGPT' ? openaiModels : anthropicModels;

  // Reset model when provider changes
  useEffect(() => {
    if (aiProvider === 'ChatGPT') {
      setSelectedModel('gpt-4o-mini');
    } else {
      setSelectedModel('claude-3-5-haiku-20241022');
    }
  }, [aiProvider]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Build system prompt with role and user material
  const buildSystemPrompt = () => {
    const parts = [];

    // Add role prompt if not default
    const rolePrompt = roles[selectedRole]?.prompt;
    if (rolePrompt) {
      parts.push(rolePrompt);
    }

    // Add user material if provided
    if (userMaterial.trim()) {
      const materialContext = `The user has provided the following material for context. Use it to answer questions and provide analysis.

--- USER MATERIAL ---
${userMaterial}
--- END MATERIAL ---`;
      parts.push(materialContext);
    }

    return parts.length > 0 ? parts.join('\n\n') : null;
  };

  // Check if running on localhost
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Send message to API
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    // Check if using shared key on localhost (requires vercel dev)
    if (useSharedKey && isLocalhost) {
      alert("Stanley's shared key requires 'vercel dev' locally, or use the deployed site. For local development with 'npm start', enter your own API key.");
      return;
    }

    const needsApiKey = !(aiProvider === 'ChatGPT' && useSharedKey);
    if (needsApiKey && !apiKey) {
      alert(`Please enter your ${aiProvider === 'ChatGPT' ? 'OpenAI' : 'Anthropic'} API key`);
      return;
    }

    const userMessage = { role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt();
      let assistantMessage;

      if (aiProvider === 'ChatGPT') {
        const openaiMessages = [];
        if (systemPrompt) {
          openaiMessages.push({ role: 'system', content: systemPrompt });
        }
        openaiMessages.push(...newMessages.map(m => ({ role: m.role, content: m.content })));

        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isLocalhost && !useSharedKey) {
          let response;

          if (webSearchEnabled) {
            response = await fetch('https://api.openai.com/v1/responses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: selectedModel,
                tools: [{ type: 'web_search' }],
                tool_choice: 'auto',
                input: newMessages[newMessages.length - 1].content,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            let responseText = data.output_text;
            if (!responseText && data.output) {
              for (const item of data.output) {
                if (item.type === 'message' && item.content) {
                  for (const content of item.content) {
                    if (content.type === 'output_text' && content.text) {
                      responseText = content.text;
                      break;
                    }
                  }
                }
                if (responseText) break;
              }
            }

            assistantMessage = {
              role: 'assistant',
              content: responseText || 'No response from web search',
            };
          } else {
            response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: selectedModel,
                max_tokens: 4096,
                messages: openaiMessages,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error?.message || 'API request failed');
            }

            const data = await response.json();
            assistantMessage = {
              role: 'assistant',
              content: data.choices[0].message.content,
            };
          }
        } else {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: openaiMessages,
              model: selectedModel,
              userApiKey: useSharedKey ? null : apiKey,
              accessCode: useSharedKey ? accessCode : null,
              webSearch: webSearchEnabled,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
          }

          const data = await response.json();
          assistantMessage = {
            role: 'assistant',
            content: data.content,
          };
        }
      } else {
        const requestBody = {
          model: selectedModel,
          max_tokens: 4096,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        };

        if (systemPrompt) {
          requestBody.system = systemPrompt;
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        assistantMessage = {
          role: 'assistant',
          content: data.content[0].text,
        };
      }

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Error: ${error.message}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar backdrop for mobile */}
      {showSidebar && window.innerWidth < 768 && (
        <div
          style={styles.sidebarBackdrop}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div style={{
          ...styles.sidebar,
          ...(window.innerWidth < 768 ? styles.sidebarMobile : {}),
        }}>
          <button
            onClick={() => setShowSidebar(false)}
            style={styles.sidebarCloseBtn}
          >
            ×
          </button>
          <h2 style={styles.sidebarTitle}>Role Chat</h2>

        {/* AI Provider Toggle */}
        <div style={styles.section}>
          <label style={styles.label}>AI Provider:</label>
          <div style={styles.providerToggle}>
            <button
              onClick={() => setAiProvider('ChatGPT')}
              style={{
                ...styles.providerBtn,
                ...(aiProvider === 'ChatGPT' ? styles.providerBtnActive : {}),
              }}
            >
              ChatGPT
            </button>
            <button
              onClick={() => setAiProvider('Anthropic')}
              style={{
                ...styles.providerBtn,
                ...(aiProvider === 'Anthropic' ? styles.providerBtnActive : {}),
              }}
            >
              Claude
            </button>
          </div>
          {aiProvider === 'ChatGPT' && (
            <button
              onClick={() => {
                const code = prompt("Enter access code for Stanley's key:");
                if (code) {
                  setAccessCode(code);
                  setUseSharedKey(true);
                  setApiKey('');
                }
              }}
              style={{
                ...styles.button,
                marginTop: '8px',
                background: useSharedKey ? '#28a745' : '#6c757d',
              }}
            >
              {useSharedKey ? "Using Stanley's Key" : "Use Stanley's Key"}
            </button>
          )}
        </div>

        {/* API Key Input */}
        <div style={styles.section}>
          <label style={styles.label}>{aiProvider === 'ChatGPT' ? 'OpenAI' : 'Anthropic'} API Key:</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={aiProvider === 'ChatGPT' ? 'sk-...' : 'sk-ant-...'}
            style={styles.input}
          />
        </div>

        {/* Model Selection */}
        <div style={styles.section}>
          <label style={styles.label}>{aiProvider === 'ChatGPT' ? 'OpenAI' : 'Claude'} Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={styles.select}
          >
            {Object.entries(models).map(([name, id]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {/* Web Search Toggle - Only for ChatGPT */}
        {aiProvider === 'ChatGPT' && (
          <div style={styles.section}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={webSearchEnabled}
                onChange={(e) => setWebSearchEnabled(e.target.checked)}
                style={styles.checkbox}
              />
              Enable Web Search
            </label>
          </div>
        )}

        {/* Role Selection */}
        <div style={styles.section}>
          <label style={styles.label}>Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={styles.select}
          >
            {Object.entries(roles).map(([key, role]) => (
              <option key={key} value={key}>{role.name}</option>
            ))}
          </select>
          {roles[selectedRole]?.prompt && (
            <button
              onClick={() => setShowPromptModal(true)}
              style={{ ...styles.button, marginTop: '8px', background: '#6c757d' }}
            >
              View Role Prompt
            </button>
          )}
        </div>

        {/* Add Material */}
        <div style={styles.section}>
          <label style={styles.label}>Your Material:</label>
          <button
            onClick={() => setShowMaterialModal(true)}
            style={{
              ...styles.button,
              background: userMaterial.trim() ? '#28a745' : '#4da6ff',
            }}
          >
            {userMaterial.trim() ? `Material Added (${userMaterial.length} chars)` : 'Add Material'}
          </button>
          {userMaterial.trim() && (
            <button
              onClick={() => setUserMaterial('')}
              style={{ ...styles.button, marginTop: '8px', background: '#dc3545' }}
            >
              Clear Material
            </button>
          )}
        </div>

        {/* Clear Chat */}
        <div style={styles.section}>
          <button
            onClick={clearChat}
            style={{ ...styles.button, background: '#6c757d' }}
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
        </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={styles.mainArea}>
        <div style={styles.chatPanel}>
          <div style={styles.chatPanelHeader}>
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                style={styles.hamburgerBtn}
              >
                ☰
              </button>
            )}
            <span>Chat with {aiProvider === 'ChatGPT' ? 'ChatGPT' : 'Claude'}</span>
            {selectedRole !== 'default' && (
              <span style={styles.roleIndicator}>Role: {roles[selectedRole]?.name}</span>
            )}
            {!showSidebar && aiProvider === 'ChatGPT' && (
              <button
                onClick={() => {
                  const code = prompt("Enter access code for Stanley's key:");
                  if (code) {
                    setAccessCode(code);
                    setUseSharedKey(true);
                    setApiKey('');
                  }
                }}
                style={{
                  ...styles.stanleyKeyBtn,
                  background: useSharedKey ? '#28a745' : '#4da6ff',
                }}
              >
                {useSharedKey ? "✓ Stanley's Key" : "Use Stanley's Key"}
              </button>
            )}
          </div>

          {/* Chat Messages */}
          <div ref={chatContainerRef} style={styles.chatContainer}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>Start a conversation</p>
                <p style={styles.emptySubtitle}>
                  {selectedRole !== 'default'
                    ? `Using "${roles[selectedRole]?.name}" role`
                    : 'Select a role or just start chatting'}
                </p>
                {userMaterial.trim() && (
                  <p style={styles.emptySubtitle}>Material loaded ({userMaterial.length} characters)</p>
                )}
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.message,
                    ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
                  }}
                >
                  <div style={styles.messageRole}>
                    {msg.role === 'user' ? 'You' : (aiProvider === 'ChatGPT' ? 'ChatGPT' : 'Claude')}
                  </div>
                  <div style={styles.messageContent}>
                    {msg.role === 'user' ? msg.content : md2plain(msg.content)}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div style={{ ...styles.message, ...styles.assistantMessage }}>
                <div style={styles.messageRole}>{aiProvider === 'ChatGPT' ? 'ChatGPT' : 'Claude'}</div>
                <div style={styles.messageContent}>Thinking...</div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={styles.inputArea}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send)"
              style={styles.textarea}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              style={{
                ...styles.sendButton,
                opacity: isLoading || !inputValue.trim() ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Modal */}
      {showPromptModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPromptModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{roles[selectedRole]?.name} - System Prompt</h3>
              <button
                onClick={() => setShowPromptModal(false)}
                style={styles.modalCloseBtn}
              >
                Close
              </button>
            </div>
            <div style={styles.modalContent}>
              <pre style={styles.promptText}>{roles[selectedRole]?.prompt}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div style={styles.modalOverlay} onClick={() => setShowMaterialModal(false)}>
          <div style={styles.materialModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Your Material</h3>
              <button
                onClick={() => setShowMaterialModal(false)}
                style={styles.modalCloseBtn}
              >
                Done
              </button>
            </div>
            <div style={styles.materialModalContent}>
              <p style={styles.materialHint}>
                Paste any text, notes, or content you want the AI to reference during your conversation.
              </p>
              <textarea
                value={userMaterial}
                onChange={(e) => setUserMaterial(e.target.value)}
                placeholder="Paste your material here..."
                style={styles.materialTextarea}
              />
              <p style={styles.charCount}>{userMaterial.length} characters</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f5f5f5',
  },
  sidebar: {
    width: '280px',
    background: '#1a1a2e',
    color: '#fff',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    flexShrink: 0,
    position: 'relative',
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '85%',
    maxWidth: '320px',
    zIndex: 1000,
    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
  },
  sidebarBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sidebarCloseBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0 8px',
    lineHeight: 1,
  },
  sidebarTitle: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    fontWeight: '600',
    color: '#4da6ff',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  providerToggle: {
    display: 'flex',
    gap: '0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  providerBtn: {
    flex: 1,
    padding: '10px 12px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    background: '#2d2d44',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  providerBtnActive: {
    background: '#4da6ff',
    color: '#fff',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#fff',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#aaa',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    background: '#2d2d44',
    color: '#fff',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    background: '#2d2d44',
    color: '#fff',
    cursor: 'pointer',
  },
  button: {
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    background: '#4da6ff',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  charCount: {
    fontSize: '12px',
    color: '#888',
    margin: '4px 0 0 0',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0,
  },
  chatPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    minHeight: 0,
    overflow: 'hidden',
  },
  chatPanelHeader: {
    padding: '15px 20px',
    background: '#1a1a2e',
    color: '#4da6ff',
    fontSize: '14px',
    fontWeight: '600',
    borderBottom: '1px solid #333',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  hamburgerBtn: {
    background: 'none',
    border: 'none',
    color: '#4da6ff',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '0',
  },
  stanleyKeyBtn: {
    marginLeft: 'auto',
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '500',
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  roleIndicator: {
    fontSize: '12px',
    color: '#888',
    background: '#2d2d44',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  chatContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    padding: '40px 20px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  emptySubtitle: {
    fontSize: '14px',
    margin: '4px 0',
    color: '#888',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    background: '#4da6ff',
    color: '#fff',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    background: '#f0f0f0',
    color: '#333',
  },
  messageRole: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.8,
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  inputArea: {
    padding: '16px 20px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '12px',
    background: '#fafafa',
  },
  textarea: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    resize: 'none',
    minHeight: '50px',
    maxHeight: '150px',
    fontFamily: 'inherit',
  },
  sendButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#4da6ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '700px',
    maxWidth: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  materialModal: {
    background: '#fff',
    borderRadius: '12px',
    width: '700px',
    maxWidth: '90%',
    height: '70vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
    background: '#1a1a2e',
    borderRadius: '12px 12px 0 0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#4da6ff',
  },
  modalCloseBtn: {
    padding: '8px 20px',
    borderRadius: '6px',
    border: 'none',
    background: '#4da6ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modalContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  materialModalContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    overflow: 'hidden',
  },
  materialHint: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 12px 0',
  },
  materialTextarea: {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  promptText: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#333',
  },
};

export default ReportChat;
