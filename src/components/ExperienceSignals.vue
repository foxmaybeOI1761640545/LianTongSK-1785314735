<script setup>
import { computed, ref } from 'vue'
import { useEChart } from '../composables/useEChart.js'
const props=defineProps({data:{type:Array,default:()=>[]},selected:{type:String,default:'ALL'}})
const chartElement=ref(null)
const option=computed(()=>({animationDuration:700,grid:{left:108,right:35,top:8,bottom:8},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:(params)=>`${params[0].name}<br/><b>${Number(params[0].value).toLocaleString('zh-CN')} 人</b><br/>月度多标签规则候选`,backgroundColor:'rgba(4,15,30,.96)',borderColor:'rgba(69,230,255,.35)',textStyle:{color:'#edf8ff'}},xAxis:{type:'value',show:false},yAxis:{type:'category',inverse:true,data:props.data.map(item=>item.name),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:'#8eaac2',fontSize:9,width:100,overflow:'truncate'}},series:[{type:'bar',barWidth:8,showBackground:true,backgroundStyle:{color:'rgba(255,255,255,.045)',borderRadius:8},data:props.data.map(item=>({value:item.value,itemStyle:{color:item.tone,opacity:props.selected==='ALL'||props.selected===item.id?1:.28,borderRadius:8},label:{show:true,position:'right',color:item.tone,fontSize:9,formatter:'{c}人'}}))}]}))
useEChart(chartElement,option)
</script>
<template><div class="experience-signal-wrap" data-testid="experience-signals"><div ref="chartElement" class="chart-canvas" aria-label="用户体验行为信号候选分布图"></div><span>多标签可重叠 · 仅表示运营候选，不是身份或满意度认定</span></div></template>
