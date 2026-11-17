import { useEffect, useState } from "react";
import { FocusScope } from "react-aria";
import { Button } from '@/components/base/buttons/button';
import { Badge } from '@/components/base/badges/badges';
import { HomeLine, ShoppingBag01, Image01, Folder, Lightbulb01, BookOpen01, Plus, ChevronRight, HelpCircle, Gift01, Menu01, Bell01, LayersTwo01 } from '@untitledui/icons';
import { IconButton } from './ui';
import { Workbench } from './Workbench';
import { LibraryPages } from './LibraryPages';
import { StudioDialogs } from './StudioDialogs';
import { useStudio } from './useStudio';
const names: Record<string, string> = { home: '首页', workbench: '创作方案', inspiration: '灵感模板', assets: '我的资产', prompts: '我的提示词', account: '个人账户' };
export default function App() {
  const s = useStudio();
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 760px)").matches);
  useEffect(() => { const media = window.matchMedia("(max-width: 760px)"); const change = () => setNarrow(media.matches); media.addEventListener("change", change); return () => media.removeEventListener("change", change); }, []);
  const { state, draft, navOpen, setNavOpen, navigate, changeTool, setModal, storageError, notify, toast } = s;
  const navItems = [{ id: 'home', label: '首页', icon: HomeLine }, { id: 'creative', label: '图片创作', icon: Image01 }, { id: 'commerce', label: '创作方案', icon: ShoppingBag01 }, { id: 'inspiration', label: '灵感模板', icon: Lightbulb01 }, { id: 'assets', label: '我的资产', icon: Folder }, { id: 'prompts', label: '我的提示词', icon: BookOpen01 }];
  return <div className={`app-shell ${navOpen ? 'nav-open' : ''}`}><a className="skip-link" href="#main">跳到主要内容</a>{navOpen && <button className="nav-backdrop" aria-label="收起导航" onClick={() => setNavOpen(false)} />}
    <FocusScope contain={narrow && navOpen} restoreFocus><aside className="sidebar" aria-label="主导航" inert={narrow && !navOpen} onKeyDown={event => { if (event.key === "Escape") setNavOpen(false); }}><button className="brand" onClick={() => navigate('home')}><span className="brand-mark"><LayersTwo01 /></span><span>iStudio<span className="brand-dot">.</span></span></button><button className="workspace-switch" onClick={() => setModal({ type: 'project' })}><span className="workspace-avatar">K</span><span><strong>我的项目</strong><small>{draft.project}</small></span><ChevronRight /></button>
      <nav>{navItems.map(({ id, label, icon: Icon }, index) => <button key={id} className={`nav-item ${index === 3 ? 'nav-divider' : ''} ${(state.view === id || (state.view === 'workbench' && draft.mode === id)) ? 'active' : ''}`} onClick={() => id === 'commerce' || id === 'creative' ? changeTool({ mode: id }) : navigate(id)}><Icon aria-hidden="true" /><span>{label}</span>{id === 'inspiration' && <span className="new-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="workspace-note"><div><span className="status-dot" />创作空间已就绪</div><p>把好想法，变成好作品。</p><Button color="secondary" size="sm" iconLeading={Plus} onPress={() => setModal({ type: 'project' })}>新建项目</Button></div><button className="nav-item" onClick={() => setModal({ type: 'promotions' })}><Gift01 />邀请与优惠</button><button className="nav-item" onClick={() => setModal({ type: 'help' })}><HelpCircle />帮助与反馈</button><button className="profile" onClick={() => navigate('account')}><span className="user-avatar">K</span><span><strong>Knight</strong><small>个人账户</small></span><ChevronRight /></button></div>
    </aside></FocusScope>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><span className="mobile-menu"><IconButton label="展开导航" icon={Menu01} onPress={() => setNavOpen(true)} /></span><span className="breadcrumb-root">创作工作台</span><ChevronRight /><strong>{state.view === 'workbench' ? (draft.mode === 'creative' ? '图片创作' : '创作方案') : names[state.view]}</strong></div><div className="topbar-actions"><Badge color="gray" size="sm">交互预览</Badge><button className="saved-status" onClick={() => notify(storageError ? '本地存储空间不足，当前修改尚未持久保存' : '草稿已保存在当前浏览器')}><span className={`status-dot ${storageError ? 'warning' : ''}`} />{storageError ? '保存失败' : '草稿已保存'}</button><IconButton label="查看公告" icon={Bell01} onPress={() => setModal({ type: 'announcements' })} /><span className="topbar-avatar">K</span></div></header>
      {storageError && <div className="error-banner" role="alert">本地空间不足，刷新前请下载作品。当前修改尚未保存。</div>}
      <main id="main" className={`main-content ${state.view === 'workbench' ? 'workbench-content' : ''}`}>{state.view === 'workbench' ? <Workbench studio={s} /> : <LibraryPages studio={s} />}</main>
    </div><StudioDialogs studio={s} /><div role="status" aria-live="polite" className={toast ? 'toast visible' : 'toast'}>{toast}</div>
  </div>;
}
