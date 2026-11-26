/* ============================================================
   内置游戏清单
   仅收录作者允许免费下载 / 开源分发的作品，版权归各作者。
   新增游戏：把 ROM 放进 roms/，在这里加一条即可。
   ============================================================ */

window.BUILTIN_GAMES = [
  {
    id: "ucity",
    title: "µCity Advance",
    subtitle: "微型城市 · 从荒原到都会",
    rom: "roms/ucity.gba",
    cover: "art/shots/ucity-0.png",
    year: "v1.0.3",
    genre: "模拟建造",
    author: "AntonioND",
    license: "GPL-3.0",
    accent: "#4ade80",
    blurb: "铺路、架电线、盖房子，把一片空地慢慢养成会呼吸的小城市。",
    link: "https://github.com/AntonioND/ucity-advance"
  },
  {
    id: "blindjump",
    title: "Blind Jump",
    subtitle: "横版动作冒险 · 机械废墟",
    rom: "roms/blindjump.gba",
    cover: "art/shots/bj-2.png",
    year: "2021",
    genre: "动作平台",
    author: "Evan Bowman",
    license: "MIT",
    accent: "#ff9f6b",
    blurb: "跑、跳、滑铲，在废墟里一路砍过去；手感扎实，BOSS 战够硬。",
    link: "https://github.com/evanbowman/blind-jump-portable"
  },
  {
    id: "minicraft",
    title: "Minicraft GBA",
    subtitle: "沙盒生存 · 一个人的小世界",
    rom: "roms/minicraft.gba",
    cover: "art/shots/minicraft-cover.png",
    year: "v2.0",
    genre: "沙盒生存",
    author: "Vulcalien",
    license: "GPL-3.0",
    accent: "#8fd0ff",
    blurb: "砍树、挖矿、造房子，攒够装备撑过夜晚——掌机上的极简生存。",
    link: "https://github.com/Vulcalien/minicraft-gba"
  }
];

/* 键盘提示（与 EmulatorJS 默认键位一致） */
window.KEY_HINTS = [
  ["方向键", "十字键"],
  ["Z", "A 键"],
  ["X", "B 键"],
  ["Q / E", "L / R"],
  ["Enter", "Start"],
  ["V", "Select"]
];
