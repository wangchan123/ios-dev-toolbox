const categories = [
  {
    name: "加密与编码",
    tools: [
      { id: "hash", icon: "#", title: "Hash / HMAC", desc: "SHA-1、SHA-256、SHA-384、SHA-512 与 HMAC 快速计算。" },
      { id: "base64", icon: "64", title: "Base64 / URL", desc: "文本 Base64、URL Encode/Decode 与 UTF-8 转换。" },
      { id: "jwt", icon: "JWT", title: "JWT 解析", desc: "本地解析 Header 与 Payload，适合调试 token 内容。" }
    ]
  },
  {
    name: "文本与正则",
    tools: [
      { id: "regex", icon: ".*", title: "正则表达式测试", desc: "实时匹配、分组查看，并附带 iOS 常用正则模板。" },
      { id: "json", icon: "{}", title: "JSON / Plist 辅助", desc: "JSON 格式化、压缩、转义，生成 Swift Codable 结构提示。" },
      { id: "strings", icon: "Aa", title: "字符串工具", desc: "大小写、行排序、去重、长度统计和命名风格转换。" }
    ]
  },
  {
    name: "转换与速查",
    tools: [
      { id: "radix", icon: "16", title: "进制转换", desc: "十六进制、十进制、二进制、RGB 与 UInt 表示互转。" },
      { id: "color", icon: "RGB", title: "颜色转换", desc: "HEX、RGB、UIColor、SwiftUI Color 代码互转。" },
      { id: "date", icon: "T", title: "时间戳转换", desc: "秒、毫秒、ISO8601 与 iOS Date 代码速查。" }
    ]
  }
];

const commonRegex = [
  ["手机号", "^1[3-9]\\d{9}$"],
  ["邮箱", "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$"],
  ["身份证", "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$"],
  ["URL", "https?:\\/\\/[\\w.-]+(?:\\/[\\w./?%&=-]*)?"],
  ["中文", "[\\u4e00-\\u9fa5]+"],
  ["十六进制颜色", "^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$"]
];

const categoryDescriptions = {
  加密与编码: "处理接口签名、Token 调试、Base64 和 URL 参数编码，全部在浏览器本地完成。",
  文本与正则: "调试正则、整理日志、格式化 JSON，并快速生成 iOS 模型代码草稿。",
  转换与速查: "进制、颜色、时间戳这些高频转换集中在这里，适合开发和排查问题时快速查。"
};

let activeCategory = categories[0].name;
let activeTool = categories[0].tools[0].id;
let filter = "";

const $ = (selector) => document.querySelector(selector);
const allTools = () => categories.flatMap((category) => category.tools.map((tool) => ({ ...tool, category: category.name })));
const getTool = (id) => allTools().find((tool) => tool.id === id);
const getCategory = (name) => categories.find((category) => category.name === name) || categories[0];
const getToolCategory = (id) => categories.find((category) => category.tools.some((tool) => tool.id === id));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  renderNav();
  renderGrid();
  renderTool();
  $("#toolCount").textContent = `${categories.length} 类`;
}

function visibleTools() {
  const q = filter.trim().toLowerCase();
  const currentTools = getCategory(activeCategory).tools.map((tool) => ({ ...tool, category: activeCategory }));
  if (!q) return currentTools;
  return currentTools.filter((tool) => `${tool.title} ${tool.desc} ${tool.category}`.toLowerCase().includes(q));
}

function renderNav() {
  $("#categoryNav").innerHTML = categories
    .map(
      (category) => `<button class="nav-category ${category.name === activeCategory ? "active" : ""}" data-category="${category.name}">
        <span class="nav-category-main">
          <span class="tool-icon">${category.tools[0].icon}</span>
          <span><strong>${category.name}</strong><small>${category.tools.map((tool) => tool.title).join(" / ")}</small></span>
        </span>
        <span class="nav-count">${category.tools.length}</span>
      </button>`
    )
    .join("");
}

function renderGrid() {
  const tools = visibleTools();
  const currentCategory = getCategory(activeCategory);
  $("#currentCategoryName").textContent = currentCategory.name;
  $("#currentCategoryCount").textContent = `${tools.length} / ${currentCategory.tools.length} 个`;
  $("#categoryHero").querySelector("h1").textContent = currentCategory.name;
  $("#categoryHero").querySelector("p").textContent = categoryDescriptions[activeCategory] || "选择一个工具开始处理当前任务。";
  $("#toolGrid").innerHTML = tools.length
    ? tools
        .map(
          (tool) => `<article class="tool-card ${tool.id === activeTool ? "active" : ""}" data-tool="${tool.id}" tabindex="0">
        <div class="tool-icon">${tool.icon}</div>
        <div><h3>${tool.title}</h3><p>${tool.desc}</p></div>
      </article>`
        )
        .join("")
    : `<div class="empty-state">当前分类没有匹配的工具。</div>`;
}

function panel(title, desc, body) {
  return `<div class="panel-head"><div><h2>${title}</h2><p>${desc}</p></div><span class="pill">${getTool(activeTool).category}</span></div>${body}`;
}

function resultBlock(value) {
  return `<div class="result"><button class="copy-btn" type="button" data-copy>复制</button><pre>${escapeHtml(value || "等待输入...")}</pre></div>`;
}

function renderTool() {
  const tool = getTool(activeTool);
  const renderers = {
    hash: renderHash,
    base64: renderBase64,
    jwt: renderJwt,
    regex: renderRegex,
    json: renderJson,
    strings: renderStrings,
    radix: renderRadix,
    color: renderColor,
    date: renderDate
  };
  $("#toolPanel").innerHTML = renderers[tool.id]();
  bindPanel();
}

function renderHash() {
  return panel(
    "Hash / HMAC",
    "选择算法后输入文本，结果使用浏览器 Web Crypto 在本地计算。",
    `<div class="form-grid">
      <label class="field">算法<select id="hashAlgo">
        <option>SHA-256</option><option>SHA-1</option><option>SHA-384</option><option>SHA-512</option><option>HMAC-SHA-256</option>
      </select></label>
      <label class="field">HMAC Key<input id="hmacKey" value="secret" /></label>
      <label class="field">输入<textarea id="hashInput">Hello iOS</textarea></label>
      <div class="actions"><button class="primary-btn" id="hashRun">计算</button><button class="ghost-btn" data-sample="hash">示例</button></div>
      <div id="hashOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderBase64() {
  return panel(
    "Base64 / URL",
    "在 UTF-8、Base64、URL 编码之间互转，适合接口参数和日志排查。",
    `<div class="form-grid">
      <label class="field">输入<textarea id="baseInput">iOS 开发工具</textarea></label>
      <div class="actions">
        <button class="primary-btn" data-base-action="b64e">Base64 编码</button>
        <button class="ghost-btn" data-base-action="b64d">Base64 解码</button>
        <button class="ghost-btn" data-base-action="urle">URL 编码</button>
        <button class="ghost-btn" data-base-action="urld">URL 解码</button>
      </div>
      <div id="baseOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderJwt() {
  return panel(
    "JWT 解析",
    "解析 JWT 的 Header 与 Payload，不做网络请求，不校验签名。",
    `<div class="form-grid">
      <label class="field">JWT<textarea id="jwtInput" placeholder="粘贴 token"></textarea></label>
      <div class="actions"><button class="primary-btn" id="jwtRun">解析</button><button class="ghost-btn" data-sample="jwt">示例</button></div>
      <div id="jwtOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderRegex() {
  return panel(
    "正则表达式测试",
    "实时测试表达式、flags 和分组，常用 iOS 输入校验模板可一键填入。",
    `<div class="form-grid">
      <div class="two-col">
        <label class="field">表达式<input id="regexPattern" value="\\b\\w+@\\w+\\.com\\b" /></label>
        <label class="field">Flags<input id="regexFlags" value="gi" /></label>
      </div>
      <label class="field">测试文本<textarea id="regexText">contact me at dev@example.com or ios@example.com</textarea></label>
      <div class="actions">${commonRegex.map(([name, pattern]) => `<button class="ghost-btn" data-regex="${escapeHtml(pattern)}">${name}</button>`).join("")}</div>
      <div id="regexOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderJson() {
  return panel(
    "JSON / Plist 辅助",
    "格式化、压缩、转义 JSON，并根据顶层字段生成 Swift Codable 草稿。",
    `<div class="form-grid">
      <label class="field">JSON<textarea id="jsonInput">{"name":"Codex","platform":"iOS","enabled":true,"count":3}</textarea></label>
      <div class="actions">
        <button class="primary-btn" data-json-action="format">格式化</button>
        <button class="ghost-btn" data-json-action="minify">压缩</button>
        <button class="ghost-btn" data-json-action="escape">转义</button>
        <button class="ghost-btn" data-json-action="codable">Codable</button>
      </div>
      <div id="jsonOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderStrings() {
  return panel(
    "字符串工具",
    "处理日志、接口字段和命名风格，快速获得统计信息。",
    `<div class="form-grid">
      <label class="field">输入<textarea id="stringInput">user_id\nUser Name\ncreated-at\nuser_id</textarea></label>
      <div class="actions">
        <button class="primary-btn" data-string-action="stats">统计</button>
        <button class="ghost-btn" data-string-action="unique">去重</button>
        <button class="ghost-btn" data-string-action="sort">排序</button>
        <button class="ghost-btn" data-string-action="camel">camelCase</button>
        <button class="ghost-btn" data-string-action="snake">snake_case</button>
      </div>
      <div id="stringOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderRadix() {
  return panel(
    "进制转换",
    "输入 10、16、2 进制或 Swift 常见 0x 写法，自动转换为多种表示。",
    `<div class="form-grid">
      <label class="field">数值<input id="radixInput" value="0xFF" /></label>
      <div class="actions"><button class="primary-btn" id="radixRun">转换</button><button class="ghost-btn" data-sample="radix">RGB 示例</button></div>
      <div id="radixOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderColor() {
  return panel(
    "颜色转换",
    "HEX/RGB 转 UIColor 与 SwiftUI Color，支持 Alpha。",
    `<div class="form-grid">
      <label class="field">颜色<input id="colorInput" value="#007AFF" /></label>
      <div class="actions"><button class="primary-btn" id="colorRun">转换</button><button class="ghost-btn" data-sample="color">系统蓝</button></div>
      <div id="colorOut">${resultBlock("")}</div>
    </div>`
  );
}

function renderDate() {
  return panel(
    "时间戳转换",
    "秒、毫秒、ISO8601 互转，并生成 Swift Date/DateFormatter 示例。",
    `<div class="form-grid">
      <label class="field">时间<input id="dateInput" value="${Date.now()}" /></label>
      <div class="actions"><button class="primary-btn" id="dateRun">转换</button><button class="ghost-btn" data-sample="date">当前时间</button></div>
      <div id="dateOut">${resultBlock("")}</div>
    </div>`
  );
}

function bindPanel() {
  $("#toolPanel").onclick = panelClick;
  const liveInputs = ["regexPattern", "regexFlags", "regexText"];
  liveInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", runRegex);
  });
  if (activeTool === "hash") runHash();
  if (activeTool === "regex") runRegex();
  if (activeTool === "radix") runRadix();
  if (activeTool === "color") runColor();
  if (activeTool === "date") runDate();
}

async function panelClick(event) {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.copy !== undefined) {
    const text = target.nextElementSibling?.innerText || "";
    await navigator.clipboard.writeText(text);
    target.textContent = "已复制";
    setTimeout(() => (target.textContent = "复制"), 900);
  }
  if (target.id === "hashRun") runHash();
  if (target.id === "jwtRun") runJwt();
  if (target.id === "radixRun") runRadix();
  if (target.id === "colorRun") runColor();
  if (target.id === "dateRun") runDate();
  if (target.dataset.baseAction) runBase64(target.dataset.baseAction);
  if (target.dataset.jsonAction) runJson(target.dataset.jsonAction);
  if (target.dataset.stringAction) runStrings(target.dataset.stringAction);
  if (target.dataset.regex) {
    $("#regexPattern").value = target.dataset.regex;
    $("#regexFlags").value = "i";
    runRegex();
  }
  if (target.dataset.sample) applySample(target.dataset.sample);
}

function setOutput(id, value) {
  document.getElementById(id).innerHTML = resultBlock(value);
}

async function runHash() {
  const input = $("#hashInput").value;
  const selected = $("#hashAlgo").value;
  try {
    if (selected.startsWith("HMAC")) {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode($("#hmacKey").value), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
      setOutput("hashOut", toHex(sig));
      return;
    }
    const digest = await crypto.subtle.digest(selected, new TextEncoder().encode(input));
    setOutput("hashOut", toHex(digest));
  } catch (error) {
    setOutput("hashOut", error.message);
  }
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function runBase64(action) {
  const input = $("#baseInput").value;
  try {
    const value =
      action === "b64e"
        ? btoa(unescape(encodeURIComponent(input)))
        : action === "b64d"
          ? decodeURIComponent(escape(atob(input)))
          : action === "urle"
            ? encodeURIComponent(input)
            : decodeURIComponent(input);
    setOutput("baseOut", value);
  } catch (error) {
    setOutput("baseOut", error.message);
  }
}

function runJwt() {
  try {
    const parts = $("#jwtInput").value.split(".");
    if (parts.length < 2) throw new Error("JWT 至少需要 Header.Payload.Signature 三段中的前两段");
    const decode = (part) => JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    setOutput("jwtOut", JSON.stringify({ header: decode(parts[0]), payload: decode(parts[1]), signature: parts[2] || "" }, null, 2));
  } catch (error) {
    setOutput("jwtOut", error.message);
  }
}

function runRegex() {
  try {
    const regex = new RegExp($("#regexPattern").value, $("#regexFlags").value);
    const text = $("#regexText").value;
    const matches = [...text.matchAll(regex)];
    const lines = matches.map((match, index) => `${index + 1}. ${match[0]} @ ${match.index}\n   groups: ${JSON.stringify(match.slice(1))}`);
    setOutput("regexOut", lines.join("\n") || "未匹配");
  } catch (error) {
    setOutput("regexOut", error.message);
  }
}

function runJson(action) {
  try {
    const raw = $("#jsonInput").value;
    const parsed = JSON.parse(raw);
    if (action === "format") setOutput("jsonOut", JSON.stringify(parsed, null, 2));
    if (action === "minify") setOutput("jsonOut", JSON.stringify(parsed));
    if (action === "escape") setOutput("jsonOut", JSON.stringify(JSON.stringify(parsed)));
    if (action === "codable") {
      const fields = Object.entries(parsed)
        .map(([key, value]) => `    let ${swiftName(key)}: ${swiftType(value)}`)
        .join("\n");
      setOutput("jsonOut", `struct Model: Codable {\n${fields}\n}`);
    }
  } catch (error) {
    setOutput("jsonOut", error.message);
  }
}

function swiftName(key) {
  return key.replace(/[-_ ]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[0-9]/, "_$&");
}

function swiftType(value) {
  if (Array.isArray(value)) return "[Any]";
  if (value === null) return "String?";
  if (typeof value === "number") return Number.isInteger(value) ? "Int" : "Double";
  if (typeof value === "boolean") return "Bool";
  if (typeof value === "object") return "[String: AnyCodable]";
  return "String";
}

function runStrings(action) {
  const text = $("#stringInput").value;
  const lines = text.split(/\r?\n/).filter(Boolean);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (action === "stats") setOutput("stringOut", `字符: ${text.length}\n行数: ${lines.length}\n单词: ${words.length}\nUTF-8 bytes: ${new Blob([text]).size}`);
  if (action === "unique") setOutput("stringOut", [...new Set(lines)].join("\n"));
  if (action === "sort") setOutput("stringOut", [...lines].sort((a, b) => a.localeCompare(b)).join("\n"));
  if (action === "camel") setOutput("stringOut", lines.map(toCamel).join("\n"));
  if (action === "snake") setOutput("stringOut", lines.map(toSnake).join("\n"));
}

function toCamel(value) {
  return value.toLowerCase().replace(/[-_\s]+([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toSnake(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1_$2").replace(/[-\s]+/g, "_").toLowerCase();
}

function parseNumber(value) {
  const clean = value.trim().replaceAll("_", "");
  if (/^0x/i.test(clean)) return parseInt(clean, 16);
  if (/^0b/i.test(clean)) return parseInt(clean.slice(2), 2);
  if (/^[0-9a-f]+$/i.test(clean) && /[a-f]/i.test(clean)) return parseInt(clean, 16);
  return Number(clean);
}

function runRadix() {
  const number = parseNumber($("#radixInput").value);
  if (!Number.isFinite(number)) return setOutput("radixOut", "无法识别的数字");
  setOutput(
    "radixOut",
    `十进制: ${number}\n十六进制: 0x${number.toString(16).toUpperCase()}\n二进制: 0b${number.toString(2)}\nUInt8: ${number >= 0 && number <= 255 ? "可用" : "超出范围"}\nSwift: let value = ${number}`
  );
}

function runColor() {
  const input = $("#colorInput").value.trim();
  const hex = input.startsWith("#") ? input.slice(1) : input;
  if (![6, 8].includes(hex.length) || !/^[\da-f]+$/i.test(hex)) return setOutput("colorOut", "请输入 #RRGGBB 或 #RRGGBBAA");
  const values = [0, 2, 4, 6].map((i) => (hex.slice(i, i + 2) ? parseInt(hex.slice(i, i + 2), 16) : 255));
  const [r, g, b, a] = values;
  setOutput(
    "colorOut",
    `HEX: #${hex.toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nUIColor: UIColor(red: ${(r / 255).toFixed(3)}, green: ${(g / 255).toFixed(3)}, blue: ${(b / 255).toFixed(3)}, alpha: ${(a / 255).toFixed(3)})\nSwiftUI: Color(red: ${(r / 255).toFixed(3)}, green: ${(g / 255).toFixed(3)}, blue: ${(b / 255).toFixed(3)}, opacity: ${(a / 255).toFixed(3)})`
  );
}

function runDate() {
  const raw = $("#dateInput").value.trim();
  let date = /^\d+$/.test(raw) ? new Date(raw.length === 10 ? Number(raw) * 1000 : Number(raw)) : new Date(raw);
  if (Number.isNaN(date.getTime())) return setOutput("dateOut", "无法解析时间");
  setOutput(
    "dateOut",
    `本地时间: ${date.toLocaleString()}\nISO8601: ${date.toISOString()}\n秒: ${Math.floor(date.getTime() / 1000)}\n毫秒: ${date.getTime()}\nSwift:\nlet date = Date(timeIntervalSince1970: ${Math.floor(date.getTime() / 1000)})`
  );
}

function applySample(type) {
  if (type === "hash") $("#hashInput").value = "com.example.app:1700000000";
  if (type === "jwt") $("#jwtInput").value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAxIiwibmFtZSI6ImlPUyBEZXYiLCJpYXQiOjE3MDAwMDAwMDB9.signature";
  if (type === "radix") $("#radixInput").value = "0x007AFF";
  if (type === "color") $("#colorInput").value = "#007AFF";
  if (type === "date") $("#dateInput").value = String(Date.now());
  if (type === "hash") runHash();
  if (type === "jwt") runJwt();
  if (type === "radix") runRadix();
  if (type === "color") runColor();
  if (type === "date") runDate();
}

document.addEventListener("click", (event) => {
  const categoryEl = event.target.closest("[data-category]");
  if (categoryEl) {
    activeCategory = categoryEl.dataset.category;
    const tools = visibleTools();
    activeTool = tools[0]?.id || getCategory(activeCategory).tools[0].id;
    render();
    return;
  }

  const toolEl = event.target.closest("[data-tool]");
  if (!toolEl) return;
  activeTool = toolEl.dataset.tool;
  activeCategory = getToolCategory(activeTool)?.name || activeCategory;
  render();
});

document.addEventListener("keydown", (event) => {
  const card = event.target.closest(".tool-card");
  if (card && (event.key === "Enter" || event.key === " ")) {
    activeTool = card.dataset.tool;
    activeCategory = getToolCategory(activeTool)?.name || activeCategory;
    render();
  }
});

$("#toolSearch").addEventListener("input", (event) => {
  filter = event.target.value;
  const tools = visibleTools();
  if (tools.length && !tools.some((tool) => tool.id === activeTool)) activeTool = tools[0].id;
  render();
});

$("#toggleSidebar").addEventListener("click", () => {
  $("#sidebar").classList.toggle("hidden");
  document.querySelector(".shell").style.gridTemplateColumns = $("#sidebar").classList.contains("hidden") ? "1fr" : "";
});

$("#themeToggle").addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");
render();
