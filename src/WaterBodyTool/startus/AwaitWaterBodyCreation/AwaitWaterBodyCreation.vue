<template>
  <div>
     <p class="waittext">Bitte warten, der Pfad wird erstellt:<br>{{ (protectedloadet * 100).toFixed(0) }}%</p>
      <div class="WaterBodyActionButtonGroup">
        <button @click="clearWaterBodies()">Abrechenen</button>
      </div>
    </div>
</template>
<style scoped src="./AwaitWaterBodyCreation.css"></style>

<script>


export default {
  props: {
    state: {
      type: Object, 
      required: true
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
    },
    methods:{
      clearWaterBodies(){this.state.clearWaterBodies()}
    }
}
</script>