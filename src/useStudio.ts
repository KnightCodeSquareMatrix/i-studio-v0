import { useEffect, useRef, useState } from 'react';
import { commerceTools, creativeModes, initialState, newPlan, preparePlan, validatePlan, normalizeDraft, saveAssetsToState, recover, validateDraft, createResults, snapshot, delivered, switchDraft, variables, fillVariables, savePromptVersion, applyInspirationToState, updateAssetMetadata } from './model.js';
const STORAGE_KEY = 'istudio-layout-v3';
export const getId = () => crypto.randomUUID();
export const date = () => new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const readState = () => { try { return recover(localStorage.getItem(STORAGE_KEY)); } catch { return initialState(); } };
export function useStudio() {
  const [state, setState] = useState<any>(readState);
  const [modal, setModal] = useState<any>(null);
  const [toast, setToast] = useState(''); const [error, setError] = useState(''); const [storageError, setStorageError] = useState(false);
  const [navOpen, setNavOpen] = useState(false); const [panelOpen, setPanelOpen] = useState(true); const [mobilePane, setMobilePane] = useState('input');
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('全部'); const [assetTab, setAssetTab] = useState('作品'); const [comparison, setComparison] = useState<string[]>([]);
  const [simulation, setSimulation] = useState('success'); const [promptForm, setPromptForm] = useState<any>(null); const [newProject, setNewProject] = useState('');
  const [feedbackText, setFeedbackText] = useState(''); const [feedbackImages, setFeedbackImages] = useState<string[]>([]); const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]); const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draft = state.draft; const busy = state.results.some((r: any) => r.status === 'generating');
  const task = commerceTools.find(t => t.id === draft.task) || commerceTools[0];
  const currentName = draft.mode === 'commerce' ? task.name : creativeModes.find(t => t.id === draft.creative)?.name;
  const completed = delivered(state.results);
  const update = (changes: any) => setState((s: any) => ({ ...s, ...changes }));
  const patchDraft = (changes: any) => { setError(''); setState((s: any) => ({ ...s, draft: { ...s.draft, ...changes } })); };
  const notify = (message: string) => { if (toastTimer.current) clearTimeout(toastTimer.current); setToast(message); toastTimer.current = setTimeout(() => setToast(''), 3200); };
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageError(false); } catch { setStorageError(true); } }, [state]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const navigate = (view: string) => { update({ view }); setNavOpen(false); setSearch(''); setFilter('全部'); };
  const changeTool = (changes: any) => { if (busy) return notify('请等待当前演示完成，或先停止生成。'); setState((s: any) => switchDraft(s, changes)); setError(''); setNavOpen(false); setMobilePane('input'); };
  const archivePrompt = (text: string, title = '未命名提示词') => { const item = { id: getId(), title, text, category: '未分类', tags: [], favorite: false, versions: [text], preset: null, deleted: false }; setState((s: any) => ({ ...s, prompts: [item, ...s.prompts] })); notify('已保存到我的提示词'); };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); notify('已复制'); } catch { notify('复制失败，请选中文本手动复制'); } };
  const favorite = (id: string) => setState((s: any) => { const item = s.results.find((r: any) => r.id === id) || s.assets.find((r: any) => r.id === id); return item ? updateAssetMetadata(s, id, { favorite: !item.favorite }) : s; });
  const moveAsset = (id: string, project: string) => setState((s: any) => updateAssetMetadata(s, id, { project }));
  const useInspiration = (item: any) => { if (busy) return notify('请先停止当前生成'); setState((s: any) => applyInspirationToState(s, item)); setMobilePane('input'); setModal(null); notify(item.requiresImage ? '已带入图生图，请添加自己的参考图；原输入已保留' : '已带入文生图；原输入已保留'); };
  const saveAssets = (items: any[]) => {
    const result = saveAssetsToState(state, items);
    setState(result.state);
    notify(`新增保存 ${result.added} 张，已保存 ${result.saved} 张`);
  };
  const download = async (item: any) => {
    if (item.status !== 'complete') return notify('完成的作品才可以下载');
    if (item.kind === 'gif') return notify('当前为动效预览，尚未接入 GIF 编码与导出');
    try { const response = await fetch(item.image); if (!response.ok) throw new Error('download'); const blob = await response.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${item.title}-示例.${item.kind === 'svg' ? 'svg' : blob.type.includes('png') ? 'png' : blob.type.includes('jpeg') ? 'jpg' : 'webp'}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } catch { notify('下载失败，请重试'); }
  };
  const readFiles = async (files: FileList | File[], target: string) => {
    const accepted = Array.from(files).filter(file => ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) && file.size <= 2 * 1024 * 1024).slice(0, 4);
    if (!accepted.length) return notify('请选择 2 MB 以内的 JPG、PNG 或 WebP 图片');
    try { const urls: string[] = await Promise.all(accepted.map(file => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); })));
    if (target === 'feedback') setFeedbackImages(urls);
    else if (target === 'assets') { update({ assets: [...urls.map((image, i) => ({ id: getId(), image, title: accepted[i].name, status: 'complete', kind: 'upload', project: draft.project, favorite: false })), ...state.assets] }); notify('素材已上传到本地素材库'); }
    else patchDraft({ [target]: [...draft[target], ...urls].slice(0, 4), strokes: target === 'references' ? [] : draft.strokes });
    setModal(null); } catch { notify('图片读取失败，请重试'); }
  };
  const plan = (choice = 'review') => { if (busy) return; const message = validateDraft(draft); setError(message || ''); if (message) { setMobilePane('input'); return; } patchDraft(preparePlan(draft, choice)); setMobilePane('plan'); };
  const generate = () => {
    if (busy) return;
    const message = validateDraft(draft, 'generate'); if (message) { setError(message); setMobilePane('input'); return; }
    if (draft.mode === 'commerce') { const planError = validatePlan(draft); if (planError) { setError(planError); patchDraft({ stage: 'plan' }); setMobilePane('plan'); return; } }
    const plans = draft.mode === 'creative' ? newPlan(draft.count).map((p, i) => ({ ...p, title: `${currentName} ${String(i + 1).padStart(2, '0')}`, prompt: draft.prompt })) : draft.plan;
    if (!plans.some((p: any) => p.enabled)) return notify('至少保留一张图片');
    const id = getId(); const result = createResults(draft, plans, id); const savedDraft = snapshot(draft); const fail = simulation === 'partial';
    setState((s: any) => ({ ...s, draft: { ...s.draft, stage: 'generating' }, results: result, histories: [{ id, title: currentName, at: date(), draft: savedDraft, results: result, status: 'generating' }, ...s.histories] }));
    setMobilePane('results'); setError('');
    result.forEach((item: any, index: number) => { timers.current.push(setTimeout(() => {
      setState((s: any) => { const results = s.results.map((r: any) => r.id === item.id ? { ...r, status: fail && index === 1 ? 'failed' : 'complete' } : r); const done = results.every((r: any) => r.status !== 'generating'); return { ...s, results, draft: { ...s.draft, stage: done ? 'results' : 'generating' }, histories: s.histories.map((h: any) => h.id === id ? { ...h, results: snapshot(results), status: done ? (fail ? 'partial' : 'complete') : 'generating' } : h) }; });
    }, 700 + index * 550)); });
  };
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; setState((s: any) => ({ ...s, draft: { ...s.draft, stage: 'interrupted' }, results: s.results.map((r: any) => r.status === 'generating' ? { ...r, status: 'interrupted' } : r), histories: s.histories.map((h: any) => h.status === 'generating' ? { ...h, status: 'interrupted', results: h.results.map((r: any) => r.status === 'generating' ? { ...r, status: 'interrupted' } : r) } : h) })); };
  const retry = (id: string) => { if (busy) return; setState((s: any) => ({ ...s, draft: { ...s.draft, stage: 'generating' }, results: s.results.map((r: any) => r.id === id ? { ...r, status: 'generating' } : r), histories: s.histories.map((h: any) => h.results.some((r: any) => r.id === id) ? { ...h, status: 'generating', results: h.results.map((r: any) => r.id === id ? { ...r, status: 'generating' } : r) } : h) })); timers.current.push(setTimeout(() => setState((s: any) => { const results = s.results.map((r: any) => r.id === id ? { ...r, status: 'complete' } : r); return { ...s, results, draft: { ...s.draft, stage: 'results' }, histories: s.histories.map((h: any) => h.results.some((r: any) => r.id === id) ? { ...h, results: snapshot(results), status: results.every((r: any) => r.status === 'complete') ? 'complete' : 'partial' } : h) }; }), 850)); };
  const restore = (history: any) => {
    if (busy) return notify('请先停止当前生成');
    const saved = normalizeDraft(snapshot(history.draft));
    const stage = history.status === 'draft' ? saved.stage : ['generating', 'interrupted'].includes(history.status) ? 'interrupted' : 'results';
    setState((s: any) => ({ ...switchDraft(s, saved), draft: { ...saved, stage }, results: snapshot(history.results).map((r: any) => r.status === 'generating' ? { ...r, status: 'interrupted' } : r), view: 'workbench' }));
    setModal(null); setMobilePane(stage === 'input' ? 'input' : stage === 'plan' ? 'plan' : 'results'); notify('已恢复全部输入、参数与结果，不会自动生成');
  };
  const applyPrompt = (item: any) => { if (busy) return notify('请先停止当前生成'); if (variables(item.text).length && !modal?.variableMode) { setVariableValues({}); setModal({ type: 'variables', item, variableMode: true }); return; } const text = fillVariables(item.text, variableValues); if (variables(text).length) return notify('请填完所有变量'); patchDraft({ ...(item.preset || {}), prompt: text, stage: 'input' }); navigate('workbench'); setModal(null); setMobilePane('input'); notify('已带入当前创作'); };
  const editPrompt = (item?: any) => { let persisted = null; try { persisted = JSON.parse(localStorage.getItem(`istudio-prompt-edit-${item?.id || 'new'}`) || 'null'); } catch {} const form = persisted || (item ? snapshot(item) : { id: getId(), title: '', text: '', category: '商品摄影', tags: [], versions: [], favorite: false, deleted: false, preset: null }); setPromptForm(form); setModal({ type: 'prompt-edit', draftId: item?.id || 'new' }); };
  const changePromptForm = (changes: any) => { const next = { ...promptForm, ...changes }; setPromptForm(next); try { localStorage.setItem(`istudio-prompt-edit-${modal.draftId}`, JSON.stringify(next)); } catch { notify('提示词编辑草稿暂时无法保存'); } };
  const savePrompt = () => { if (!promptForm.title.trim() || !promptForm.text.trim()) return notify('请填写名称和提示词内容'); const original = state.prompts.find((p: any) => p.id === promptForm.id); const item = original ? savePromptVersion(original, promptForm) : { ...promptForm, versions: [promptForm.text] }; update({ prompts: [item, ...state.prompts.filter((p: any) => p.id !== item.id)] }); try { localStorage.removeItem(`istudio-prompt-edit-${modal.draftId}`); } catch {} setModal(null); notify('提示词已保存'); };
  const continueImage = (item: any, mode = 'image') => { if (busy) return notify('请先停止当前生成'); setState((s: any) => { const next = switchDraft(s, { mode: 'creative', creative: mode }); return { ...next, draft: { ...next.draft, references: [item.image], strokes: [], prompt: item.prompt || draft.prompt, stage: 'input' }, results: [] }; }); setModal(null); setMobilePane('input'); };
  return { state, setState, modal, setModal, toast, error, storageError, navOpen, setNavOpen, panelOpen, setPanelOpen, mobilePane, setMobilePane, search, setSearch, filter, setFilter, assetTab, setAssetTab, comparison, setComparison, simulation, setSimulation, promptForm, newProject, setNewProject, feedbackText, setFeedbackText, feedbackImages, setFeedbackImages, variableValues, setVariableValues, draft, busy, currentName, completed, update, patchDraft, notify, navigate, changeTool, archivePrompt, copy, favorite, moveAsset, useInspiration, saveAssets, download, readFiles, plan, generate, stop, retry, restore, applyPrompt, editPrompt, changePromptForm, savePrompt, continueImage };
}
