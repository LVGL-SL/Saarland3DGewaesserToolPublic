<template>
   <div>
   
    <div>
       
        <component v-if="component" :is="component" :state="pl.state" class="content"/>
       
    </div>
    <div class="titlebox">
            <a href="#/" class="cancel-btn vcm-btn-icon cancel-icon vcm-btn-icon-font-default router-link-active"></a>
            <h2>{{ $t('titel') }}</h2>
         </div>
   
    <div class="footbox">
          <p>Watertool | © LVGL-Saarland 2025</p>
    </div>
    
    </div>
</template>
<style scoped src="./window.css"></style>

<script>
import i18n from "../i18n-Language/window/Window"
import PluginManager from '../PluginManager/PluginManager';

export default {
    i18n,
    data() {
        return {
            component:null,
            windowManager:null,
            pl:null,
        }
    },
    beforeMount() {
        if (this.$route.path === '/waterbodytool') {
            PluginManager.init()
            this.pl = PluginManager.instance
            this.pl.openWindow()
        }
    },
    mounted() {
        console.log('mounted');
        //!!!OLS VCS - Set window to open on the left
        vcs.ui.store.state.contentPosition = "left"
    },
    watch: {
        "pl.component": {
            handler(newVal) {
                this.component = newVal|| null;
            },
            deep: true,
            immediate: true
        }
    },
    beforeDestroy() {
       this.pl.closeWindow()
    }
}
</script>