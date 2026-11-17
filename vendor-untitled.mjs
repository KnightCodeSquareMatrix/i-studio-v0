import fs from 'node:fs/promises';
import path from 'node:path';
const commit='0e7b80a65e3db80c06951427870cb8ba5c6c476f';
const base=`https://raw.githubusercontent.com/untitleduico/react/${commit}/`;
const files=['LICENSE','styles/globals.css','styles/theme.css','styles/typography.css','utils/cx.ts','utils/is-react-component.ts','hooks/use-resize-observer.ts','components/base/buttons/button.tsx','components/base/buttons/button-utility.tsx','components/base/input/input.tsx','components/base/input/hint-text.tsx','components/base/input/label.tsx','components/base/select/select.tsx','components/base/select/combobox.tsx','components/base/select/popover.tsx','components/base/select/select-footer.tsx','components/base/select/select-item.tsx','components/base/select/select-shared.tsx','components/base/tooltip/tooltip.tsx','components/base/badges/badges.tsx','components/base/badges/badge-types.ts','components/base/checkbox/checkbox.tsx','components/base/avatar/avatar.tsx','components/base/avatar/base-components/index.tsx','components/base/avatar/base-components/avatar-badge.ts','components/base/avatar/base-components/avatar-add-button.tsx','components/base/avatar/base-components/avatar-company-icon.tsx','components/base/avatar/base-components/avatar-count.tsx','components/base/avatar/base-components/avatar-online-indicator.tsx','components/base/avatar/base-components/verified-tick.tsx','components/base/progress-indicators/progress-indicators.tsx','components/foundations/dot-icon.tsx','components/foundations/featured-icon/featured-icon.tsx','components/application/tabs/tabs.tsx','components/application/file-upload/file-upload-base.tsx'];
const results=await Promise.allSettled(files.map(async file=>{const r=await fetch(base+file);if(!r.ok)throw Error(`${file}: ${r.status}`);const text=await r.text();const out=file==='LICENSE'?'UNTITLED-LICENSE':path.join('src',file);await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,text);return file;}));
for(const r of results)if(r.status==='rejected')console.error(r.reason);
if(results.some(r=>r.status==='rejected'))process.exitCode=1;
console.log('Downloaded',results.filter(r=>r.status==='fulfilled').length,'of',files.length,'files from',commit);
const p=await fetch(base+'package.json').then(r=>r.json());console.log(JSON.stringify({dependencies:p.dependencies,devDependencies:p.devDependencies},null,2));
await fs.writeFile('untitled-source.json',JSON.stringify({repository:'https://github.com/untitleduico/react',commit,license:'MIT',files},null,2)+'\n');

// Keep the recorded compatibility/localization changes when refreshing the pinned source.
if (!process.exitCode) await import('./patch-untitled.mjs');
