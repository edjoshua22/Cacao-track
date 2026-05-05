/**
 * @file useMonitoring.js
 * @description Hook for MonitoringScreen — real-time sensor data from DI.
 */
import { useState, useEffect } from 'react';
import container from '../../../../core/di/container';

/**
 * @returns {{ sensors: object, chartData: object }}
 */
export const useMonitoring = () => {
  const [sensors, setSensors] = useState({
    tempDHT1:0,tempDHT2:0,humidDHT1:0,humidDHT2:0,avgTemp:0,avgHumidity:0,moisture:0,lastDataTime:0,lastUpdate:'',
  });
  const [chartData, setChartData] = useState({
    labels:[],tempDHT1Data:[],tempDHT2Data:[],humidDHT1Data:[],humidDHT2Data:[],moistData:[],
  });

  useEffect(() => {
    let dataTimeout = null;
    let unsubscribe = null;

    const clearSensors = () => setSensors(prev => ({...prev,tempDHT1:0,humidDHT1:0,tempDHT2:0,humidDHT2:0,avgTemp:0,avgHumidity:0,moisture:0}));
    const resetTimeout = () => { if(dataTimeout) clearTimeout(dataTimeout); dataTimeout = setTimeout(clearSensors, 10000); };

    clearSensors();

    const useCase = container.resolve('getMonitoringDataUseCase');
    useCase.execute({ callback: ({ type, data }) => {
      const now = Date.now();
      const isStale = data ? (now - (data.timestamp||now)) >= 5000 : true;

      if (type === 'dht1') {
        if (!isStale && data) { setSensors(p => ({...p,tempDHT1:Number(data.temperature)??0,humidDHT1:Number(data.humidity)??0,lastDataTime:now})); resetTimeout(); }
        else setSensors(p => ({...p,tempDHT1:0,humidDHT1:0}));
      } else if (type === 'dht2') {
        if (!isStale && data) { setSensors(p => ({...p,tempDHT2:Number(data.temperature)??0,humidDHT2:Number(data.humidity)??0,moisture:Number(data.soilMoisture)??0,lastUpdate:data.lastUpdate||p.lastUpdate,lastDataTime:now})); resetTimeout(); }
        else setSensors(p => ({...p,tempDHT2:0,humidDHT2:0,moisture:0}));
      } else if (type === 'average') {
        if (!isStale && data) { setSensors(p => ({...p,avgTemp:Number(data.temperature)??0,avgHumidity:Number(data.humidity)??0,lastDataTime:now})); resetTimeout(); }
        else setSensors(p => ({...p,avgTemp:0,avgHumidity:0}));
      } else if (type === 'history' && data) {
        let entries = Object.entries(data).map(([_,v]) => ({...v}));
        entries.sort((a,b) => (a.time||'').localeCompare(b.time||''));
        setChartData({
          tempDHT1Data:  entries.map(e => isFinite(Number(e.tempDHT1??e.temp1??e.temp??e.temperature))  ? Number(e.tempDHT1??e.temp1??e.temp??e.temperature)  : 0),
          tempDHT2Data:  entries.map(e => isFinite(Number(e.tempDHT2??e.temp2??e.temp??e.temperature))  ? Number(e.tempDHT2??e.temp2??e.temp??e.temperature)  : 0),
          humidDHT1Data: entries.map(e => isFinite(Number(e.humidDHT1??e.humidity1??e.humidity))        ? Number(e.humidDHT1??e.humidity1??e.humidity)        : 0),
          humidDHT2Data: entries.map(e => isFinite(Number(e.humidDHT2??e.humidity2??e.humidity))        ? Number(e.humidDHT2??e.humidity2??e.humidity)        : 0),
          moistData:     entries.map(e => isFinite(Number(e.soilMoisture)) ? Number(e.soilMoisture) : 0),
          labels:        entries.map(e => e.time ? String(e.time) : ''),
        });
      }
    }}).then(result => { if(result.success) unsubscribe = result.data.unsubscribe; });

    return () => { if(dataTimeout) clearTimeout(dataTimeout); if(unsubscribe) unsubscribe(); };
  }, []);

  return { sensors, chartData };
};
