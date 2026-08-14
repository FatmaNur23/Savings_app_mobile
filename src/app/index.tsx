import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { getGoals, getGoalCalculation, createIncome, createExpense, getIncomes, getExpenses, createGoal } from '../api';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [goal, setGoal] = useState<any>(null);
    const [calculation, setCalculation] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [transactionType, setTransactionType] = useState<string>('INCOME');

    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [goalNameInput, setGoalNameInput] = useState<string>('');


    const router = useRouter();

    const fetchData = async () => {
        try {
            const incomesRes = await getIncomes();

            if (!incomesRes.data || incomesRes.data.length === 0) {
                router.replace('/welcome' as any);
                return;
            }

            const goalsResponse = await getGoals();
            if (goalsResponse.data && goalsResponse.data.length > 0) {
                const activeGoal = goalsResponse.data[goalsResponse.data.length - 1];
                setGoal(activeGoal);

                const calcResponse = await getGoalCalculation(activeGoal.id);
                setCalculation(calcResponse.data);
            } else {
                setGoal(null);
                setCalculation(null);
            }

            const expensesRes = await getExpenses();

            const formattedIncomes = (incomesRes.data || []).map((item: any) => ({ ...item, type: 'INCOME' }));

            const formattedExpenses = (expensesRes.data || []).map((item: any) => ({
                ...item,
                type: item.category === 'Sabit Birikim' ? 'SAVINGS' : 'EXPENSE'
            }));

            const allTransactions = [...formattedIncomes, ...formattedExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(allTransactions);

        } catch (error) {
            console.error("Veri çekilirken hata oluştu:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAddTransaction = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            if (transactionType === 'GOAL') {
                if (!amount || !goalNameInput) return Alert.alert('Uyarı', 'Lütfen hedef adı ve tutarını girin.');
                await createGoal({ name: goalNameInput, targetAmount: parseFloat(amount), currentAmount: 0, monthlySavings: 0 });
            }
            else if (transactionType === 'INCOME') {
                if (!amount || !description) return Alert.alert('Uyarı', 'Boş alan bırakmayın.');
                // Gelirler her ay otomatik tekrar etmesi için isRecurring: true gönderiliyor
                await createIncome({ title: description, amount: parseFloat(amount), date: today, isRecurring: true });
            }
            else if (transactionType === 'SAVINGS') {
                if (!amount) return Alert.alert('Uyarı', 'Lütfen birikim tutarını girin.');
                // Sabit birikim de her ay otomatik yinelenecek bir gider/birikim olarak kaydediliyor
                await createExpense({ title: description || 'Sabit Birikim', amount: parseFloat(amount), date: today, category: 'Sabit Birikim', isRecurring: true });
            }
            else {
                if (!amount || !description) return Alert.alert('Uyarı', 'Boş alan bırakmayın.');
                // Standart giderler (istersek bunları tek seferlik false yapabiliriz ama şimdilik standart kaydediyoruz)
                await createExpense({ title: description, amount: parseFloat(amount), date: today, category: 'Genel', isRecurring: false });
            }

            Alert.alert('Başarılı', 'İşlem başarıyla kaydedildi ve her ay için otomatikleştirildi!');

            setModalVisible(false);
            setAmount('');
            setDescription('');
            setGoalNameInput('');
            setTransactionType('INCOME');

            setLoading(true);
            fetchData();
        } catch (error) {
            Alert.alert('Hata', 'İşlem kaydedilirken bir sorun oluştu.');
            console.error(error);
        }
    };


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={{ marginTop: 10 }}>Veriler yükleniyor...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <Text style={styles.headerTitle}>Birikim Takibi</Text>

                {goal && calculation ? (
                    <View style={styles.card}>
                        <Text style={styles.cardSubtitle}>Mevcut Hedef</Text>
                        <Text style={styles.goalName}>{calculation.goalName}</Text>
                        <View style={styles.row}><Text style={styles.label}>Hedef Tutar:</Text><Text style={styles.value}>{calculation.targetAmount} TL</Text></View>
                        <View style={styles.row}><Text style={styles.label}>Mevcut Biriken:</Text><Text style={styles.value}>{calculation.currentAmount} TL</Text></View>
                        <View style={styles.row}><Text style={styles.label}>Kalan Tutar:</Text><Text style={[styles.value, { color: '#E74C3C' }]}>{calculation.remainingAmount} TL</Text></View>
                        <View style={styles.divider} />
                        <View style={styles.statusBox}>
                            <Text style={styles.statusTitle}>Tahmini Kalan Süre</Text>
                            <Text style={styles.statusDays}>
                                {calculation.estimatedMonthsLeft > 0 ? `${calculation.estimatedMonthsLeft} Ay (${calculation.estimatedDaysLeft} Gün)` : 'Süre Hesaplanamıyor'}
                            </Text>
                            <Text style={styles.statusMessage}>{calculation.statusMessage}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
                        <Text style={styles.emptyText}>Henüz eklenmiş bir hedef bulunamadı.</Text>
                        <TouchableOpacity style={[styles.modalBtn, styles.saveBtn, { marginTop: 15, paddingHorizontal: 20 }]} onPress={() => { setTransactionType('GOAL'); setModalVisible(true); }}>
                            <Text style={styles.saveBtnText}>Yeni Hedef Belirle</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {calculation && (
                    <View style={[styles.card, { backgroundColor: '#2ECC71' }]}>
                        <Text style={[styles.cardSubtitle, { color: '#FFF' }]}>Aylık Net Birikim (Gelir - Gider)</Text>
                        <Text style={styles.netSavingsText}>{calculation.netSavings} TL / Ay</Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Son İşlemler</Text>
                {transactions.length > 0 ? (
                    transactions.map((item, index) => (
                        <View key={index} style={styles.transactionItem}>
                            <View>
                                <Text style={styles.transactionTitle}>{item.title}</Text>
                                <Text style={styles.transactionDate}>{item.date}</Text>
                            </View>
                            {/* Rengi tipe göre ayarlıyoruz: Gelir Yeşil, Gider Kırmızı, Sabit Birikim Mavi */}
                            <Text style={[styles.transactionAmount, item.type === 'INCOME' ? styles.incomeText : (item.type === 'SAVINGS' ? styles.savingsText : styles.expenseText)]}>
                                {item.type === 'INCOME' ? '+' : '-'}{item.amount} TL
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Henüz bir işlem eklenmemiş.</Text>
                )}
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => { setTransactionType('INCOME'); setModalVisible(true); }}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Yeni Ekle</Text>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity style={[styles.typeButton, transactionType === 'INCOME' && styles.typeButtonActiveIncome]} onPress={() => setTransactionType('INCOME')}>
                                <Text style={[styles.typeButtonText, transactionType === 'INCOME' && styles.typeButtonTextActive]}>Gelir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeButton, transactionType === 'EXPENSE' && styles.typeButtonActiveExpense]} onPress={() => setTransactionType('EXPENSE')}>
                                <Text style={[styles.typeButtonText, transactionType === 'EXPENSE' && styles.typeButtonTextActive]}>Gider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeButton, transactionType === 'SAVINGS' && styles.typeButtonActiveSavings]} onPress={() => setTransactionType('SAVINGS')}>
                                <Text style={[styles.typeButtonText, transactionType === 'SAVINGS' && styles.typeButtonTextActive]}>Birikim</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeButton, transactionType === 'GOAL' && styles.typeButtonActiveGoal]} onPress={() => setTransactionType('GOAL')}>
                                <Text style={[styles.typeButtonText, transactionType === 'GOAL' && styles.typeButtonTextActive]}>Hedef</Text>
                            </TouchableOpacity>
                        </View>

                        {transactionType === 'GOAL' ? (
                            <>
                                <TextInput style={styles.input} placeholder="Hedef Adı (Örn: MacBook)" value={goalNameInput} onChangeText={setGoalNameInput} />
                                <TextInput style={styles.input} placeholder="Hedef Tutarı (Örn: 50000)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                            </>
                        ) : transactionType === 'SAVINGS' ? (
                            <>
                                <TextInput style={styles.input} placeholder="Birikim Tutarı (Örn: 2000)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                                <TextInput style={styles.input} placeholder="Nereye? (Örn: Altın, Borsa, Kasa)" value={description} onChangeText={setDescription} />
                            </>
                        ) : (
                            <>
                                <TextInput style={styles.input} placeholder="Tutar (Örn: 1500)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                                <TextInput style={styles.input} placeholder="Açıklama (Örn: Maaş, Market vs.)" value={description} onChangeText={setDescription} />
                            </>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddTransaction}>
                                <Text style={styles.saveBtnText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    cardSubtitle: { fontSize: 12, color: '#95A5A6', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
    goalName: { fontSize: 22, fontWeight: 'bold', color: '#34495E', marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: '#7F8C8D', fontSize: 15 },
    value: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
    divider: { height: 1, backgroundColor: '#ECF0F1', marginVertical: 15 },
    statusBox: { backgroundColor: '#EBF5FB', padding: 12, borderRadius: 10, alignItems: 'center' },
    statusTitle: { color: '#2980B9', fontSize: 13, fontWeight: '600' },
    statusDays: { fontSize: 20, fontWeight: 'bold', color: '#2980B9', marginVertical: 4 },
    statusMessage: { textAlign: 'center', fontSize: 12, color: '#5D6D7E' },
    netSavingsText: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginTop: 10, marginBottom: 15 },
    transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
    transactionTitle: { fontSize: 16, fontWeight: '600', color: '#34495E' },
    transactionDate: { fontSize: 12, color: '#95A5A6', marginTop: 4 },
    transactionAmount: { fontSize: 16, fontWeight: 'bold' },
    incomeText: { color: '#2ECC71' },
    expenseText: { color: '#E74C3C' },
    savingsText: { color: '#3498DB' },
    emptyText: { textAlign: 'center', color: '#7F8C8D', marginTop: 20, fontStyle: 'italic' },
    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#3498DB', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    fabText: { fontSize: 30, color: '#FFF', fontWeight: 'bold', marginTop: -2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalView: { width: '90%', backgroundColor: '#FFF', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20, textAlign: 'center' },
    typeSelector: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ECF0F1' },
    typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F8F9F9' },
    typeButtonActiveIncome: { backgroundColor: '#2ECC71' },
    typeButtonActiveExpense: { backgroundColor: '#E74C3C' },
    typeButtonActiveSavings: { backgroundColor: '#3498DB' },
    typeButtonActiveGoal: { backgroundColor: '#9B59B6' },
    typeButtonText: { fontSize: 13, fontWeight: '700', color: '#7F8C8D' },
    typeButtonTextActive: { color: '#FFF' },
    input: { backgroundColor: '#F8F9F9', borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15, color: '#2C3E50' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
    cancelBtn: { backgroundColor: '#ECF0F1' },
    saveBtn: { backgroundColor: '#3498DB' },
    cancelBtnText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});