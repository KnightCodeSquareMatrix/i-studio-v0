import fs from 'node:fs/promises';
const patches = [
  ['src/components/base/buttons/button.tsx', text => text.replace('    ...props\n}) => {', '    ...props\n}: Props) => {')],
  ['src/components/base/buttons/button-utility.tsx', text => text.replace('tooltipPlacement = "top", ...props }) => {', 'tooltipPlacement = "top", ...props }: Props) => {').replace('rest as AriaButtonProps', 'rest as unknown as AriaButtonProps')],
  ['src/components/base/select/combobox.tsx', text => text.replaceAll('icon?: FC | ReactNode;', 'icon?: FC<{ className?: string; "aria-hidden"?: "true" | "false" }> | ReactNode;')],
  ['src/components/application/file-upload/file-upload-base.tsx', text => text.replace('type="file"\n                        className', 'type="file"\n                        aria-label="上传图片文件"\n                        className').replace('Click to upload <span className="md:hidden">and attach files</span>', '点击上传<span className="md:hidden">图片</span>').replace('or drag and drop', '或拖拽图片到这里')],
];
for (const [file, apply] of patches) { const before = await fs.readFile(file, 'utf8'); const after = apply(before); if (before !== after) await fs.writeFile(file, after); }
console.log('Untitled UI local patches applied (TypeScript 6 annotations and Chinese upload labels).');
