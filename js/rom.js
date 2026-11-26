/* ============================================================
   ROM 解析：认格式 → 读 GBA 卡带头 → 从 zip 里抽 .gba
   ============================================================ */

(function () {
  "use strict";

  var GBA_EXT = /\.(gba|agb|bin)$/i;
  var MAX_SIZE = 64 * 1024 * 1024; // GBA 卡带最大 32MB，放宽到 64MB 容错

  function hex(bytes, n) {
    var out = [];
    for (var i = 0; i < Math.min(n, bytes.length); i++) {
      out.push(bytes[i].toString(16).padStart(2, "0").toUpperCase());
    }
    return out.join(" ");
  }

  function ascii(bytes, from, to) {
    var s = "";
    for (var i = from; i < to && i < bytes.length; i++) {
      s += bytes[i] >= 32 && bytes[i] < 127 ? String.fromCharCode(bytes[i]) : "";
    }
    return s;
  }

  /**
   * 看文件头判断它到底是什么。
   * 返回 { kind, reason?, header? }
   */
  function sniff(buffer) {
    var bytes = new Uint8Array(buffer);

    if (!bytes.length) return { kind: "empty", reason: "文件是空的（0 字节）" };

    // 压缩包（下载到的 ROM 经常是压缩包直接改后缀）
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
      return { kind: "zip", reason: "这其实是一个 ZIP 压缩包（文件头 50 4B）" };
    }
    if (bytes[0] === 0x37 && bytes[1] === 0x7a && bytes[2] === 0xbc && bytes[3] === 0xaf) {
      return { kind: "7z", reason: "这其实是一个 7z 压缩包（文件头 37 7A BC AF）" };
    }
    if (bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21) {
      return { kind: "rar", reason: "这其实是一个 RAR 压缩包（文件头 52 61 72 21）" };
    }
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      return { kind: "gzip", reason: "这其实是一个 gzip 压缩包（文件头 1F 8B）" };
    }

    // 网页 / 文本（下载被拦截、存成了登录页之类）
    var head = ascii(bytes, 0, 64).trim().toLowerCase();
    if (/^<(!doctype|html|head|body|\?xml)/.test(head) || head.indexOf("{") === 0) {
      return { kind: "text", reason: "这看起来是网页 / 文本文件，不是卡带（可能是下载失败或被拦截）" };
    }

    // 标准 GBA：0xB2 固定为 0x96
    if (bytes.length >= 0xc0 && bytes[0xb2] === 0x96) {
      return { kind: "gba", header: readHeader(bytes) };
    }

    // 非标准但仍可能是 GBA：入口是 ARM 跳转指令（0xEAxxxxxx），体积合理
    if (bytes.length >= 0xc0 && bytes[3] === 0xea && bytes.length <= MAX_SIZE) {
      var h = readHeader(bytes);
      h.magic = false;
      return {
        kind: "gba-suspect",
        header: h,
        reason: "卡带头里缺少 0x96 标记（可能是裁剪版 / 改版 ROM）"
      };
    }

    return {
      kind: "unknown",
      reason: "认不出这个格式（文件头 " + hex(bytes, 4) + "，大小 " + formatSize(bytes.length) + "）"
    };
  }

  function readHeader(bytes) {
    var title = "";
    for (var i = 0xa0; i < 0xac; i++) {
      var c = bytes[i];
      title += c >= 32 && c < 127 ? String.fromCharCode(c) : "";
    }
    var code = ascii(bytes, 0xac, 0xb0);
    return {
      valid: true,
      magic: bytes[0xb2] === 0x96,
      title: title.replace(/\s+/g, " ").trim(),
      code: /^[A-Z0-9]{4}$/.test(code) ? code : "",
      size: bytes.length
    };
  }

  /** 兼容旧接口：只要卡带头 */
  function parseHeader(buffer) {
    var info = sniff(buffer);
    return info.header || null;
  }

  /** 找一个像样的名字：优先文件名，其次卡带头。 */
  function prettyName(header, filename) {
    var base = String(filename || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[_]+/g, " ")
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    var looksUseful = base.length >= 2 && !/^[\d\s-]+$/.test(base);
    if (looksUseful) return base;
    if (header && header.title) return header.title;
    return base || "未命名卡带";
  }

  function isGbaFile(file) {
    return GBA_EXT.test(file.name) || /\.zip$/i.test(file.name);
  }

  /** 从 zip 里挑出 GBA 卡带 */
  function unzipRom(buffer) {
    var fflate = window.fflate;
    if (!fflate) throw new Error("缺少解压模块");

    var files;
    try {
      files = fflate.unzipSync(new Uint8Array(buffer), {
        filter: function (file) { return GBA_EXT.test(file.name); }
      });
    } catch (err) {
      throw new Error("ZIP 解压失败：" + (err && err.message ? err.message : "文件可能已损坏"));
    }

    var names = Object.keys(files);
    if (!names.length) throw new Error("压缩包里没有 .gba / .agb / .bin 文件");

    // 多个候选取最大的那个（通常就是正片）
    names.sort(function (a, b) { return files[b].length - files[a].length; });
    var best = names[0];
    return { name: best.split("/").pop(), data: files[best].buffer };
  }

  function readAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error("读取文件失败")); };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 把用户选的文件变成 { name, buffer, header, warning } 列表。
   * 返回 { roms: [...], errors: [...] }
   */
  async function ingestFiles(fileList) {
    var roms = [];
    var errors = [];

    for (var i = 0; i < fileList.length; i++) {
      var file = fileList[i];
      try {
        if (!isGbaFile(file)) {
          errors.push(file.name + "：不是 .gba / .agb / .bin / .zip 文件");
          continue;
        }

        var buffer = await readAsArrayBuffer(file);
        var name = file.name;
        var info = sniff(buffer);

        // 后缀是 .gba 但其实是压缩包 —— 直接帮它解开
        if (info.kind === "zip") {
          var unzipped = unzipRom(buffer);
          buffer = unzipped.data;
          name = unzipped.name;
          info = sniff(buffer);
        }

        if (info.kind === "7z" || info.kind === "rar" || info.kind === "gzip") {
          errors.push(name + "：" + info.reason + "，请先解压出 .gba 再导入");
          continue;
        }
        if (info.kind === "text" || info.kind === "empty") {
          errors.push(name + "：" + info.reason);
          continue;
        }
        if (info.kind === "unknown") {
          errors.push(name + "：" + info.reason);
          continue;
        }

        var header = info.header;
        header.size = buffer.byteLength;

        roms.push({
          name: prettyName(header, name),
          filename: name,
          buffer: buffer,
          header: header,
          warning: info.kind === "gba-suspect" ? "卡带头异常，已按普通卡带导入（" + info.reason + "）" : ""
        });
      } catch (err) {
        errors.push(file.name + "：" + (err && err.message ? err.message : "导入失败"));
      }
    }

    return { roms: roms, errors: errors };
  }

  function formatSize(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1) + " MB";
  }

  window.ROM = {
    GBA_EXT: GBA_EXT,
    sniff: sniff,
    parseHeader: parseHeader,
    ingestFiles: ingestFiles,
    formatSize: formatSize
  };
})();
