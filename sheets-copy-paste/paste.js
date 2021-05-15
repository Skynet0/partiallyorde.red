(function () {
  "use strict";

  function init() {
    document.addEventListener("paste", renderPaste);
    let clipboard = new ClipboardJS("#copy-btn", {
      target: (_) => id("paste-container"),
    });

    clipboard.on("success", (e) => {
      e.clearSelection();
      displayMessage("Copied!");
    });
  }

  function renderPaste(e) {
    let target = id("paste-container");
    removeAllChildren(target);

    let html = e.clipboardData.getData("text/html");

    // Pre-dom batch replacements, that are easier to do as strings
    // rather than iterating and applying.

    // Pasting into sheets can't parse hex border colors for some reason
    // TODO: replace this with a hex -> rgb(r,g,b)
    html = html.replaceAll("#000000", "black");

    // Fine-grained DOM modifications
    let body = new DOMParser().parseFromString(html, "text/html").body;
    let sheetsBase = body.firstElementChild;

    if (sheetsBase.tagName !== "GOOGLE-SHEETS-HTML-ORIGIN") {
      target.insertAdjacentHTML("afterbegin", html);
      return;
    }

    // Delete the inline style
    if (sheetsBase.firstElementChild.tagName === "STYLE") {
      sheetsBase.firstElementChild.remove();
    }

    // Unset global borders
    let table = sheetsBase.getElementsByTagName("table")[0];
    table.removeAttribute("border");
    table.style.removeProperty("border");

    let tbody = table.getElementsByTagName("tbody")[0];

    // CHROME
    // Add a dummy row so that the last cell still has its styles
    tbody.insertRow(-1);

    // Iterate over
    let tds = tbody.getElementsByTagName("td");
    for (let i = 0; i < tds.length; i++) {
      let td = tds[i];

      // If a cell consists of solely whitespace, then it loses styling
      if (td.colSpan > 1 && td.textContent.trim().length === 0) {
        // FIREFOX: set data-sheets-value attribute
        if (!td.hasAttribute("data-sheets-value")) {
          td.setAttribute(
            "data-sheets-value",
            JSON.stringify({
              1: 2,
              2: " ",
            })
          );
        }
        // CHROME: use a ' to indicate literally empty
        td.textContent = "'" + td.textContent;
      }
    }

    target.appendChild(document.createComment("StartFragment"));

    let meta = gen("meta");
    meta.name = "generator";
    meta.content = "Sheets";

    // TODO: try out an iframe for generating the content?
    // It would help with style independence.

    target.appendChild(meta);
    target.appendChild(sheetsBase);
  }

  function removeAllChildren(elem) {
    while (elem.lastChild) {
      elem.removeChild(elem.lastChild);
    }
  }

  function displayMessage(message) {
    id("clip-msg").textContent = message;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns a new element with the given tagname
   * @param {string} tagname - name of element to create and return
   * @returns {object} new DOM element with the given tagname
   */
  function gen(tagname) {
    return document.createElement(tagname);
  }

  init();
})();
