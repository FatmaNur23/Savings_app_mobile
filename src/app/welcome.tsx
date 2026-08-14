import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createIncome } from '../api';

export default function WelcomeScreen() {
    const [salary, setSalary] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const handleStart = async () => {
        if (!salary) {
            Alert.alert('Uyarı', 'Lütfen aylık maaşınızı girin.');
            return;
        }

        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await createIncome({
                title: 'Maaş',
                amount: parseFloat(salary),
                date: today,
                isRecurring: true
            });

            router.replace('/');
        } catch (error) {
            Alert.alert('Hata', 'Maaş kaydedilirken bir sorun oluştu.');
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>👋</Text>
                    <Text style={styles.title}>Hoş Geldin!</Text>
                    <Text style={styles.subtitle}>Birikim yapmaya başlamadan önce, temel gelirini belirleyelim.</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Aylık Net Maaşın / Gelirin</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Örn: 35000"
                        keyboardType="numeric"
                        value={salary}
                        onChangeText={setSalary}
                    />
                    <Text style={styles.note}>* Bu tutar her ay otomatik olarak bakiyene eklenecektir.</Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleStart}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Kaydediliyor...' : 'Başla'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    content: { flex: 1, justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 40 },
    emoji: { fontSize: 60, marginBottom: 10 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', lineHeight: 22 },
    inputContainer: { marginBottom: 30 },
    label: { fontSize: 16, fontWeight: '600', color: '#34495E', marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 12, padding: 18, fontSize: 18, color: '#2C3E50', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    note: { fontSize: 12, color: '#95A5A6', marginTop: 8, fontStyle: 'italic' },
    button: { backgroundColor: '#3498DB', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#3498DB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    buttonDisabled: { backgroundColor: '#95A5A6' },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
