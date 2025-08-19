<template>

    <span  
            :class="[   
                        'vcm-btn-icon', 'vcm-btn-base-default', 
                        'vcm-btn-base-splash-hover', 'vcm-border', 
                        'vcm-border-dye03', 'vcm-btn-icon-font-default', 
                        'vcm-btn-icon-font-dye01-hover', 'vcm-no-select',
                        'water-icon', status
                    ]"
            @click="navigate"
    >
    
    </span>
</template>

<script>
import PluginManager from '../PluginManager/PluginManager'; // Adjust import path as needed

export default {
    name: 'Icon',
    watch: {
        // Watch for changes in PluginManager status
        'pluginManager.status': {
            handler(newStatus) {
                this.status = newStatus;
            },
            immediate: true
        }
    },
    methods: {
        navigate(){
            if (this.$route.path !== '/waterbodytool') {
                this.$router.push({ path: '/waterbodytool' });
            }else{
            PluginManager.closeWindow()
            this.$router.push({ path: '/' });
            }
        }
    }
};
</script>
<style cssa>

body .plugins-group .legend-icon-canvas.inactive {
    display: block;
    

}

body .plugins-group .title{
    width: fit-content;
   
}

body .plugins-group > :nth-child(5) {
    float: none;
    margin: 0;
    vertical-align: middle;
}

</style>
<style scoped>

.water-icon {
    display: inline-block;
    width: 100%;
    height: 100%;
    

}
.water-icon::before {
    content: "";
    position: absolute;
    top: 10%; left: 10%; right: 10%; bottom: 10%; 
    -webkit-mask: url('../../assets/water.svg') no-repeat center center;
    mask: url('../../assets/water.svg') no-repeat center center;
    -webkit-mask-size: cover;
    mask-size: cover;
    background-color: currentColor;
    display: block;
}

.disabled::before {
    background-color:#AAA
}
.disabled {
   background-color:#EEE
}
.disabled:hover {
   background-color:#DDD
}
</style>
