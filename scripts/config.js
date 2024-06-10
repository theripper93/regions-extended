import {initControlsLayer} from "./ControlButton.js";
import { RegionEventsHandler } from "./RegionEventsHandler.js";
import { MODULE_ID, REGION_EXTENDED_EVENTS } from "./main.js";

const DEFAULT_FLAGS = {
    events: [],
};

export function initConfig() {
    Hooks.on("renderRegionBehaviorConfig", async (app, html, data) => {

        const selected = [];
        for (const k of Object.keys(REGION_EXTENDED_EVENTS)) {
            selected.push({
                label: REGION_EXTENDED_EVENTS[k],
                value: k,
                selected: app.document.flags[MODULE_ID]?.events?.includes(k) ?? false,
            });
        }

        const template = await renderTemplate("modules/regions-extended/templates/behaviour-config.hbs", {
            flags: foundry.utils.mergeObject(foundry.utils.deepClone(DEFAULT_FLAGS), app.document.flags[MODULE_ID] ?? {}),
            REGION_EXTENDED_EVENTS,
            multiSelect: selected,
        });

        html.querySelector(`[name="disabled"]`).closest("fieldset").insertAdjacentHTML("beforebegin", template);
    });

    libWrapper.register(MODULE_ID, "TokenLayer.prototype._onClickLeft", RegionEventsHandler._onClickLeft, "MIXED");

    libWrapper.register(MODULE_ID, "TokenLayer.prototype._onClickLeft2", RegionEventsHandler._onClickLeft2, "MIXED");

    libWrapper.register(MODULE_ID, "TokenLayer.prototype._onClickRight", RegionEventsHandler._onClickRight, "MIXED");

    libWrapper.register(MODULE_ID, "RegionBehavior.prototype._handleRegionEvent", RegionEventsHandler._handleRegionEvent, "MIXED");

    initControlsLayer();
}