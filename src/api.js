import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1';

export const getGoals = () => axios.get(`${BASE_URL}/goals`);
export const createGoal = (goalData) => axios.post(`${BASE_URL}/goals`, goalData);

export const getIncomes = () => axios.get(`${BASE_URL}/incomes`);
export const createIncome = (incomeData) => axios.post(`${BASE_URL}/incomes`, incomeData);

export const getExpenses = () => axios.get(`${BASE_URL}/expenses`);
export const createExpense = (expenseData) => axios.post(`${BASE_URL}/expenses`, expenseData);

export const getGoalCalculation = (goalId) => axios.get(`${BASE_URL}/goals/${goalId}/calculate`);
