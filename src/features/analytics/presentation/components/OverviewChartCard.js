import React from 'react';
import { View, StyleSheet } from 'react-native';
import LineChart from '../../../../../components/LineChart';
import { SectionHeader } from './AnalyticsComponents';

export const OverviewChartCard = React.memo(({ overviewSeries, totalReadings, colors }) => {
  if (!overviewSeries || overviewSeries.isEmpty) return null;

  return (
    <>
      <SectionHeader
        emoji="📈"
        title="Full Sensor History"
        subtitle={`All ${totalReadings} readings · sampled for performance`}
        color={colors.primary}
        colors={colors}
      />
      <View style={[S.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LineChart
          labels={overviewSeries.labels}
          tempDHT1Data={overviewSeries.tempDHT1}
          tempDHT2Data={overviewSeries.tempDHT2}
          humidDHT1Data={overviewSeries.humidDHT1}
          humidDHT2Data={overviewSeries.humidDHT2}
          moistureData={overviewSeries.moisture}
          hideHeader
        />
      </View>
    </>
  );
});

const S = StyleSheet.create({
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 8, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
});
