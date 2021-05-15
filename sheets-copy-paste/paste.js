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

    // Pasting into sheets can't parse this hex border color for some reason
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

    // Add a dummy row so that the last cell still has its styles
    table.getElementsByTagName("tbody")[0].appendChild(gen("tr"));

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
