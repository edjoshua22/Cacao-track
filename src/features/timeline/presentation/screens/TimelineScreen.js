/**
 * @file TimelineScreen.js
 * @description Migrated from screens/TimelineScreen.js. Dumb screen — uses useTimeline hook only.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, FlatList, RefreshControl, Platform } from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Card from '../../../../../components/Card';
import { useAppTheme } from '../../../../../context/ThemeContext';
import { useTimeline }  from '../hooks/useTimeline';

export default function TimelineScreen() {
  const { colors }                           = useAppTheme();
  const navigation                           = useNavigation();
  const { images, isLoading, refreshing, onRefresh } = useTimeline();

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => navigation.navigate('ImageDetail', {
        ...item,
        parsedDateTimestamp: item.parsedDate ? item.parsedDate.getTime() : null,
        parsedDate: undefined,
      })}
    >
      <Image source={{ uri: item.url }} style={styles.image}/>
      <Text style={[styles.caption,{color:colors.subtext}]}>Day {item.dayNumber} - {item.inference?.stage||'Unknown'}</Text>
      <Text style={styles.timestamp}>{item.displayDate}</Text>
    </TouchableOpacity>
  ), [navigation, colors.subtext]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered,{backgroundColor:colors.bg}]}>
        <ActivityIndicator size="large" color={colors.primary}/>
        <Text style={{color:colors.subtext,marginTop:12}}>Loading images...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:colors.bg}}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item.timestamp}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{padding:16}}
        ListHeaderComponent={<Text style={[styles.title,{color:colors.text}]}>Cacao Bean Timeline</Text>}
        ListEmptyComponent={<Card><Text style={{textAlign:'center',color:colors.subtext}}>No images yet</Text></Card>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS==='android'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title:         { fontSize:22, fontWeight:'800', marginBottom:12 },
  tile:          { width:'48%', marginBottom:16 },
  image:         { width:'100%', height:120, borderRadius:12 },
  caption:       { fontSize:12, fontWeight:'600', marginTop:6 },
  timestamp:     { fontSize:10, opacity:0.6 },
  centered:      { flex:1, justifyContent:'center', alignItems:'center' },
  columnWrapper: { justifyContent:'space-between' },
});
