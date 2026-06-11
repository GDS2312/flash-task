/**
 * AI Task Extraction Engine
 *
 * Two modes:
 * 1. Rule-based (default): Pattern matching for Chinese text, works offline
 * 2. LLM-based: Sends text to an OpenAI-compatible API for extraction
 */

import type { AppSettings } from './types';

// ---- Rule-Based Extraction ----

interface ExtractedItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string | null;
  tags: string[];
}

// Action verb patterns — sentences starting or containing these indicate tasks
const ACTION_PATTERNS = [
  /需要|必须|应该|得|要|务必/,
  /做|干|搞|弄/,
  /完成|提交|交付|上线|发布|部署/,
  /准备|筹备|安排|组织/,
  /联系|沟通|对接|协调|汇报|请示/,
  /检查|审核|审批|确认|核实/,
  /修改|优化|调整|更新|升级/,
  /处理|解决|修复|排查/,
  /购买|采购|下单|付款/,
  /学习|研究|调研|分析|评估/,
  /发送|回复|转发|通知/,
  /参加|出席|主持会议/,
  /整理|汇总|收集|统计/,
  /申请|注册|开通|配置/,
  /拜访|出差|考察|参观/,
  /记得|别忘了|提醒|注意/,
  /帮忙|协助|支持|配合/,
  /跟进|追踪|督促|推进/,
];

// Priority indicators
const HIGH_PRIORITY = /紧急|加急|尽快|立即|马上|ASAP|今天务必|非常重要|关键|第一优先/;
const LOW_PRIORITY = /不急|有空|空闲|顺便|抽空|改天|无所谓|不重要/;

// Date patterns
function extractDate(text: string): { date: string | null; remainText: string } {
  const now = new Date();

  // 今天/明天/后天
  if (/今天/.test(text)) return { date: now.toISOString().slice(0, 10), remainText: text };
  if (/明天/.test(text)) {
    const d = new Date(now); d.setDate(d.getDate() + 1);
    return { date: d.toISOString().slice(0, 10), remainText: text };
  }
  if (/后天/.test(text)) {
    const d = new Date(now); d.setDate(d.getDate() + 2);
    return { date: d.toISOString().slice(0, 10), remainText: text };
  }
  if (/大后天/.test(text)) {
    const d = new Date(now); d.setDate(d.getDate() + 3);
    return { date: d.toISOString().slice(0, 10), remainText: text };
  }

  // 下周X
  const weekMatch = text.match(/下周([一二三四五六日天])/);
  if (weekMatch) {
    const dayMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
    const targetDay = dayMap[weekMatch[1]];
    const currentDay = now.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
    const d = new Date(now); d.setDate(d.getDate() + daysUntil);
    return { date: d.toISOString().slice(0, 10), remainText: text };
  }

  // 周X
  const thisWeekMatch = text.match(/周([一二三四五六日天])/);
  if (thisWeekMatch) {
    const dayMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
    const targetDay = dayMap[thisWeekMatch[1]];
    const currentDay = now.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
    const d = new Date(now); d.setDate(d.getDate() + daysUntil);
    return { date: d.toISOString().slice(0, 10), remainText: text };
  }

  // X月X日/X月X号
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]);
    const day = parseInt(dateMatch[2]);
    const year = now.getFullYear();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { date: dateStr, remainText: text };
  }

  // X天后 / X天后
  const daysLater = text.match(/(\d+)天后/);
  if (daysLater) {
    const d = new Date(now); d.setDate(d.getDate() + parseInt(daysLater[1]));
    return { date: d.toISOString().slice(0, 10), remainText: text };
  }

  return { date: null, remainText: text };
}

// Tag extraction
function extractTags(text: string): string[] {
  const tags: string[] = [];

  if (/会议|开会|讨论|汇报|周会|例会/.test(text)) tags.push('会议');
  if (/代码|开发|编程|bug|修复|上线|部署|接口|API/.test(text)) tags.push('开发');
  if (/设计|UI|UX|原型|界面/.test(text)) tags.push('设计');
  if (/文档|报告|PPT|方案|周报|日报|汇报/.test(text)) tags.push('文档');
  if (/采购|购买|下单|预算|报销/.test(text)) tags.push('采购');
  if (/调研|研究|分析|竞品|数据/.test(text)) tags.push('调研');
  if (/客户|用户|甲方|乙方/.test(text)) tags.push('客户');
  if (/测试|验收|检查/.test(text)) tags.push('测试');
  if (/学习|培训|课程|教程/.test(text)) tags.push('学习');
  if (/团队|招聘|面试|HR/.test(text)) tags.push('人事');
  if (/服务器|运维|部署|监控|报警/.test(text)) tags.push('运维');
  if (/AI|模型|算法|ML|深度学习|神经网络/.test(text)) tags.push('AI');

  return [...new Set(tags)];
}

function parseTextToTasks(text: string): ExtractedItem[] {
  const tasks: ExtractedItem[] = [];

  // Split into sentences
  const sentences = text
    .split(/[。！？\n;；,，、]/)
    .map(s => s.trim())
    .filter(s => s.length > 3 && s.length < 200);

  for (const sentence of sentences) {
    // Check if sentence contains action patterns
    const hasAction = ACTION_PATTERNS.some(pattern => pattern.test(sentence));
    if (!hasAction) continue;

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (HIGH_PRIORITY.test(sentence)) priority = 'high';
    if (LOW_PRIORITY.test(sentence)) priority = 'low';

    // Extract date
    const { date } = extractDate(sentence);

    // Extract tags
    const tags = extractTags(sentence);

    // Clean up title — only remove emotional/priority filler words, keep dates for context
    let title = sentence
      .replace(/^[，,。！!\s]*/, '')
      .replace(/^(紧急|加急|尽快|ASAP|不急|有空|顺便|记得|别忘了)[，,\s]*/gi, '')
      .replace(/([，,]\s*)(紧急|加急|尽快|ASAP|不急|有空|顺便|记得|别忘了)\s*/gi, '$1')
      .trim();

    if (title.length < 3) title = sentence.trim();

    tasks.push({
      title,
      description: sentence.trim(),
      priority,
      dueDate: date,
      tags,
    });
  }

  return tasks;
}

// ---- LLM-Based Extraction ----

async function extractTasksViaLLM(text: string, settings: AppSettings): Promise<ExtractedItem[]> {
  const prompt = `你是一个任务提取专家。请从以下文本中提取所有待办任务。

对于每个任务，请识别：
1. 任务标题（简洁明了）
2. 优先级（高/中/低，基于紧急程度）
3. 截止日期（如果有明确或隐含的日期）
4. 标签（会议/开发/设计/文档/采购/调研/客户/测试/学习/人事/运维/AI 等）

文本内容：
${text}

请以JSON数组格式返回，每个任务包含：title（字符串）, description（字符串）, priority（"high"/"medium"/"low"）, dueDate（ISO日期字符串或null）, tags（字符串数组）。
只返回JSON数组，不要其他内容。`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(settings.llmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.llmApiKey}`,
      },
      body: JSON.stringify({
        model: settings.llmModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (err) {
    console.warn('LLM extraction failed, falling back to rule-based:', err);
    return parseTextToTasks(text);
  }
}

// ---- Main API ----

export async function extractTasks(
  text: string,
  settings: AppSettings
): Promise<ExtractedItem[]> {
  if (!text.trim()) return [];

  if (settings.aiMode === 'llm' && settings.llmEndpoint && settings.llmApiKey) {
    return extractTasksViaLLM(text, settings);
  }

  // Add a small delay for UX (shows processing state)
  await new Promise(resolve => setTimeout(resolve, 600));
  return parseTextToTasks(text);
}

// Analyze image content via LLM API (for image-to-text)
export async function analyzeImageContent(
  imageDataUrl: string,
  settings: AppSettings
): Promise<string> {
  if (settings.aiMode !== 'llm' || !settings.llmEndpoint || !settings.llmApiKey) {
    return '（图片已保存。请在设置中配置LLM API以启用图片内容识别，或手动输入图片中的文字内容。）';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(settings.llmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.llmApiKey}`,
      },
      body: JSON.stringify({
        model: settings.llmModel,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: '请识别并提取这张图片中的所有文字内容。如果有手写笔记、白板内容、文档截图、便签等，请完整提取文字。如果图片是非文字内容，请简要描述图片内容。' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        }],
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '（未能识别图片内容）';
  } catch (err) {
    console.warn('Image analysis failed:', err);
    return '（图片分析失败，请手动输入图片中的内容）';
  }
}
