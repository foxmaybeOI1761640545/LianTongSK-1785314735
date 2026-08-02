<script setup>
import { computed, ref } from 'vue'
import { useEChart } from '../composables/useEChart.js'
import { formatBytes } from '../utils/traffic.js'
const props=defineProps({data:{type:Array,default:()=>[]}})
const chartElement=ref(null)
const option=computed(()=>({animationDuration:700,grid:{left:42,right:44,top:20,bottom:30},tooltip:{trigger:'axis',backgroundColor:'rgba(4,15,30,.96)',borderColor:'rgba(69,230,255,.35)',textStyle:{color:'#edf8ff'},formatter(params){const row=props.data[params[0].dataIndex];return `<b>${row.date}</b><br/>活跃用户：${row.activeUsers.toLocaleString('zh-CN')}人<br/>漫游流量：${formatBytes(row.totalBytes)}<br/><span style="color:#6f91aa">静态样本记录：${row.recordCount.toLocaleString('zh-CN')}条</span>`}},xAxis:{type:'category',data:props.data.map(item=>item.date.slice(5)),boundaryGap:true,axisLine:{lineStyle:{color:'rgba(105,167,205,.25)'}},axisTick:{show:false},axisLabel:{color:'#6f91aa',fontSize:10,interval:Math.max(0,Math.ceil(props.data.length/6)-1)}},yAxis:[{type:'value',splitNumber:3,axisLabel:{color:'#6f91aa',fontSize:10,formatter:value=>`${Math.round(value)}人`},splitLine:{lineStyle:{color:'rgba(80,139,177,.12)'}}},{type:'value',show:false}],series:[{name:'活跃用户',type:'bar',data:props.data.map(item=>item.activeUsers),barMaxWidth:11,itemStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'#47dcff'},{offset:1,color:'rgba(54,106,220,.12)'}]},borderRadius:[3,3,0,0]}},{name:'流量',type:'line',yAxisIndex:1,data:props.data.map(item=>item.totalBytes),symbol:'none',smooth:true,lineStyle:{color:'#8078ff',width:2},areaStyle:{color:'rgba(111,93,255,.08)'}}]}))
useEChart(chartElement,option)
</script>
<template><div ref="chartElement" class="chart-canvas" data-testid="traffic-chart" aria-label="活跃用户与漫游流量趋势图"></div></template>
