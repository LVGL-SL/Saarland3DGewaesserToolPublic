<template>
  <div>
      
      <form class="WaterBodycontrolbox">
          Aktuelle Überhöhe von: <br>
          <input
              class="WaterBodyLatLongInput input-with-unit "
              type="number"
              :value="waterlevel"
              :title="`Überhöhe: ${waterlevel > 0 ? '+' : ''}${waterlevel}m`"
              @wheel="handleOverheightWheel($event.target.value, step, $event, updateWaterLevel)"
              @keydown="handleOverheightKeydown($event.target.value, step, $event, updateWaterLevel)"
              @blur="updateWaterLevel($event.target.value)"
          />
      </form>
      <div v-if="currentWaterLevelStations" class="waterLevelStationBoxlist">
          <form v-for="(station, index) in currentWaterLevelStations" class="waterLevelStationBox">
            <h3 title="waterLevelStationTitel">{{ station.name }}</h3>
            <div title="infobox">
                <p> Aktueller Wasserstand: 
                  <input type="number"
                    :class="`input-with-unit`" 
                    :value="Number(waterLevelStationsWaterLevel[index]).toFixed(2)"
                    :title="`Wasserstand: ${Number(waterLevelStationsWaterLevel[index]).toFixed(2)}m`"
                    @wheel="handleWaterLevelStationWheel(station, $event.target.value, step, $event, setHeightFromWaterLevelStation)"
                    @keydown="handleWaterLevelStationKeyDown(station, $event.target.value, step, $event, setHeightFromWaterLevelStation)"
                    @blur="setHeightFromWaterLevelStation(station, $event.target.value)"
                  > </p>
                <br>
              <p>
                Status: 
                <span :class="`status ${getWrantring(waterLevelStationsWarnIndex[index])}`"></span> 
                {{ translateWarnring(getWrantring(waterLevelStationsWarnIndex[index])) }}
              </p>
            </div>
            <div class="stationWarnlsit">
              <div>
              <span :class="`status ${getWrantring(-1)}`"></span>
              Normal Null : 
              <button type="button" title="Grenzwert für Warnstufe" @click="setOverheightto(station,-1)"> 0m</button>
              </div>
              <div v-for="(warn, warnIndex) in station.warn">
                <span :class="`status ${getWrantring(warnIndex)}`"></span>
                Warnstufe {{ warnIndex + 1 }} : 
                <button type="button" title="Grenzwert für Warnstufe" @click="setOverheightto(station,warnIndex)">{{ warn }}m</button>
              </div>
              <div v-if="station.warn?.length === 0">
                 Es ligen keine Wartnstufen vor
              </div>
            </div>
          </form>
          <div v-if="currentWaterLevelStations.length === 0">
                <p class="info">
                Im ausgewählten Bereich sind leider keine Daten zur Angabe des Flusstyps bekannt. Bitte beachten Sie, dass die Überhöhe keine Relation zur echten Höhe allein hat. <br> 
                Um Daten mit Referenzwerten zu erhalten, wählen Sie bitte eine Stelle, an der Pegelmessstationen <span class="iconWaterLevelStation"></span>, bzw. Normalnull-Daten, verfügbar sind.
                </p>
            </div>
      </div>
      <div class="clearWaterBodiesBox">
        <button type="button" @click="clearWaterBodies()">zurück zu Bearbeiten</button>
      </div>
  </div>
</template>
    
     
<style scoped src="./WaterBodyControl.css"></style>
<script>
import i18nWaterBodyControl from "../../../i18n-Language/WaterBodyTool/WaterBodyControl.js"

export default {
  props: {
    state: {
      type: Object, 
      required: true
    }
  },
  data() {
    return {
      step: 0.1, // ca. 10 cm
      strgmultipyer:10,
      altdmultipyer:0.1,
    }
  },
  
  mounted() {
    },
    computed:{
      protectedloadet(){
        if(this.state.WaterBodyToolManager){
          return this.state.WaterBodyToolManager.protectedloadet
        }
        return 0
      },
      waterlevel(){
        if(this.state.WaterBodyToolManager){
          return this.state.WaterBodyToolManager.waterlevel
        }
        return 0
      },
      currentWaterLevelStations() {
  if (this.state.WaterBodyToolManager) {
    return this.state.WaterBodyToolManager.currentWaterLevelStations;
  }
  return [];
},
waterLevelStationsWaterLevel() {
  if (this.state.WaterBodyToolManager) {
    return this.state.WaterBodyToolManager.waterLevelStationsWaterLevel;
  }
  return [];
},
waterLevelStationsWarnIndex() {
  if (this.state.WaterBodyToolManager) {
    return this.state.WaterBodyToolManager.waterLevelStationsWarnIndex;
  }
  return [];
},
    },
   


    methods:{
      getWrantring(id) {
        switch (id) {
          case -1:
        return 'okay';
          case 0:
        return 'light';
          case 1:
        return 'medium';
          case 2:
        return 'big';
          case 3:
        return 'extreme';
          default:
        return 'nodata';
        }
      },
      setOverheightto(station,warnIndex){this.state.setOverheightto(station,warnIndex)},
      clearWaterBodies(){this.state.clearWaterBodies()},

      updateWaterLevel(value) {this.state.updateWaterLevel(value);},
      handleOverheightKeydown(value, stepSize, event, updatefunktion) {
          if (event.target !== document.activeElement) return;
          if (event.ctrlKey) stepSize *= this.strgmultipyer;
          if (event.altKey) stepSize *= this.altdmultipyer;

          const numValue = parseFloat(value);

          if (event.key === "ArrowUp") {
              updatefunktion(numValue + stepSize);
              event.preventDefault();
          } else if (event.key === "ArrowDown") {
              updatefunktion(numValue - stepSize);
              event.preventDefault();
          } else if (event.key === "Enter") {
              updatefunktion(numValue);
              event.preventDefault();
          } else if (event.ctrlKey || event.altKey) {
              event.preventDefault();
          }
      },
      handleOverheightWheel(value, stepSize, event, updatefunktion) {
          if (event.target !== document.activeElement) return;
          if (event.ctrlKey) stepSize *= this.strgmultipyer;
          if (event.altKey) stepSize *= this.altdmultipyer;
          updatefunktion(value - (stepSize * event.deltaY/1000));
          event.preventDefault();
      },

      setHeightFromWaterLevelStation(station,hieght){this.state.setHeightFromWaterLevelStation(station,hieght)},
      handleWaterLevelStationKeyDown(station,value, stepSize, event, updatefunktion) {
          if (event.target !== document.activeElement) return;
          if (event.ctrlKey) stepSize *= this.strgmultipyer;
          if (event.altKey) stepSize *= this.altdmultipyer;

          const numValue = parseFloat(value);

          if (event.key === "ArrowUp") {
              updatefunktion(station,numValue + stepSize);
              event.preventDefault();
          } else if (event.key === "ArrowDown") {
              updatefunktion(numValue - stepSize);
              event.preventDefault();
          } else if (event.key === "Enter") {
              updatefunktion(station,numValue);
              event.preventDefault();
          } else if (event.ctrlKey || event.altKey) {
              event.preventDefault();
          }
      },
      handleWaterLevelStationWheel(station, value, stepSize, event, updatefunktion) {
          if (event.target !== document.activeElement) return;
          if (event.ctrlKey) stepSize *= this.strgmultipyer;
          if (event.altKey) stepSize *= this.altdmultipyer;
          updatefunktion(station, value - (stepSize * event.deltaY/1000));
          event.preventDefault();
      },
      
      translateWarnring(key) {
      const lang = (this.state?.lang || 'de');
      return i18nWaterBodyControl.messages[lang][key] || key;
    },
    }
}
</script>