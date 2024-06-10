import {initConfig} from "./config.js";
import {RegionEventsHandler} from "./RegionEventsHandler.js";
import {registerSettings} from "./settings.js";
import {Socket} from "./lib/socket.js";

export const MODULE_ID = "regions-extended";

export const REGION_EXTENDED_EVENTS = {
    "clickleft": `${MODULE_ID}.events.clickleft`,
    "clickright": `${MODULE_ID}.events.clickright`,
    "doubleclickleft": `${MODULE_ID}.events.doubleclickleft`,
    "button": `${MODULE_ID}.events.button`,
}

Hooks.on("init", () => {
    initConfig();
    registerSettings();
    Socket.register("triggerRegionEvent", RegionEventsHandler._triggerRegionEvent);
});