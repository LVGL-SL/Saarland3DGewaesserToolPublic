//!!!OLD VCS - Import constance
const EVENT_TYPE_TYPE = vcs.vcm.interaction.EventType
const MODIFICATION_KEY_TYPE = vcs.vcm.interaction.ModificationKeyType;
const VcsEvent = vcs.vcm.event.VcsEvent
const AbstractInteraction = vcs.vcm.interaction.AbstractInteraction



export default class InteractionLissner extends AbstractInteraction {
    private _removeEventListener: () => void = () => { };
    private event:()=>void
    private _timer: NodeJS.Timeout|undefined
    constructor(
        eventHandler: vcs.vcm.interaction.EventHandler,
        event:()=>void
    ) {
        super();
        this._defaultActive = EVENT_TYPE_TYPE.ALL;
        this._defaultModificationKey = MODIFICATION_KEY_TYPE.ALL;
        // First element of the chain that contains all event content 
        this._removeEventListener = eventHandler.addPersistentInteraction(this, 3);
        // finally set listener to Active
        this.event = event;
        this.setActive();
    }

    async pipe(event: vcs.vcm.interaction.Event) {
        // Cancel any existing timer if drag starts
        if (event.type === 256/*DRAGSTART*/) {
            if (this._timer) {
            clearTimeout(this._timer);
            this._timer = undefined;
            }
        }

        // Start timer on drag end
        if (event.type === 512/*DRAGEND*/) {
            if (this._timer) {
            clearTimeout(this._timer);
            }
            this._timer = setTimeout(() => {
            this.event();
            this._timer = undefined;
            }, 500);
        }
        
        event.stopPropagation = false
        return event;
    }

    destroy(): void {
        this.event=()=>{}
        super.destroy()
        this._removeEventListener();
        
    }

}
