import {Socket} from "./lib/socket";
import { MODULE_ID } from "./main";

export function initControlsLayer() {
    ControlsLayer.prototype.drawRegionsExtendedControls = function () {
        {
            // Create the container
            if (this.regionsExtendedControls) this.regionsExtendedControls.destroy({ children: true });
            this.regionsExtendedControls = this.addChild(new PIXI.Container());

            // Iterate over all walls, selecting the doors
            for (let r of canvas.regions.placeables) {
                this.createRegionsExtendedControl(r);
            }

            // Toggle visibility for the set of door control icons
            //this.doors.visible = !canvas.walls._active;
        }
    };

    ControlsLayer.prototype.createRegionsExtendedControl = function (region) {
        const rec = this.regionsExtendedControls.addChild(new RegionControl(region));
        rec.visible = false;
        return rec.draw();
    };

    libWrapper.register(MODULE_ID, "ControlsLayer.prototype.draw", RegionControl.drawRegionsExtendedControl);
    libWrapper.register(MODULE_ID, "CanvasVisibility.prototype.restrictVisibility", RegionControl.restrictVisibility);
    libWrapper.register(MODULE_ID, "Region.prototype._onDelete", function _onDelete(wrapped, ...args) {
        this.regionsExtendedControl?.destroy();
        return wrapped(...args);
    });
}

export class RegionControl extends PIXI.Container {
    constructor(region) {
        super();
        this.region = region;
        this.region.regionsExtendedControl = this;
    }
    async draw() {
        // Control Icon
        this.icon = this.icon || this.addChild(new PIXI.Sprite());
        this.icon.width = this.icon.height = 40;
        this.icon.alpha = 0.6;
        this.icon.texture = await this._getTexture();

        // Add control interactivity
        this.eventMode = "static";
        this.interactiveChildren = false;
        this.hitArea = new PIXI.Rectangle(-2, -2, 44, 44);
        this.cursor = "pointer";

        // Set position
        this.reposition();
        this.alpha = 1.0;

        // Activate listeners
        this.removeAllListeners();
        this.on("mouseover", this._onMouseOver).on("mouseout", this._onMouseOut).on("mousedown", this._onMouseDown);

        this.visible = this.isVisible;

        // Return the control icon
        return this;
    }
    async _getTexture() {
        const tex = this.region.document.behaviors.find((b) => b.flags[MODULE_ID]?.events?.includes("button") && b.flags[MODULE_ID]?.img)?.flags[MODULE_ID]?.img ?? "icons/svg/d20-highlight.svg";
        await loadTexture(tex);
        return getTexture(tex);
    }
    reposition() {
        this.position.set(this.region.center.x - this.width / 2, this.region.center.y - this.height / 2);
    }
    get isVisible() {
        const l = this.region;
        if (!this.isRegionControl) return false;
        if (game.modules.get("levels")?.active) {
            if (!CONFIG.Levels.currentToken && game.user.isGM) return true;
            if (!CONFIG.Levels.currentToken) return false;
            if (!CONFIG.Levels.helpers.inRange(l.document, CONFIG.Levels.currentToken.losHeight)) return false;
        }
        const point = new PIXI.Point(l.center.x, l.center.y);
        return canvas.visibility.testVisibility(point, { tolerance: 2, object: this });
    }

    get isRegionControl() {
        return this.region.document.behaviors.some((b) => b.flags[MODULE_ID]?.events?.includes("button"));
    }

    _onMouseOver(event) {
        event.stopPropagation();
        const blockPaused = game.paused && !game.user.isGM;
        if (blockPaused) return false;
        this.icon.alpha = 1.0;
    }
    _onMouseOut(event) {
        event.stopPropagation();
        if (game.paused && !game.user.isGM) return false;
        this.icon.alpha = 0.6;
    }
    async _onMouseDown(event) {
        if (event.data.originalEvent.button !== 0) return;
        event.stopPropagation();
        const behaviors = this.region.document.behaviors.filter((b) => b.flags[MODULE_ID]?.events?.includes("button"));
        canvas.mouseInteractionManager.cancel(event)
        Socket.triggerRegionEvent({behaviors: behaviors.map((b) => {
            return {
                name: MODULE_ID + "." + "button",
                data: { 
                    regionsExtended: true,
                    regionsExtendedEventType: "button",
                    token: _token?.document?.uuid,
                },
                user: game.user.id,
                behavior: b.uuid,
            }
        })});
    }

    static drawRegionsExtendedControl(wrapped, ...args) {
        wrapped(...args);
        this.drawRegionsExtendedControls();
    }

    static restrictVisibility(wrapped, ...args) {
        for (let c of canvas.controls.regionsExtendedControls.children) {
            c.visible = c.isRegionControl && (!this.tokenVision || c.isVisible);
        }
        wrapped(...args);
    }
}
