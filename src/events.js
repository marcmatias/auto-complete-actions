/**
 * `EventListener` makes it easier to handle events inside elements of a
 * container - only the main container is used to handle all children's events
 * so memory is saved.
 */
export class EventListener {

    constructor(selectorOrElement) {
        let self = this;
        this.container = (
          typeof(selectorOrElement) === "string" ?
          document.querySelector(selectorOrElement) :
          selectorOrElement
        );
        this._listeners = {};
        this._callback = async function(event) {
            await self._handle(event);
        };
    }

    detach(eventType, selector) {
        delete this._listeners[eventType][selector];
        if (Object.keys(this._listeners[eventType]).length == 0) {
            // No more attached events of this type, so remove listener
            this.container.removeEventListener(eventType, this._callback);
        }
    }

    detachAll() {
        for (let eventType of Object.keys(this._listeners)) {
            for (let [selector, callbacks] of Object.entries(this._listeners[eventType])) {
                for (let callback of callbacks) {
                    this.container.removeEventListener(eventType, this._callback);
                }
            }
        }
        this._listeners = {};
    }

    attach(eventType, selector, callback) {
        if (this._listeners[eventType] === undefined) {
            // First time seeing this event on this container, so attach
            // listener.
            this._listeners[eventType] = {};
            this.container.addEventListener(eventType, this._callback);
        }
        if (this._listeners[eventType][selector] === undefined) {
            this._listeners[eventType][selector] = [];
        }
        this._listeners[eventType][selector].push(callback);
    }

    async _handle(event) {
        let target = event.target, eventType = event.type;

        for (let [selector, callbacks] of Object.entries(this._listeners[eventType])) {
            let closest = target.closest(selector);
            if (closest && closest.disabled !== true) {
                for (let callback of callbacks) {
                    await Promise.resolve(callback(event, closest));
                }
            }
        }
    }
}
