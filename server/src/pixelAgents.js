const axios = require('axios');

const baseURL = process.env.PIXEL_AGENT_DESK_URL || 'http://localhost:3000';
const client = axios.create({ baseURL, timeout: 5000 });

async function proxyRequest(endpoint) {
  try {
    const { data } = await client.get(endpoint);
    return { ok: true, data };
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return { ok: false, data: null, error: 'Pixel Agent Desk is not running' };
    }
    return { ok: false, data: null, error: err.message };
  }
}

async function getAgents() {
  return proxyRequest('/api/agents');
}

async function getStats() {
  return proxyRequest('/api/stats');
}

async function getSessions() {
  return proxyRequest('/api/sessions');
}

async function getHeatmap() {
  return proxyRequest('/api/heatmap');
}

async function getHealth() {
  return proxyRequest('/api/health');
}

async function getAgentDetail(id) {
  return proxyRequest(`/api/agents/${id}`);
}

async function getAgentHistory(id) {
  // Get agent detail to find the jsonl path
  const detail = await proxyRequest(`/api/agents/${id}`);
  if (!detail.ok || !detail.data?.jsonlPath) {
    return { ok: false, data: null, error: 'Agent or history not found' };
  }

  const fs = require('fs');
  const jsonlPath = detail.data.jsonlPath;

  if (!fs.existsSync(jsonlPath)) {
    return { ok: false, data: null, error: 'History file not found' };
  }

  try {
    const content = fs.readFileSync(jsonlPath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const messages = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (!entry.message || !entry.message.role) continue;

        const { role, content: msgContent } = entry.message;

        if (role === 'user') {
          const text = typeof msgContent === 'string'
            ? msgContent
            : Array.isArray(msgContent)
              ? msgContent.filter(b => b.type === 'text').map(b => b.text).join('\n')
              : '';
          if (text) {
            messages.push({ role: 'user', text: text.slice(0, 2000), ts: entry.message.timestamp || null });
          }
        } else if (role === 'assistant') {
          const blocks = Array.isArray(msgContent) ? msgContent : [];
          let text = '';
          let tools = [];
          for (const block of blocks) {
            if (block.type === 'text' && block.text) {
              text += block.text;
            } else if (block.type === 'tool_use') {
              tools.push(block.name);
            }
          }
          if (text || tools.length > 0) {
            messages.push({
              role: 'assistant',
              text: text.slice(0, 2000),
              tools,
              model: entry.message.model || null,
              ts: entry.message.timestamp || null,
            });
          }
        }
      } catch {
        // Skip unparseable lines
      }
    }

    return {
      ok: true,
      data: {
        agent: detail.data,
        messages,
        totalMessages: messages.length,
      },
    };
  } catch (err) {
    return { ok: false, data: null, error: err.message };
  }
}

module.exports = { getAgents, getStats, getSessions, getHeatmap, getHealth, getAgentDetail, getAgentHistory };
