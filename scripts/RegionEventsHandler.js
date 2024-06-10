import {MODULE_ID, REGION_EXTENDED_EVENTS} from "./main";
import {Socket} from "./lib/socket";

export class RegionEventsHandler {
    static _onClickLeft(wrapped, ...args) {
        if (RegionEventsHandler.handleRegionExtended(args[0], "clickleft")) return canvas.mouseInteractionManager.cancel(args[0]);
        return wrapped(...args);
    }

    static _onClickLeft2(wrapped, ...args) {
        if (RegionEventsHandler.handleRegionExtended(args[0], "doubleclickleft")) return canvas.mouseInteractionManager.cancel(args[0]);
        return wrapped(...args);
    }

    static _onClickRight(wrapped, ...args) {
        if (RegionEventsHandler.handleRegionExtended(args[0], "clickleft")) return canvas.mouseInteractionManager.cancel(args[0]);
        return wrapped(...args);
    }

    static handleRegionExtended(event, eventType) {
        const canvasCoords = event.interactionData.origin;
        const validRegions = canvas.regions.placeables.filter((r) => r.document.behaviors.some((b) => b.flags[MODULE_ID]?.events?.includes(eventType))).filter((r) => r.testPoint(canvasCoords, _token?.document?.elevation));
        if (!validRegions.length) return null;

        const behaviors = validRegions.map((r) => r.document.behaviors.filter((b) => b.flags[MODULE_ID]?.events?.includes(eventType))).flat();

        if (!behaviors.length) return null;

        const socketData = behaviors.map((b) => {
            return {
                name: MODULE_ID + "." + eventType,
                data: { 
                    regionsExtended: true,
                    regionsExtendedEventType: eventType,
                    token: _token?.document?.uuid,
                },
                user: game.user.id,
                behavior: b.uuid,
            }
        });

        Socket.triggerRegionEvent({behaviors: socketData});

        return true;
    }

    static _handleRegionEvent(wrapped, ...args) {
        const isExtendedEvent = args[0].name.startsWith(MODULE_ID);
        if (!isExtendedEvent) return wrapped(...args);

        args[0].name = CONST.REGION_EVENTS.TOKEN_ENTER;
        return this.system._handleRegionEvent(...args);
    }

    static _triggerRegionEvent(data) {
        const behaviors = data.behaviors;
        behaviors.forEach((bData) => {
            const b = fromUuidSync(bData.behavior);
            bData.data.token = fromUuidSync(bData.data.token);
            bData.data.behavior = b;
            b.region._handleEvent({
                name: bData.name,
                data: bData.data,
                region: b.region,
                user: game.users.get(bData.user),
            });
        });
    }
}
