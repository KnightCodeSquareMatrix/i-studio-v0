export const commerceTools = [
  { id: 'main', name: '商品主图', short: '主图', description: '让商品在第一眼被看见', image: '/assets/perfume.webp' },
  { id: 'detail', name: '商品详情', short: '详情', description: '把卖点讲成一套完整的故事', image: '/assets/skincare.webp' },
  { id: 'clone', name: '爆款复刻', short: '复刻', description: '参考好构图，保留你的商品', image: '/assets/coffee.webp' },
  { id: 'retouch', name: '产品精修', short: '精修', description: '还原材质，整理光影与细节', image: '/assets/light.webp' },
  { id: 'clothing', name: '服装组图', short: '服装', description: '规划同一款服装的整组展示', image: '/assets/garden.webp' },
];
export const creativeModes = [
  { id: 'text', name: '文生图' }, { id: 'image', name: '图生图' },
  { id: 'mask', name: '局部重绘' }, { id: 'markup', name: '圈画修改' },
  { id: 'gif', name: 'GIF 动图' }, { id: 'svg', name: 'SVG 矢量' },
];
export const planTitles = ['首屏主视觉', '核心卖点', '材质细节', '使用场景', '氛围展示', '规格信息'];
export const initialPrompt = '一款琥珀木质调香氛，透明方形玻璃瓶、金色瓶盖。突出温暖、自然与安静的高级感，使用柔和的侧光和浅色石材背景。保留产品外观，画面简洁，适合电商上架。';
export const inspirations = [
  { id: 'warm', name: '让光影，替产品说话', category: '商品摄影', image: '/assets/perfume.webp', prompt: initialPrompt, tag: '自然光影', requiresImage: true },
  { id: 'skin', name: '干净柔和的护肤视觉', category: '美妆个护', image: '/assets/skincare.webp', prompt: '保留参考产品外观，浅色背景，柔和散射光，突出产品细腻质感。', tag: '清透质感', requiresImage: true },
  { id: 'coffee', name: '一杯咖啡的日常仪式', category: '食品饮料', image: '/assets/coffee.webp', prompt: '咖啡产品静物摄影，自然窗光，暖棕色调，真实生活场景。', tag: '生活方式', requiresImage: true },
  { id: 'light', name: '留白中的设计感', category: '家居生活', image: '/assets/light.webp', prompt: '家居产品摄影，大面积留白，简洁空间，突出轮廓与材质。', tag: '极简构图', requiresImage: true },
  { id: 'garden', name: '把自然带进画面', category: '生活方式', image: '/assets/garden.webp', prompt: '自然庭院环境，绿植背景，通透光线，安静而有生活感。', tag: '自然场景', requiresImage: false },
];
export const briefFields = [
  { key: 'subject', label: '主体与特征', required: true, hint: '是什么？写清外观、材质或不能改变的特征。', placeholder: '如：透明方形香氛瓶，金色瓶盖，琥珀色液体', examples: ['透明玻璃瓶，保留标签', '白色棉质衬衫，宽松版型'] },
  { key: 'purpose', label: '表达重点/用途', required: true, hint: '想突出什么？这张图准备用在哪里？', placeholder: '如：突出温暖木质香调，用作电商商品主图', examples: ['突出材质质感，用作商品主图', '展示使用体验，用于详情页'] },
  { key: 'scene', label: '场景与背景', hint: '把主体放在哪里？背景也可以留白。', placeholder: '如：浅色石材台面，干净背景', examples: ['浅色石材台面', '自然庭院，绿植虚化'] },
  { key: 'composition', label: '构图与视角', hint: '从哪里看？主体占多大，哪里留空？', placeholder: '如：正面近景，主体居中，右侧留白', examples: ['正面近景，主体居中', '俯拍，右侧留白'] },
  { key: 'lighting', label: '光线与风格', hint: '用光、色调和质感，希望是什么感觉？', placeholder: '如：柔和侧光，暖色调，自然写实', examples: ['柔和侧光，自然写实', '清透散射光，极简风格'] },
  { key: 'constraints', label: '文字与限制', hint: '需要哪些文字？哪些内容不要出现？', placeholder: '如：不添加文字，不改变包装与品牌标签', examples: ['不添加文字，保留品牌标签', '避免变形与杂乱背景'] },
];
export const emptyBrief = () => Object.fromEntries(briefFields.map(field => [field.key, '']));
export function composePrompt(draft) {
  const parts = briefFields.filter(field => draft.brief?.[field.key]?.trim()).map(field => field.label + '：' + draft.brief[field.key].trim());
  if (draft.prompt.trim()) parts.push('补充原始描述：' + draft.prompt.trim());
  return parts.join('\n');
}
export function planSource(draft) {
  return JSON.stringify([composePrompt(draft), draft.count, draft.task, draft.platform, draft.language, draft.negative || '', draft.style || '', draft.clothingScene || '', draft.modelBrief || '']);
}
export function planNeedsReview(draft) { return draft.plan.length > 0 && draft.planSource !== planSource(draft); }
export function preparePlan(draft, choice = 'review') {
  if (draft.plan.length && choice !== 'update') return { ...draft, stage: 'plan', ...(choice === 'keep' ? { planSource: planSource(draft) } : {}) };
  const prompt = [composePrompt(draft), '投放平台：' + draft.platform, '文案语言：' + draft.language, draft.clothingScene && '服装展示：' + draft.clothingScene, draft.modelBrief && '模特与场景：' + draft.modelBrief, draft.negative && '避免：' + draft.negative, draft.style && '视觉风格：' + draft.style].filter(Boolean).join('\n');
  return { ...draft, stage: 'plan', planSource: planSource(draft), plan: newPlan(draft.count).map(item => ({ ...item, prompt: prompt + '\n本张表达：' + item.title + '。保持主体特征一致。' })) };
}

export function newPlan(count = 6) {
  return Array.from({ length: count }, (_, i) => ({ id: `plan-${i}`, title: planTitles[i % planTitles.length], prompt: `${planTitles[i % planTitles.length]}：保持商品外观与整套风格一致，构图清晰，保留必要留白。`, enabled: true }));
}
export function newDraft(task = 'main', mode = 'commerce') {
  return { task, mode, creative: 'text', project: '琥珀 · 香氛视觉', prompt: '', brief: emptyBrief(), references: [], styleReferences: [], platform: '淘宝 / 天猫', language: '简体中文', ratio: '3:4', quality: '标准', count: mode === 'commerce' ? 6 : 1, duration: 3, frames: 12, strokes: [], plan: [], planSource: null, stage: 'input' };
}
export function initialState() {
  return { schema: 1, view: 'home', draft: newDraft(), results: [], assets: [], histories: [], prompts: [{ id: 'prompt-1', title: '自然光商品摄影', text: initialPrompt, category: '商品摄影', tags: ['光影', '静物'], favorite: true, versions: [initialPrompt], preset: null, deleted: false }], projects: ['琥珀 · 香氛视觉', '日常产品拍摄'], feedback: [], submissions: [], signedIn: true, lastCheckin: '', notices: [] };
}
const validDraft = draft => draft && typeof draft.prompt === 'string' && typeof draft.project === 'string' && ['commerce', 'creative'].includes(draft.mode) && Array.isArray(draft.references) && draft.references.every(x => typeof x === 'string') && Array.isArray(draft.styleReferences) && draft.styleReferences.every(x => typeof x === 'string') && Array.isArray(draft.plan) && draft.plan.every(x => x && typeof x.title === 'string' && typeof x.prompt === 'string') && Array.isArray(draft.strokes);
const validResults = results => Array.isArray(results) && results.every(x => x && typeof x.id === 'string' && typeof x.title === 'string' && typeof x.image === 'string');
const interruptResults = results => results.map(item => item.status === 'generating' ? { ...item, status: 'interrupted' } : item);
export function normalizeDraft(draft) {
  const normalized = { ...newDraft(draft.task, draft.mode), ...draft, brief: { ...emptyBrief(), ...draft.brief } };
  for (const field of briefFields) if (typeof normalized.brief[field.key] !== 'string') normalized.brief[field.key] = '';
  // Legacy free text and every hand-edited per-image prompt stay intact.
  if (!Object.hasOwn(draft, 'planSource') && draft.plan.length) normalized.planSource = planSource(normalized);
  return normalized;
}
const interruptDraft = (draft, results) => ({ ...normalizeDraft(draft), stage: draft.stage === 'generating' || results.some(r => r.status === 'generating') ? 'interrupted' : draft.stage });
export function recover(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || data.schema !== 1 || !validDraft(data.draft) || !validResults(data.results) || !validResults(data.assets) || !Array.isArray(data.prompts) || !data.prompts.every(p => p && typeof p.text === 'string' && typeof p.title === 'string' && Array.isArray(p.tags) && Array.isArray(p.versions)) || !Array.isArray(data.histories) || !data.histories.every(h => h && validDraft(h.draft) && validResults(h.results))) return initialState();
    const state = { ...initialState(), ...data, draft: interruptDraft(data.draft, data.results), results: interruptResults(data.results) };
    state.histories = data.histories.map(h => ({ ...h, status: h.status === 'generating' || h.results.some(r => r.status === 'generating') ? 'interrupted' : h.status, draft: interruptDraft(h.draft, h.results), results: interruptResults(h.results) }));
    state.drafts = Object.fromEntries(Object.entries(data.drafts || {}).filter(([, entry]) => entry && validDraft(entry.draft) && validResults(entry.results)).map(([key, entry]) => [key, { draft: interruptDraft(entry.draft, entry.results), results: interruptResults(entry.results) }]));
    for (const key of ['projects', 'feedback', 'submissions', 'notices']) if (!Array.isArray(state[key])) state[key] = initialState()[key];
    return state;
  } catch { return initialState(); }
}
export function validateDraft(draft, phase = 'input') {
  if (draft.mode === 'commerce') {
    if (!draft.brief?.subject?.trim()) return '请填写主体与特征。';
    if (!draft.brief?.purpose?.trim()) return '请填写表达重点/用途。';
    if (phase === 'generate' && !draft.references.length) return '生成前请先添加商品原图。';
    if (phase === 'generate' && draft.task === 'clone' && !draft.styleReferences.length) return '爆款复刻生成前还需要一张独立的构图参考图。';
  } else {
    if (!draft.prompt.trim()) return '请先填写画面描述。';
    if (['image', 'mask', 'markup'].includes(draft.creative) && !draft.references.length) return '请先添加参考图片。';
    if (['mask', 'markup'].includes(draft.creative) && !draft.strokes.length) return '请先在图片上标记需要修改的位置。';
  }
  return null;
}
export function validatePlan(draft) {
  if (!draft.plan.length) return '请先整理逐张提示词。';
  if (planNeedsReview(draft)) return '引导输入已变化，请选择更新方案或保留原方案。';
  const enabled = draft.plan.filter(item => item.enabled);
  if (!enabled.length) return '请至少勾选一张图片。';
  if (enabled.some(item => !item.title.trim() || !item.prompt.trim())) return '请补齐已勾选图片的标题与提示词。';
  return null;
}
export function createResults(draft, plan, id) {
  const selected = plan.filter(item => item.enabled);
  return selected.map((item, index) => ({ id: `${id}-${index}`, title: item.title, prompt: item.prompt, image: draft.creative === 'svg' && draft.mode === 'creative' ? '/assets/botanical.svg' : (draft.references[0] || '/assets/perfume.webp'), status: 'generating', variant: index, ratio: draft.ratio, quality: draft.quality, duration: draft.duration, frames: draft.frames, project: draft.project, favorite: false, task: draft.task, mode: draft.mode, creative: draft.creative, kind: draft.mode === 'creative' ? draft.creative : 'image', example: true }));
}
export function snapshot(draft) { return JSON.parse(JSON.stringify(draft)); }
export function delivered(results) { return results.filter(item => item.status === 'complete'); }
export function applyInspiration(draft, inspiration) {
  return { ...draft, prompt: inspiration.prompt, references: [], inspiration: { id: inspiration.id, name: inspiration.name }, stage: 'input' };
}
export function serialize(state) {
  return JSON.stringify(state);
}

export function draftKey(draft) { return JSON.stringify([draft.project, draft.mode, draft.mode === 'commerce' ? draft.task : draft.creative]); }
export function switchDraft(state, changes) {
  const drafts = { ...(state.drafts || {}), [draftKey(state.draft)]: { draft: snapshot(state.draft), results: snapshot(state.results) } };
  const target = { ...state.draft, ...changes };
  const saved = drafts[draftKey(target)];
  const draft = saved ? snapshot(saved.draft) : { ...newDraft(target.task, target.mode), ...changes, project: target.project, creative: target.creative, stage: 'input', strokes: [] };
  return { ...state, drafts, draft, results: saved ? snapshot(saved.results) : [], view: 'workbench' };
}
export function variables(text) { return [...new Set([...text.matchAll(/\{\{([^{}]+)\}\}/g)].map(match => match[1].trim()))]; }
export function fillVariables(text, values) { return text.replace(/\{\{([^{}]+)\}\}/g, (match, name) => values[name.trim()]?.trim() || match); }
export function savePromptVersion(prompt, changes) { const versions = [...(prompt.versions || [])]; if (changes.text !== prompt.text) versions.push(changes.text); return { ...prompt, ...changes, versions }; }

export function applyInspirationToState(state, inspiration) {
  const next = switchDraft(state, { mode: 'creative', creative: inspiration.requiresImage ? 'image' : 'text' });
  const previous = next.draft;
  const hasInput = previous.prompt.trim() || previous.references.length || previous.plan.length || next.results.length || Object.values(previous.brief).some(value => value.trim());
  // Reuse the existing history snapshot when the destination has work to preserve.
  // This also covers applying another inspiration within the same image mode.
  const histories = hasInput ? [{ id: crypto.randomUUID(), title: '灵感带入前草稿', at: new Date().toLocaleString('zh-CN'), status: 'draft', draft: snapshot(previous), results: snapshot(next.results) }, ...next.histories] : next.histories;
  return { ...next, histories, draft: { ...applyInspiration(previous, inspiration), strokes: [] }, results: [] };
}
export function updateAssetMetadata(state, id, changes) {
  const update = results => results.map(item => item.id === id ? { ...item, ...changes } : item);
  return { ...state, results: update(state.results), assets: update(state.assets), drafts: Object.fromEntries(Object.entries(state.drafts || {}).map(([key, value]) => [key, { ...value, results: update(value.results) }])), histories: state.histories.map(history => ({ ...history, results: update(history.results) })) };
}

export function saveAssetsToState(state, items) {
  const eligible = [...new Map(delivered(items).map(item => [item.id, item])).values()];
  const added = eligible.filter(item => !state.assets.some(asset => asset.id === item.id));
  return { state: { ...state, assets: [...snapshot(added), ...state.assets] }, added: added.length, saved: eligible.length - added.length };
}
