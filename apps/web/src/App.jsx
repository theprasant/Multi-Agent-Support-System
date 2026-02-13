import { useState } from 'react'
import './App.css'
import { MessageRole } from '@repo/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

console.log("MessageRole: ", MessageRole);

const initialValues = {
  conversations: [],
  conversationId: null,
  messages: [],
  agentType: null,
}

async function getConversations() {
  try {
    const response = await fetch('http://localhost:3000/api/chat/conversationIDs');
    const data = await response.json();
    return data;
    // console.log("Conversation IDs:", data);
  } catch (error) {
    console.error('Error fetching conversation IDs:', error);
  }
}

const cnvs = await getConversations();
initialValues.conversations = cnvs || [];
initialValues.conversationId = cnvs[0]?.id || null;
initialValues.agentType = cnvs[0]?.agent || null;

const msgs = await getMessages(cnvs[0]?.id);
initialValues.messages = msgs || [];

async function getMessages(conversationId) {
  try {
    console.log("Fetching messages for conversation ID:", conversationId);
    const response = await fetch('http://localhost:3000/api/chat/messages/' + conversationId);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching messages for conversation ID:', conversationId, error);
  }
}

function App() {
  const [messages, setMessages] = useState(initialValues.messages || []);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(initialValues.conversationId || null);
  const [conversations, setConversations] = useState(initialValues.conversations || []);
  const [agentType, setAgentType] = useState(initialValues.agentType || null);
  const [loading, setLoading] = useState(false);

  console.log("messages: ", messages);
  console.log("conversationId: ", conversationId);
  console.log("agentType: ", agentType);

  console.log("Initial Messages:", initialValues.messages);
  console.log("Initial Conversations:", initialValues.conversations);
  console.log("Initial Agent:", initialValues.agentType);

  async function sendMessage() {
    console.log("SendMessage triggered.")
    if (!input.trim() || loading) return;

    const userMessage = {
      role: MessageRole.USER,
      content: input,
    }

    setMessages(m => [...m, userMessage]);
    setInput('');
    setLoading(true);

    try {

      console.log("Sending message:", userMessage.content, "\nwith conversation ID:", conversationId);
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: userMessage.content,
        }),
      });

      if (!response.body) return;

      const newConversationId = response.headers.get("X-Conversation-Id");
      const newAgentType = response.headers.get("X-Agent-Type");
      if (newAgentType && newAgentType !== agentType) {
        console.log("Updating agent type to:", newAgentType);
        setAgentType(newAgentType);
        await sendAnnouncementMessage(`Switched to ${newAgentType} agent.`);
      }

      console.log("New Conversation ID:", newConversationId);
      setConversationId(newConversationId);
      if(newConversationId && !conversations.some(c => c.id === newConversationId)) {
        setConversations(c => [...c, { id: newConversationId, agent: newAgentType || agentType }]);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(m => [...m, { role: MessageRole.ASSISTANT, content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value);

        setMessages(m => {
          const msgsCpy = [...m];
          msgsCpy[msgsCpy.length - 1].content = assistantText;
          return msgsCpy;
        })
      }

      setLoading(false);

      if (newConversationId && newConversationId !== conversationId) {
        console.log("Updating conversation ID to:", newConversationId);
        setConversationId(newConversationId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendAnnouncementMessage(content) {
    const announcementMessage = {
      role: MessageRole.ASSISTANT,
      content,
    }

    setMessages(m => [...m, announcementMessage]);
  }

  return (
    <div className="container">
      <div className="heading">
        <div className="head-start">
          <h2 >Support {agentType ? `(${agentType})` : ''}</h2>
          {conversationId
            ? <>
              <span className="conversation-id">Conversation ID:</span>
              <select name="conversationId" id="conversationId" value={conversationId || ''} onChange={async e => {
                const selectedId = e.target.value;
                setConversationId(selectedId);
                const msgs = await getMessages(selectedId);
                setMessages(msgs || []);
              }}>
                {
                  (conversations && conversations.length > 0)
                    ? conversations.map(c => (
                      <option key={c.id} value={c.id}>{c.id}</option>
                    ))
                    : <option value="">No conversations</option>
                }
              </select>
            </>
            : ''}
        </div>

        <div className="head-end">
          <button onClick={() => {
            setConversationId(null);
            setMessages([]);
            setAgentType(null);
          }}>New</button>
        </div>

      </div>

      <div className="chatbox">
        {messages.map((m, i) => (
          <div className={`message ${m.role === MessageRole.USER ? "user-message" : "assistant-message"}`} key={i}>
            <div className="message-content">
              {m.role === MessageRole.ASSISTANT ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {loading && <div className="loading">Assistant is typing…</div>}
      </div>
      <form onSubmit={e => { e.preventDefault(); sendMessage() }} id='main-form'>
        <input type="text" id='text-input' value={input} onChange={e => setInput(e.target.value)} placeholder='Ask your queries...' />
        <button type="submit">Send</button>
      </form>
    </div>
  )


}

export default App
