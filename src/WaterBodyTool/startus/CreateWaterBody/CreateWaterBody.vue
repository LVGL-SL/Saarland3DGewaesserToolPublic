<template>
  <div>

    <div class="WaterBodyToolbar">

      <div class="WaterBodyTabMenu">
        <span v-for="(item, index) in nodePath" 
          @click="selectedWaterPath(index)"
          :class="`WaterBodyTab ${index === selecteNodePath ? 'selected' : ''}`"
        >
          {{ index }}
        </span>
      </div>

      <form class="WaterBodyToolbarButtonBox">
          <button type="button" class="buttonelemt" @click="addNodepath"><i class="fa fa-plus" ></i></button>
         <div class="buttonelemt" @click="triggerFileInput">
            <label>
              <input
                type="file"
                ref="fileInput"
                @change="loadNodepath($event)"
                style="display:none;"
              />
              <i class="buttonelemtfill fa fa-upload"></i>
            </label>
          </div>
          
          <button type="button" class="buttonelemt" @click="saveNodepath"><i class="fa fa-floppy-o" ></i></button>
          <button type="button" class="buttonelemt" @click="removeNodepath(selecteNodePath)"> <i class="fa fa-trash" ></i></button>
      </form>

    </div>

    <div class="WaterBodyNodeList">
      <div v-if="currentPath" class="WaterBodyNodeOrderList">
        <form v-for="(node, index) in currentPath" 
        @mouseenter="menuhover(node)" 
        @mouseleave="menuunhover(node)"
        :class="`WaterBodyNodeContainer WaterBodyNodeListElement`"
        >
          <div>
                <button @click="moveUp(node)"
                :class="`WaterBodyMoveButton`"
                >
                  <i class="fa fa-angle-up"></i>
                </button>
                <button @click="moveDown(node)"
                :class="`WaterBodyMoveButton`"
                >
                  <i class="fa fa-angle-down"></i>
                </button>
          </div>
          <div class="WaterBodyCoordinatesContainer">
            <input
              class="WaterBodyLatLongInput"
              type="number"
              :value="node.lat"
              :title="`Breitengrad: ${node.lat}°`"
              @wheel="handleLatWheel(node, $event.target.value, latstep, $event, updateNodeLat)"
              @keydown="handleLatKeydown(node, $event.target.value, latstep, $event, updateNodeLat)"
              @blur="updateNodeLat(node, $event.target.value)"
            />
            <input
              class="WaterBodyLatLongInput"
              type="number"
              :value="node.long"
              :title="`Längengrad: ${node.long}°`"
              
              @wheel="handleLatWheel(node, node.long, latstep, $event, updateNodeLong)"
              @keydown="handleLatKeydown(node, node.long, latstep, $event, updateNodeLong)"
              @blur="updateNodeLong(node, $event.target.value)"
            />
          </div>
          <div class="WaterBodyActionButtonGroup">
                <button @click="remove(node)"><i class="fa fa-trash"></i></button>
                <button 
                  @click="flyToNode(node)"><i class="fa fa-paper-plane"></i>
                </button>
          </div>
        </form>
        <div v-if="(currentPath.length<3)">
         <p class="interaction"> Um einen Flussverlauf zu zeichnen, klicken und platzieren Sie Punkte auf der Karte. Mit einem einfachen Klick können Sie diese auch wieder löschen.
          Bei gedrücktem Halten können Sie die Punkte auf der Karte verschieben.<br>
          Die Reihenfolge der Punkte kann hier im Menü durch die Pfeile geändert werden.
          Mit dem Papierflieger nehmen Sie den ausgewählten Punkt in den Fokus. Der Mülleimer löscht ebenfalls den Punkt. <br>
          Diese Meldung blendet sich nach 3 Punkten aus.
          </p>
        </div>
      </div>
      <div class="WaterBodyCreateButtonBox">
        <button @click="createWaterBodies" class="WaterBodyCreateButton">Pfad erstellen</button>
      </div>
    </div>
  </div>
</template>
<style scoped src="./CreateWaterBody.css"></style>

<script>


export default {
  props: {
    state: {
      type: Object, 
      required: true
    }
  },
  data() {
    return {
      latstep: 0.000009013, // ca. 1 Meter in Breitengrad
      longstep: 0.000008993, // ca. 1 Meter in Längengrad (bei mittleren Breiten, z.B. Deutschland)
      strgmultipyer:10,
      altdmultipyer:0.1,
    }
  },
  mounted() {
    },
    computed:{
      selecteNodePath(){
        if(this.state.WaterBodyToolManager){
          return this.state.WaterBodyToolManager.selecteNodePath
        }
        return 0
      },
      nodePath() {
        if (this.state.WaterBodyToolManager.nodePath) {
            return this.state.WaterBodyToolManager.nodePath
        }
        return []
      },
      currentPath() {
        if (this.state.WaterBodyToolManager.nodePath) {
            return this.state.WaterBodyToolManager.nodePath[this.selecteNodePath].path
        }
        return []
      },
    },
    methods:{
      addNodepath(){this.state.addNodepath()},
      removeNodepath(index){this.state.removeNodepath(index)},
      selectedWaterPath(index){this.state.selectedWaterPath(index)},
      moveUp(node){this.state.moveUp(node)},
      moveDown(node){this.state.moveDown(node)},
      remove(node){this.state.remove(node)},
      menuhover(node){this.state.menuhover(node)},
      menuunhover(node){this.state.menuunhover(node)},
      flyToNode(node){this.state.flyToNode(node)},
      updateNodeLat(node, value) {this.state.updateNodeLat(node, value);},
      updateNodeLong(node, value) {this.state.updateNodeLong(node, value);},
      handleLatKeydown(node, value, stepSize, event, updatefunktion) {
          if (event.target !== document.activeElement) return;
          if (event.ctrlKey) stepSize *= this.strgmultipyer;
          if (event.altKey) stepSize *= this.altdmultipyer;

          if (event.key === "ArrowUp") {
              updatefunktion(node, value + stepSize);
              event.preventDefault();
          } else if (event.key === "ArrowDown") {
              updatefunktion(node, value - stepSize);
              event.preventDefault();
          } else if (event.key === "Enter") {
              updatefunktion(node, value);
              event.preventDefault();
          } else if (event.ctrlKey || event.altKey) {
              event.preventDefault();
          }
      },
      handleLatWheel(node, value, stepSize, event, updatefunktion) {
          if (event.target !== document.activeElement) return;
          if (event.ctrlKey) stepSize *= this.strgmultipyer;
          if (event.altKey) stepSize *= this.altdmultipyer;
          updatefunktion(node, value - (stepSize * event.deltaY));
          event.preventDefault();
      },
      createWaterBodies(){this.state.createWaterBodies()},
      saveNodepath(){this.state.saveNodepath()},
      loadNodepath(event){this.state.loadNodepath(event)},
        triggerFileInput() {this.$refs.fileInput.click();},

    }
}
</script>