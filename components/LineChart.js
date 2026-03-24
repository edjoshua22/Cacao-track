import React, { useState, useRef, useEffect } from "react";
import { Dimensions, View, Text, Animated, TouchableOpacity } from "react-native";
import { LineChart as RNCKLine } from "react-native-chart-kit";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";
import { Svg, G, Rect, Text as SvgText, Circle, Defs, RadialGradient, Stop } from "react-native-svg";

const screenW = Dimensions.get("window").width;
const screenH = Dimensions.get("window").height;
const chartHeight = Math.max(240, Math.min(380, Math.floor(screenH * 0.4)));

function CoolLegend({ onToggle, activeDatasets, isDark }) {
  const legendItems = [
    { key: "tempDHT1", label: "Temp DHT1", icon: "🌡️", color: "#EF4444" },
    { key: "tempDHT2", label: "Temp DHT2", icon: "🌡️", color: "#F87171" },
    { key: "humidDHT1", label: "Humid DHT1", icon: "💧", color: "#3B82F6" },
    { key: "humidDHT2", label: "Humid DHT2", icon: "💧", color: "#60A5FA" },
    { key: "moisture", label: "Moisture", icon: "🌱", color: "#10B981" },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 20,
      paddingHorizontal: 10,
      gap: 8,
    }}>
      {legendItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          onPress={() => onToggle(item.key)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: activeDatasets[item.key] 
              ? `${item.color}15` 
              : (isDark ? '#2A2420' : '#F8F9FA'),
            borderWidth: 2,
            borderColor: activeDatasets[item.key] 
              ? item.color 
              : (isDark ? '#3A2F26' : '#E5E7EB'),
            opacity: activeDatasets[item.key] ? 1 : 0.5,
          }}
        >
          <Text style={{ fontSize: 16, marginRight: 6 }}>{item.icon}</Text>
          <Text style={{
            color: activeDatasets[item.key] 
              ? item.color 
              : (isDark ? '#C4B7A9' : '#64748B'),
            fontWeight: '600',
            fontSize: 12,
          }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EnhancedTooltip({ tooltip, isDark, screenW }) {
  if (!tooltip) return null;

  const datasetMap = {
    tempDHT1: { bg: "#EF4444", icon: "🌡️", title: "Temp DHT1", unit: "°C" },
    tempDHT2: { bg: "#F87171", icon: "🌡️", title: "Temp DHT2", unit: "°C" },
    humidDHT1: { bg: "#3B82F6", icon: "💧", title: "Humid DHT1", unit: "%" },
    humidDHT2: { bg: "#60A5FA", icon: "💧", title: "Humid DHT2", unit: "%" },
    moisture: { bg: "#10B981", icon: "🌱", title: "Moisture", unit: "%" },
  };

  const dataset = datasetMap[tooltip.datasetKey] || datasetMap.temp;
  if (!dataset) return null;

  const { bg, icon, title, unit } = dataset;
  const innerWidth = screenW - 64;
  const tooltipWidth = 140;
  const tooltipHeight = 80;
  const x = Math.max(8, Math.min(tooltip.x - tooltipWidth / 2, innerWidth - tooltipWidth - 8));
  const y = Math.max(8, tooltip.y - tooltipHeight - 12);

  return (
    <Svg>
      <Defs>
        <RadialGradient id="tooltipGradient" cx="50%" cy="0%" r="100%">
          <Stop offset="0%" stopColor={bg} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={bg} stopOpacity="0.85" />
        </RadialGradient>
      </Defs>
      <G>
        <Rect x={x + 2} y={y + 2} rx={12} ry={12} width={tooltipWidth} height={tooltipHeight} fill="rgba(0,0,0,0.2)" />
        <Rect x={x} y={y} rx={12} ry={12} width={tooltipWidth} height={tooltipHeight} fill="url(#tooltipGradient)" />
        <SvgText x={x + 15} y={y + 25} fill="#ffffff" fontSize="20">{icon}</SvgText>
        <SvgText x={x + 45} y={y + 22} fill="#ffffff" fontSize="12" fontWeight="600">{title}</SvgText>
        <SvgText x={x + 45} y={y + 38} fill="rgba(255,255,255,0.8)" fontSize="10">{tooltip.label}</SvgText>
        <SvgText x={x + 15} y={y + 60} fill="#ffffff" fontSize="18" fontWeight="bold">{tooltip.value} {unit}</SvgText>
        <Circle cx={tooltip.x} cy={tooltip.y} r="6" fill={bg} stroke="#ffffff" strokeWidth="3" />
      </G>
    </Svg>
  );
}

export default function LineChart({ 
  labels = [], 
  tempData = [], 
  tempDHT1Data = [],
  tempDHT2Data = [],
  humidData = [],
  humidDHT1Data = [],
  humidDHT2Data = [],
  moistureData = [] 
}) {
  const { colors, isDark } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [tooltip, setTooltip] = useState(null);
  const [activeDatasets, setActiveDatasets] = useState({ 
    tempDHT1: true, 
    tempDHT2: true, 
    humidDHT1: true, 
    humidDHT2: true, 
    moisture: true 
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const safeLabels = labels.length ? labels : ["0"];
  // Use new data if provided, otherwise fallback to old format for backward compatibility
  const safeTempDHT1 = tempDHT1Data.length ? tempDHT1Data : (tempData.length ? tempData : [0]);
  const safeTempDHT2 = tempDHT2Data.length ? tempDHT2Data : [0];
  const safeHumidDHT1 = humidDHT1Data.length ? humidDHT1Data : (humidData.length ? humidData : [0]);
  const safeHumidDHT2 = humidDHT2Data.length ? humidDHT2Data : [0];
  const safeMoisture = moistureData.length ? moistureData : [0];

  const toggleDataset = (key) => setActiveDatasets(prev => ({ ...prev, [key]: !prev[key] }));

  const datasets = [];
  if (activeDatasets.tempDHT1) {
    datasets.push({
      key: "tempDHT1",
      data: safeTempDHT1.map(n => isFinite(n) ? n : 0),
      strokeWidth: 3,
      color: (opacity = 1) => `rgba(239,68,68,${opacity})`,
      withDots: true,
      propsForDots: { r: "5", strokeWidth: "2", stroke: "#ffffff", fill: "rgba(239,68,68,1)" },
    });
  }
  if (activeDatasets.tempDHT2) {
    datasets.push({
      key: "tempDHT2",
      data: safeTempDHT2.map(n => isFinite(n) ? n : 0),
      strokeWidth: 3,
      color: (opacity = 1) => `rgba(248,113,113,${opacity})`,
      withDots: true,
      propsForDots: { r: "5", strokeWidth: "2", stroke: "#ffffff", fill: "rgba(248,113,113,1)" },
    });
  }
  if (activeDatasets.humidDHT1) {
    datasets.push({
      key: "humidDHT1",
      data: safeHumidDHT1.map(n => isFinite(n) ? n : 0),
      strokeWidth: 3,
      color: (opacity = 1) => `rgba(59,130,246,${opacity})`,
      withDots: true,
      propsForDots: { r: "5", strokeWidth: "2", stroke: "#ffffff", fill: "rgba(59,130,246,1)" },
    });
  }
  if (activeDatasets.humidDHT2) {
    datasets.push({
      key: "humidDHT2",
      data: safeHumidDHT2.map(n => isFinite(n) ? n : 0),
      strokeWidth: 3,
      color: (opacity = 1) => `rgba(96,165,250,${opacity})`,
      withDots: true,
      propsForDots: { r: "5", strokeWidth: "2", stroke: "#ffffff", fill: "rgba(96,165,250,1)" },
    });
  }
  if (activeDatasets.moisture) {
    datasets.push({
      key: "moisture",
      data: safeMoisture.map(n => isFinite(n) ? n : 0),
      strokeWidth: 3,
      color: (opacity = 1) => `rgba(16,185,129,${opacity})`,
      withDots: true,
      propsForDots: { r: "5", strokeWidth: "2", stroke: "#ffffff", fill: "rgba(16,185,129,1)" },
    });
  }

  const data = { labels: safeLabels, datasets: datasets.length > 0 ? datasets : [{}] };  // Add a fallback empty object to prevent errors

  if (!safeTempDHT1.length && !safeTempDHT2.length && !safeHumidDHT1.length && !safeHumidDHT2.length && !safeMoisture.length) {
    return (
      <View style={{
        height: 280, justifyContent: 'center', alignItems: 'center',
        backgroundColor: isDark ? '#2A2420' : '#F8F9FA', borderRadius: 20, margin: 10,
      }}>
        <Ionicons name="analytics-outline" size={48} color={isDark ? '#5B4A3D' : '#9CA3AF'} />
        <Text style={{ color: isDark ? '#C4B7A9' : '#6B7280', marginTop: 12, fontSize: 16, fontWeight: '600' }}>No Data Available</Text>
        <Text style={{ color: isDark ? '#8B7355' : '#9CA3AF', marginTop: 4, fontSize: 14 }}>Waiting for sensor readings...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], width: "100%", alignItems: "center", paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 }}>
        <LinearGradient colors={isDark ? ['#3E2723', '#5D4037'] : ['#8C6339', '#A0522D']} style={{ width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Ionicons name="pulse-outline" size={20} color="#ffffff" />
        </LinearGradient>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>📊 Live Sensor Data</Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 2 }}>Real-time fermentation metrics</Text>
        </View>
      </View>

      <CoolLegend onToggle={toggleDataset} activeDatasets={activeDatasets} isDark={isDark} />

      <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        <LinearGradient colors={isDark ? ['rgba(46, 41, 51, 0.1)', 'rgba(46, 41, 51, 0.05)'] : ['rgba(249, 250, 251, 0.8)', 'rgba(255, 255, 255, 0.4)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        <RNCKLine
          data={data}
          width={screenW - 96}
          height={chartHeight}
          withDots={datasets.length > 0}  // Only show dots if datasets exist
          withShadow={false}
          bezier
          segments={6}
          fromZero={false}
          yAxisSuffix=""
          yLabelsOffset={12}
          xLabelsOffset={-2}
          withVerticalLabels={false}
          withHorizontalLabels={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          chartConfig={{
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            backgroundGradientFromOpacity: 1,
            backgroundGradientToOpacity: 1,
            decimalPlaces: 1,
            color: (opacity = 1) => isDark ? `rgba(245, 233, 221, ${opacity})` : `rgba(15, 23, 42, ${opacity})`,
            labelColor: () => colors.subtext,
            fillShadowGradientFrom: isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)",
            fillShadowGradientFromOpacity: isDark ? 0.2 : 0.1,
            fillShadowGradientTo: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
            fillShadowGradientToOpacity: isDark ? 0.15 : 0.08,
            propsForBackgroundLines: {
              stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              strokeWidth: 1,
              strokeDasharray: "5,5",
            },
            propsForVerticalLabels: { fontSize: 11, fontWeight: "600", fill: colors.subtext },
            propsForHorizontalLabels: { fontSize: 11, fontWeight: "600", fill: colors.subtext },
          }}
          onDataPointClick={(p) => {
            if (p && p.dataset) {
              const isSame = tooltip && tooltip.x === p.x && tooltip.y === p.y;
              setTooltip(isSame ? null : { x: p.x, y: p.y, value: p.value, datasetKey: p.dataset.key || "tempDHT1", label: safeLabels[p.index] ?? "" });
            } else {
              if (__DEV__) {
                console.warn('No dataset available in onDataPointClick');
              }
              setTooltip(null);
            }
          }}
          decorator={() => <EnhancedTooltip tooltip={tooltip} isDark={isDark} screenW={screenW} />}
          style={{ borderRadius: 16 }}
        />
      </View>
    </Animated.View>
  );
}
