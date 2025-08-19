//!!!OLD VCS - Import constance
const EVENT_TYPE_TYPE = vcs.vcm.interaction.EventType
const EVENT_TYPE_MAP = Object.entries(EVENT_TYPE_TYPE);

export function getReadableEventTypeName(type:number):string{
   return EVENT_TYPE_MAP.find(
            ([key, value]) => value === type
        )?.[0] || 'NONE';
}