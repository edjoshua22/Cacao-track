/**
 * DetailStyles.js
 * Shared StyleSheet for all screens inside screens/Details/.
 */
import { StyleSheet } from 'react-native';

export const detailStyles = StyleSheet.create({
  // ── Common layout ──────────────────────────────────────────────────────────
  container:     { flex: 1, padding: 16 },
  scrollContent: { padding: 16 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row:           { flexDirection: 'row', alignItems: 'center' },

  // ── GraphDetail ────────────────────────────────────────────────────────────
  graphTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  graphSubtitle: {
    fontSize: 16,
    marginBottom: 12,
  },

  // ── ImageDetail ────────────────────────────────────────────────────────────
  imageTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  imageContainer: {
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image:           { width: '100%', height: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText:   { fontSize: 16, fontWeight: '600' },
  caption:     { fontSize: 16, marginBottom: 8 },
  timestamp:   { fontSize: 14, opacity: 0.7 },

  // ── BatchDetail ────────────────────────────────────────────────────────────
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  batchTitle:    { fontSize: 22, fontWeight: '800' },
  batchSubtitle: { fontSize: 14, marginTop: 4 },
  statCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel:  { fontSize: 13, fontWeight: '500' },
  statValue:  { fontSize: 20, fontWeight: '800' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  dayCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  dayTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  dataText:    { fontSize: 12, marginBottom: 2 },
  exportRow:   { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 30 },
  exportBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
