# 第三方组件与许可

本项目只包含界面、游戏库与工程整合代码；下面这些是随仓库一起分发的第三方作品或资源，
版权归各自作者，许可证以原文为准。**仓库内不含任何商业游戏卡带镜像。**

## 模拟器

| 组件 | 位置 | 许可证 | 来源 |
|---|---|---|---|
| EmulatorJS 4.2.3（前端 / 内核加载 / 输入） | `data/emulator.min.js`、`data/emulator.min.css`、`data/loader.js`、`data/compression/`、`data/localization/` | GPL-3.0 | <https://github.com/EmulatorJS/EmulatorJS> |
| mGBA core（WebAssembly） | `data/cores/mgba-wasm.data`、`data/cores/mgba-legacy-wasm.data` | MPL-2.0 | <https://github.com/mgba-emu/mgba> |
| fflate（浏览器内 zip 解包） | `data/vendor/fflate.js` | MIT | <https://github.com/101arrowz/fflate> |

EmulatorJS 以 minified 构建形式分发，源码见其仓库；mGBA 以编译后的 WASM 分发，源码见其仓库。

## 内置游戏

以下三款均为作者公开发布、允许免费下载 / 开源的完整游戏，ROM 随仓库分发：

| 游戏 | 文件 | 作者 | 许可证 | 来源 |
|---|---|---|---|---|
| µCity Advance 1.0.3 | `roms/ucity.gba` | AntonioND | 代码 GPL-3.0，美术/音频 CC BY-NC-SA 4.0 | <https://github.com/AntonioND/ucity-advance> |
| Blind Jump (2021-11-20) | `roms/blindjump.gba` | Evan Bowman | MIT | <https://github.com/evanbowman/blind-jump-portable> |
| Minicraft GBA 2.0 | `roms/minicraft.gba` | Vulcalien（原作 Markus Persson） | GPL-3.0 | <https://github.com/Vulcalien/minicraft-gba> |

## 字体与图像

| 资源 | 位置 | 许可证 | 来源 |
|---|---|---|---|
| Press Start 2P | `assets/fonts/` | SIL Open Font License 1.1（见 `assets/fonts/OFL-PressStart2P.txt`） | <https://fonts.google.com/specimen/Press+Start+2P> |
| 内置游戏截图（用作封面） | `art/shots/` | 取自各游戏项目仓库，版权归原作者 | 见上表 |
| 界面与掌机插画 | `assets/`、`index.html` 内联 SVG | 随本项目 | — |

## 用户导入的卡带

用户通过界面导入的 ROM 只写入其本机浏览器的 IndexedDB，不会上传，也不属于本仓库内容。

## 关于商业游戏

《宝可梦》《黄金太阳》《火焰纹章》等商业卡带的 ROM 受版权保护。本项目不提供、不内置、
也不提供任何下载入口；想用本模拟器运行这类游戏，请使用你自己拥有卡带的合法转储文件。
