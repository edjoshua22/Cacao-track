/**
 * @file BatchScreen.js
 * @description Batch list screen. Migrated from screens/BatchScreen.js.
 * Imports ONLY the useBatchList hook — zero business logic here.
 */
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons }     from '@expo/vector-icons';
import Card       from '../../../../../components/Card';
import Background from '../../../../../components/Background';
import LineChart  from '../../../../../components/LineChart';
import { useAppTheme } from '../../../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AddButton from '../../../../../screens/Menu/AddButton';
import { createBatch } from '../../../../../screens/Menu/batchUtils';
import { useBatchList } from '../hooks/useBatchList';
import container from '../../../../core/di/container';
import { exportPDF } from '../../../../core/utils/exportUtils';

// ── Internal daily graph sub-component ───────────────────────────────────────
const DailyGraph = React.memo(({ dayKey, dayData, index, colors }) => {
  if (!dayData?.sensorData?.length) {
    return (
      <View style={styles.dayCard}>
        <LinearGradient colors={['rgba(139,90,43,0.15)','rgba(139,90,43,0.05)']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.dayHeaderGradient}>
          <Text style={[styles.dayTitle,{color:colors.text}]}>Day {index} – {dayData?.stageName||'Unknown'}</Text>
        </LinearGradient>
        <View style={styles.noDataPlaceholder}>
          <Ionicons name="stats-chart-outline" size={32} color={colors.subtext}/>
          <Text style={{color:colors.subtext,marginTop:8,fontSize:13,fontWeight:'500'}}>No sensor data recorded for this stage</Text>
        </View>
      </View>
    );
  }

  const labels=[],tempDHT1=[],tempDHT2=[],humidDHT1=[],humidDHT2=[],moist=[];
  for (const e of dayData.sensorData) {
    labels.push(e.time ? String(e.time).split(' ')[1]||String(e.time) : '');
    tempDHT1.push(Number(e.tempDHT1??e.temperature??0));
    tempDHT2.push(Number(e.tempDHT2??e.temperature??0));
    humidDHT1.push(Number(e.humidDHT1??e.humidity??0));
    humidDHT2.push(Number(e.humidDHT2??e.humidity??0));
    moist.push(Number(e.soilMoisture??0));
  }

  return (
    <View style={styles.dayCard}>
      <LinearGradient colors={['rgba(139,90,43,0.2)','rgba(139,90,43,0.05)']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.dayHeaderGradient}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <Text style={[styles.dayTitle,{color:colors.text}]}>Day {index} – {dayData.stageName}</Text>
          <Ionicons name="analytics" size={18} color="#8B5A2B"/>
        </View>
      </LinearGradient>
      <View style={styles.chartWrapper}>
        <LineChart labels={labels} tempDHT1Data={tempDHT1} tempDHT2Data={tempDHT2} humidDHT1Data={humidDHT1} humidDHT2Data={humidDHT2} moistureData={moist} hideHeader={true}/>
      </View>
    </View>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BatchScreen() {
  const { colors } = useAppTheme();
  const { batches, isLoading, error, deleteBatch, expandedBatchId, toggleExpand } = useBatchList();
  const [isMigrating, setIsMigrating] = React.useState(false);

  const handleMigrate = useCallback(async () => {
    setIsMigrating(true);
    try {
      const pastStartTime = Date.now() - (6 * 24 * 60 * 60 * 1000);
      await createBatch("Batch 1", "Automatically migrated past data", pastStartTime);
      Alert.alert("Success", "Batch 1 created with all your past sensor data!");
    } catch (err) {
      Alert.alert("Error", "Failed to migrate past data.");
    } finally {
      setIsMigrating(false);
    }
  }, []);

  const handleDelete = useCallback((id, name) => {
    Alert.alert(
      'Delete Batch', `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try { await deleteBatch(id, name); Alert.alert('Deleted', `"${name}" deleted.`); }
            catch (err) { Alert.alert('Error', 'Failed to delete batch.'); }
          },
        },
      ]
    );
  }, [deleteBatch]);

  const handleExportImages = useCallback(async () => {
    const useCase = container.resolve('exportBatchImageUseCase');
    await useCase.execute();
  }, []);

  const renderItem = useCallback(({ item: batch }) => {
    const isExpanded = expandedBatchId === batch.id;
    const daysArr    = ['day0','day1','day2','day3','day4','day5','day6'];
    return (
      <View style={styles.cardWrapper}>
        <View style={styles.batchCard}>
          <View style={styles.batchHeader}>
            <View style={{flex:1}}>
              <Text style={styles.batchName}>{batch.name || batch.title}</Text>
              <Text style={styles.batchDate}>
                <Text style={{fontWeight:'700'}}>Batch Created on: </Text>
                {batch.date || 'Unknown date'}
              </Text>
            </View>
          </View>

          <View style={styles.divider}/>

          <TouchableOpacity
            style={[styles.dashboardBtn, isExpanded && styles.dashboardBtnActive]}
            onPress={() => toggleExpand(batch.id)}
            activeOpacity={0.8}
          >
            <Ionicons name={isExpanded?'podium':'podium-outline'} size={20} color={isExpanded?'#fff':colors.primary}/>
            <Text style={[styles.dashboardBtnText, isExpanded&&{color:'#fff'}]}>
              {isExpanded ? 'Hide Dashboard' : 'View Analytics Dashboard'}
            </Text>
            <Ionicons name={isExpanded?'chevron-up':'chevron-down'} size={20} color={isExpanded?'#fff':colors.primary} style={{marginLeft:'auto'}}/>
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.analysisSection}>
              {daysArr.map((dayKey, index) => (
                <DailyGraph key={dayKey} dayKey={dayKey} dayData={batch[dayKey]} index={index} colors={colors}/>
              ))}
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionBtn,styles.imagesBtn]} onPress={handleExportImages}>
              <Ionicons name="image-outline" size={18} color="#fff"/>
              <Text style={styles.btnText}>Images</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn,styles.pdfBtn]} onPress={() => exportPDF(batch)}>
              <Ionicons name="download-outline" size={18} color="#fff"/>
              <Text style={styles.btnText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn,styles.deleteBtn]} onPress={() => handleDelete(batch.id, batch.name||batch.title)}>
              <Ionicons name="trash-outline" size={18} color="#fff"/>
              <Text style={styles.btnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [expandedBatchId, toggleExpand, handleDelete, handleExportImages, colors]);

  if (isLoading) {
    return (
      <Background variant="gradient">
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color={colors?.primary}/>
          <Text style={[styles.loadingText,{color:colors?.subtext}]}>Loading batches...</Text>
        </SafeAreaView>
      </Background>
    );
  }

  if (error) {
    return (
      <Background variant="gradient">
        <SafeAreaView style={styles.centered}>
          <Ionicons name="warning-outline" size={64} color={colors?.subtext}/>
          <Text style={[styles.errorTitle,{color:colors?.text}]}>Error Loading Batches</Text>
          <Text style={[styles.errorText,{color:colors?.subtext}]}>{error}</Text>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background variant="gradient">
      <SafeAreaView style={{flex:1}} edges={['bottom', 'top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Batches</Text>
          <View style={{ width: 44, height: 44, position: 'relative' }}>
            <View style={{ position: 'absolute', top: -20, right: 0 }}>
              <AddButton />
            </View>
          </View>
        </View>
        <FlatList
          data={batches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{padding:16}}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={64} color={colors?.subtext}/>
              <Text style={[styles.emptyTitle,{color:colors?.text}]}>No Batches Yet</Text>
              <Text style={[styles.emptyText,{color:colors?.subtext, marginBottom: 20}]}>Add a new batch to start tracking fermentation.</Text>
              <TouchableOpacity 
                style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                onPress={handleMigrate}
                disabled={isMigrating}
              >
                {isMigrating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="download-outline" size={20} color="#fff" />}
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Migrate Past Data to Batch 1</Text>
              </TouchableOpacity>
            </Card>
          }
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
          removeClippedSubviews={Platform.OS==='android'}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  centered:        { flex:1, justifyContent:'center', alignItems:'center' },
  cardWrapper:     { marginBottom:24, borderRadius:16, shadowColor:'#000', shadowOpacity:0.1, shadowOffset:{width:0,height:4}, shadowRadius:10, elevation:6, overflow:'hidden' },
  batchCard:       { backgroundColor:'#FFFFFF', borderRadius:16, padding:16, borderTopWidth:6, borderTopColor:'#8B5A2B' },
  batchHeader:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  dashboardBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:14, paddingHorizontal:16, backgroundColor:'rgba(139,90,43,0.06)', borderRadius:12, marginBottom:16, borderWidth:1, borderColor:'rgba(139,90,43,0.1)' },
  dashboardBtnActive: { backgroundColor:'#8B5A2B' },
  dashboardBtnText:{ fontSize:16, fontWeight:'700', color:'#8B5A2B' },
  analysisSection: { marginTop:8, marginBottom:16 },
  divider:         { height:1, backgroundColor:'rgba(139,90,43,0.15)', marginBottom:20 },
  dayCard:         { marginBottom:20, backgroundColor:'#FAFAFA', borderRadius:14, borderWidth:1, borderColor:'#EFEFEF', overflow:'hidden', shadowColor:'#000', shadowOpacity:0.04, shadowOffset:{width:0,height:2}, shadowRadius:4, elevation:2 },
  dayHeaderGradient:{ paddingVertical:10, paddingHorizontal:14, borderBottomWidth:1, borderBottomColor:'#EBEBEB' },
  dayTitle:        { fontSize:15, fontWeight:'800' },
  noDataPlaceholder:{ alignItems:'center', justifyContent:'center', paddingVertical:30, backgroundColor:'#FAFAFA' },
  chartWrapper:    { padding:8, backgroundColor:'#FFFFFF' },
  batchName:       { fontSize:18, fontWeight:'700', color:'#4B3B2B' },
  batchDate:       { fontSize:13, color:'#8B7355' },
  buttonRow:       { flexDirection:'row', justifyContent:'space-between', gap:8 },
  actionBtn:       { flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', borderRadius:10, paddingVertical:10, gap:4 },
  imagesBtn:       { backgroundColor:'#2E7D32' },
  pdfBtn:          { backgroundColor:'#8B4513' },
  deleteBtn:       { backgroundColor:'#B22222' },
  btnText:         { color:'#fff', fontWeight:'700', fontSize:14 },
  emptyCard:       { alignItems:'center', padding:40 },
  emptyTitle:      { fontSize:20, fontWeight:'700', marginTop:16, marginBottom:8 },
  emptyText:       { fontSize:14, textAlign:'center', lineHeight:20 },
  loadingText:     { marginTop:12, fontSize:14 },
  errorTitle:      { fontSize:20, fontWeight:'700', marginTop:16, marginBottom:8 },
  errorText:       { fontSize:14, textAlign:'center', lineHeight:20 },
});
