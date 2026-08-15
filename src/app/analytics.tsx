import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getIncomes, getExpenses, getGoals } from '../api';

export default function AnalyticsScreen() {
    const [incomes, setIncomes] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [completedGoals, setCompletedGoals] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const router = useRouter();

    const fetchAnalyticsData = async () => {
        try {
            setRefreshing(true);
            const incRes = await getIncomes();
            const expRes = await getExpenses();
            const goalsRes = await getGoals();

            setIncomes(incRes.data || []);
            setExpenses(expRes.data || []);

            const finished = (goalsRes.data || []).filter((g: any) => g.isCompleted);
            setCompletedGoals(finished);
        } catch (error) {
            console.error('Analiz verileri çekilemedi:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netBalance = totalIncome - totalExpense;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAnalyticsData} />}
            >
                <Text style={styles.headerTitle}>📊 Finansal Analiz & Geçmiş</Text>

                {/* Özet Kartları */}
                <View style={styles.cardRow}>
                    <View style={[styles.summaryCard, { backgroundColor: '#27AE60' }]}>
                        <Text style={styles.cardLabel}>Toplam Gelir (Maaş vb.)</Text>
                        <Text style={styles.cardValue}>+{totalIncome} TL</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#C0392B' }]}>
                        <Text style={styles.cardLabel}>Toplam Harcama</Text>
                        <Text style={styles.cardValue}>-{totalExpense} TL</Text>
                    </View>
                </View>

                <View style={styles.netCard}>
                    <Text style={styles.cardLabel}>Net Durum (Bakiye)</Text>
                    <Text style={[styles.netValue, { color: netBalance >= 0 ? '#27AE60' : '#C0392B' }]}>
                        {netBalance} TL
                    </Text>
                </View>

                {/* Harcama Dağılımı / Analiz Bölümü */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Harcama Dağılım Analizi</Text>
                    {expenses.length === 0 ? (
                        <Text style={styles.emptyText}>Henüz kaydedilmiş harcama bulunmuyor.</Text>
                    ) : (
                        expenses.map((item, index) => (
                            <View key={index} style={styles.analysisItem}>
                                <Text style={styles.analysisTitle}>{item.title} ({item.category || 'Genel'})</Text>
                                <Text style={styles.analysisAmount}>-{item.amount} TL</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Tamamlanan Hedefler Geçmişi */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>🎯 Tamamlanan Hedefler Geçmişi</Text>
                    {completedGoals.length === 0 ? (
                        <Text style={styles.emptyText}>Henüz tamamlanmış bir hedef yok. Harika bir hedefe ulaşmak üzeresin!</Text>
                    ) : (
                        completedGoals.map((goal, index) => (
                            <View key={index} style={styles.goalHistoryCard}>
                                <Text style={styles.goalTitle}>🏆 {goal.name}</Text>
                                <Text style={styles.goalDetail}>Hedef Tutar: {goal.targetAmount} TL</Text>
                                <Text style={styles.goalDate}>Durum: Başarıyla Tamamlandı</Text>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    scrollContent: { padding: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20, textAlign: 'center' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    summaryCard: { flex: 1, padding: 15, borderRadius: 12, marginRight: 8, alignItems: 'center' },
    netCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardLabel: { color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 5 },
    cardValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    netValue: { fontSize: 26, fontWeight: 'bold', marginTop: 5 },
    sectionContainer: { marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#34495E', marginBottom: 12 },
    emptyText: { color: '#95A5A6', fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
    analysisItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
    analysisTitle: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
    analysisAmount: { fontSize: 14, color: '#C0392B', fontWeight: 'bold' },
    goalHistoryCard: { backgroundColor: '#E8F8F5', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#A3E4D7', marginBottom: 10 },
    goalTitle: { fontSize: 16, fontWeight: 'bold', color: '#117A65', marginBottom: 4 },
    goalDetail: { fontSize: 13, color: '#566573' },
    goalDate: { fontSize: 12, color: '#16A085', marginTop: 4, fontWeight: '600' }
});
