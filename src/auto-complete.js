import nunjucks from "nunjucks";

import { EventListener } from "./events.js";

function jsonToBase64(data) {
    return btoa(JSON.stringify(data));
}
function base64ToJson(text) {
    return JSON.parse(atob(text));
}

export class AutoComplete {
    constructor(selector, {search = undefined, renderItem = undefined, onSelect = undefined, autoFocus = true, minLength = 3, delay = 500} = {}) {
        let self = this;
        this._timeout = undefined;
        this._controlKeys = ["Escape", "ArrowDown", "ArrowUp", "Enter"];
        this._options = { search, renderItem, onSelect, autoFocus, minLength, delay };
        this._options.renderItem = this._options.renderItem || this.renderItem;
        this._template = this.getTemplate();
        this._container = (
            typeof(selector) === "string" ?
            document.querySelector(selector) :
            selector
        );
        this._inputContainer = this._container.querySelector("input[type=search]");
        this._inputContainer.autocomplete = "off";
        this._inputEvents = new EventListener(this._container);
        this._attachInputEventListeners();
        if (this._options.autoFocus) {
            this._inputContainer.focus();
        }

        this._init();
    }

    _init() {
        // Showing clear field button any browser

    }

    conditionallyHideClearIcon(e) {
        const input = this._inputContainer;

        const target = (e && e.target) || input;
        target.parentElement.querySelector("[data-clear-input]").style.display = target.value ? 'inline' : 'none';
    }

    _attachInputEventListeners() {
        let self = this;

        this._inputEvents.attach(
            "click",
            "[data-clear-input]",
            async function(event) {
                self._inputContainer.value = '';
                self.conditionallyHideClearIcon();
            }
        );
        this._inputEvents.attach(
            "input",
            "input[type=search]",
            async function(event) {
                self.conditionallyHideClearIcon(event);
            }
        );
        this._inputEvents.attach(
            "keydown",
            "input[type=search]",
            async function(event) {
                await self.onKeyDown(event);
            }
        );
        this._inputEvents.attach(
            "keyup",
            "input[type=search]",
            async function(event) {
                await self.onKeyUp(event);
            }
        );
        this._inputEvents.attach(
            "click",
            "span[type=submit]",
            async function (event, closest) {
                event.preventDefault();
                event.stopPropagation();
                if (self._resultContainer) {
                    const select = self._resultContainer.querySelector("li");
                    if (select) {
                        await self.onSelect(event, select);
                    }
                }
                else {
                    await self.search();
                }
            }
        );
        this._inputEvents.attach(
            "submit",
            "form",
            async function (event, closest) {
                event.preventDefault();
                event.stopPropagation();
                if (self._resultContainer) {
                    const select = self._resultContainer.querySelector("li");
                    if (select) {
                        await self.onSelect(event, select);
                    }
                }
                else {
                    await self.search();
                }
            }
        );
    }

    _attachResultEventListeners() {
        let self = this;

        window.addEventListener("click", function (event) {
            self.close(false);
        });
        this._resultEvents.attach(
            "click",
            "ul > li.autocomplete-item-none",
            async function (event, closest) {
                self.close();
            }
        );
        this._resultEvents.attach(
            "mouseover",
            "ul > li.autocomplete-item",
            async function (event, closest) {
                let selected = self._resultContainer.querySelector("li.selected");
                if (selected) {
                    selected.classList.remove("selected");
                }
                closest.classList.add("selected");
            }
        );
        this._resultEvents.attach(
            "click",
            "ul > li.autocomplete-item",
            async function (event, closest) {
                await self.onSelect(event, closest);
            }
        );
    }

    async onSelect(event, closest) {
        let item = (
            closest.classList.contains("autocomplete-item-none") ?
            null :
            base64ToJson(closest.dataset.item)
        );
        try {
            await this._options.onSelect(item);
        }
        catch (error) {
            // do nothing
        }
        this.close();
    }

    async onKeyDown(event) {
        let self = this,
            target = event.target,
            key = event.key;
        if (!self._controlKeys.includes(key)) {
            return;
        }

        event.preventDefault();
        if (key == "Escape") {
            self.close(false);
        }
        else if ((key == "ArrowDown" || key == "ArrowUp") && this._resultContainer) {
            let selected = this._resultContainer.querySelector("li.selected"),
                nextSelected;

            if (!selected) {
                if (key == "ArrowDown") {
                    nextSelected = this._resultContainer.querySelector("li");
                }
                else {
                    nextSelected = this._resultContainer.querySelectorAll("li:last-child")[0];
                }
            }
            else {
                nextSelected = (
                    key == "ArrowDown" ?
                    selected.nextElementSibling :
                    selected.previousElementSibling
                );
                selected.classList.remove("selected");
            }
            if (nextSelected) {
                nextSelected.classList.add("selected");
            }
        }
        else if (key == "Enter") {
            const self = this,
                  resContainer = this._resultContainer;
            if (resContainer) {
                let select = resContainer.querySelector("li.selected") || resContainer.querySelector("li");
                if (select) {
                    await self.onSelect(event, select);
                }
            }
        }
    }

    async onKeyUp(event) {
        let self = this,
            target = event.target,
            key = event.key;

        if (self._controlKeys.includes(key)) {
            event.preventDefault();
            return;
        }
        else if (
          target.tagName != "INPUT"
          || target.value.length < this._options.minLength
        ) {
            this.close(false);
            return;
        }

        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(
            async function() { await self.search(); },
            this._options.delay,
        );
    }

    _createResultElement(html, inputContainer) {
        let div = document.createElement("div");
        div.classList = "autocomplete-container";
        div.style.top = inputContainer.offsetTop + inputContainer.offsetHeight;
        div.style.left = inputContainer.offsetLeft + inputContainer.offsetWidth;
        div.innerHTML = html;
        return div;
    }

    getTemplate() {
        let template = `
          <ul class="autocomplete-result">
          {% for item in results %}
          <li class="autocomplete-item" data-item="{{ item|jsonToBase64 }}">
            {{ item|renderItem|safe }}
          </li>
          {% else %}
          <li class="autocomplete-item autocomplete-item-none"> Nenhum resultado encontrado </li>
          {% endfor %}
          </ul>
        `;
        let env = new nunjucks.Environment();
        env.addFilter("renderItem", this._options.renderItem, false);
        env.addFilter("jsonToBase64", jsonToBase64, false);
        return nunjucks.compile(template, env);
    }

    renderItem(item) {
        return item.label;
    }

    async search() {
        let inputContainer = this._inputContainer,
            results = await this._options.search(inputContainer.value),
            html = this._template.render({ results });

        if (this._resultContainer) {
            this._resultContainer.innerHTML = html;
        }
        else {
            let div = this._createResultElement(html, inputContainer);
            this._container.appendChild(div);
            this._resultContainer = div;
            this._resultEvents = new EventListener(div.parentElement);
            this._attachResultEventListeners();
        }
    }

    close(clear=true) {
        if (this._resultContainer) {
            this._resultContainer.remove();
            this._resultEvents.detachAll();
            this._resultContainer = undefined;
            this._resultEvents = undefined;
        }
        if (clear) {
            this._inputContainer.value = "";
            this.conditionallyHideClearIcon();
        }
    }
}
