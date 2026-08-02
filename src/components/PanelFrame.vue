<script setup>
const props=defineProps({title:{type:String,required:true},eyebrow:{type:String,default:''},active:{type:Boolean,default:false},compact:{type:Boolean,default:false},detailId:{type:String,default:''}})
const emit=defineEmits(['open-detail'])
function openDetail(event){if(props.detailId)emit('open-detail',{target:props.detailId,origin:{x:event.clientX,y:event.clientY}})}
</script>
<template><section class="panel-frame" :class="{'is-active':active,'is-compact':compact,'is-detail-enabled':detailId}" @dblclick.stop="openDetail"><div class="panel-corner panel-corner--tl"></div><div class="panel-corner panel-corner--br"></div><header class="panel-header"><div><span v-if="eyebrow" class="panel-eyebrow">{{ eyebrow }}</span><h2>{{ title }}</h2></div><slot name="header"></slot></header><div class="panel-body"><slot></slot></div></section></template>
